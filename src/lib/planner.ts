// Study Planner rules (SQL 015). The database checks the same limits; these
// give the learner friendly messages before it has to.
import { formValues } from "@/lib/form-values";
import { isUuid, SUBJECTS, type Subject } from "@/lib/tutormatch";

export const PRIORITIES = { high: "High", medium: "Medium", low: "Low" } as const;
export type Priority = keyof typeof PRIORITIES;

export const PRIORITY_STYLE: Record<Priority, string> = {
  high: "bg-rose-100 text-rose-900",
  medium: "bg-amber-100 text-amber-900",
  low: "bg-muted text-muted-foreground",
};

// To Do → In Progress → Completed (SQL 017 added In Progress).
export const TASK_STATUSES = { todo: "To Do", in_progress: "In Progress", done: "Completed" } as const;
export type TaskStatus = keyof typeof TASK_STATUSES;

export function isTaskStatus(value: unknown): value is TaskStatus {
  return typeof value === "string" && Object.hasOwn(TASK_STATUSES, value);
}

export type StudyTask = {
  id: string;
  title: string;
  subject: Subject;
  due_date: string; // "2026-10-20"
  due_time: string | null; // "16:00:00"
  priority: Priority;
  estimated_minutes: number | null;
  notes: string; // shown as "Description"
  status: TaskStatus;
  completed_at: string | null;
  goal_id?: string | null; // the goal this task counts towards, if any
};

// Today's date in the Philippines as "YYYY-MM-DD" (Vercel runs on UTC).
export function manilaToday(now = new Date()) {
  return now.toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });
}

// Overdue (before today), Today, Upcoming (later) and Done. Unfinished
// tasks (To Do or In Progress) are soonest first; Done is most recently
// finished first.
export function groupTasks<T extends Pick<StudyTask, "due_date" | "due_time" | "status" | "completed_at">>(
  tasks: T[],
  today = manilaToday(),
) {
  const key = (t: T) => `${t.due_date} ${t.due_time ?? "99:99"}`;
  const soonest = (a: T, b: T) => key(a).localeCompare(key(b));
  const todo = tasks.filter((t) => t.status !== "done").sort(soonest);
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
  // null = not linked to a goal. Left out when the form had no goal box,
  // so saving never unlinks a goal by accident.
  goal_id?: string | null;
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
  if (notes.length > 500) return { error: "Please keep the description under 500 characters." };
  // The goal must be one of the learner's own — the database checks that;
  // here we only check it looks like an id.
  const goal = text("goal_id");
  if (goal && !isUuid(goal)) return { error: "Choose one of your goals, or none." };

  return {
    task: {
      title,
      subject: subject as Subject,
      due_date: dueDate,
      due_time: dueTime || null,
      priority: priority as Priority,
      estimated_minutes: estimated,
      notes,
      ...(form.has("goal_id") ? { goal_id: goal || null } : {}),
    },
  };
}

// What the learner typed into the add / edit form, as text, so the form can
// be refilled after an error instead of losing their work.
const TASK_FIELDS = [
  "title",
  "subject",
  "due_date",
  "due_time",
  "priority",
  "estimated_minutes",
  "notes",
  "goal_id",
] as const;
export type TaskFormValues = Partial<Record<(typeof TASK_FIELDS)[number], string>>;

export function taskFormValues(form: FormData): TaskFormValues {
  return formValues(form, TASK_FIELDS);
}

// ---- Filters and sessions in the planner (ticket 17) ----------------------

export const STATUS_FILTERS = { all: "All", ...TASK_STATUSES } as const;
export type StatusFilter = keyof typeof STATUS_FILTERS;

// Read ?subject=…&status=…&priority=… from the page address. Unknown
// values are ignored, so a bad link never breaks the page.
export function parsePlannerFilters(params: Record<string, string | string[] | undefined>) {
  const one = (k: string) => {
    const v = params[k];
    return typeof v === "string" ? v : "";
  };
  const subject = one("subject");
  const status = one("status");
  const priority = one("priority");
  return {
    subject: Object.hasOwn(SUBJECTS, subject) ? (subject as Subject) : undefined,
    status: (Object.hasOwn(STATUS_FILTERS, status) ? status : "all") as StatusFilter,
    priority: Object.hasOwn(PRIORITIES, priority) ? (priority as Priority) : undefined,
  };
}

// "Create study task" from a LearnTrack topic opens Study Tasks with
// ?new_title=…&new_subject=…. Only a known subject and a title within the
// limit are used; anything else is ignored. Nothing is saved until the
// learner presses Add task.
export function parseTaskPrefill(params: Record<string, string | string[] | undefined>): TaskFormValues | undefined {
  const title = typeof params.new_title === "string" ? params.new_title.trim().slice(0, 100) : "";
  const subject = typeof params.new_subject === "string" ? params.new_subject : "";
  if (!title) return undefined;
  return Object.hasOwn(SUBJECTS, subject) ? { title, subject } : { title };
}

// A tutoring session's start time as a Philippine date and time, so it can
// sit in the planner next to tasks: "2026-10-20" and "16:00:00".
export function toManilaDateTime(iso: string) {
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });
  const time = d.toLocaleTimeString("en-GB", { timeZone: "Asia/Manila", hour12: false });
  return { date, time };
}
