"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { parseManilaDateTime, SUBJECTS } from "@/lib/tutormatch";

export type RequestFormState = { error?: string };

export async function requestSession(
  _prev: RequestFormState,
  formData: FormData,
): Promise<RequestFormState> {
  const tutorId = String(formData.get("tutor_id") ?? "");
  const subject = String(formData.get("subject") ?? "");
  const topic = String(formData.get("topic") ?? "").trim();
  const startsAt = parseManilaDateTime(String(formData.get("starts_at") ?? ""));

  if (!Object.hasOwn(SUBJECTS, subject)) return { error: "Choose a subject." };
  if (!topic) return { error: "Tell the tutor what topic you need help with." };
  if (topic.length > 200) return { error: "Please keep the topic under 200 characters." };
  if (!startsAt) return { error: "Choose a real date and time." };
  if (startsAt.getTime() <= Date.now()) return { error: "Please pick a date and time in the future." };
  if (startsAt.getTime() > Date.now() + 365 * 24 * 60 * 60 * 1000)
    return { error: "Please pick a date within the next year." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please log in again." };

  // No price and no status: the database copies the price from the
  // tutor's current rate and always starts the request as Pending
  // (see supabase/sql/003-bookings.sql).
  const { error } = await supabase.from("bookings").insert({
    learner_id: user.id,
    tutor_id: tutorId,
    subject,
    topic,
    starts_at: startsAt.toISOString(),
  });

  if (error) {
    console.error("Request a session: insert failed", error.code, error.message);
    // P0001 = a message we wrote ourselves in the SQL trigger.
    if (error.code === "P0001") return { error: error.message };
    // 42501 = blocked by Row Level Security (e.g. a tutor account).
    if (error.code === "42501") return { error: "Only learner accounts can request sessions." };
    return { error: "We couldn't send your request. Please try again." };
  }

  redirect("/sessions");
}
