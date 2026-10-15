import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import {
  budgetTag,
  formatPeso,
  firstName,
  formatSessionTime,
  HELP_STATUS_STYLE,
  HELP_STATUSES,
  isUuid,
  LEVELS,
  SUBJECTS,
  type HelpStatus,
  type Level,
  type Subject,
} from "@/lib/tutormatch";
import { MessageLearnerButton } from "@/app/messages/message-learner-button";
import { ChooseOfferButton } from "./choose-button";
import { OfferForm } from "./offer-form";

export const metadata: Metadata = { title: "Help request · TutorMatch" };

type HelpRequest = {
  id: string;
  learner_id: string;
  title: string;
  details: string;
  subject: Subject;
  level: Level;
  budget_centavos: number;
  mode: "online" | "face_to_face";
  preferred_time: string;
  status: HelpStatus;
  chosen_offer_id: string | null;
  offer_count: number;
  created_at: string;
  learner: { display_name: string } | null;
};

export default async function HelpRequestPage({ params }: PageProps<"/help-requests/[id]">) {
  const { id } = await params;
  if (!isUuid(id)) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/help-requests/${id}`);

  // Row Level Security decides who can read this request at all (SQL 007
  // and 008). If they can't, it's simply "not found".
  const { data: r, error } = await supabase
    .from("help_requests")
    .select(
      "id, learner_id, title, details, subject, level, budget_centavos, mode, preferred_time, status, chosen_offer_id, offer_count, created_at, learner:profiles(display_name)",
    )
    .eq("id", id)
    .maybeSingle<HelpRequest>();

  if (error) {
    console.error("Help request page: could not load", error);
    return (
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col px-4 py-10">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-2xl">We couldn&apos;t load this request</CardTitle>
            <CardDescription>Please try again in a moment.</CardDescription>
          </CardHeader>
        </Card>
      </main>
    );
  }
  if (!r) notFound();

  const isOwner = r.learner_id === user.id;
  const learnerFirstName = firstName(r.learner?.display_name);

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-4 px-4 py-10">
      <Link href="/help-requests" className="text-sm font-medium text-primary hover:underline">
        ← Back to {isOwner ? "my help requests" : "Help Requests"}
      </Link>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <CardTitle className="text-2xl break-words">{r.title}</CardTitle>
            <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${HELP_STATUS_STYLE[r.status]}`}>
              {HELP_STATUSES[r.status]}
            </span>
          </div>
          <CardDescription>
            {isOwner ? "Your request" : `From ${learnerFirstName}`} · posted {formatSessionTime(r.created_at)}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 text-sm">
          <p className="whitespace-pre-line break-words">{r.details}</p>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
            <dt className="text-muted-foreground">Subject</dt>
            <dd>{SUBJECTS[r.subject]}</dd>
            <dt className="text-muted-foreground">Level</dt>
            <dd>{LEVELS[r.level]}</dd>
            <dt className="text-muted-foreground">Budget</dt>
            <dd>up to {formatPeso(r.budget_centavos)} per session</dd>
            <dt className="text-muted-foreground">Mode</dt>
            <dd>{r.mode === "online" ? "Online" : "Face-to-face"}</dd>
            <dt className="text-muted-foreground">Preferred</dt>
            <dd className="min-w-0 break-words">{r.preferred_time || "Any time"}</dd>
            <dt className="text-muted-foreground">Offers</dt>
            <dd>{r.offer_count}</dd>
          </dl>
        </CardContent>
      </Card>

      {isOwner ? (
        <LearnerOffers request={r} />
      ) : (
        <TutorOfferCard
          requestId={r.id}
          status={r.status}
          chosenOfferId={r.chosen_offer_id}
          learnerFirstName={learnerFirstName}
          tutorId={user.id}
        />
      )}
    </main>
  );
}

