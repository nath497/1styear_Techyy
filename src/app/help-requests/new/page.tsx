import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { PostHelpRequestForm } from "./post-form";

export const metadata: Metadata = { title: "Post a help request · TutorMatch" };

export default async function NewHelpRequestPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/help-requests/new");

  const { data: profile } = await supabase.from("profiles").select("role, level").eq("id", user.id).maybeSingle();

  // Only learners post help requests (the database enforces this too).
  if (profile?.role !== "learner") {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">This page is for learners</CardTitle>
            <CardDescription>Help requests are posted from learner accounts.</CardDescription>
          </CardHeader>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-4 px-4 py-10">
      <Link href="/help-requests" className="text-sm font-medium text-primary hover:underline">
        ← Back to my help requests
      </Link>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Post a help request</CardTitle>
          <CardDescription>Tutors on TutorMatch can see it and offer to help.</CardDescription>
        </CardHeader>
        <CardContent>
          <PostHelpRequestForm defaultLevel={profile.level ?? ""} />
        </CardContent>
      </Card>
    </main>
  );
}
