"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { manilaToday } from "@/lib/planner";
import { activityInstant, formatDay, parseActivityForm, scheduleDays, type ActivityInput } from "@/lib/schedule";
import { isUuid } from "@/lib/tutormatch";

export type ActivityFormState = { error?: string; saved?: number; warning?: string; note?: string };

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

// Saved fine — but does it overlap one of the learner's accepted tutoring
// sessions (1 hour each)? That's allowed; we just say so. Row Level
// Security only returns the learner's own bookings.
async function sessionWarning(
  supabase: Awaited<ReturnType<typeof createClient>>,
  a: ActivityInput,
): Promise<string | undefined> {
  const start = activityInstant(a.activity_date, a.start_time);
  const end = activityInstant(a.activity_date, a.end_time);
  const hourBefore = new Date(new Date(start).getTime() - 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("bookings")
    .select("id")
    .eq("status", "accepted")
    .gt("starts_at", hourBefore)
    .lt("starts_at", end)
    .limit(1);
  if (error) {
    console.error("Schedule: could not check sessions", error.code, error.message);
    return undefined;
  }
  return data && data.length > 0 ? "Heads up: this overlaps one of your tutoring sessions." : undefined;
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
  const today = manilaToday();
  // The Schedule only lists this week and next; say where a later one went.
  const note = scheduleDays(today).includes(parsed.activity.activity_date)
    ? undefined
    : `Saved for ${formatDay(parsed.activity.activity_date, today)}. It will show here in the two weeks before.`;
  return { saved: Date.now(), warning: await sessionWarning(supabase, parsed.activity), note };
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
