"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LEVELS } from "@/lib/tutormatch";

export type AuthFormState = { error?: string; message?: string };

// Only allow redirects to pages on this site (e.g. "/tutors"), never to
// another website. Browsers treat a backslash like "/" and silently drop
// tabs and newlines, so "/\evil.com" or "/<tab>/evil.com" would both turn
// into "//evil.com". So: plain visible characters only, no backslash.
function safeNext(value: FormDataEntryValue | null, fallback = "/tutors") {
  const next = typeof value === "string" ? value : "";
  const isSafe =
    /^\/[\x21-\x7E]*$/.test(next) && !next.startsWith("//") && !next.includes("\\");
  return isSafe ? next : fallback;
}

// Turn Supabase's technical messages into friendly ones.
function friendly(message: string) {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "Wrong email or password. Please try again.";
  if (m.includes("already registered")) return "An account with this email already exists. Try logging in instead.";
  if (m.includes("email not confirmed")) return "Please confirm your email first — check your inbox.";
  // Supabase's built-in email sends only a few emails an hour. This only
  // happens if "Confirm email" is ON in Supabase — team: check that if
  // you see "email rate limit" in Vercel's logs.
  if (m.includes("email rate limit"))
    return "Sign-up is busy right now. Please try again in about an hour.";
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
  if (password.length < 8) return { error: "Your password needs at least 8 characters." };
  if (role !== "learner" && role !== "tutor") return { error: "Choose whether you are a Learner or a Tutor." };
  if (!(level in LEVELS)) return { error: "Choose High School or College." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    // The database reads these to create the profile row (see SQL 002).
    options: { data: { display_name: displayName, role, level } },
  });

  if (error) {
    // The real message, for Vercel's logs (Project → Logs).
    console.error("Auth error:", error.status, error.code, error.message);
    return { error: friendly(error.message) };
  }

  // If "Confirm email" is still ON in Supabase there is no session yet.
  if (!data.session) {
    return { message: "Account created! Check your email for a confirmation link, then log in." };
  }

  // New tutors go straight to their profile, unless a page asked to come back.
  redirect(safeNext(formData.get("next"), role === "tutor" ? "/tutor-profile" : "/dashboard"));
}

export async function logIn(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Please enter your email and password." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    // The real message, for Vercel's logs (Project → Logs).
    console.error("Auth error:", error.status, error.code, error.message);
    return { error: friendly(error.message) };
  }

  // Each person lands on their own dashboard (unless a page asked to come back).
  redirect(safeNext(formData.get("next"), "/dashboard"));
}

export async function logOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
