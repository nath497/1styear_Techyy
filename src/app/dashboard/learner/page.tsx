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
import { JoinCallLink } from "@/components/join-call-link";
import { TaskDoneButton } from "@/app/planner/task-done-button";
import { formatDue, manilaToday, type StudyTask } from "@/lib/planner";
import type { LearnTopic } from "@/lib/learntrack";
import { loadInbox } from "@/lib/chat";
import { Empty, LoadError, RecentChats, Section, StatCard, Welcome } from "../parts";

export const metadata: Metadata = { title: "Dashboard · TutorMatch" };

type BookingRow = {
  id: string;
  subject: Subject;
  topic: string;
  starts_at: string;
  price_centavos: number;
  status: Status;
  meeting_link: string | null;
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
  const [bookingsRes, helpRes, openHelpRes, tutorsRes] = await Promise.all([
    supabase
      .from("bookings")
      .select("id, subject, topic, starts_at, price_centavos, status, meeting_link, tutor:tutor_profiles(profiles(display_name))")
      .eq("learner_id", user.id)
      .returns<BookingRow[]>(),
    supabase
      .from("help_requests")
      .select("id, title, subject, level, budget_centavos, mode, status, offer_count")
      .eq("learner_id", user.id)
      .order("created_at", { ascending: false })
      .limit(3)
      .returns<HelpRow[]>(),
    // The newest request that's still Open — the best clue to what the
    // learner needs now.
    supabase
      .from("help_requests")
      .select("id, title, subject, level, budget_centavos, mode, status, offer_count")
      .eq("learner_id", user.id)
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .limit(1)
      .returns<HelpRow[]>(),
    supabase
      .from("tutor_profiles")
      .select("tutor_id, bio, subjects, levels, rate_centavos, mode, created_at, profiles(display_name)")
      .returns<TutorRow[]>(),
  ]);
  for (const [what, res] of [
    ["bookings", bookingsRes],
    ["help requests", helpRes],
    ["open help request", openHelpRes],
    ["tutors", tutorsRes],
  ] as const) {
    if (res.error) console.error(`Learner dashboard: could not load ${what}`, res.error);
  }

  const sessions = groupSessions(bookingsRes.data ?? []);
  const completed = sessions.history.filter((b) => b.status === "completed").length;

  // BudgetMatch suggestions, based on the learner's latest OPEN help
  // request (or, if none is open, their latest one) — the only saved
  // preferences we have. Never over budget.
  const openLatest = openHelpRes.data?.[0];
  const latest = openLatest ?? helpRes.data?.[0];
  const filters: MarketFilters | null = latest
    ? { q: "", subject: latest.subject, level: latest.level, maxCentavos: latest.budget_centavos, mode: latest.mode, sort: "relevance" }
    : null;
  const listings = (tutorsRes.data ?? []).map((t) => ({ ...t, name: t.profiles?.display_name ?? "Tutor" }) as Listing & TutorRow);
  const suggestions = filters ? sortListings(listings.filter((t) => tutorMatches(t, filters)), filters).slice(0, 3) : [];

  // Latest chats (only shown once there are any).
  const inbox = await loadInbox(supabase, user.id, 3);

  // Today's study tasks: up to 3 due today or overdue (soonest first), and
  // whether the learner has any tasks at all — the card only appears once
  // they do. Row Level Security only returns their own tasks (SQL 015).
  const today = manilaToday();
  const [dueRes, anyRes] = await Promise.all([
    supabase
      .from("study_tasks")
      .select("id, title, subject, due_date, due_time, priority, estimated_minutes, notes, status, completed_at")
      .neq("status", "done")
      .lte("due_date", today)
      .order("due_date", { ascending: true })
      .order("due_time", { ascending: true, nullsFirst: false })
      .limit(3)
      .returns<StudyTask[]>(),
    supabase.from("study_tasks").select("id", { count: "exact", head: true }),
  ]);
  if (dueRes.error) console.error("Dashboard: could not load study tasks", dueRes.error);
  if (anyRes.error) console.error("Dashboard: could not count study tasks", anyRes.error);
  const tasksError = Boolean(dueRes.error || anyRes.error);
  // Show the card once they have tasks — or when we can't tell, so a
  // failed load says so instead of the card silently vanishing.
  const showTasks = tasksError || (anyRes.count ?? 0) > 0;
  if (inbox.error) console.error("Dashboard: could not load chats", inbox.error);

  // LearnTrack: how many topics are at Need to Review (and up to 3 of
  // them), and whether the learner has any topics at all — the card only
  // appears once they do. Row Level Security only returns their own (SQL 016).
  const [reviewRes, anyTopicRes] = await Promise.all([
    supabase
      .from("learn_topics")
      .select("id, subject, name", { count: "exact" })
      .eq("status", "need_review")
      .order("updated_at", { ascending: false })
      .limit(3)
      .returns<Pick<LearnTopic, "id" | "subject" | "name">[]>(),
    supabase.from("learn_topics").select("id", { count: "exact", head: true }),
  ]);
  if (reviewRes.error) console.error("Dashboard: could not load topics", reviewRes.error);
  if (anyTopicRes.error) console.error("Dashboard: could not count topics", anyTopicRes.error);
  const topicsError = Boolean(reviewRes.error || anyTopicRes.error);
  // As with study tasks: when we can't tell, show the card with an error.
  const showTopics = topicsError || (anyTopicRes.count ?? 0) > 0;
  const toReview = reviewRes.count ?? 0;

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

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Waiting for a tutor" value={bookingsRes.error ? "—" : sessions.pending.length} href="/sessions" />
        <StatCard label="Upcoming sessions" value={bookingsRes.error ? "—" : sessions.upcoming.length} href="/sessions" />
        <StatCard label="Completed" value={bookingsRes.error ? "—" : completed} href="/sessions" />
      </div>

      {inbox.items.length > 0 && <RecentChats items={inbox.items} />}

      {showTasks && (
        <Section title="Today's study tasks" action={{ href: "/learning-space?tab=tasks", label: "Open Study Tasks" }}>
          {tasksError ? (
            <LoadError what="your study tasks" />
          ) : !dueRes.data?.length ? (
            <Empty>Nothing due today. Nice work!</Empty>
          ) : (
            <ul className="flex flex-col gap-2">
              {dueRes.data.map((t) => (
                <li
                  key={t.id}
                  className="flex items-center justify-between gap-3 rounded-[var(--radius)] bg-muted/60 px-3 py-2"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{t.title}</span>
                    <span className={t.due_date < today ? "text-destructive" : "text-muted-foreground"}>
                      {t.due_date < today ? "Overdue · " : ""}
                      {SUBJECTS[t.subject]} · {formatDue(t.due_date, t.due_time)}
                    </span>
                  </span>
                  <TaskDoneButton taskId={t.id} title={t.title} done={false} />
                </li>
              ))}
            </ul>
          )}
        </Section>
      )}

      {showTopics && (
        <Section title="LearnTrack" action={{ href: "/learning-space?tab=learntrack", label: "Open LearnTrack" }}>
          {topicsError ? (
            <LoadError what="your topics" />
          ) : toReview === 0 ? (
            <Empty>Nothing at Need to Review. Keep it up!</Empty>
          ) : (
            <div className="flex flex-col gap-3">
              <p>
                <span className="font-semibold">{toReview}</span>{" "}
                {toReview === 1 ? "topic needs" : "topics need"} review.
              </p>
              <ul className="flex flex-col gap-2">
                {(reviewRes.data ?? []).map((t) => (
                  <li key={t.id} className="rounded-[var(--radius)] bg-muted/60 px-3 py-2">
                    <span className="block truncate font-medium">{t.name}</span>
                    <span className="text-muted-foreground">{SUBJECTS[t.subject]}</span>
                  </li>
                ))}
              </ul>
              {toReview > 3 && (
                <Link href="/learning-space?tab=learntrack&status=need_review" className="text-xs font-medium text-primary hover:underline">
                  See all {toReview}
                </Link>
              )}
            </div>
          )}
        </Section>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Section title="Next sessions" action={{ href: "/sessions", label: "All sessions" }}>
          {bookingsRes.error ? (
            <LoadError what="your sessions" />
          ) : sessions.upcoming.length + sessions.pending.length === 0 ? (
            <Empty>No sessions yet. Find a tutor and send your first request.</Empty>
          ) : (
            <ul className="flex flex-col gap-2">
              {[...sessions.upcoming, ...sessions.pending].slice(0, 4).map((b) => (
                <li key={b.id} className="flex flex-wrap items-start justify-between gap-3 rounded-[var(--radius)] bg-muted/60 px-3 py-2">
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
                  {b.status === "accepted" && b.meeting_link && (
                    <div className="w-full">
                      <JoinCallLink link={b.meeting_link} />
                    </div>
                  )}
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
              Based on your {openLatest ? "open" : "latest"} help request: {SUBJECTS[latest.subject]}, {LEVELS[latest.level]}, up to{" "}
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
