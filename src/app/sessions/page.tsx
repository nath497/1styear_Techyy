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

type CommissionRow = {
  booking_id: string;
  price_centavos: number;
  commission_centavos: number;
  tutor_amount_centavos: number;
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

  // Sessions that still need something done come first (soonest at the
  // top); finished ones go below (most recent first).
  const isActive = (b: BookingRow) => b.status === "pending" || b.status === "accepted";
  const time = (b: BookingRow) => new Date(b.starts_at).getTime();
  const bookings = [...(data ?? [])].sort((a, b) => {
    if (isActive(a) !== isActive(b)) return isActive(a) ? -1 : 1;
    return isActive(a) ? time(a) - time(b) : time(b) - time(a);
  });

  // Tutors also see the 10% commission the database recorded for each
  // completed session. (Learners can't read these — RLS, SQL 005.)
  let commissions: CommissionRow[] = [];
  let commissionFailed = false;
  if (isTutor) {
    const { data: rows, error: commissionError } = await supabase
      .from("commission_records")
      .select("booking_id, price_centavos, commission_centavos, tutor_amount_centavos")
      .eq("tutor_id", user.id)
      .returns<CommissionRow[]>();
    if (commissionError) {
      console.error("My sessions: could not load commission records", commissionError);
      commissionFailed = true;
    }
    commissions = rows ?? [];
  }
  const commissionFor = new Map(commissions.map((c) => [c.booking_id, c]));
  const total = commissions.reduce(
    (sum, c) => ({
      price: sum.price + c.price_centavos,
      commission: sum.commission + c.commission_centavos,
      tutor: sum.tutor + c.tutor_amount_centavos,
    }),
    { price: 0, commission: 0, tutor: 0 },
  );

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

      {isTutor &&
        (commissionFailed ? (
          <Card className="border-destructive">
            <CardContent className="pt-6 text-sm">
              <p className="font-medium text-destructive">We couldn&apos;t load your earnings right now.</p>
              <p className="mt-1 text-muted-foreground">Please refresh the page in a moment.</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-primary">
            <CardContent className="flex flex-col gap-1 pt-6 text-sm">
              <p className="font-semibold">Completed sessions: {formatPeso(total.price)}</p>
              <p>
                {formatPeso(total.commission)} TutorMatch (10%) · {formatPeso(total.tutor)} you
              </p>
              <p className="mt-1 font-medium text-primary">Recorded, not collected — no real money has moved.</p>
            </CardContent>
          </Card>
        ))}

      {error ? (
        <Card className="border-destructive">
          <CardContent className="pt-6 text-sm">
            <p className="font-medium text-destructive">We couldn&apos;t load your sessions right now.</p>
            <p className="mt-1 text-muted-foreground">Please try again in a moment.</p>
          </CardContent>
        </Card>
      ) : bookings.length === 0 ? (
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
          {bookings.map((b) => {
            const other = isTutor
              ? (b.learner?.display_name ?? "A learner")
              : (b.tutor?.profiles?.display_name ?? "your tutor");
            const commission = commissionFor.get(b.id);
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

                    {isTutor && b.status === "completed" && commission && (
                      <p className="rounded-[var(--radius)] bg-secondary px-3 py-2 text-secondary-foreground">
                        {formatPeso(commission.price_centavos)} session →{" "}
                        {formatPeso(commission.commission_centavos)} TutorMatch (10%) →{" "}
                        {formatPeso(commission.tutor_amount_centavos)} you
                      </p>
                    )}
                    {isTutor && b.status === "accepted" && (
                      <StatusButtons
                        bookingId={b.id}
                        choices={[
                          { status: "completed", label: "Mark completed", confirm: `Mark the session with ${other} as completed? This can't be undone.` },
                        ]}
                      />
                    )}
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
