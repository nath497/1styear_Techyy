import Link from "next/link";
import { CalendarCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { JoinCallLink } from "@/components/join-call-link";
import { createClient } from "@/lib/supabase/server";
import { addDays } from "@/lib/learning-space";
import { toManilaDateTime } from "@/lib/planner";
import { formatDay, formatTimeRange, overlapsSession, scheduleDays, type StudyActivity } from "@/lib/schedule";
import { SUBJECTS, type Subject } from "@/lib/tutormatch";
import { ActivityItem } from "./activity-item";
import { AddActivityForm } from "./add-activity-form";

type BookingRow = {
  id: string;
  subject: Subject;
  starts_at: string;
  meeting_link: string | null;
  tutor: { profiles: { display_name: string } | null } | null;
};

// The Schedule tab of My Learning Space: planned study activities for this
// week and next, by day, with accepted tutoring sessions shown read-only.
// The page has already checked that this is a logged-in learner.
export async function ScheduleTab({ learnerId, today }: { learnerId: string; today: string }) {
  const supabase = await createClient();
  const days = scheduleDays(today);
  const first = days[0];
  const last = days[days.length - 1];

  // Row Level Security only returns this learner's own activities (SQL 017)
  // and bookings (SQL 003). Sessions are fetched by their Philippine dates.
  const [activitiesRes, sessionsRes] = await Promise.all([
    supabase
      .from("study_activities")
      .select("id, title, subject, activity_date, start_time, end_time, notes")
      .gte("activity_date", first)
      .lte("activity_date", last)
      .order("activity_date", { ascending: true })
      .order("start_time", { ascending: true })
      .returns<StudyActivity[]>(),
    supabase
      .from("bookings")
      .select("id, subject, starts_at, meeting_link, tutor:tutor_profiles(profiles(display_name))")
      .eq("learner_id", learnerId)
      .eq("status", "accepted")
      .gte("starts_at", `${first}T00:00:00+08:00`)
      .lt("starts_at", `${addDays(last, 1)}T00:00:00+08:00`)
      .order("starts_at", { ascending: true })
      .returns<BookingRow[]>(),
  ]);
  if (activitiesRes.error) console.error("Schedule: could not load activities", activitiesRes.error);
  if (sessionsRes.error) console.error("Schedule: could not load sessions", sessionsRes.error);

  const activities = activitiesRes.data ?? [];
  const sessions = (sessionsRes.data ?? []).map((s) => ({ ...s, ...toManilaDateTime(s.starts_at) }));
  // Today, plus every day that has something on it.
  const shownDays = days.filter(
    (d) => d === today || activities.some((a) => a.activity_date === d) || sessions.some((s) => s.date === d),
  );
  const nothingPlanned = activities.length === 0 && sessions.length === 0;

  return (
    <div className="flex flex-col gap-6">
      <p className="text-muted-foreground">
        Plan when you&apos;ll study, this week and next. Your activities can&apos;t overlap each other; your accepted
        tutoring sessions show here too.
      </p>

      <AddActivityForm today={today} />

      {activitiesRes.error && (
        <Card className="border-destructive">
          <CardContent className="pt-6 text-sm">
            <p className="font-medium text-destructive">We couldn&apos;t load your study activities right now.</p>
            <p className="mt-1 text-muted-foreground">Please try again in a moment.</p>
          </CardContent>
        </Card>
      )}
      {sessionsRes.error && (
        <p className="text-sm text-destructive">We couldn&apos;t load your tutoring sessions right now.</p>
      )}

      {!activitiesRes.error && nothingPlanned && (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 pt-6 text-center">
            <p className="font-medium">Nothing planned for this week or next.</p>
            <p className="text-sm text-muted-foreground">
              Add a study activity — say, an hour of Math review on Saturday morning.
            </p>
          </CardContent>
        </Card>
      )}

      {!nothingPlanned &&
        shownDays.map((day) => {
          const dayActivities = activities.filter((a) => a.activity_date === day);
          const daySessions = sessions.filter((s) => s.date === day);
          const isPast = day < today;
          return (
            <section key={day} className="flex flex-col gap-2">
              <h3
                className={`text-sm font-semibold tracking-tight ${day === today ? "text-primary" : isPast ? "text-muted-foreground" : ""}`}
              >
                {formatDay(day, today)}
              </h3>
              {dayActivities.length === 0 && daySessions.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nothing planned today.</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {/* Sessions and activities in time order. */}
                  {[
                    ...daySessions.map((s) => ({ kind: "session" as const, time: s.time, s })),
                    ...dayActivities.map((a) => ({ kind: "activity" as const, time: a.start_time, a })),
                  ]
                    .sort((x, y) => x.time.localeCompare(y.time))
                    .map((item) =>
                      item.kind === "activity" ? (
                        <li key={`a-${item.a.id}`}>
                          <ActivityItem activity={item.a} sessionClash={overlapsSession(item.a, daySessions)} />
                        </li>
                      ) : (
                        <li key={`s-${item.s.id}`}>
                          <Card className="border-primary/40 bg-secondary/40">
                            <CardContent className="flex flex-col gap-2 pt-4 pb-4 text-sm sm:flex-row sm:items-center sm:justify-between">
                              <div className="flex min-w-0 flex-col gap-1">
                                <p className="flex items-center gap-2 font-medium">
                                  <CalendarCheck className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                                  Session with {item.s.tutor?.profiles?.display_name ?? "your tutor"}
                                </p>
                                <p className="text-muted-foreground">
                                  {formatTimeRange(item.s.time, addMinutes(item.s.time, 60))} ·{" "}
                                  {SUBJECTS[item.s.subject]}
                                </p>
                              </div>
                              <div className="flex shrink-0 flex-col items-start gap-1 sm:items-end">
                                {item.s.meeting_link && <JoinCallLink link={item.s.meeting_link} />}
                                <Link href="/sessions" className="text-xs font-medium text-primary hover:underline">
                                  Manage in My sessions
                                </Link>
                              </div>
                            </CardContent>
                          </Card>
                        </li>
                      ),
                    )}
                </ul>
              )}
            </section>
          );
        })}
    </div>
  );
}

// "16:00:00" plus 60 → "17:00" (wraps past midnight).
function addMinutes(time: string, minutes: number) {
  const [h, m] = time.split(":").map(Number);
  const total = (h * 60 + m + minutes) % (24 * 60);
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}
