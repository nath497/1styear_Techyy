import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import {
  formatDue,
  groupTasks,
  manilaToday,
  PRIORITIES,
  PRIORITY_STYLE,
  type StudyTask,
} from "@/lib/planner";
import { SUBJECTS } from "@/lib/tutormatch";
import { AddTaskForm } from "./add-task-form";
import { TaskDoneButton } from "./task-done-button";

export const metadata: Metadata = { title: "Study Planner · TutorMatch" };

export default async function StudyPlannerPage() {
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

  // Row Level Security only returns this learner's own tasks (SQL 015).
  const { data, error } = await supabase
    .from("study_tasks")
    .select("id, title, subject, due_date, due_time, priority, estimated_minutes, notes, status, completed_at")
    .order("due_date", { ascending: true })
    .returns<StudyTask[]>();
  if (error) console.error("Study Planner: could not load tasks", error);

  const today = manilaToday();
  const groups = groupTasks(data ?? [], today);
  const sections = [
    { title: "Overdue", items: groups.overdue, tone: "text-destructive" },
    { title: "Today", items: groups.today, tone: "" },
    { title: "Upcoming", items: groups.upcoming, tone: "" },
    { title: "Done", items: groups.done, tone: "text-muted-foreground" },
  ];

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Study Planner</h1>
        <p className="text-muted-foreground">Plan what to study and when. Only you can see your planner.</p>
      </header>

      <AddTaskForm today={today} />

      {error ? (
        <Card className="border-destructive">
          <CardContent className="pt-6 text-sm">
            <p className="font-medium text-destructive">We couldn&apos;t load your study tasks right now.</p>
            <p className="mt-1 text-muted-foreground">Please try again in a moment.</p>
          </CardContent>
        </Card>
      ) : !data || data.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="font-medium">No study tasks yet — add your first one.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Break your studying into small tasks with a due date, and tick them off as you go.
            </p>
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
                  {s.items.map((task) => (
                    <li key={task.id}>
                      <TaskRow task={task} />
                    </li>
                  ))}
                </ul>
              </section>
            ),
        )
      )}
    </main>
  );
}

function TaskRow({ task }: { task: StudyTask }) {
  const done = task.status === "done";
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-3 pt-4 pb-4 text-sm">
        <div className="flex min-w-0 flex-col gap-1">
          <p className={`font-medium break-words ${done ? "text-muted-foreground line-through" : ""}`}>{task.title}</p>
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-muted-foreground">
            <span>{SUBJECTS[task.subject]}</span>
            <span aria-hidden>·</span>
            <span>{formatDue(task.due_date, task.due_time)}</span>
            {task.estimated_minutes && (
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" aria-hidden /> {task.estimated_minutes} min
              </span>
            )}
            {!done && (
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_STYLE[task.priority]}`}>
                {PRIORITIES[task.priority]}
              </span>
            )}
          </p>
          {task.notes && <p className="whitespace-pre-line break-words text-muted-foreground">{task.notes}</p>}
        </div>
        <TaskDoneButton taskId={task.id} done={done} />
      </CardContent>
    </Card>
  );
}
