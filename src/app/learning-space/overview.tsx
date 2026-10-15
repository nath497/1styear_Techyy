import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Empty, LoadError, Section, StatCard } from "@/app/dashboard/parts";
import { InProgressBadge } from "@/app/planner/in-progress-badge";
import { TaskDoneButton } from "@/app/planner/task-done-button";
import { createClient } from "@/lib/supabase/server";
import { addDays, overallProgress, spaceHref } from "@/lib/learning-space";
import { formatDue, type StudyTask } from "@/lib/planner";
import { formatTargetDate, goalProgress, type LearningGoal } from "@/lib/goals";
import { formatDay, formatTimeRange, manilaNowTime, nextActivity, type StudyActivity } from "@/lib/schedule";
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
  const [dueSoon, completed, allTasks, review, understood, allTopics, sessions, todayTasks, upcomingActivities, goals, linked] =
    await Promise.all([
    supabase.from("study_tasks").select("id", count).neq("status", "done").gte("due_date", today).lte("due_date", weekEnd),
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
      .neq("status", "done")
      .lte("due_date", today)
      .order("due_date", { ascending: true })
      .order("due_time", { ascending: true, nullsFirst: false })
      .limit(5)
      .returns<StudyTask[]>(),
    // From today on; the first that hasn't finished yet is "next".
    supabase
      .from("study_activities")
      .select("id, title, subject, activity_date, start_time, end_time, notes")
      .gte("activity_date", today)
      .order("activity_date", { ascending: true })
      .order("start_time", { ascending: true })
      .limit(10)
      .returns<StudyActivity[]>(),
    // Active goals (soonest target first) and the tasks linked to goals.
    supabase
      .from("learning_goals")
      .select("id, title, description, target_date, status")
      .eq("status", "active")
      .order("target_date", { ascending: true })
      .limit(3)
      .returns<LearningGoal[]>(),
    supabase
      .from("study_tasks")
      .select("goal_id, status")
      .not("goal_id", "is", null)
      .returns<{ goal_id: string; status: string }[]>(),
  ]);
  const results = {
    dueSoon,
    completed,
    allTasks,
    review,
    understood,
    allTopics,
    sessions,
    todayTasks,
    upcomingActivities,
    goals,
    linked,
  };
  for (const [name, r] of Object.entries(results)) {
    if (r.error) console.error(`My Learning Space: could not load ${name}`, r.error);
  }
  // A figure that failed to load shows "—", never a misleading 0.
  const shown = (r: { error: unknown; count: number | null }) => (r.error ? "—" : (r.count ?? 0));
  const anyError = Object.values(results).some((r) => r.error);

  const progress =
    understood.error || allTopics.error ? null : overallProgress(understood.count ?? 0, allTopics.count ?? 0);
  // New = nothing anywhere yet: no tasks, topics, active goals or upcoming
  // activities (and none of those failed to load).
  const isNew =
    [allTasks, allTopics, goals, upcomingActivities].every((r) => !r.error) &&
    (allTasks.count ?? 0) === 0 &&
    (allTopics.count ?? 0) === 0 &&
    (goals.data?.length ?? 0) === 0 &&
    (upcomingActivities.data?.length ?? 0) === 0;
  const next = sessions.data?.[0];
  const nextStudy = nextActivity(upcomingActivities.data ?? [], today, manilaNowTime());

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
        <StatCard label="Due in the next 7 days" value={shown(dueSoon)} href={spaceHref("tasks")} />
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

      <Section title="Due today & overdue" action={{ href: spaceHref("tasks"), label: "All study tasks" }}>
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
                  <span className="block truncate font-medium">
                    {t.status === "in_progress" && <InProgressBadge />}
                    {t.title}
                  </span>
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

      {!goals.error && !linked.error && (goals.data?.length ?? 0) > 0 && (
        <Section title="Active goals" action={{ href: spaceHref("goals"), label: "All goals" }}>
          <ul className="flex flex-col gap-3">
            {goals.data!.map((g) => {
              const p = goalProgress((linked.data ?? []).filter((t) => t.goal_id === g.id));
              return (
                <li key={g.id} className="flex flex-col gap-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="min-w-0 truncate font-medium">{g.title}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">by {formatTargetDate(g.target_date)}</span>
                  </div>
                  {p.total === 0 ? (
                    <span className="text-xs text-muted-foreground">Link study tasks to track progress</span>
                  ) : (
                    <>
                      <div className="h-2 overflow-hidden rounded-full bg-muted" aria-hidden>
                        <div className="h-full rounded-full bg-primary" style={{ width: `${p.percent}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {p.done} of {p.total} linked tasks completed
                      </span>
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        </Section>
      )}

      {nextStudy && (
        <Section title="Next study activity" action={{ href: spaceHref("schedule"), label: "Schedule" }}>
          <p className="font-medium break-words">{nextStudy.title}</p>
          <p className="text-muted-foreground">
            {formatDay(nextStudy.activity_date, today)} · {formatTimeRange(nextStudy.start_time, nextStudy.end_time)} ·{" "}
            {SUBJECTS[nextStudy.subject]}
          </p>
        </Section>
      )}

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
