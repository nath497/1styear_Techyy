import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { LEVELS, type Level } from "@/lib/tutormatch";
import { AccountForm } from "./account-form";

export const metadata: Metadata = { title: "Profile · TutorMatch" };

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/profile");

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("display_name, role, level, created_at")
    .eq("id", user.id)
    .maybeSingle<{ display_name: string; role: "learner" | "tutor"; level: Level; created_at: string }>();

  if (error || !profile) {
    if (error) console.error("Profile: could not load account", error);
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-2xl">We couldn&apos;t load your account</CardTitle>
            <CardDescription>
              {error
                ? "Please refresh the page in a moment."
                : "Your account isn't set up properly. Please log out, sign up again, or ask your team for help."}
            </CardDescription>
          </CardHeader>
        </Card>
      </main>
    );
  }

  const joined = new Date(profile.created_at).toLocaleDateString("en-PH", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-4 py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Profile</h1>
        <p className="text-muted-foreground">Your account details.</p>
      </header>

      <Card>
        <CardContent className="pt-6">
          {/* Read-only details. The email belongs to the login account, and
              the role is fixed at sign-up. */}
          <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-[auto_1fr]">
            <dt className="text-muted-foreground">Email</dt>
            <dd className="break-all font-medium">{user.email}</dd>
            <dt className="text-muted-foreground">Role</dt>
            <dd className="font-medium">{profile.role === "tutor" ? "Tutor" : "Learner"}</dd>
            <dt className="text-muted-foreground">Level</dt>
            <dd className="font-medium">{LEVELS[profile.level]}</dd>
            <dt className="text-muted-foreground">Joined</dt>
            <dd className="font-medium">{joined}</dd>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Edit your details</CardTitle>
        </CardHeader>
        <CardContent>
          <AccountForm name={profile.display_name} level={profile.level} />
        </CardContent>
      </Card>

      {profile.role === "tutor" && (
        <p className="text-sm text-muted-foreground">
          Your rate, subjects and bio are on{" "}
          <Link href="/tutor-profile" className="font-medium text-primary hover:underline">
            My Profile
          </Link>
          .
        </p>
      )}
    </main>
  );
}
