import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { groupBySubject, type LearnTopic } from "@/lib/learntrack";
import { SUBJECTS } from "@/lib/tutormatch";
import { AddTopicForm } from "./add-topic-form";
import { TopicStatusButtons } from "./topic-status";

export const metadata: Metadata = { title: "LearnTrack · TutorMatch" };

export default async function LearnTrackPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/learntrack");

  // LearnTrack is a learner tool (the database enforces this too).
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role === "tutor") {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">LearnTrack is for learners</CardTitle>
            <CardDescription>Learners use it to track which topics they understand.</CardDescription>
          </CardHeader>
        </Card>
      </main>
    );
  }

  // Row Level Security only returns this learner's own topics (SQL 016).
  const { data, error } = await supabase
    .from("learn_topics")
    .select("id, subject, name, status, note")
    .returns<LearnTopic[]>();
  if (error) console.error("LearnTrack: could not load topics", error);
  const groups = groupBySubject(data ?? []);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">LearnTrack</h1>
        <p className="text-muted-foreground">
          List the topics you&apos;re studying and mark how well you know each one, so you can see where you need
          help. Only you can see your LearnTrack.
        </p>
      </header>

      <AddTopicForm />

      {error ? (
        <Card className="border-destructive">
          <CardContent className="pt-6 text-sm">
            <p className="font-medium text-destructive">We couldn&apos;t load your topics right now.</p>
            <p className="mt-1 text-muted-foreground">Please try again in a moment.</p>
          </CardContent>
        </Card>
      ) : groups.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 pt-6 text-center">
            <p className="font-medium">No topics yet — add the first topic you&apos;re studying.</p>
            <p className="text-sm text-muted-foreground">
              Start with the ones you find hardest. They&apos;ll begin at Need to Review.
            </p>
          </CardContent>
        </Card>
      ) : (
        groups.map((g) => {
          const percent = Math.round((g.understood / g.total) * 100);
          return (
            <section key={g.subject} className="flex flex-col gap-3">
              <div className="flex flex-col gap-2">
                <div className="flex items-baseline justify-between gap-3">
                  <h2 className="text-lg font-semibold tracking-tight">{SUBJECTS[g.subject]}</h2>
                  <p className="text-sm text-muted-foreground">
                    {g.understood} of {g.total} understood
                  </p>
                </div>
                <div
                  role="progressbar"
                  aria-label={`${SUBJECTS[g.subject]} progress`}
                  aria-valuemin={0}
                  aria-valuemax={g.total}
                  aria-valuenow={g.understood}
                  aria-valuetext={`${g.understood} of ${g.total} understood`}
                  className="h-2 overflow-hidden rounded-full bg-muted"
                >
                  <div className="h-full rounded-full bg-green-600 transition-all" style={{ width: `${percent}%` }} />
                </div>
              </div>
              <ul className="flex flex-col gap-2">
                {g.topics.map((t) => (
                  <li key={t.id}>
                    <Card>
                      <CardContent className="flex flex-col gap-3 pt-4 pb-4 text-sm sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex min-w-0 flex-col gap-1">
                          <p className="font-medium break-words">{t.name}</p>
                          {t.note && (
                            <p className="whitespace-pre-line break-words text-muted-foreground">{t.note}</p>
                          )}
                        </div>
                        <TopicStatusButtons topicId={t.id} name={t.name} status={t.status} />
                      </CardContent>
                    </Card>
                  </li>
                ))}
              </ul>
            </section>
          );
        })
      )}
    </main>
  );
}
