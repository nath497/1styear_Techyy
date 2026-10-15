import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import {
  firstName,
  formatPeso,
  formatSessionTime,
  groupSessions,
  HELP_STATUS_STYLE,
  HELP_STATUSES,
  LEVELS,
  matchReasons,
  MODES,
  sortListings,
  SUBJECTS,
  tutorMatches,
  type HelpStatus,
  type Level,
  type Listing,
  type MarketFilters,
  type Mode,
  type Status,
  type Subject,
} from "@/lib/tutormatch";
import { Empty, LoadError, Section, StatCard, Welcome } from "../parts";

export const metadata: Metadata = { title: "Dashboard · TutorMatch" };

type BookingRow = {
  id: string;
  subject: Subject;
  topic: string;
  starts_at: string;
  price_centavos: number;
  status: Status;
  tutor: { profiles: { display_name: string } | null } | null;
};

type HelpRow = {
  id: string;
  title: string;
  subject: Subject;
  level: Level;
  budget_centavos: number;
  mode: "online" | "face_to_face";
  status: HelpStatus;
  offer_count: number;
};

type TutorRow = {
  tutor_id: string;
  bio: string;
  subjects: Subject[];
  levels: Level[];
  rate_centavos: number;
  mode: Mode;
  created_at: string;
  profiles: { display_name: string } | null;
};

