import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, Circle } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { StatusButtons } from "@/app/sessions/status-buttons";
import {
  firstName,
  formatPeso,
  formatSessionTime,
  groupSessions,
  helpRequestFit,
  profileChecklist,
  SUBJECTS,
  type Level,
  type Mode,
  type Status,
  type Subject,
  type WantedMode,
} from "@/lib/tutormatch";
import { Empty, LoadError, Section, StatCard, Welcome } from "../parts";

export const metadata: Metadata = { title: "Tutor dashboard · TutorMatch" };

type BookingRow = {
  id: string;
  subject: Subject;
  topic: string;
  starts_at: string;
  price_centavos: number;
  status: Status;
  learner: { display_name: string } | null;
};

type OpenRequest = {
  id: string;
  title: string;
  subject: Subject;
  level: Level;
  budget_centavos: number;
  mode: WantedMode;
  learner: { display_name: string } | null;
};

export default async function TutorDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard/tutor");

  // The role comes from the database, never from the browser.
  const { data: profile } = await supabase.from("profiles").select("display_name, role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "tutor") redirect("/dashboard/learner");

  // Row Level Security only returns this tutor's own bookings, commission
  // records and offers, and only Open help requests.
  const [bookingsRes, commissionRes, listingRes, openRes, myOffersRes] = await Promise.all([
    supabase
      .from("bookings")
      .select("id, subject, topic, starts_at, price_centavos, status, learner:profiles(display_name)")
      .eq("tutor_id", user.id)
      .returns<BookingRow[]>(),
    supabase.from("commission_records").select("price_centavos, commission_centavos, tutor_amount_centavos").eq("tutor_id", user.id),
    supabase
      .from("tutor_profiles")
      .select("bio, subjects, levels, rate_centavos, mode, availability")
      .eq("tutor_id", user.id)
      .maybeSingle<{ bio: string; subjects: Subject[]; levels: Level[]; rate_centavos: number; mode: Mode; availability: string }>(),
    supabase
      .from("help_requests")
      .select("id, title, subject, level, budget_centavos, mode, learner:profiles(display_name)")
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .returns<OpenRequest[]>(),
    supabase.from("help_offers").select("request_id").eq("tutor_id", user.id),
  ]);
  for (const [what, res] of [
    ["bookings", bookingsRes],
    ["commission records", commissionRes],
    ["tutor profile", listingRes],
    ["help requests", openRes],
    ["my offers", myOffersRes],
  ] as const) {
    if (res.error) console.error(`Tutor dashboard: could not load ${what}`, res.error);
  }

  const sessions = groupSessions(bookingsRes.data ?? []);
  const completed = sessions.history.filter((b) => b.status === "completed").length;
  const earnings = (commissionRes.data ?? []).reduce(
    (sum, c) => ({
      price: sum.price + c.price_centavos,
      commission: sum.commission + c.commission_centavos,
      tutor: sum.tutor + c.tutor_amount_centavos,
    }),
    { price: 0, commission: 0, tutor: 0 },
  );

  const listing = listingRes.data;
  const checklist = profileChecklist(listing ?? null);
  // Open help requests that fit this tutor and that they haven't offered on.
  const offered = new Set((myOffersRes.data ?? []).map((o) => o.request_id as string));
  const fits = listing
    ? (openRes.data ?? [])
        .filter((r) => !offered.has(r.id))
        .map((r) => ({ request: r, reasons: helpRequestFit(r, listing) }))
        .filter((x): x is { request: OpenRequest; reasons: string[] } => x.reasons !== null)
        .slice(0, 3)
    : [];

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-8">
      <Welcome
        name={firstName(profile?.display_name, "there")}
        message="Here's what needs your attention today — requests to answer, sessions coming up, and learners looking for help."
      >
        <Link href="/tutor-profile" className={buttonVariants()}>
          Manage Tutor Profile
        </Link>
        <Link href="/help-requests" className={buttonVariants({ variant: "outline" })}>
          Find Help Requests
        </Link>
      </Welcome>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Requests to answer" value={bookingsRes.error ? "—" : sessions.pending.length} href="/sessions" />
        <StatCard label="Upcoming sessions" value={bookingsRes.error ? "—" : sessions.upcoming.length} href="/sessions" />
        <StatCard label="Completed" value={bookingsRes.error ? "—" : completed} href="/sessions" />
        <StatCard
          label="Your recorded share"
          value={commissionRes.error ? "—" : formatPeso(earnings.tutor)}
          href="/sessions"
          note="Recorded, not collected"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Section title="Requests to answer" action={{ href: "/sessions", label: "All sessions" }}>
          {bookingsRes.error ? (
            <LoadError what="your session requests" />
          ) : sessions.pending.length === 0 ? (
            <Empty>No requests waiting. New session requests from learners show up here.</Empty>
          ) : (
            <ul className="flex flex-col gap-3">
              {sessions.pending.slice(0, 3).map((b) => {
                const learner = b.learner?.display_name ?? "A learner";
                return (
                  <li key={b.id} className="flex flex-col gap-2 rounded-[var(--radius)] bg-muted/60 px-3 py-3">
                    <span>
                      <span className="block font-medium">
                        {SUBJECTS[b.subject]} for {learner}
                      </span>
                      <span className="block break-words">{b.topic}</span>
                      <span className="text-muted-foreground">
                        {formatSessionTime(b.starts_at)} · {formatPeso(b.price_centavos)}
                      </span>
                    </span>
                    {/* Same buttons and database rules as My sessions (SQL 004). */}
                    <StatusButtons
                      bookingId={b.id}
                      choices={[
                        { status: "accepted", label: "Accept" },
                        { status: "declined", label: "Decline", confirm: `Decline ${learner}'s request? This can't be undone.` },
                      ]}
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </Section>

        <Section title="Upcoming sessions" action={{ href: "/sessions", label: "All sessions" }}>
          {bookingsRes.error ? (
            <LoadError what="your sessions" />
          ) : sessions.upcoming.length === 0 ? (
            <Empty>No confirmed sessions yet.</Empty>
          ) : (
            <ul className="flex flex-col gap-2">
              {sessions.upcoming.slice(0, 4).map((b) => (
                <li key={b.id} className="rounded-[var(--radius)] bg-muted/60 px-3 py-2">
                  <span className="block font-medium">
                    {SUBJECTS[b.subject]} for {b.learner?.display_name ?? "a learner"}
                  </span>
                  <span className="text-muted-foreground">
                    {formatSessionTime(b.starts_at)} · {formatPeso(b.price_centavos)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Section title="Help requests for you" action={{ href: "/help-requests", label: "View all requests" }}>
          {!listing ? (
            <Empty>Create your tutor profile to see help requests that fit what you teach.</Empty>
          ) : openRes.error ? (
            <LoadError what="help requests" />
          ) : fits.length === 0 ? (
            <Empty>No open requests fit your subjects, levels, rate and mode right now.</Empty>
          ) : (
            <ul className="flex flex-col gap-2">
              {fits.map(({ request: r, reasons }) => (
                <li key={r.id}>
                  <Link
                    href={`/help-requests/${r.id}`}
                    className="flex flex-col gap-1 rounded-[var(--radius)] bg-muted/60 px-3 py-2 hover:bg-muted"
                  >
                    <span className="font-medium break-words">{r.title}</span>
                    <span className="text-muted-foreground">
                      {firstName(r.learner?.display_name)} · up to {formatPeso(r.budget_centavos)}
                    </span>
                    <span className="text-xs text-secondary-foreground">Why: {reasons.join(" · ")}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="Your tutor profile" action={{ href: "/tutor-profile", label: "Edit" }}>
          {listingRes.error ? (
            <LoadError what="your tutor profile" />
          ) : (
            <>
              <p className="font-medium">
                {checklist.done} of {checklist.total} done
              </p>
              <ul className="flex flex-col gap-1.5">
                {checklist.items.map((i) => (
                  <li key={i.label} className="flex items-center gap-2">
                    {i.done ? (
                      <CheckCircle2 className="h-4 w-4 text-success" aria-hidden />
                    ) : (
                      <Circle className="h-4 w-4 text-muted-foreground" aria-hidden />
                    )}
                    <span className={i.done ? "" : "text-muted-foreground"}>
                      {i.label}
                      <span className="sr-only">{i.done ? " (done)" : " (missing)"}</span>
                    </span>
                  </li>
                ))}
              </ul>
              {listing && (
                <Link href={`/tutors/${user.id}`} className="text-primary hover:underline">
                  See your public profile
                </Link>
              )}
            </>
          )}
        </Section>
      </div>
    </main>
  );
}
