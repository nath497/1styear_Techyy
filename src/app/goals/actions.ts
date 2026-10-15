"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isGoalStatus, parseGoalForm } from "@/lib/goals";
import { isUuid } from "@/lib/tutormatch";

export type GoalFormState = { error?: string; saved?: number };

function refresh() {
  revalidatePath("/learning-space");
}

// Add a goal. The database sets the owner, starts it Active, and only lets
// learners add goals (SQL 017).
export async function addGoal(_prev: GoalFormState, formData: FormData): Promise<GoalFormState> {
  const parsed = parseGoalForm(formData);
  if ("error" in parsed) return { error: parsed.error };

  const supabase = await createClient();
  const { error } = await supabase.from("learning_goals").insert(parsed.goal);
  if (error) {
    console.error("Goals: add failed", error.code, error.message);
    if (error.code === "42501") return { error: "Only learner accounts can set learning goals." };
    return { error: "We couldn't add the goal. Please try again." };
  }
  refresh();
  return { saved: Date.now() };
}

// Edit a goal's title, description or target date. Only the owner can.
export async function updateGoal(_prev: GoalFormState, formData: FormData): Promise<GoalFormState> {
  const id = String(formData.get("goal_id") ?? "");
  if (!isUuid(id)) return { error: "Something went wrong. Please refresh." };
  const parsed = parseGoalForm(formData);
  if ("error" in parsed) return { error: parsed.error };

  const supabase = await createClient();
  const { data, error } = await supabase.from("learning_goals").update(parsed.goal).eq("id", id).select("id");
  if (error) {
    console.error("Goals: edit failed", error.code, error.message);
    return { error: "We couldn't save your changes. Please try again." };
  }
  if (!data || data.length === 0) return { error: "You can't change this goal. Please refresh." };
  refresh();
  return { saved: Date.now() };
}

// Mark a goal Achieved, or back to Active. The database fills in when.
export async function setGoalStatus(_prev: GoalFormState, formData: FormData): Promise<GoalFormState> {
  const id = String(formData.get("goal_id") ?? "");
  const status = formData.get("status");
  if (!isUuid(id) || !isGoalStatus(status)) return { error: "Something went wrong. Please refresh." };

  const supabase = await createClient();
  const { data, error } = await supabase.from("learning_goals").update({ status }).eq("id", id).select("id");
  if (error) {
    console.error("Goals: status change failed", error.code, error.message);
    return { error: "We couldn't update the goal. Please try again." };
  }
  if (!data || data.length === 0) return { error: "You can't change this goal. Please refresh." };
  refresh();
  return { saved: Date.now() };
}

// Delete a goal. Its tasks stay; they're just no longer linked (SQL 017).
export async function deleteGoal(_prev: GoalFormState, formData: FormData): Promise<GoalFormState> {
  const id = String(formData.get("goal_id") ?? "");
  if (!isUuid(id)) return { error: "Something went wrong. Please refresh." };

  const supabase = await createClient();
  const { data, error } = await supabase.from("learning_goals").delete().eq("id", id).select("id");
  if (error) {
    console.error("Goals: delete failed", error.code, error.message);
    return { error: "We couldn't delete the goal. Please try again." };
  }
  if (!data || data.length === 0) return { error: "You can't delete this goal. Please refresh." };
  refresh();
  return { saved: Date.now() };
}
