import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Empty, LoadError, Section, StatCard } from "@/app/dashboard/parts";
import { TaskDoneButton } from "@/app/planner/task-done-button";
import { createClient } from "@/lib/supabase/server";
import { addDays, overallProgress, spaceHref } from "@/lib/learning-space";
import { formatDue, type StudyTask } from "@/lib/planner";
import { formatSessionTime, SUBJECTS, type Subject } from "@/lib/tutormatch";

type NextSession = {
  starts_at: string;
  subject: Subject;
  tutor: { profiles: { display_name: string } | null } | null;
};

// The Overview tab: a few figures counted from the learner's real records,
// plus today's tasks. Nothing here is estimated — a new learner sees zeros.
export async function OverviewTab({ learnerId, today }: { learnerId: string; today: string }) {
  const supabase = await createClient();
  const weekEnd = addDays(today, 6);
  const count = { count: "exact" as const, head: true };

  // Row Level Security only returns this learner's own rows (SQL 003, 015,
  // 016), so these counts are theirs alone.
  const [dueSoon, completed, allTasks, review, understood, allTopics, sessions, todayTasks] = await Promise.all([
    supabase.from("study_tasks").select("id", count).eq("status", "todo").gte("due_date", today).lte("due_date", weekEnd),
    supabase.from("study_tasks").select("id", count).eq("status", "done"),
    supabase.from("study_tasks").select("id", count),
    supabase.from("learn_topics").select("id", count).eq("status", "need_review"),
    supabase.from("learn_topics").select("id", count).eq("status", "understood"),
    supabase.from("learn_topics").select("id", count),
    supabase
      .from("bookings")
      .select("starts_at, subject, tutor:tutor_profiles(profiles(display_name))", { count: "exact" })
      .eq("learner_id", learnerId)
      .eq("status", "accepted")
      .gte("starts_at", new Date().toISOString())
      .order("starts_at", { ascending: true })
      .limit(1)
      .returns<NextSession[]>(),
    supabase
      .from("study_tasks")
      .select("id, title, subject, due_date, due_time, priority, estimated_minutes, notes, status, completed_at")
      .eq("status", "todo")
      .lte("due_date", today)
      .order("due_date", { ascending: true })
      .order("due_time", { ascending: true, nullsFirst: false })
      .limit(5)
      .returns<StudyTask[]>(),
  ]);
  const results = { dueSoon, completed, allTasks, review, understood, allTopics, sessions, todayTasks };
  for (const [name, r] of Object.entries(results)) {
    if (r.error) console.error(`My Learning Space: could not load ${name}`, r.error);
  }
  // A figure that failed to load shows "—", never a misleading 0.
  const shown = (r: { error: unknown; count: number | null }) => (r.error ? "—" : (r.count ?? 0));
  const anyError = Object.values(results).some((r) => r.error);

  const progress =
    understood.error || allTopics.error ? null : overallProgress(understood.count ?? 0, allTopics.count ?? 0);
  const isNew = !allTasks.error && !allTopics.error && (allTasks.count ?? 0) === 0 && (allTopics.count ?? 0) === 0;
  const next = sessions.data?.[0];

  return (
    <div className="flex flex-col gap-6">
      {isNew && (
        <Card className="border-primary/40 bg-secondary/40">
          <CardContent className="flex flex-col gap-3 pt-6">
            <p className="font-medium">Start here 👋</p>
            <p className="text-sm text-muted-foreground">
              Add a study task for something due soon, or add the topics you find hardest to LearnTrack. Your
              figures here fill in as you go.
            </p>
            <div className="flex flex-wrap gap-2">
              <Link href={spaceHref("tasks")} className={buttonVariants({ size: "sm" })}>
                Add a study task
              </Link>
              <Link href={spaceHref("learntrack")} className={buttonVariants({ size: "sm", variant: "outline" })}>
                Add a topic
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label="Due in the next 7 days" value={shown(dueSoon)} href={spaceHref("tasks", { status: "todo" })} />
        <StatCard label="Completed tasks" value={shown(completed)} href={spaceHref("tasks", { status: "done" })} />
        <StatCard
          label="Topics to review"
          value={shown(review)}
          href={spaceHref("learntrack", { status: "need_review" })}
        />
        <StatCard label="Upcoming sessions" value={shown(sessions)} href="/sessions" />
        <StatCard
          label="Overall progress"
          value={progress === null ? "—" : `${progress}%`}
          note={progress === null ? "Add LearnTrack topics to see this" : "of your topics understood"}
          href={spaceHref("learntrack")}
        />
      </div>

      {anyError && <LoadError what="some of your figures" />}

      <Section title="Due today" action={{ href: spaceHref("tasks"), label: "All study tasks" }}>
        {todayTasks.error ? (
          <LoadError what="today's tasks" />
        ) : !todayTasks.data?.length ? (
          <Empty>Nothing due today.</Empty>
        ) : (
          <ul className="flex flex-col gap-2">
            {todayTasks.data.map((t) => (
              <li
                key={t.id}
                className="flex items-center justify-between gap-3 rounded-[var(--radius)] bg-muted/60 px-3 py-2"
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium">{t.title}</span>
                  <span className={t.due_date < today ? "text-destructive" : "text-muted-foreground"}>
                    {t.due_date < today ? "Overdue · " : ""}
                    {SUBJECTS[t.subject]} · {formatDue(t.due_date, t.due_time)}
                  </span>
                </span>
                <TaskDoneButton taskId={t.id} title={t.title} done={false} />
              </li>
            ))}
          </ul>
        )}
      </Section>

      {next && (
        <Section title="Next tutoring session" action={{ href: "/sessions", label: "My sessions" }}>
          <p className="font-medium">
            {SUBJECTS[next.subject]} with {next.tutor?.profiles?.display_name ?? "your tutor"}
          </p>
          <p className="text-muted-foreground">{formatSessionTime(next.starts_at)}</p>
        </Section>
      )}
    </div>
  );
}