// The tutor's side: their offer if they made one, otherwise the form.
async function TutorOfferCard({
  requestId,
  status,
  chosenOfferId,
  learnerFirstName,
  tutorId,
}: {
  requestId: string;
  status: HelpStatus;
  chosenOfferId: string | null;
  learnerFirstName: string;
  tutorId: string;
}) {
  const isOpen = status === "open";
  const supabase = await createClient();
  const [{ data: myOffer }, { data: myListing }] = await Promise.all([
    supabase
      .from("help_offers")
      .select("id, message, proposed_time, created_at")
      .eq("request_id", requestId)
      .eq("tutor_id", tutorId)
      .maybeSingle(),
    supabase.from("tutor_profiles").select("rate_centavos").eq("tutor_id", tutorId).maybeSingle(),
  ]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{myOffer ? "Your offer" : "Send an offer"}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 text-sm">
        {myOffer ? (
          <>
            {status === "matched" &&
              (chosenOfferId === myOffer.id ? (
                <p className="rounded-[var(--radius)] bg-success/15 px-3 py-2 font-medium text-green-800">
                  {learnerFirstName} chose you! They&apos;ll send you a session request — watch My Sessions.
                </p>
              ) : (
                <p className="rounded-[var(--radius)] bg-muted px-3 py-2 text-muted-foreground">
                  {learnerFirstName} chose another tutor this time.
                </p>
              ))}
            {status === "cancelled" && (
              <p className="rounded-[var(--radius)] bg-muted px-3 py-2 text-muted-foreground">
                {learnerFirstName} cancelled this request.
              </p>
            )}
            <p>
              <span className="text-muted-foreground">Proposed time:</span> {myOffer.proposed_time}
            </p>
            <p className="whitespace-pre-line break-words">{myOffer.message}</p>
            <p className="text-muted-foreground">Sent {formatSessionTime(myOffer.created_at)}</p>
            {/* Allowed by the database only because this tutor made an offer (SQL 012). */}
            <MessageLearnerButton requestId={requestId} learnerName={learnerFirstName} />
          </>
        ) : !isOpen ? (
          <p className="text-muted-foreground">This request is closed, so it isn&apos;t taking offers.</p>
        ) : !myListing ? (
          <div className="flex flex-col gap-3">
            <p className="text-muted-foreground">Create your tutor profile first — offers show your listed rate.</p>
            <Link href="/tutor-profile" className={buttonVariants({ className: "self-start" })}>
              Create my tutor profile
            </Link>
          </div>
        ) : (
          <OfferForm requestId={requestId} rateLabel={formatPeso(myListing.rate_centavos)} />
        )}
      </CardContent>
    </Card>
  );
}

type OfferRow = {
  id: string;
  tutor_id: string;
  message: string;
  proposed_time: string;
  created_at: string;
  // help_offers → tutor_profiles (rate) → profiles (name)
  tutor: { rate_centavos: number; profiles: { display_name: string } | null } | null;
};

// The learner's side: every offer on their request, with an honest
// budget tag, and "Choose this tutor" while the request is Open.
async function LearnerOffers({ request: r }: { request: HelpRequest }) {
  const supabase = await createClient();
  // Row Level Security only returns offers on the learner's own request.
  const { data: offers, error } = await supabase
    .from("help_offers")
    .select("id, tutor_id, message, proposed_time, created_at, tutor:tutor_profiles(rate_centavos, profiles(display_name))")
    .eq("request_id", r.id)
    .order("created_at", { ascending: true })
    .returns<OfferRow[]>();
  if (error) console.error("Help request page: could not load offers", error);

  const chosen = offers?.find((o) => o.id === r.chosen_offer_id);
  const chosenName = chosen?.tutor?.profiles?.display_name ?? "your tutor";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Offers</CardTitle>
        <CardDescription>
          {r.status === "matched"
            ? `You chose ${chosenName}. Now send them a session request — nothing is booked until you do.`
            : r.status === "cancelled"
              ? "You cancelled this request."
              : "Compare the offers and choose one tutor. Choosing doesn't book anything by itself."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 text-sm">
        {r.status === "matched" && chosen && (
          <Link href={`/tutors/${chosen.tutor_id}`} className={buttonVariants({ className: "self-start" })}>
            Request a session with {chosenName}
          </Link>
        )}

        {error ? (
          <p className="text-destructive">We couldn&apos;t load the offers right now. Please refresh.</p>
        ) : !offers || offers.length === 0 ? (
          <p className="text-muted-foreground">
            No offers yet. Tutors can see your request on the Help Request Board.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {offers.map((o) => {
              const name = o.tutor?.profiles?.display_name ?? "Tutor";
              const tag = o.tutor ? budgetTag(o.tutor.rate_centavos, r.budget_centavos) : null;
              const isChosen = o.id === r.chosen_offer_id;
              return (
                <li
                  key={o.id}
                  className={`flex flex-col gap-2 rounded-[var(--radius)] border p-4 ${isChosen ? "border-primary bg-secondary/50" : "border-border"}`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Link href={`/tutors/${o.tutor_id}`} className="font-semibold hover:underline">
                      {name}
                    </Link>
                    {isChosen && (
                      <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-medium text-primary-foreground">
                        Chosen
                      </span>
                    )}
                  </div>
                  {o.tutor && tag && (
                    <p className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{formatPeso(o.tutor.rate_centavos)} / session</span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${tag.within ? "bg-success/15 text-green-800" : "bg-warning/15 text-amber-900"}`}
                      >
                        {tag.text}
                      </span>
                    </p>
                  )}
                  <p>
                    <span className="text-muted-foreground">Proposed time:</span> {o.proposed_time}
                  </p>
                  <p className="whitespace-pre-line break-words">{o.message}</p>
                  {r.status === "open" && <ChooseOfferButton requestId={r.id} offerId={o.id} tutorName={name} />}
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
