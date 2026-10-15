import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { SignupForm } from "./signup-form";

export const metadata: Metadata = { title: "Sign up · TutorMatch" };

export default async function SignupPage({ searchParams }: PageProps<"/signup">) {
  const { role, next } = await searchParams;

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (data.user) redirect("/tutors");

  const nextPath = typeof next === "string" ? next : "";

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Create your TutorMatch account</CardTitle>
          <CardDescription>Learn from fellow students, or earn by tutoring them.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <SignupForm defaultRole={role === "tutor" ? "tutor" : "learner"} next={nextPath} />
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href={nextPath ? `/login?next=${encodeURIComponent(nextPath)}` : "/login"}
              className="font-medium text-primary hover:underline"
            >
              Log in
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
