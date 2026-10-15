"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isTaskStatus, parseTaskForm, type TaskFormValues } from "@/lib/planner";
import { isUuid } from "@/lib/tutormatch";

// `values` and `attempt` are filled in by the forms after an error, so the
// learner's typing comes back (see add-task-form.tsx).
export type TaskFormState = { error?: string; saved?: number; values?: TaskFormValues; attempt?: number };

// Add a study task. The database sets the owner, the "to do" status and
// the dates, and only lets learners add tasks (SQL 015).
export async function addTask(_prev: TaskFormState, formData: FormData): Promise<TaskFormState> {
  const parsed = parseTaskForm(formData);
  if ("error" in parsed) return { error: parsed.error };

  const supabase = await createClient();
  const { error } = await supabase.from("study_tasks").insert(parsed.task);
  if (error) {
    console.error("Study Planner: add failed", error.code, error.message);
    if (error.code === "42501") return { error: "Only learner accounts can use the Study Planner." };
    // P0001 = the goal isn't one of the learner's own (SQL 017).
    if (error.code === "P0001") return { error: "Choose one of your own goals, or none." };
    return { error: "We couldn't add the task. Please try again." };
  }

  revalidatePath("/learning-space");
  revalidatePath("/dashboard/learner");
  return { saved: Date.now() };
}

// Move a task between To Do, In Progress and Completed. Row Level Security
// means a learner can only change their own tasks.
export async function setTaskStatus(_prev: TaskFormState, formData: FormData): Promise<TaskFormState> {
  const taskId = String(formData.get("task_id") ?? "");
  const status = formData.get("status");
  if (!isUuid(taskId) || !isTaskStatus(status)) return { error: "Something went wrong. Please refresh." };

  const supabase = await createClient();
  const { data, error } = await supabase.from("study_tasks").update({ status }).eq("id", taskId).select("id");
  if (error) {
    console.error("Study Planner: status change failed", error.code, error.message);
    return { error: "We couldn't update the task. Please try again." };
  }
  if (!data || data.length === 0) return { error: "You can't change this task. Please refresh." };

  revalidatePath("/learning-space");
  revalidatePath("/dashboard/learner");
  return { saved: Date.now() };
}

// Edit a task — same checks as adding. Only the owner can (SQL 015).
export async function updateTask(_prev: TaskFormState, formData: FormData): Promise<TaskFormState> {
  const taskId = String(formData.get("task_id") ?? "");
  if (!isUuid(taskId)) return { error: "Something went wrong. Please refresh." };
  const parsed = parseTaskForm(formData);
  if ("error" in parsed) return { error: parsed.error };

  const supabase = await createClient();
  const { data, error } = await supabase.from("study_tasks").update(parsed.task).eq("id", taskId).select("id");
  if (error) {
    console.error("Study Planner: edit failed", error.code, error.message);
    if (error.code === "P0001") return { error: "Choose one of your own goals, or none." };
    return { error: "We couldn't save your changes. Please try again." };
  }
  if (!data || data.length === 0) return { error: "You can't change this task. Please refresh." };

  revalidatePath("/learning-space");
  revalidatePath("/dashboard/learner");
  return { saved: Date.now() };
}

// Delete a task. These are the learner's private notes, so deleting is
// allowed — but only by the owner (SQL 015).
export async function deleteTask(_prev: TaskFormState, formData: FormData): Promise<TaskFormState> {
  const taskId = String(formData.get("task_id") ?? "");
  if (!isUuid(taskId)) return { error: "Something went wrong. Please refresh." };

  const supabase = await createClient();
  const { data, error } = await supabase.from("study_tasks").delete().eq("id", taskId).select("id");
  if (error) {
    console.error("Study Planner: delete failed", error.code, error.message);
    return { error: "We couldn't delete the task. Please try again." };
  }
  if (!data || data.length === 0) return { error: "You can't delete this task. Please refresh." };

  revalidatePath("/learning-space");
  revalidatePath("/dashboard/learner");
  return { saved: Date.now() };
}
