import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { firstName, isUuid } from "@/lib/tutormatch";
import { MessageForm } from "./message-form";

export const metadata: Metadata = { title: "Chat · TutorMatch" };

type Conversation = {
  id: string;
  learner_id: string;
  tutor_id: string;
  // conversations → profiles for the learner; → tutor_profiles → profiles
  // for the tutor. Display names only — never emails.
  learner: { display_name: string } | null;
  tutor: { profiles: { display_name: string } | null } | null;
};

type Message = { id: string; sender_id: string; body: string; created_at: string };

// e.g. "Oct 15, 4:05 PM" in Philippine time.
function messageTime(iso: string) {
  return new Date(iso).toLocaleString("en-PH", {
    timeZone: "Asia/Manila",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function ConversationPage({ params }: PageProps<"/messages/[id]">) {
  const { id } = await params;
  if (!isUuid(id)) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/messages/${id}`);

  // Row Level Security only returns a conversation (and its messages) to
  // the two people in it (SQL 010). Anyone else simply gets "not found".
  const [{ data: convo, error }, { data: messages, error: messagesError }] = await Promise.all([
    supabase
      .from("conversations")
      .select("id, learner_id, tutor_id, learner:profiles(display_name), tutor:tutor_profiles(profiles(display_name))")
      .eq("id", id)
      .maybeSingle<Conversation>(),
    supabase
      .from("messages")
      .select("id, sender_id, body, created_at")
      .eq("conversation_id", id)
      .order("created_at", { ascending: true })
      .returns<Message[]>(),
  ]);

  if (error) {
    console.error("Chat: could not load conversation", error);
    return (
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-10">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-2xl">We couldn&apos;t load this chat</CardTitle>
            <CardDescription>Please try again in a moment.</CardDescription>
          </CardHeader>
        </Card>
      </main>
    );
  }
  if (!convo) notFound();
  if (messagesError) console.error("Chat: could not load messages", messagesError);

  const iAmLearner = convo.learner_id === user.id;
  const learnerName = convo.learner?.display_name ?? "Learner";
  const tutorName = convo.tutor?.profiles?.display_name ?? "Tutor";
  const otherName = iAmLearner ? tutorName : learnerName;
  const nameOf = (senderId: string) => firstName(senderId === convo.learner_id ? learnerName : tutorName, "Someone");

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-4 py-6">
      <Link
        href={iAmLearner ? `/tutors/${convo.tutor_id}` : "/dashboard/tutor"}
        className="text-sm font-medium text-primary hover:underline"
      >
        ← Back to {iAmLearner ? `${firstName(tutorName, "the tutor")}'s profile` : "your dashboard"}
      </Link>

      <Card className="flex flex-1 flex-col">
        <CardHeader className="border-b border-border">
          <CardTitle className="text-xl">{otherName}</CardTitle>
          <CardDescription>
            {iAmLearner ? "Tutor" : "Learner"} · Only the two of you can see this chat.
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-1 flex-col gap-4 pt-4">
          {messagesError ? (
            <p className="text-sm text-destructive">We couldn&apos;t load the messages right now. Please refresh.</p>
          ) : !messages || messages.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No messages yet. Say hello and ask {firstName(otherName, "them")} anything about your topic.
            </p>
          ) : (
            <ol className="flex flex-col gap-3" aria-label="Messages">
              {messages.map((m) => {
                const mine = m.sender_id === user.id;
                return (
                  <li key={m.id} className={`flex flex-col gap-1 ${mine ? "items-end" : "items-start"}`}>
                    <span className="text-xs text-muted-foreground">
                      {mine ? "You" : nameOf(m.sender_id)} · {messageTime(m.created_at)}
                    </span>
                    <p
                      className={`max-w-[85%] whitespace-pre-line break-words rounded-2xl px-4 py-2 text-sm ${
                        mine ? "rounded-br-sm bg-primary text-primary-foreground" : "rounded-bl-sm bg-muted"
                      }`}
                    >
                      {m.body}
                    </p>
                  </li>
                );
              })}
            </ol>
          )}

          <div className="mt-auto border-t border-border pt-4">
            <MessageForm conversationId={convo.id} />
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
