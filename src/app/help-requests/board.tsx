import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { createClient } from "@/lib/supabase/server";
import { formatPeso, formatSessionTime, LEVELS, SUBJECTS, type Level, type Subject } from "@/lib/tutormatch";

type BoardRow = {
  id: string;
  title: string;
  details: string;
  subject: Subject;
  level: Level;
  budget_centavos: number;
  mode: "online" | "face_to_face";
  preferred_time: string;
  offer_count: number;
  created_at: string;
  learner: { display_name: string } | null;
};

// "Mika Santos" → "Mika": tutors see only the learner's first name.
const firstName = (name: string | undefined) => name?.trim().split(/\s+/)[0] || "A learner";

// The tutors' Help Request Board: Open requests, newest first, with
// subject and level filters. Row Level Security only lets tutors read
// Open requests (and ones they already offered on) — SQL 008.
export async function HelpBoard({ tutorId, subject, level }: { tutorId: string; subject: string; level: string }) {
  const pickedSubject = Object.hasOwn(SUBJECTS, subject) ? (subject as Subject) : undefined;
  const pickedLevel = Object.hasOwn(LEVELS, level) ? (level as Level) : undefined;

  const supabase = await createClient();
  let query = supabase
    .from("help_requests")
    .select(
      "id, title, details, subject, level, budget_centavos, mode, preferred_time, offer_count, created_at, learner:profiles(display_name)",
    )
    .eq("status", "open")
    .order("created_at", { ascending: false });
  if (pickedSubject) query = query.eq("subject", pickedSubject);
  if (pickedLevel) query = query.eq("level", pickedLevel);

  const [{ data, error }, { data: mine }] = await Promise.all([
    query.returns<BoardRow[]>(),
    supabase.from("help_offers").select("request_id").eq("tutor_id", tutorId),
  ]);
  if (error) console.error("Help Request Board: could not load", error);
  const offered = new Set((mine ?? []).map((o) => o.request_id as string));
  const filtering = Boolean(pickedSubject || pickedLevel);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Help Request Board</h1>
        <p className="text-muted-foreground">Learners who need help. Open one to make an offer.</p>
      </header>

      <Card>
        <CardContent className="pt-6">
          <form method="get" action="/help-requests" className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <div className="flex flex-col gap-2">
              <Label htmlFor="board-subject">Subject</Label>
              <Select id="board-subject" name="subject" defaultValue={pickedSubject ?? ""}>
                <option value="">Any subject</option>
                {(Object.keys(SUBJECTS) as Subject[]).map((key) => (
                  <option key={key} value={key}>
                    {SUBJECTS[key]}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="board-level">Level</Label>
              <Select id="board-level" name="level" defaultValue={pickedLevel ?? ""}>
                <option value="">Any level</option>
                {(Object.keys(LEVELS) as Level[]).map((key) => (
                  <option key={key} value={key}>
                    {LEVELS[key]}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex gap-2">
              <Button type="submit">Filter</Button>
              {filtering && (
                <Link href="/help-requests" className={buttonVariants({ variant: "ghost" })}>
                  Reset
                </Link>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {error ? (
        <Card className="border-destructive">
          <CardContent className="pt-6 text-sm">
            <p className="font-medium text-destructive">We couldn&apos;t load help requests right now.</p>
            <p className="mt-1 text-muted-foreground">Please try again in a moment.</p>
          </CardContent>
        </Card>
      ) : data.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="font-medium">
              {filtering ? "No open help requests match these filters." : "No open help requests right now."}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {filtering ? "Try another subject or level." : "Check back soon — new requests show up here."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <ul className="flex flex-col gap-3">
          {data.map((r) => (
            <li key={r.id}>
              <Card>
                <CardContent className="flex flex-col gap-3 pt-6 text-sm sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <p className="text-base font-semibold break-words">{r.title}</p>
                    <ul className="flex flex-wrap gap-1.5">
                      <li className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
                        {SUBJECTS[r.subject]}
                      </li>
                      <li className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
                        {LEVELS[r.level]}
                      </li>
                      <li className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
                        {r.mode === "online" ? "Online" : "Face-to-face"}
                      </li>
                    </ul>
                    <p className="line-clamp-2 break-words">{r.details}</p>
                    <p className="text-muted-foreground">
                      {firstName(r.learner?.display_name)} · {r.preferred_time ? `${r.preferred_time} · ` : ""}posted{" "}
                      {formatSessionTime(r.created_at)}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-row flex-wrap items-center justify-between gap-2 sm:flex-col sm:items-end">
                    <p className="text-lg font-semibold">
                      up to {formatPeso(r.budget_centavos)}{" "}
                      <span className="text-sm font-normal text-muted-foreground">/ session</span>
                    </p>
                    <p className="text-muted-foreground">
                      {r.offer_count} {r.offer_count === 1 ? "offer" : "offers"}
                    </p>
                    {offered.has(r.id) && (
                      <span className="rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-medium text-green-800">
                        You offered
                      </span>
                    )}
                    <Link href={`/help-requests/${r.id}`} className={buttonVariants({ size: "sm" })}>
                      {offered.has(r.id) ? "View" : "View & offer"}
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
