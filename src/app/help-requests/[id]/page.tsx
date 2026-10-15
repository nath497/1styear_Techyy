import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import {
  formatPeso,
  formatSessionTime,
  HELP_STATUSES,
  LEVELS,
  SUBJECTS,
  type HelpStatus,
  type Level,
  type Subject,
} from "@/lib/tutormatch";
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
  offer_count: number;
  created_at: string;
  learner: { display_name: string } | null;
};

// Supabase ids look like 3f2b...-...; anything else can't be a request.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function HelpRequestPage({ params }: PageProps<"/help-requests/[id]">) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();

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
      "id, learner_id, title, details, subject, level, budget_centavos, mode, preferred_time, status, offer_count, created_at, learner:profiles(display_name)",
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
  const learnerFirstName = r.learner?.display_name?.trim().split(/\s+/)[0] || "A learner";

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-4 px-4 py-10">
      <Link href="/help-requests" className="text-sm font-medium text-primary hover:underline">
        ← Back to {isOwner ? "my help requests" : "the Help Request Board"}
      </Link>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <CardTitle className="text-2xl break-words">{r.title}</CardTitle>
            <span className="shrink-0 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
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
        <Card>
          <CardHeader>
            <CardTitle>Offers</CardTitle>
            <CardDescription>
              {r.offer_count === 0
                ? "No offers yet. Tutors who teach this subject can see your request."
                : `${r.offer_count} ${r.offer_count === 1 ? "tutor has" : "tutors have"} offered. Comparing offers and choosing a tutor arrives in the next update.`}
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <TutorOfferCard requestId={r.id} isOpen={r.status === "open"} tutorId={user.id} />
      )}
    </main>
  );
}

// The tutor's side: their offer if they made one, otherwise the form.
async function TutorOfferCard({ requestId, isOpen, tutorId }: { requestId: string; isOpen: boolean; tutorId: string }) {
  const supabase = await createClient();
  const [{ data: myOffer }, { data: myListing }] = await Promise.all([
    supabase
      .from("help_offers")
      .select("message, proposed_time, created_at")
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
            <p>
              <span className="text-muted-foreground">Proposed time:</span> {myOffer.proposed_time}
            </p>
            <p className="whitespace-pre-line break-words">{myOffer.message}</p>
            <p className="text-muted-foreground">Sent {formatSessionTime(myOffer.created_at)}</p>
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
