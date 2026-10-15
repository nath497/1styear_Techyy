import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarCheck } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { JoinCallLink } from "@/components/join-call-link";
import { createClient } from "@/lib/supabase/server";
import {
  formatDue,
  groupTasks,
  manilaToday,
  parsePlannerFilters,
  STATUS_FILTERS,
  toManilaDateTime,
  type StatusFilter,
  type StudyTask,
} from "@/lib/planner";
import { SUBJECTS, type Subject } from "@/lib/tutormatch";
import { AddTaskForm } from "./add-task-form";
import { TaskItem } from "./task-item";

export const metadata: Metadata = { title: "Study Planner · TutorMatch" };

type SessionRow = {
  id: string;
  subject: Subject;
  topic: string;
  starts_at: string;
  meeting_link: string | null;
  tutor: { profiles: { display_name: string } | null } | null;
};

// A planner row: one of my study tasks, or one of my accepted tutoring
// sessions (read-only).
type Item =
  | (StudyTask & { kind: "task" })
  | {
      kind: "session";
      id: string;
      subject: Subject;
      topic: string;
      tutorName: string;
      meeting_link: string | null;
      due_date: string;
      due_time: string;
      status: "todo";
      completed_at: null;
    };

export default async function StudyPlannerPage({ searchParams }: PageProps<"/planner">) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/planner");

  // The planner is a learner tool (the database enforces this too).
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role === "tutor") {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">The Study Planner is for learners</CardTitle>
            <CardDescription>Your sessions and help requests are on your dashboard.</CardDescription>
          </CardHeader>
        </Card>
      </main>
    );
  }

  const filters = parsePlannerFilters(await searchParams);
  const today = manilaToday();

  // Row Level Security only returns this learner's own tasks (SQL 015) and
  // own bookings (SQL 003).
  const [tasksRes, sessionsRes] = await Promise.all([
    supabase
      .from("study_tasks")
      .select("id, title, subject, due_date, due_time, priority, estimated_minutes, notes, status, completed_at")
      .order("due_date", { ascending: true })
      .returns<StudyTask[]>(),
    supabase
      .from("bookings")
      .select("id, subject, topic, starts_at, meeting_link, tutor:tutor_profiles(profiles(display_name))")
      .eq("learner_id", user.id)
      .eq("status", "accepted")
      .returns<SessionRow[]>(),
  ]);
  if (tasksRes.error) console.error("Study Planner: could not load tasks", tasksRes.error);
  if (sessionsRes.error) console.error("Study Planner: could not load sessions", sessionsRes.error);

  const allTasks = tasksRes.data ?? [];
  const tasks: Item[] = allTasks
    .filter((t) => !filters.subject || t.subject === filters.subject)
    .filter((t) => filters.status === "all" || t.status === filters.status)
    .map((t) => ({ ...t, kind: "task" as const }));

  // Accepted sessions from today on, on their Philippine date. (Past ones
  // live in My sessions.) They count as "to do", so the Done filter hides them.
  const sessions: Item[] =
    filters.status === "done"
      ? []
      : (sessionsRes.data ?? [])
          .filter((s) => !filters.subject || s.subject === filters.subject)
          .map((s) => {
            const { date, time } = toManilaDateTime(s.starts_at);
            return {
              kind: "session" as const,
              id: s.id,
              subject: s.subject,
              topic: s.topic,
              tutorName: s.tutor?.profiles?.display_name ?? "your tutor",
              meeting_link: s.meeting_link,
              due_date: date,
              due_time: time,
              status: "todo" as const,
              completed_at: null,
            };
          })
          .filter((s) => s.due_date >= today);

  const groups = groupTasks<Item>([...tasks, ...sessions], today);
  const sections = [
    { title: "Overdue", items: groups.overdue, tone: "text-destructive" },
    { title: "Today", items: groups.today, tone: "" },
    { title: "Upcoming", items: groups.upcoming, tone: "" },
    { title: "Done", items: groups.done, tone: "text-muted-foreground" },
  ];
  const filtering = Boolean(filters.subject) || filters.status !== "all";
  const nothing = tasks.length + sessions.length === 0;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Study Planner</h1>
        <p className="text-muted-foreground">
          Plan what to study and when. Your accepted tutoring sessions show here too. Only you can see your planner.
        </p>
      </header>

      <AddTaskForm today={today} />

      {/* Filters: a plain GET form, so the choice is kept in the address. */}
      {allTasks.length > 0 && (
        <form method="get" action="/planner" className="flex flex-wrap items-end gap-3">
          <div className="flex min-w-40 flex-1 flex-col gap-1.5 sm:flex-none">
            <Label htmlFor="filter-subject" className="text-xs text-muted-foreground">
              Subject
            </Label>
            <Select id="filter-subject" name="subject" defaultValue={filters.subject ?? ""}>
              <option value="">All subjects</option>
              {(Object.keys(SUBJECTS) as Subject[]).map((key) => (
                <option key={key} value={key}>
                  {SUBJECTS[key]}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex min-w-32 flex-1 flex-col gap-1.5 sm:flex-none">
            <Label htmlFor="filter-status" className="text-xs text-muted-foreground">
              Show
            </Label>
            <Select id="filter-status" name="status" defaultValue={filters.status}>
              {(Object.keys(STATUS_FILTERS) as StatusFilter[]).map((key) => (
                <option key={key} value={key}>
                  {STATUS_FILTERS[key]}
                </option>
              ))}
            </Select>
          </div>
          <Button type="submit" variant="outline">
            Filter
          </Button>
          {filtering && (
            <Link href="/planner" className={buttonVariants({ variant: "ghost" })}>
              Reset
            </Link>
          )}
        </form>
      )}

      {tasksRes.error ? (
        <Card className="border-destructive">
          <CardContent className="pt-6 text-sm">
            <p className="font-medium text-destructive">We couldn&apos;t load your study tasks right now.</p>
            <p className="mt-1 text-muted-foreground">Please try again in a moment.</p>
          </CardContent>
        </Card>
      ) : nothing ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 pt-6 text-center">
            {filtering ? (
              <>
                <p className="font-medium">Nothing matches these filters.</p>
                <Link href="/planner" className={buttonVariants({ variant: "outline", size: "sm" })}>
                  Show everything
                </Link>
              </>
            ) : (
              <>
                <p className="font-medium">No study tasks yet — add your first one.</p>
                <p className="text-sm text-muted-foreground">
                  Break your studying into small tasks with a due date, and tick them off as you go.
                </p>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        sections.map(
          (s) =>
            s.items.length > 0 && (
              <section key={s.title} className="flex flex-col gap-3">
                <h2 className={`text-lg font-semibold tracking-tight ${s.tone}`}>
                  {s.title} <span className="text-sm font-normal text-muted-foreground">({s.items.length})</span>
                </h2>
                <ul className="flex flex-col gap-2">
                  {s.items.map((item) => (
                    <li key={`${item.kind}-${item.id}`}>
                      {item.kind === "task" ? <TaskItem task={item} today={today} /> : <SessionRow session={item} />}
                    </li>
                  ))}
                </ul>
              </section>
            ),
        )
      )}

      {sessionsRes.error && (
        <p className="text-sm text-destructive">We couldn&apos;t load your tutoring sessions right now.</p>
      )}
    </main>
  );
}

// An accepted tutoring session in the planner — read-only; it's managed in
// My sessions.
function SessionRow({ session: s }: { session: Extract<Item, { kind: "session" }> }) {
  return (
    <Card className="border-primary/40 bg-secondary/40">
      <CardContent className="flex flex-col gap-3 pt-4 pb-4 text-sm sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-col gap-1">
          <p className="flex items-center gap-2 font-medium">
            <CalendarCheck className="h-4 w-4 shrink-0 text-primary" aria-hidden />
            Session with {s.tutorName}
          </p>
          <p className="text-muted-foreground">
            {SUBJECTS[s.subject]} · {formatDue(s.due_date, s.due_time)}
          </p>
          <p className="break-words">{s.topic}</p>
        </div>
        <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
          {s.meeting_link && <JoinCallLink link={s.meeting_link} />}
          <Link href="/sessions" className="text-xs font-medium text-primary hover:underline">
            Manage in My sessions
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
