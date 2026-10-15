import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { createClient } from "@/lib/supabase/server";
import {
  formatPeso,
  hasAnyFilter,
  LEVELS,
  matchReasons,
  MODES,
  parseMarketFilters,
  SORTS,
  sortListings,
  SUBJECTS,
  tutorMatches,
  whatIsLimiting,
  type Level,
  type Listing,
  type MarketFilters,
  type Mode,
  type Sort,
  type Subject,
} from "@/lib/tutormatch";

export const metadata: Metadata = { title: "Find a Tutor · TutorMatch" };

type TutorRow = {
  tutor_id: string;
  bio: string;
  subjects: Subject[];
  levels: Level[];
  rate_centavos: number;
  mode: Mode;
  availability: string;
  created_at: string;
  profiles: { display_name: string } | null;
};

type TutorListing = Listing & { id: string; availability: string };

// "Josh Lavado" → "JL"
function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

export default async function FindATutorPage({ searchParams }: PageProps<"/tutors">) {
  const params = await searchParams;
  const { filters: f, notes } = parseMarketFilters(params);
  const filtering = hasAnyFilter(f);
  // Pre-fill the form with what's in the address (e.g. a home page link).
  const picked = (key: string) => (typeof params[key] === "string" ? params[key] : "");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tutor_profiles")
    .select("tutor_id, bio, subjects, levels, rate_centavos, mode, availability, created_at, profiles(display_name)")
    .returns<TutorRow[]>();

  // Shows up in the terminal locally and in Vercel's logs when live.
  if (error) console.error("Find a Tutor: could not load tutor_profiles", error);

  const all: TutorListing[] = (data ?? []).map((row) => ({
    id: row.tutor_id,
    name: row.profiles?.display_name ?? "Tutor",
    bio: row.bio,
    subjects: row.subjects,
    levels: row.levels,
    rate_centavos: row.rate_centavos,
    mode: row.mode,
    availability: row.availability,
    created_at: row.created_at,
  }));
  // Every filter you filled in applies together. (Loading all listings and
  // filtering here is fine at class size; move it into the query if
  // TutorMatch ever has thousands of tutors.)
  const tutors = sortListings(
    all.filter((t) => tutorMatches(t, f)),
    f,
  );
  const limiting = tutors.length === 0 && filtering ? whatIsLimiting(all, f) : [];

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Find a Tutor</h1>
        <p className="text-muted-foreground">
          Search by name or topic, and set your budget — BudgetMatch shows only tutors who fit.
        </p>
      </header>

      {/* A plain GET form: the answers go into the page address, so the
          results can be shared, bookmarked or refreshed. Every field is
          optional. */}
      <Card>
        <CardContent className="pt-6">
          <form method="get" action="/tutors" className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="q">Search</Label>
              <div className="relative">
                <Search
                  className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
                <Input
                  id="q"
                  name="q"
                  type="search"
                  maxLength={100}
                  placeholder="Tutor name or topic, e.g. algebra, essay writing"
                  defaultValue={picked("q")}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <div className="col-span-2 flex flex-col gap-2 sm:col-span-1">
                <Label htmlFor="subject">Subject</Label>
                <Select id="subject" name="subject" defaultValue={picked("subject")}>
                  <option value="">Any subject</option>
                  {(Object.keys(SUBJECTS) as Subject[]).map((key) => (
                    <option key={key} value={key}>
                      {SUBJECTS[key]}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="level">Level</Label>
                <Select id="level" name="level" defaultValue={picked("level")}>
                  <option value="">Any level</option>
                  {(Object.keys(LEVELS) as Level[]).map((key) => (
                    <option key={key} value={key}>
                      {LEVELS[key]}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="mode">Mode</Label>
                <Select id="mode" name="mode" defaultValue={picked("mode")}>
                  <option value="">Any mode</option>
                  <option value="online">Online</option>
                  <option value="face_to_face">Face-to-face</option>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="min">Min ₱</Label>
                <Input
                  id="min"
                  name="min"
                  type="number"
                  inputMode="decimal"
                  min="1"
                  max="100000"
                  step="0.01"
                  placeholder="Any"
                  defaultValue={picked("min")}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="budget">Budget ₱ (max)</Label>
                <Input
                  id="budget"
                  name="budget"
                  type="number"
                  inputMode="decimal"
                  min="1"
                  max="100000"
                  step="0.01"
                  placeholder="e.g. 100"
                  defaultValue={picked("budget")}
                />
              </div>
              <div className="col-span-2 flex flex-col gap-2 sm:col-span-1">
                <Label htmlFor="sort">Sort by</Label>
                <Select id="sort" name="sort" defaultValue={f.sort}>
                  {(Object.keys(SORTS) as Sort[]).map((key) => (
                    <option key={key} value={key}>
                      {SORTS[key]}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit">
                <Search className="h-4 w-4" aria-hidden /> Find my match
              </Button>
              {(filtering || f.sort !== "relevance") && (
                <Link href="/tutors" className={buttonVariants({ variant: "ghost" })}>
                  Reset filters
                </Link>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {notes.length > 0 && (
        <ul role="status" className="rounded-[var(--radius)] bg-warning/10 px-4 py-3 text-sm text-amber-900">
          {notes.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      )}

      {error ? (
        <Card className="border-destructive">
          <CardContent className="pt-6 text-sm">
            <p className="font-medium text-destructive">We couldn&apos;t load tutors right now.</p>
            <p className="mt-1 text-muted-foreground">Please try again in a moment.</p>
          </CardContent>
        </Card>
      ) : all.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="font-medium">No tutors yet.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              TutorMatch is brand new — check back soon, or become the first tutor.
            </p>
          </CardContent>
        </Card>
      ) : tutors.length === 0 ? (
        <NoMatches filters={f} limiting={limiting} />
      ) : (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-muted-foreground">
            {filtering
              ? `${tutors.length} ${tutors.length === 1 ? "tutor matches" : "tutors match"} you`
              : `All ${tutors.length} tutors — add a budget to see who fits`}
          </h2>
          <ul className="flex flex-col gap-3">
            {tutors.map((t) => (
              <li key={t.id}>
                <TutorCard
                  tutor={t}
                  reasons={filtering ? matchReasons(t, f) : []}
                  withinBudget={f.maxCentavos !== undefined}
                />
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}

function TutorCard({
  tutor: t,
  reasons,
  withinBudget,
}: {
  tutor: TutorListing;
  reasons: string[];
  withinBudget: boolean;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row">
        <span
          aria-hidden
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-secondary text-lg font-semibold text-secondary-foreground"
        >
          {initials(t.name)}
        </span>

        <div className="flex min-w-0 flex-1 flex-col gap-2 text-sm">
          <p className="text-base font-semibold">{t.name}</p>
          <ul className="flex flex-wrap gap-1.5" aria-label="Subjects">
            {t.subjects.map((s) => (
              <li key={s} className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
                {SUBJECTS[s]}
              </li>
            ))}
          </ul>
          <p className="text-muted-foreground">
            {t.levels.map((l) => LEVELS[l]).join(", ")} · {MODES[t.mode]}
          </p>
          {t.bio && <p className="line-clamp-2 break-words">{t.bio}</p>}
          {t.availability && <p className="break-words text-muted-foreground">Available: {t.availability}</p>}
          {reasons.length > 0 && (
            <p className="rounded-[var(--radius)] bg-secondary px-3 py-2 text-secondary-foreground">
              <span className="font-medium">Why it matches:</span> {reasons.join(" · ")}
            </p>
          )}
        </div>

        <div className="flex shrink-0 flex-row flex-wrap items-center justify-between gap-2 sm:flex-col sm:items-end sm:justify-start">
          <p className="text-lg font-semibold">
            {formatPeso(t.rate_centavos)} <span className="text-sm font-normal text-muted-foreground">/ session</span>
          </p>
          {/* Only tutors at or under the budget are ever shown, so this is
              always true when a budget is set. */}
          {withinBudget && (
            <span className="rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-medium text-green-800">
              Within budget
            </span>
          )}
          <Link href={`/tutors/${t.id}`} className={buttonVariants({ size: "sm" })}>
            View Profile
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

// When nothing matches: say plainly which filter is in the way, using the
// real listings. We never change the learner's budget for them.
function NoMatches({
  filters: f,
  limiting,
}: {
  filters: MarketFilters;
  limiting: ReturnType<typeof whatIsLimiting>;
}) {
  // Only blame the budget when dropping it would actually show tutors (or
  // when we can't tell which filter is in the way).
  const budgetIsTheProblem =
    f.maxCentavos !== undefined && (limiting.length === 0 || limiting.some((l) => l.isBudget));

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 pt-6 text-center">
        <p className="font-medium">
          {budgetIsTheProblem && f.maxCentavos !== undefined
            ? `No tutors within ${formatPeso(f.maxCentavos)} yet — try raising your budget.`
            : "No tutors match all your filters yet."}
        </p>
        {limiting.length > 0 ? (
          <ul className="mx-auto flex max-w-md flex-col gap-1 text-sm text-muted-foreground">
            {limiting.map((l) => (
              <li key={l.filter}>
                Without {l.filter}: {l.count} {l.count === 1 ? "tutor" : "tutors"}
                {l.isBudget && l.cheapest !== undefined ? ` (cheapest ${formatPeso(l.cheapest)})` : ""}.
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            Try removing a few filters, or check back soon as more tutors join.
          </p>
        )}
        <Link href="/tutors" className={buttonVariants({ variant: "outline", className: "mx-auto" })}>
          Reset filters
        </Link>
      </CardContent>
    </Card>
  );
}
