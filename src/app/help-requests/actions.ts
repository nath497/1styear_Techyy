"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LEVELS, pesosToCentavos, SUBJECTS } from "@/lib/tutormatch";

export type HelpFormState = { error?: string };

export async function postHelpRequest(_prev: HelpFormState, formData: FormData): Promise<HelpFormState> {
  const text = (key: string) => String(formData.get(key) ?? "").trim();
  const title = text("title");
  const details = text("details");
  const subject = text("subject");
  const level = text("level");
  const mode = text("mode");
  const preferredTime = text("preferred_time");
  const budgetCentavos = pesosToCentavos(text("budget"));

  if (!title) return { error: "Give your request a short title." };
  if (title.length > 100) return { error: "Please keep the title under 100 characters." };
  if (!details) return { error: "Tell tutors what you need help with." };
  if (details.length > 1000) return { error: "Please keep the details under 1000 characters." };
  if (!Object.hasOwn(SUBJECTS, subject)) return { error: "Choose a subject." };
  if (!Object.hasOwn(LEVELS, level)) return { error: "Choose your level." };
  if (budgetCentavos === undefined) return { error: "Enter your budget per session in pesos, e.g. 100." };
  if (mode !== "online" && mode !== "face_to_face") return { error: "Choose online or face-to-face." };
  if (preferredTime.length > 200) return { error: "Please keep the preferred time under 200 characters." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please log in again." };

  // No status: the database always starts a request as Open
  // (see supabase/sql/007-help-requests.sql).
  const { error } = await supabase.from("help_requests").insert({
    learner_id: user.id,
    title,
    details,
    subject,
    level,
    budget_centavos: budgetCentavos,
    mode,
    preferred_time: preferredTime,
  });

  if (error) {
    console.error("Post a help request: insert failed", error.code, error.message);
    // 42501 = blocked by Row Level Security (e.g. a tutor account).
    if (error.code === "42501") return { error: "Only learner accounts can post help requests." };
    return { error: "We couldn't post your request. Please try again." };
  }

  redirect("/help-requests");
}

export async function cancelHelpRequest(_prev: HelpFormState, formData: FormData): Promise<HelpFormState> {
  const requestId = String(formData.get("request_id") ?? "");
  if (!requestId) return { error: "Something went wrong. Please refresh." };

  const supabase = await createClient();
  // Who may cancel, and when, is decided by the database (SQL 007).
  const { data, error } = await supabase
    .from("help_requests")
    .update({ status: "cancelled" })
    .eq("id", requestId)
    .select("id");

  if (error) {
    console.error("My help requests: cancel failed", error.code, error.message);
    // P0001 = a message we wrote ourselves in the SQL trigger.
    if (error.code === "P0001") return { error: error.message };
    return { error: "We couldn't cancel this request. Please try again." };
  }
  if (!data || data.length === 0) return { error: "You can't change this request. Please refresh." };

  revalidatePath("/help-requests");
  return {};
}
