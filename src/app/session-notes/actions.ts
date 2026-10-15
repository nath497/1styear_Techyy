"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { parseNoteForm } from "@/lib/session-notes";
import { isUuid } from "@/lib/tutormatch";

export type NoteFormState = { error?: string; saved?: number };

// Save the learner's notes on one of their sessions: update the note if it
// exists, otherwise create it. (A one-step "upsert" isn't possible: the
// database never lets a note's booking change, by design.)
// The database only allows this on the learner's OWN Accepted or Completed
// booking, and nobody else can read the notes (SQL 017).
export async function saveSessionNote(_prev: NoteFormState, formData: FormData): Promise<NoteFormState> {
  const bookingId = String(formData.get("booking_id") ?? "");
  if (!isUuid(bookingId)) return { error: "Something went wrong. Please refresh." };
  const parsed = parseNoteForm(formData);
  if ("error" in parsed) return { error: parsed.error };

  const supabase = await createClient();
  const update = () =>
    supabase.from("session_notes").update(parsed.note).eq("booking_id", bookingId).select("id");

  let { data, error } = await update();
  if (!error && (!data || data.length === 0)) {
    // No note yet — create one.
    ({ error } = await supabase.from("session_notes").insert({ booking_id: bookingId, ...parsed.note }));
    // 23505 = it was created a moment ago (e.g. another tab): update it instead.
    if (error?.code === "23505") ({ data, error } = await update());
  }
  if (error) {
    console.error("Session notes: save failed", error.code, error.message);
    if (error.code === "42501")
      return { error: "Notes can only be added to your own accepted or completed sessions." };
    return { error: "We couldn't save your notes. Please try again." };
  }

  revalidatePath("/learning-space");
  return { saved: Date.now() };
}
