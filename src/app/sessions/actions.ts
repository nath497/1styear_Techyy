"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isAllowedMeetingLink, isUuid } from "@/lib/tutormatch";

export type StatusFormState = { error?: string };

// The statuses a button can ask for. Who may do what is decided by the
// database (supabase/sql/004 and 005), not here.
const ALLOWED = ["accepted", "declined", "cancelled", "completed"];

export async function changeBookingStatus(
  _prev: StatusFormState,
  formData: FormData,
): Promise<StatusFormState> {
  const bookingId = String(formData.get("booking_id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!bookingId || !ALLOWED.includes(status)) return { error: "Something went wrong. Please refresh." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bookings")
    .update({ status })
    .eq("id", bookingId)
    .select("id");

  if (error) {
    console.error("My sessions: status change failed", error.code, error.message);
    // P0001 = a message we wrote ourselves in the SQL trigger.
    if (error.code === "P0001") return { error: error.message };
    return { error: "We couldn't update this session. Please try again." };
  }
  // No row came back: not your booking, or you're logged out.
  if (!data || data.length === 0) return { error: "You can't change this session. Please refresh." };

  revalidatePath("/sessions");
  revalidatePath("/dashboard/tutor");
  return {};
}

export type LinkFormState = { error?: string; saved?: number };

// The tutor adds, changes or removes the video call link on an Accepted
// session. Empty = remove. The database checks it's the tutor, that the
// session is Accepted, and that the link is a real Meet/Zoom/Teams/Jitsi
// link (SQL 014).
export async function saveMeetingLink(_prev: LinkFormState, formData: FormData): Promise<LinkFormState> {
  const bookingId = String(formData.get("booking_id") ?? "");
  const link = String(formData.get("meeting_link") ?? "").trim();
  if (!isUuid(bookingId)) return { error: "Something went wrong. Please refresh." };
  if (link && !isAllowedMeetingLink(link))
    return { error: "Paste a Google Meet, Zoom, Microsoft Teams or Jitsi link that starts with https://" };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bookings")
    .update({ meeting_link: link || null })
    .eq("id", bookingId)
    .select("id");

  if (error) {
    console.error("Video call link: update failed", error.code, error.message);
    // P0001 = a message we wrote ourselves in the SQL trigger.
    if (error.code === "P0001") return { error: error.message };
    // 23514 = the link rule in the database.
    if (error.code === "23514") return { error: "That link isn't from Google Meet, Zoom, Microsoft Teams or Jitsi." };
    return { error: "We couldn't save the link. Please try again." };
  }
  if (!data || data.length === 0) return { error: "You can't change this session. Please refresh." };

  revalidatePath("/sessions");
  revalidatePath("/dashboard/tutor");
  revalidatePath("/dashboard/learner");
  return { saved: Date.now() };
}
