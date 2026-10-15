// Study Planner rules (SQL 015). The database checks the same limits; these
// give the learner friendly messages before it has to.
import { SUBJECTS, type Subject } from "@/lib/tutormatch";

export const PRIORITIES = { high: "High", medium: "Medium", low: "Low" } as const;
export type Priority = keyof typeof PRIORITIES;

export const PRIORITY_STYLE: Record<Priority, string> = {
  high: "bg-rose-100 text-rose-900",
  medium: "bg-amber-100 text-amber-900",
  low: "bg-muted text-muted-foreground",
};

export type StudyTask = {
  id: string;
  title: string;
  subject: Subject;
  due_date: string; // "2026-10-20"
  due_time: string | null; // "16:00:00"
  priority: Priority;
  estimated_minutes: number | null;
  notes: string;
  status: "todo" | "done";
  completed_at: string | null;
};

// Today's date in the Philippines as "YYYY-MM-DD" (Vercel runs on UTC).
export function manilaToday(now = new Date()) {
  return now.toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });
}

// Overdue (before today), Today, Upcoming (later) and Done. To-do tasks
// are soonest first; Done is most recently finished first.
export function groupTasks<T extends Pick<StudyTask, "due_date" | "due_time" | "status" | "completed_at">>(
  tasks: T[],
  today = manilaToday(),
) {
  const key = (t: T) => `${t.due_date} ${t.due_time ?? "99:99"}`;
  const soonest = (a: T, b: T) => key(a).localeCompare(key(b));
  const todo = tasks.filter((t) => t.status === "todo").sort(soonest);
  return {
    overdue: todo.filter((t) => t.due_date < today),
    today: todo.filter((t) => t.due_date === today),
    upcoming: todo.filter((t) => t.due_date > today),
    done: tasks
      .filter((t) => t.status === "done")
      .sort((a, b) => (b.completed_at ?? "").localeCompare(a.completed_at ?? "")),
  };
}

// e.g. "Tue, Oct 20 · 4:00 PM" (or without the time).
export function formatDue(dueDate: string, dueTime: string | null) {
  const [y, m, d] = dueDate.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-PH", {
    timeZone: "UTC",
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  if (!dueTime) return date;
  const [h, min] = dueTime.split(":").map(Number);
  const time = new Date(Date.UTC(2000, 0, 1, h, min)).toLocaleTimeString("en-PH", {
    timeZone: "UTC",
    hour: "numeric",
    minute: "2-digit",
  });
  return `${date} · ${time}`;
}

export type TaskInput = {
  title: string;
  subject: Subject;
  due_date: string;
  due_time: string | null;
  priority: Priority;
  estimated_minutes: number | null;
  notes: string;
};

// Read and check the add / edit form. Returns the clean values, or the
// first problem as a friendly message.
export function parseTaskForm(form: FormData): { task: TaskInput } | { error: string } {
  const text = (k: string) => String(form.get(k) ?? "").trim();
  const title = text("title");
  const subject = text("subject");
  const dueDate = text("due_date");
  const dueTime = text("due_time");
  const priority = text("priority") || "medium";
  const minutes = text("estimated_minutes");
  const notes = text("notes");

  if (!title) return { error: "Give the task a title." };
  if (title.length > 100) return { error: "Please keep the title under 100 characters." };
  if (!Object.hasOwn(SUBJECTS, subject)) return { error: "Choose a subject." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate) || Number.isNaN(Date.parse(`${dueDate}T00:00:00Z`)))
    return { error: "Choose a due date." };
  // Reject impossible dates like Feb 30.
  if (new Date(`${dueDate}T00:00:00Z`).toISOString().slice(0, 10) !== dueDate) return { error: "Choose a real date." };
  if (dueTime && !/^([01]\d|2[0-3]):[0-5]\d$/.test(dueTime)) return { error: "Choose a valid time, or leave it empty." };
  if (!Object.hasOwn(PRIORITIES, priority)) return { error: "Choose a priority." };
  let estimated: number | null = null;
  if (minutes) {
    if (!/^\d+$/.test(minutes)) return { error: "Estimated time should be a whole number of minutes." };
    estimated = Number(minutes);
    if (estimated < 5 || estimated > 600) return { error: "Estimated time should be between 5 and 600 minutes." };
  }
  if (notes.length > 500) return { error: "Please keep notes under 500 characters." };

  return {
    task: {
      title,
      subject: subject as Subject,
      due_date: dueDate,
      due_time: dueTime || null,
      priority: priority as Priority,
      estimated_minutes: estimated,
      notes,
    },
  };
}
