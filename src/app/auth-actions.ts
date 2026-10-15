"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LEVELS } from "@/lib/tutormatch";

export type AuthFormState = { error?: string; message?: string };

// Only allow redirects to pages on this site (e.g. "/tutors"), never to
// another website.
function safeNext(value: FormDataEntryValue | null) {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/") && !next.startsWith("//") ? next : "/tutors";
}

// Turn Supabase's technical messages into friendly ones.
function friendly(message: string) {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "Wrong email or password. Please try again.";
  if (m.includes("already registered")) return "An account with this email already exists. Try logging in instead.";
  if (m.includes("email not confirmed")) return "Please confirm your email first — check your inbox.";
  if (m.includes("rate limit") || m.includes("too many")) return "Too many attempts. Please wait a minute and try again.";
  if (m.includes("password")) return message;
  return "Something went wrong. Please try again.";
}

export async function signUp(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const displayName = String(formData.get("display_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "");
  const level = String(formData.get("level") ?? "");

  if (!displayName) return { error: "Please enter your name." };
  if (displayName.length > 80) return { error: "Please use a shorter name (80 characters max)." };
  if (!email) return { error: "Please enter your email." };
  if (password.length < 6) return { error: "Your password needs at least 6 characters." };
  if (role !== "learner" && role !== "tutor") return { error: "Choose whether you are a Learner or a Tutor." };
  if (!(level in LEVELS)) return { error: "Choose Senior High or College." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    // The database reads these to create the profile row (see SQL 002).
    options: { data: { display_name: displayName, role, level } },
  });

  if (error) return { error: friendly(error.message) };

  // If "Confirm email" is still ON in Supabase there is no session yet.
  if (!data.session) {
    return { message: "Account created! Check your email for a confirmation link, then log in." };
  }

  redirect(safeNext(formData.get("next")));
}

export async function logIn(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Please enter your email and password." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: friendly(error.message) };

  redirect(safeNext(formData.get("next")));
}

export async function logOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
