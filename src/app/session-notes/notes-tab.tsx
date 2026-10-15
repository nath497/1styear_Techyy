import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { sessionHasStarted, type SessionNote } from "@/lib/session-notes";
import { formatSessionTime, SUBJECTS, type Subject } from "@/lib/tutormatch";
import { NoteCard } from "./note-card";

type BookingRow = {
  id: string;
  subject: Subject;
  topic: string;
  starts_at: string;
  tutor: { profiles: { display_name: string } | null } | null;
};

// The Session Notes tab of My Learning Space: the learner's real Accepted
// and Completed bookings, each with private notes. The page has already
// checked that this is a logged-in learner.
export async function SessionNotesTab({ learnerId }: { learnerId: string }) {
  const supabase = await createClient();

  // Row Level Security only returns this learner's own bookings (SQL 003),
  // notes and topics (SQL 016, 017).
  const [bookingsRes, notesRes, topicsRes] = await Promise.all([
    supabase
      .from("bookings")
      .select("id, subject, topic, starts_at, tutor:tutor_profiles(profiles(display_name))")
      .eq("learner_id", learnerId)
      .in("status", ["accepted", "completed"])
      .order("starts_at", { ascending: true })
      .returns<BookingRow[]>(),
    supabase
      .from("session_notes")
      .select("id, booking_id, questions, help_topics, reflection")
      .returns<SessionNote[]>(),
    supabase.from("learn_topics").select("name, subject").eq("status", "need_review").order("name"),
  ]);
  if (bookingsRes.error) console.error("Session notes: could not load sessions", bookingsRes.error);
  if (notesRes.error) console.error("Session notes: could not load notes", notesRes.error);
  if (topicsRes.error) console.error("Session notes: could not load topics", topicsRes.error);

  const now = new Date();
  const sessions = (bookingsRes.data ?? []).map((b) => ({
    id: b.id,
    subject: b.subject,
    when: formatSessionTime(b.starts_at),
    tutorName: b.tutor?.profiles?.display_name ?? "your tutor",
    subjectName: SUBJECTS[b.subject],
    topic: b.topic,
    started: sessionHasStarted(b.starts_at, now),
  }));
  // Coming up: soonest first. Past: most recent first.
  const upcoming = sessions.filter((s) => !s.started);
  const past = sessions.filter((s) => s.started).reverse();
  const notes = new Map((notesRes.data ?? []).map((n) => [n.booking_id, n]));
  const reviewFor = (subject: Subject) =>
    (topicsRes.data ?? []).filter((t) => t.subject === subject).map((t) => t.name as string);

  const list = (items: typeof sessions) => (
    <ul className="flex flex-col gap-3">
      {items.map((s) => (
        <li key={s.id}>
          <NoteCard session={s} note={notes.get(s.id) ?? null} reviewTopics={reviewFor(s.subject)} />
        </li>
      ))}
    </ul>
  );

  return (
    <div className="flex flex-col gap-6">
      <p className="text-muted-foreground">
        Prepare for your tutoring sessions and reflect afterwards. Your notes are private — your tutor can&apos;t see
        them.
      </p>

      {bookingsRes.error || notesRes.error ? (
        <Card className="border-destructive">
          <CardContent className="pt-6 text-sm">
            <p className="font-medium text-destructive">We couldn&apos;t load your sessions and notes right now.</p>
            <p className="mt-1 text-muted-foreground">Please try again in a moment.</p>
          </CardContent>
        </Card>
      ) : sessions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 pt-6 text-center">
            <p className="font-medium">No tutoring sessions to prepare for yet.</p>
            <p className="text-sm text-muted-foreground">
              Once a tutor accepts one of your session requests, it appears here.
            </p>
            <Link href="/tutors" className={buttonVariants({ size: "sm" })}>
              Find a Tutor
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          {upcoming.length > 0 && (
            <section className="flex flex-col gap-3">
              <h3 className="text-lg font-semibold tracking-tight">Coming up</h3>
              {list(upcoming)}
            </section>
          )}
          {past.length > 0 && (
            <section className="flex flex-col gap-3">
              <h3 className="text-lg font-semibold tracking-tight">Past sessions</h3>
              {list(past)}
            </section>
          )}
        </>
      )}
    </div>
  );
}
