import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { formatPeso, LEVELS, MODES, SUBJECTS, type Level, type Mode, type Subject } from "@/lib/tutormatch";
import { RequestForm } from "./request-form";

export const metadata: Metadata = { title: "Tutor · TutorMatch" };

type Tutor = {
  tutor_id: string;
  bio: string;
  subjects: Subject[];
  levels: Level[];
  rate_centavos: number;
  mode: Mode;
  availability: string;
  profiles: { display_name: string } | null;
};

// Supabase ids look like 3f2b...-...; anything else can't be a tutor.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function TutorPage({ params }: PageProps<"/tutors/[id]">) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const supabase = await createClient();
  const [{ data: tutor, error }, { data: auth }] = await Promise.all([
    supabase
      .from("tutor_profiles")
      .select("tutor_id, bio, subjects, levels, rate_centavos, mode, availability, profiles(display_name)")
      .eq("tutor_id", id)
      .maybeSingle<Tutor>(),
    supabase.auth.getUser(),
  ]);

  if (error) {
    console.error("Tutor page: could not load tutor", error);
    return (
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col px-4 py-10">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-2xl">We couldn&apos;t load this tutor</CardTitle>
            <CardDescription>Please try again in a moment.</CardDescription>
          </CardHeader>
        </Card>
      </main>
    );
  }
  if (!tutor) notFound();

  const name = tutor.profiles?.display_name ?? "Tutor";
  const user = auth.user;

  // Only learners can request sessions (the database enforces this too).
  let isLearner = false;
  if (user) {
    const { data: viewer } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
    isLearner = viewer?.role === "learner";
  }

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-4 px-4 py-10">
      <Link href="/tutors" className="text-sm font-medium text-primary hover:underline">
        ← Back to Find a Tutor
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{name}</CardTitle>
          <CardDescription>{tutor.subjects.map((s) => SUBJECTS[s]).join(" · ")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 text-sm">
          <p className="text-2xl font-semibold">
            {formatPeso(tutor.rate_centavos)}{" "}
            <span className="text-sm font-normal text-muted-foreground">per session</span>
          </p>

          {tutor.bio && <p className="whitespace-pre-line break-words">{tutor.bio}</p>}

          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
            <dt className="text-muted-foreground">Teaches</dt>
            <dd>{tutor.levels.map((l) => LEVELS[l]).join(", ")}</dd>
            <dt className="text-muted-foreground">Mode</dt>
            <dd>{MODES[tutor.mode]}</dd>
            <dt className="text-muted-foreground">Available</dt>
            <dd className="min-w-0 break-words">{tutor.availability || "Ask the tutor"}</dd>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Request a Session</CardTitle>
        </CardHeader>
        <CardContent>
          {isLearner ? (
            <RequestForm
              tutorId={tutor.tutor_id}
              subjects={tutor.subjects}
              priceLabel={formatPeso(tutor.rate_centavos)}
            />
          ) : user ? (
            <p className="text-sm text-muted-foreground">
              Session requests are sent from learner accounts.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground">
                Log in to send {name} a session request.
              </p>
              <Link
                href={`/login?next=${encodeURIComponent(`/tutors/${tutor.tutor_id}`)}`}
                className={buttonVariants({ className: "w-full" })}
              >
                Log in to request a session
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
