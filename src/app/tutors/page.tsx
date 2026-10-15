import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/server";
import {
  formatPeso,
  LEVELS,
  matchReason,
  MODES,
  parseMatchFilters,
  SUBJECTS,
  tutorMatches,
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

const select =
  "flex h-10 w-full rounded-[var(--radius)] border border-input bg-background px-3 py-2 text-base md:text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";
const choice =
  "flex cursor-pointer items-center gap-2 rounded-[var(--radius)] border border-input bg-card px-3 py-2.5 text-sm has-[:checked]:border-primary has-[:checked]:bg-secondary has-[:checked]:text-secondary-foreground";

export default async function FindATutorPage({ searchParams }: PageProps<"/tutors">) {
  const params = await searchParams;
  // null until the learner has filled in all four answers.
  const filters = parseMatchFilters(params);
  // Pre-fill the form from the address, e.g. a home page subject link.
  const picked = (key: string) => (typeof params[key] === "string" ? params[key] : "");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tutor_profiles")
    .select("tutor_id, subjects, levels, rate_centavos, mode, availability, profiles(display_name)")
    .order("rate_centavos", { ascending: true })
    .returns<TutorRow[]>();

  // Shows up in the terminal locally and in Vercel's logs when live.
  if (error) console.error("Find a Tutor: could not load tutor_profiles", error);

  const tutors = filters ? (data ?? []).filter((t) => tutorMatches(t, filters)) : (data ?? []);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Find a Tutor</h1>
        <p className="text-muted-foreground">
          Student tutors who teach your subject, at a price that fits your budget.
        </p>
      </header>

      {/* A plain GET form: the answers go into the page address, so the
          results can be shared, bookmarked or refreshed. */}
      <Card>
        <CardContent className="pt-6">
          <form method="get" action="/tutors" className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="subject">Subject</Label>
              <select id="subject" name="subject" required defaultValue={picked("subject")} className={select}>
                <option value="" disabled>
                  Choose a subject
                </option>
                {(Object.keys(SUBJECTS) as Subject[]).map((key) => (
                  <option key={key} value={key}>
                    {SUBJECTS[key]}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="level">My level</Label>
              <select id="level" name="level" required defaultValue={picked("level")} className={select}>
                <option value="" disabled>
                  Choose your level
                </option>
                {(Object.keys(LEVELS) as Level[]).map((key) => (
                  <option key={key} value={key}>
                    {LEVELS[key]}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="budget">Budget per session (₱)</Label>
              <Input
                id="budget"
                name="budget"
                type="number"
                inputMode="decimal"
                min="1"
                step="0.01"
                placeholder="e.g. 100"
                required
                defaultValue={picked("budget")}
              />
            </div>

            <fieldset className="flex flex-col gap-2">
              <legend className="mb-2 text-sm font-medium">Mode</legend>
              <div className="grid grid-cols-2 gap-2">
                <label className={choice}>
                  <input type="radio" name="mode" value="online" required defaultChecked={picked("mode") === "online"} className="accent-primary" />
                  Online
                </label>
                <label className={choice}>
                  <input type="radio" name="mode" value="face_to_face" defaultChecked={picked("mode") === "face_to_face"} className="accent-primary" />
                  Face-to-face
                </label>
              </div>
            </fieldset>

            <Button type="submit" className="sm:col-span-2">
              Find my match
            </Button>
          </form>
        </CardContent>
      </Card>

      {error ? (
        <Card className="border-destructive">
          <CardContent className="pt-6 text-sm">
            <p className="font-medium text-destructive">We couldn&apos;t load tutors right now.</p>
            <p className="mt-1 text-muted-foreground">Please try again in a moment.</p>
          </CardContent>
        </Card>
      ) : tutors.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            {filters ? (
              <>
                <p className="font-medium">
                  No tutors within {formatPeso(filters.budgetCentavos)} yet — try raising your budget.
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Or try the other mode, or check back soon as more tutors join.
                </p>
              </>
            ) : (
              <>
                <p className="font-medium">No tutors yet.</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  TutorMatch is brand new — check back soon, or become the first tutor.
                </p>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-muted-foreground">
            {filters
              ? `${tutors.length} ${tutors.length === 1 ? "tutor matches" : "tutors match"} you`
              : "All tutors — fill in the form to see who fits your budget"}
          </h2>
          <ul className="grid gap-4 sm:grid-cols-2">
            {tutors.map((tutor) => (
              <li key={tutor.tutor_id}>
                <Link href={`/tutors/${tutor.tutor_id}`} className="block h-full rounded-[var(--radius)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <Card className="h-full transition-colors hover:border-primary">
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
                      {filters && (
                        <p className="mt-2 rounded-[var(--radius)] bg-secondary px-3 py-2 text-secondary-foreground">
                          <span className="font-medium">Why it matches:</span>{" "}
                          {matchReason(tutor.rate_centavos, filters)}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
