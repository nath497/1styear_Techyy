"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { parseActivityForm } from "@/lib/schedule";
import { isUuid } from "@/lib/tutormatch";

export type ActivityFormState = { error?: string; saved?: number };

// Turn a database refusal into a friendly message. 23P01 = the activity
// clashes with another one (SQL 017); the clashing title comes back as
// the error's detail.
function friendly(error: { code?: string; details?: string | null }, fallback: string) {
  if (error.code === "23P01")
    return error.details
      ? `This clashes with "${error.details}". Pick a different time.`
      : "This clashes with another study activity. Pick a different time.";
  if (error.code === "23514") return "Check the times: the end must be after the start.";
  if (error.code === "42501") return "Only learner accounts can plan study activities.";
  return fallback;
}

function refresh() {
  revalidatePath("/learning-space");
}

// Add a study activity. The database sets the owner and dates, and refuses
// one that overlaps the learner's own activities (SQL 017).
export async function addActivity(_prev: ActivityFormState, formData: FormData): Promise<ActivityFormState> {
  const parsed = parseActivityForm(formData);
  if ("error" in parsed) return { error: parsed.error };

  const supabase = await createClient();
  const { error } = await supabase.from("study_activities").insert(parsed.activity);
  if (error) {
    console.error("Schedule: add failed", error.code, error.message);
    return { error: friendly(error, "We couldn't add the activity. Please try again.") };
  }
  refresh();
  return { saved: Date.now() };
}

// Edit an activity — same checks as adding. Only the owner can (SQL 017).
export async function updateActivity(_prev: ActivityFormState, formData: FormData): Promise<ActivityFormState> {
  const id = String(formData.get("activity_id") ?? "");
  if (!isUuid(id)) return { error: "Something went wrong. Please refresh." };
  const parsed = parseActivityForm(formData);
  if ("error" in parsed) return { error: parsed.error };

  const supabase = await createClient();
  const { data, error } = await supabase.from("study_activities").update(parsed.activity).eq("id", id).select("id");
  if (error) {
    console.error("Schedule: edit failed", error.code, error.message);
    return { error: friendly(error, "We couldn't save your changes. Please try again.") };
  }
  if (!data || data.length === 0) return { error: "You can't change this activity. Please refresh." };
  refresh();
  return { saved: Date.now() };
}

// Delete an activity. Only the owner can (SQL 017).
export async function deleteActivity(_prev: ActivityFormState, formData: FormData): Promise<ActivityFormState> {
  const id = String(formData.get("activity_id") ?? "");
  if (!isUuid(id)) return { error: "Something went wrong. Please refresh." };

  const supabase = await createClient();
  const { data, error } = await supabase.from("study_activities").delete().eq("id", id).select("id");
  if (error) {
    console.error("Schedule: delete failed", error.code, error.message);
    return { error: "We couldn't delete the activity. Please try again." };
  }
  if (!data || data.length === 0) return { error: "You can't delete this activity. Please refresh." };
  refresh();
  return { saved: Date.now() };
}