export default async function LearnerDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard/learner");

  // The role comes from the database, never from the browser.
  const { data: profile } = await supabase.from("profiles").select("display_name, role").eq("id", user.id).maybeSingle();
  if (profile?.role === "tutor") redirect("/dashboard/tutor");

  // Row Level Security only returns this learner's own bookings and help
  // requests; tutor listings are public.
  const [bookingsRes, helpRes, tutorsRes] = await Promise.all([
    supabase
      .from("bookings")
      .select("id, subject, topic, starts_at, price_centavos, status, tutor:tutor_profiles(profiles(display_name))")
      .eq("learner_id", user.id)
      .returns<BookingRow[]>(),
    supabase
      .from("help_requests")
      .select("id, title, subject, level, budget_centavos, mode, status, offer_count")
      .eq("learner_id", user.id)
      .order("created_at", { ascending: false })
      .limit(3)
      .returns<HelpRow[]>(),
    supabase
      .from("tutor_profiles")
      .select("tutor_id, bio, subjects, levels, rate_centavos, mode, created_at, profiles(display_name)")
      .returns<TutorRow[]>(),
  ]);
  for (const [what, res] of [["bookings", bookingsRes], ["help requests", helpRes], ["tutors", tutorsRes]] as const) {
    if (res.error) console.error(`Learner dashboard: could not load ${what}`, res.error);
  }

  const sessions = groupSessions(bookingsRes.data ?? []);
  const completed = sessions.history.filter((b) => b.status === "completed").length;

  // BudgetMatch suggestions, based on the learner's latest help request
  // (the only saved preferences we have). Never over budget.
  const latest = helpRes.data?.[0];
  const filters: MarketFilters | null = latest
    ? { q: "", subject: latest.subject, level: latest.level, maxCentavos: latest.budget_centavos, mode: latest.mode, sort: "relevance" }
    : null;
  const listings = (tutorsRes.data ?? []).map((t) => ({ ...t, name: t.profiles?.display_name ?? "Tutor" }) as Listing & TutorRow);
  const suggestions = filters ? sortListings(listings.filter((t) => tutorMatches(t, filters)), filters).slice(0, 3) : [];

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-8">
      <Welcome
        name={firstName(profile?.display_name, "there")}
        message="Find a tutor who fits your budget, and keep track of your sessions in one place."
      >
        <Link href="/tutors" className={buttonVariants()}>
          Find a Tutor
        </Link>
        <Link href="/help-requests/new" className={buttonVariants({ variant: "outline" })}>
          Request Help
        </Link>
      </Welcome>

      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Waiting for a tutor" value={bookingsRes.error ? "—" : sessions.pending.length} href="/sessions" />
        <StatCard label="Upcoming sessions" value={bookingsRes.error ? "—" : sessions.upcoming.length} href="/sessions" />
        <StatCard label="Completed" value={bookingsRes.error ? "—" : completed} href="/sessions" />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Section title="Next sessions" action={{ href: "/sessions", label: "All sessions" }}>
          {bookingsRes.error ? (
            <LoadError what="your sessions" />
          ) : sessions.upcoming.length + sessions.pending.length === 0 ? (
            <Empty>No sessions yet. Find a tutor and send your first request.</Empty>
          ) : (
            <ul className="flex flex-col gap-2">
              {[...sessions.upcoming, ...sessions.pending].slice(0, 4).map((b) => (
                <li key={b.id} className="flex items-start justify-between gap-3 rounded-[var(--radius)] bg-muted/60 px-3 py-2">
                  <span className="min-w-0">
                    <span className="block font-medium">
                      {SUBJECTS[b.subject]} with {b.tutor?.profiles?.display_name ?? "your tutor"}
                    </span>
                    <span className="text-muted-foreground">
                      {formatSessionTime(b.starts_at)} · {formatPeso(b.price_centavos)}
                    </span>
                  </span>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${b.status === "accepted" ? "bg-green-100 text-green-900" : "bg-amber-100 text-amber-900"}`}
                  >
                    {b.status === "accepted" ? "Confirmed" : "Waiting"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="My help requests" action={{ href: "/help-requests", label: "View all" }}>
          {helpRes.error ? (
            <LoadError what="your help requests" />
          ) : !helpRes.data?.length ? (
            <Empty>Stuck on something? Post a help request and let tutors come to you.</Empty>
          ) : (
            <ul className="flex flex-col gap-2">
              {helpRes.data.map((r) => (
                <li key={r.id}>
                  <Link
                    href={`/help-requests/${r.id}`}
                    className="flex items-center justify-between gap-3 rounded-[var(--radius)] bg-muted/60 px-3 py-2 hover:bg-muted"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{r.title}</span>
                      <span className="text-muted-foreground">
                        {r.offer_count} {r.offer_count === 1 ? "offer" : "offers"}
                      </span>
                    </span>
                    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${HELP_STATUS_STYLE[r.status]}`}>
                      {HELP_STATUSES[r.status]}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>

      <Section
        title="BudgetMatch for you"
        action={filters ? { href: "/tutors", label: "Find more tutors" } : undefined}
      >
        {!latest ? (
          <div className="flex flex-col items-start gap-3">
            <Empty>Tell BudgetMatch your subject, level and budget to see tutors who fit.</Empty>
            <Link href="/tutors" className={buttonVariants({ size: "sm" })}>
              Start BudgetMatch
            </Link>
          </div>
        ) : tutorsRes.error ? (
          <LoadError what="tutors" />
        ) : (
          <>
            <p className="text-muted-foreground">
              Based on your latest help request: {SUBJECTS[latest.subject]}, {LEVELS[latest.level]}, up to{" "}
              {formatPeso(latest.budget_centavos)}, {latest.mode === "online" ? "online" : "face-to-face"}.
            </p>
            {suggestions.length === 0 ? (
              <Empty>No tutors fit all of that yet. Try Find a Tutor with a different budget or mode.</Empty>
            ) : (
              <ul className="grid gap-3 sm:grid-cols-3">
                {suggestions.map((t) => (
                  <li key={t.tutor_id}>
                    <Link
                      href={`/tutors/${t.tutor_id}`}
                      className="flex h-full flex-col gap-1 rounded-[var(--radius)] border border-border p-3 hover:border-primary"
                    >
                      <span className="font-semibold">{t.name}</span>
                      <span className="font-medium">{formatPeso(t.rate_centavos)} / session</span>
                      <span className="text-muted-foreground">{MODES[t.mode]}</span>
                      <span className="mt-1 text-xs text-secondary-foreground">
                        {filters && matchReasons(t, filters)[0]}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </Section>
    </main>
  );
}
