// Learning goal rules (SQL 017, ticket 25). The database checks the same
// limits; these give the learner friendly messages first.
import { calendarDateError, hasLetterOrNumber } from "@/lib/dates";
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

  if (!hasLetterOrNumber(title)) return { error: "Give the goal a title." };
  if (title.length > 100) return { error: "Please keep the title under 100 characters." };
  if (description.length > 500) return { error: "Please keep the description under 500 characters." };
  const dateError = calendarDateError(date, "a target date");
  if (dateError) return { error: dateError };

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
