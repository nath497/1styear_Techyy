import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm, type ExistingProfile } from "./profile-form";

export const metadata: Metadata = { title: "My tutor profile · TutorMatch" };

export default async function TutorProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/tutor-profile");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  // Learners see a friendly message instead of the form. (The database
  // would refuse to save a learner's listing anyway.)
  if (profile?.role !== "tutor") {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">This page is for tutors</CardTitle>
            <CardDescription>
              Your account is a learner account, so you don&apos;t need a tutor profile.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/tutors" className={buttonVariants({ className: "w-full" })}>
              Find a Tutor
            </Link>
          </CardContent>
        </Card>
      </main>
    );
  }

  const { data: existing, error } = await supabase
    .from("tutor_profiles")
    .select("bio, subjects, levels, rate_centavos, mode, availability")
    .eq("tutor_id", user.id)
    .maybeSingle<ExistingProfile>();

  if (error) console.error("Tutor profile: could not load", error);

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">My tutor profile</CardTitle>
          <CardDescription>
            {existing
              ? "This is what learners see on Find a Tutor. Update it any time."
              : "Tell learners what you teach and what you charge. You'll appear on Find a Tutor once you save."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <p role="alert" className="rounded-[var(--radius)] bg-destructive/10 px-3 py-2 text-sm text-destructive">
              We couldn&apos;t load your profile right now. Please refresh the page.
            </p>
          ) : (
            <ProfileForm existing={existing} />
          )}
        </CardContent>
      </Card>
    </main>
  );
}
