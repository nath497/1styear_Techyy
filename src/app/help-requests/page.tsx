import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
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
import { CancelHelpRequestButton } from "./cancel-button";

export const metadata: Metadata = { title: "Request Help · TutorMatch" };

type HelpRequestRow = {
  id: string;
  title: string;
  details: string;
  subject: Subject;
  level: Level;
  budget_centavos: number;
  mode: "online" | "face_to_face";
  preferred_time: string;
  status: HelpStatus;
  created_at: string;
};

const statusStyle: Record<HelpStatus, string> = {
  open: "bg-green-100 text-green-900",
  matched: "bg-secondary text-secondary-foreground",
  cancelled: "bg-muted text-muted-foreground",
};

export default async function HelpRequestsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/help-requests");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();

  // The tutors' Help Request Board arrives in ticket 10.
  if (profile?.role === "tutor") {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Help Request Board</CardTitle>
            <CardDescription>Open help requests from learners will show here in the next update.</CardDescription>
          </CardHeader>
        </Card>
      </main>
    );
  }

  // Row Level Security only returns this learner's own requests.
  const { data, error } = await supabase
    .from("help_requests")
    .select("id, title, details, subject, level, budget_centavos, mode, preferred_time, status, created_at")
    .eq("learner_id", user.id)
    .order("created_at", { ascending: false })
    .returns<HelpRequestRow[]>();

  if (error) console.error("My help requests: could not load", error);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight">My help requests</h1>
          <p className="text-muted-foreground">Tell tutors what you need — they can come to you.</p>
        </div>
        <Link href="/help-requests/new" className={buttonVariants()}>
          <Plus className="h-4 w-4" aria-hidden /> Post a request
        </Link>
      </header>

      {error ? (
        <Card className="border-destructive">
          <CardContent className="pt-6 text-sm">
            <p className="font-medium text-destructive">We couldn&apos;t load your help requests right now.</p>
            <p className="mt-1 text-muted-foreground">Please try again in a moment.</p>
          </CardContent>
        </Card>
      ) : data.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 pt-6 text-center">
            <div>
              <p className="font-medium">No help requests yet.</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Post what you&apos;re stuck on, your level and your budget — tutors who fit can offer to help.
              </p>
            </div>
            <Link href="/help-requests/new" className={buttonVariants()}>
              Post your first request
            </Link>
          </CardContent>
        </Card>
      ) : (
        <ul className="flex flex-col gap-3">
          {data.map((r) => (
            <li key={r.id}>
              <Card>
                <CardContent className="flex flex-col gap-3 pt-6 text-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 flex-col gap-1">
                      <p className="text-base font-semibold break-words">{r.title}</p>
                      <p className="text-muted-foreground">
                        {SUBJECTS[r.subject]} · {LEVELS[r.level]} · up to {formatPeso(r.budget_centavos)} ·{" "}
                        {r.mode === "online" ? "Online" : "Face-to-face"}
                      </p>
                    </div>
                    <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${statusStyle[r.status]}`}>
                      {HELP_STATUSES[r.status]}
                    </span>
                  </div>
                  <p className="line-clamp-3 whitespace-pre-line break-words">{r.details}</p>
                  <p className="text-muted-foreground">
                    {r.preferred_time ? `Preferred: ${r.preferred_time} · ` : ""}Posted {formatSessionTime(r.created_at)}
                  </p>
                  {r.status === "open" && <CancelHelpRequestButton requestId={r.id} />}
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
