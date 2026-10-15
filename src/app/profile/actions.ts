"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { LEVELS } from "@/lib/tutormatch";

export type AccountFormState = { error?: string; saved?: number };

// Change your own display name and level. The database only lets you
// change these two columns, and only on your own row (SQL 002) — your role
// can never change, even if someone bypasses this form.
export async function saveAccount(_prev: AccountFormState, formData: FormData): Promise<AccountFormState> {
  const displayName = String(formData.get("display_name") ?? "").trim();
  const level = String(formData.get("level") ?? "");

  if (!displayName) return { error: "Please enter your name." };
  if (displayName.length > 80) return { error: "Please use a shorter name (80 characters max)." };
  if (!Object.hasOwn(LEVELS, level)) return { error: "Choose Senior High or College." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please log in again." };

  const { data, error } = await supabase
    .from("profiles")
    .update({ display_name: displayName, level })
    .eq("id", user.id)
    .select("id");
  if (error) {
    console.error("Profile: could not save", error.code, error.message);
    return { error: "We couldn't save your changes. Please try again." };
  }
  if (!data || data.length === 0) return { error: "We couldn't find your account. Please log in again." };

  // The name shows in the header on every page, so refresh them all.
  revalidatePath("/", "layout");
  return { saved: Date.now() };
}
