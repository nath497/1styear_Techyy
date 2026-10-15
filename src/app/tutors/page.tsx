import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import {
  formatPeso,
  LEVELS,
  MODES,
  SUBJECTS,
  type Level,
  type Mode,
  type Subject,
} from "@/lib/tutormatch";

export const metadata: Metadata = { title: "Find a Tutor · TutorMatch" };

type TutorRow = {
  tutor_id: string;
  subjects: Subject[];
  levels: Level[];
  rate_centavos: number;
  mode: Mode;
  availability: string;
  profiles: { display_name: string } | null;
};

export default async function FindATutorPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tutor_profiles")
    .select("tutor_id, subjects, levels, rate_centavos, mode, availability, profiles(display_name)")
    .order("rate_centavos", { ascending: true })
    .returns<TutorRow[]>();

  // Shows up in the terminal locally and in Vercel's logs when live.
  if (error) console.error("Find a Tutor: could not load tutor_profiles", error);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Find a Tutor</h1>
        <p className="text-muted-foreground">
          Student tutors who teach your subject, at a price that fits your budget.
        </p>
      </header>

      {error ? (
        <Card className="border-destructive">
          <CardContent className="pt-6 text-sm">
            <p className="font-medium text-destructive">We couldn&apos;t load tutors right now.</p>
            <p className="mt-1 text-muted-foreground">Please try again in a moment.</p>
          </CardContent>
        </Card>
      ) : data.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="font-medium">No tutors yet.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              TutorMatch is brand new — check back soon, or become the first tutor.
            </p>
          </CardContent>
        </Card>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {data.map((tutor) => (
            <li key={tutor.tutor_id}>
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>{tutor.profiles?.display_name ?? "Tutor"}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {tutor.subjects.map((s) => SUBJECTS[s]).join(" · ")}
                  </p>
                </CardHeader>
                <CardContent className="flex flex-col gap-1 text-sm">
                  <p className="text-lg font-semibold">
                    {formatPeso(tutor.rate_centavos)}{" "}
                    <span className="text-sm font-normal text-muted-foreground">per session</span>
                  </p>
                  <p>{MODES[tutor.mode]}</p>
                  <p className="text-muted-foreground">
                    {tutor.levels.map((l) => LEVELS[l]).join(", ")}
                    {tutor.availability ? ` · ${tutor.availability}` : ""}
                  </p>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
