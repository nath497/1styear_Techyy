import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { formatPeso, formatSessionTime, STATUSES, SUBJECTS, type Status, type Subject } from "@/lib/tutormatch";
import { StatusButtons } from "./status-buttons";

export const metadata: Metadata = { title: "My sessions · TutorMatch" };

type BookingRow = {
  id: string;
  subject: Subject;
  topic: string;
  starts_at: string;
  price_centavos: number;
  status: Status;
  // The other person's name: bookings → profiles for the learner, and
  // bookings → tutor_profiles → profiles for the tutor.
  learner: { display_name: string } | null;
  tutor: { profiles: { display_name: string } | null } | null;
};

const statusStyle: Record<Status, string> = {
  pending: "bg-amber-100 text-amber-900",
  accepted: "bg-green-100 text-green-900",
  declined: "bg-muted text-muted-foreground",
  completed: "bg-secondary text-secondary-foreground",
  cancelled: "bg-muted text-muted-foreground",
};

export default async function MySessionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/sessions");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  const isTutor = profile?.role === "tutor";

  // Row Level Security only returns bookings this user is part of; the
  // filter just picks which side of the booking they are on.
  const { data, error } = await supabase
    .from("bookings")
    .select(
      "id, subject, topic, starts_at, price_centavos, status, learner:profiles(display_name), tutor:tutor_profiles(profiles(display_name))",
    )
    .eq(isTutor ? "tutor_id" : "learner_id", user.id)
    .order("starts_at", { ascending: true })
    .returns<BookingRow[]>();

  if (error) console.error("My sessions: could not load bookings", error);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">My sessions</h1>
        <p className="text-muted-foreground">
          {isTutor
            ? "Session requests from learners. Accept the ones you can do."
            : "Your session requests and their status."}
        </p>
      </header>

      {error ? (
        <Card className="border-destructive">
          <CardContent className="pt-6 text-sm">
            <p className="font-medium text-destructive">We couldn&apos;t load your sessions right now.</p>
            <p className="mt-1 text-muted-foreground">Please try again in a moment.</p>
          </CardContent>
        </Card>
      ) : data.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 pt-6 text-center">
            {isTutor ? (
              <div>
                <p className="font-medium">No session requests yet.</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  When a learner requests a session with you, it will show here.
                </p>
              </div>
            ) : (
              <>
                <div>
                  <p className="font-medium">No session requests yet.</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Find a tutor who fits your budget and send your first request.
                  </p>
                </div>
                <Link href="/tutors" className={buttonVariants()}>
                  Find a Tutor
                </Link>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <ul className="flex flex-col gap-3">
          {data.map((b) => {
            const other = isTutor
              ? (b.learner?.display_name ?? "A learner")
              : (b.tutor?.profiles?.display_name ?? "your tutor");
            return (
              <li key={b.id}>
                <Card>
                  <CardContent className="flex flex-col gap-3 pt-6 text-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 flex-col gap-1">
                        <p className="text-base font-semibold">
                          {SUBJECTS[b.subject]} {isTutor ? "for" : "with"} {other}
                        </p>
                        <p className="break-words">{b.topic}</p>
                        <p className="text-muted-foreground">
                          {formatSessionTime(b.starts_at)} · {formatPeso(b.price_centavos)}
                        </p>
                      </div>
                      <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${statusStyle[b.status]}`}>
                        {STATUSES[b.status]}
                      </span>
                    </div>

                    {isTutor && b.status === "pending" && (
                      <StatusButtons
                        bookingId={b.id}
                        choices={[
                          { status: "accepted", label: "Accept" },
                          { status: "declined", label: "Decline", confirm: `Decline ${other}'s request? This can't be undone.` },
                        ]}
                      />
                    )}
                    {!isTutor && (b.status === "pending" || b.status === "accepted") && (
                      <StatusButtons
                        bookingId={b.id}
                        choices={[
                          { status: "cancelled", label: "Cancel request", confirm: "Cancel this session? This can't be undone." },
                        ]}
                      />
                    )}
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
