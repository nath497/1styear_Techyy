import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { createClient } from "@/lib/supabase/server";
import { spaceHref, SPACE_PATH } from "@/lib/learning-space";
import {
  groupTasks,
  manilaToday,
  parsePlannerFilters,
  parseTaskPrefill,
  PRIORITIES,
  STATUS_FILTERS,
  toManilaDateTime,
  type Priority,
  type StatusFilter,
  type StudyTask,
} from "@/lib/planner";
import { SUBJECTS, type Subject } from "@/lib/tutormatch";
import { AddTaskForm } from "./add-task-form";
import type { GoalOption } from "@/lib/goals";
import { SessionRow, type PlannerSession } from "./session-row";
import { TaskItem } from "./task-item";

// An accepted booking as it comes back from the database.
type BookingRow = {
  id: string;
  subject: Subject;
  topic: string;
  starts_at: string;
  meeting_link: string | null;
  tutor: { profiles: { display_name: string } | null } | null;
};

// A planner row: one of my study tasks, or one of my accepted tutoring
// sessions (read-only).
type Item = (StudyTask & { kind: "task" }) | PlannerSession;

// The Study Tasks tab of My Learning Space (the Study Planner). The page
// has already checked that this is a logged-in learner.
export async function StudyTasksTab({
  learnerId,
  params,
}: {
  learnerId: string;
  params: Record<string, string | string[] | undefined>;
}) {
  const supabase = await createClient();
  const filters = parsePlannerFilters(params);
  const today = manilaToday();

  // Row Level Security only returns this learner's own tasks (SQL 015) and
  // own bookings (SQL 003).
  const [tasksRes, sessionsRes, goalsRes] = await Promise.all([
    supabase
      .from("study_tasks")
      .select("id, title, subject, due_date, due_time, priority, estimated_minutes, notes, status, completed_at, goal_id")
      .order("due_date", { ascending: true })
      .returns<StudyTask[]>(),
    supabase
      .from("bookings")
      .select("id, subject, topic, starts_at, meeting_link, tutor:tutor_profiles(profiles(display_name))")
      .eq("learner_id", learnerId)
      .eq("status", "accepted")
      .returns<BookingRow[]>(),
    // The learner's goals, for "Counts towards a goal" (SQL 017).
    supabase.from("learning_goals").select("id, title, status").order("target_date").returns<GoalOption[]>(),
  ]);
  // Without goals the task form just hides the goal box.
  if (goalsRes.error) console.error("Study Planner: could not load goals", goalsRes.error);
  const goals = goalsRes.data ?? [];
  if (tasksRes.error) console.error("Study Planner: could not load tasks", tasksRes.error);
  if (sessionsRes.error) console.error("Study Planner: could not load sessions", sessionsRes.error);

  const allTasks = tasksRes.data ?? [];
  const tasks: Item[] = allTasks
    .filter((t) => !filters.subject || t.subject === filters.subject)
    .filter((t) => filters.status === "all" || t.status === filters.status)
    .filter((t) => !filters.priority || t.priority === filters.priority)
    .map((t) => ({ ...t, kind: "task" as const }));

  // Accepted sessions from today on, on their Philippine date. (Past ones
  // live in My sessions.)
  const allSessions: PlannerSession[] = (sessionsRes.data ?? [])
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
  // Sessions count as "To Do" and have no priority, so they only show for
  // All / To Do with no priority filter.
  const showSessions = (filters.status === "all" || filters.status === "todo") && !filters.priority;
  const sessions: Item[] = showSessions
    ? allSessions.filter((s) => !filters.subject || s.subject === filters.subject)
    : [];

  const groups = groupTasks<Item>([...tasks, ...sessions], today);
  const sections = [
    { title: "Overdue", items: groups.overdue, tone: "text-destructive" },
    { title: "Today", items: groups.today, tone: "" },
    { title: "Upcoming", items: groups.upcoming, tone: "" },
    { title: "Done", items: groups.done, tone: "text-muted-foreground" },
  ];
  const filtering = Boolean(filters.subject) || filters.status !== "all" || Boolean(filters.priority);
  const nothing = tasks.length + sessions.length === 0;
  // Filters are worth showing once there's anything to filter — or when
  // tasks failed to load, so the learner isn't stuck on a filtered view.
  const showFilters = allTasks.length + allSessions.length > 0 || Boolean(tasksRes.error);

  return (
    <div className="flex flex-col gap-6">
      <p className="text-muted-foreground">
        Plan what to study and when. Your accepted tutoring sessions show here too.
      </p>

      <AddTaskForm today={today} prefill={parseTaskPrefill(params)} goals={goals} />

      {/* Filters: a plain GET form, so the choice is kept in the address. */}
      {showFilters && (
        <form method="get" action={SPACE_PATH} className="flex flex-wrap items-end gap-3">
          <input type="hidden" name="tab" value="tasks" />
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
          <div className="flex min-w-32 flex-1 flex-col gap-1.5 sm:flex-none">
            <Label htmlFor="filter-priority" className="text-xs text-muted-foreground">
              Priority
            </Label>
            <Select id="filter-priority" name="priority" defaultValue={filters.priority ?? ""}>
              <option value="">Any priority</option>
              {(Object.keys(PRIORITIES) as Priority[]).map((key) => (
                <option key={key} value={key}>
                  {PRIORITIES[key]}
                </option>
              ))}
            </Select>
          </div>
          <Button type="submit" variant="outline">
            Filter
          </Button>
          {filtering && (
            <Link href={spaceHref("tasks")} className={buttonVariants({ variant: "ghost" })}>
              Reset
            </Link>
          )}
        </form>
      )}

      {/* One message at most above the list: a load error, no matches, or
          the "add your first task" nudge (shown even when sessions exist). */}
      {tasksRes.error ? (
        <Card className="border-destructive">
          <CardContent className="pt-6 text-sm">
            <p className="font-medium text-destructive">We couldn&apos;t load your study tasks right now.</p>
            <p className="mt-1 text-muted-foreground">Please try again in a moment.</p>
          </CardContent>
        </Card>
      ) : filtering && nothing ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 pt-6 text-center">
            <p className="font-medium">Nothing matches these filters.</p>
            <Link href={spaceHref("tasks")} className={buttonVariants({ variant: "outline", size: "sm" })}>
              Show everything
            </Link>
          </CardContent>
        </Card>
      ) : !filtering && allTasks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 pt-6 text-center">
            <p className="font-medium">No study tasks yet — add your first one.</p>
            <p className="text-sm text-muted-foreground">
              Break your studying into small tasks with a due date, and tick them off as you go.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {sections.map(
        (s) =>
          s.items.length > 0 && (
            <section key={s.title} className="flex flex-col gap-3">
              <h2 className={`text-lg font-semibold tracking-tight ${s.tone}`}>
                {s.title} <span className="text-sm font-normal text-muted-foreground">({s.items.length})</span>
              </h2>
              <ul className="flex flex-col gap-2">
                {s.items.map((item) => (
                  <li key={`${item.kind}-${item.id}`}>
                    {item.kind === "task" ? <TaskItem task={item} today={today} goals={goals} /> : <SessionRow session={item} />}
                  </li>
                ))}
              </ul>
            </section>
          ),
      )}

      {sessionsRes.error && (
        <p className="text-sm text-destructive">We couldn&apos;t load your tutoring sessions right now.</p>
      )}
    </div>
  );
}
