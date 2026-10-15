import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Messages · TutorMatch" };

// The right-hand side of the inbox before a chat is opened (desktop only;
// on phones the list fills the screen).
export default async function MessagesHome() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/messages");

  // Any chats yet? (Row Level Security only counts mine.)
  const { count } = await supabase
    .from("conversations")
    .select("id", { count: "exact", head: true })
    .not("last_message_at", "is", null);
  const hasChats = (count ?? 0) > 0;

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center text-muted-foreground">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-primary">
        <MessageCircle className="h-7 w-7" aria-hidden />
      </span>
      <p className="font-medium text-foreground">{hasChats ? "Your messages" : "No chats yet"}</p>
      <p className="max-w-xs text-sm">
        {hasChats
          ? "Choose a chat on the left. New messages appear here without refreshing."
          : "When you message a tutor — or a learner whose help request you offered on — the chat shows up here."}
      </p>
    </div>
  );
}
