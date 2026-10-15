"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type StatusFormState = { error?: string };

// The statuses a button can ask for. Who may do what is decided by the
// database (supabase/sql/004-booking-status-changes.sql), not here.
const ALLOWED = ["accepted", "declined", "cancelled"];

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
  return {};
}
