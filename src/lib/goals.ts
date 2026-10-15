// Learning goal rules (SQL 017, ticket 25). The database checks the same
// limits; these give the learner friendly messages first.
import { formValues } from "@/lib/form-values";

export const GOAL_STATUSES = { active: "Active", achieved: "Achieved" } as const;
export type GoalStatus = keyof typeof GOAL_STATUSES;

export function isGoalStatus(value: unknown): value is GoalStatus {
  return typeof value === "string" && Object.hasOwn(GOAL_STATUSES, value);
}

export type LearningGoal = {
  id: string;
  title: string;
  description: string;
  target_date: string; // "2026-11-30"
  status: GoalStatus;
};

// The short version used in pick-lists (e.g. "Link to a goal").
export type GoalOption = Pick<LearningGoal, "id" | "title" | "status">;

export type GoalInput = Pick<LearningGoal, "title" | "description" | "target_date">;

// Read and check the add / edit form.
export function parseGoalForm(form: FormData): { goal: GoalInput } | { error: string } {
  const text = (k: string) => String(form.get(k) ?? "").trim();
  const title = text("title");
  const description = text("description");
  const date = text("target_date");

  if (!/[\p{L}\p{N}]/u.test(title)) return { error: "Give the goal a title." };
  if (title.length > 100) return { error: "Please keep the title under 100 characters." };
  if (description.length > 500) return { error: "Please keep the description under 500 characters." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(`${date}T00:00:00Z`)))
    return { error: "Choose a target date." };
  if (new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) !== date) return { error: "Choose a real date." };
  const year = Number(date.slice(0, 4));
  if (year < 2020 || year > 2100) return { error: "Choose a date between 2020 and 2100." };

  return { goal: { title, description, target_date: date } };
}

export const GOAL_FIELDS = ["title", "description", "target_date"] as const;
export type GoalFormValues = Partial<Record<(typeof GOAL_FIELDS)[number], string>>;
export function goalFormValues(form: FormData): GoalFormValues {
  return formValues(form, GOAL_FIELDS);
}

// The progress rule: "X of Y linked tasks completed". With no linked tasks
// there's no percent (never a made-up 0%).
export function goalProgress(tasks: { status: string }[]) {
  const total = tasks.length;
  const done = tasks.filter((t) => t.status === "done").length;
  return { done, total, percent: total > 0 ? Math.round((done / total) * 100) : null };
}

// "Nov 30, 2026" — a plain calendar date.
export function formatTargetDate(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-PH", {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
