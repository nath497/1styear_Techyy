import Link from "next/link";
import { CalendarCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { JoinCallLink } from "@/components/join-call-link";
import { formatDue } from "@/lib/planner";
import { SUBJECTS, type Subject } from "@/lib/tutormatch";

// An accepted tutoring session placed in the planner on its Philippine date.
// It counts as "to do" so it groups with tasks; it can't be ticked off here.
export type PlannerSession = {
  kind: "session";
  id: string;
  subject: Subject;
  topic: string;
  tutorName: string;
  meeting_link: string | null;
  due_date: string;
  due_time: string;
  status: "todo";
  completed_at: null;
};

// The session's card — read-only; it's managed in My sessions.
export function SessionRow({ session: s }: { session: PlannerSession }) {
  return (
    <Card className="border-primary/40 bg-secondary/40">
      <CardContent className="flex flex-col gap-3 pt-4 pb-4 text-sm sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-col gap-1">
          <p className="flex items-center gap-2 font-medium">
            <CalendarCheck className="h-4 w-4 shrink-0 text-primary" aria-hidden />
            Session with {s.tutorName}
          </p>
          <p className="text-muted-foreground">
            {SUBJECTS[s.subject]} · {formatDue(s.due_date, s.due_time)}
          </p>
          <p className="break-words">{s.topic}</p>
        </div>
        <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
          {s.meeting_link && <JoinCallLink link={s.meeting_link} />}
          <Link href="/sessions" className="text-xs font-medium text-primary hover:underline">
            Manage in My sessions
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
