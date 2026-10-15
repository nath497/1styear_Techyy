// Schedule rules (SQL 017, ticket 24). The database checks the same limits
// and refuses clashes; these give the learner friendly messages first.
import { calendarDateError, hasLetterOrNumber } from "@/lib/dates";
import { formValues } from "@/lib/form-values";
import { addDays } from "@/lib/learning-space";
import { SUBJECTS, type Subject } from "@/lib/tutormatch";

export type StudyActivity = {
  id: string;
  title: string;
  subject: Subject;
  activity_date: string; // "2026-10-20"
  start_time: string; // "16:00:00" (Philippine time)
  end_time: string;
  notes: string;
};

export type ActivityInput = Omit<StudyActivity, "id">;

const TIME = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

// Read and check the add / edit form. Returns the clean values, or the
// first problem as a friendly message.
export function parseActivityForm(form: FormData): { activity: ActivityInput } | { error: string } {
  const text = (k: string) => String(form.get(k) ?? "").trim();
  const title = text("title");
  const subject = text("subject");
  const date = text("activity_date");
  const start = text("start_time");
  const end = text("end_time");
  const notes = text("notes");

  if (!hasLetterOrNumber(title)) return { error: "Give the activity a title." };
  if (title.length > 100) return { error: "Please keep the title under 100 characters." };
  if (!Object.hasOwn(SUBJECTS, subject)) return { error: "Choose a subject." };
  const dateError = calendarDateError(date);
  if (dateError) return { error: dateError };
  if (!TIME.test(start)) return { error: "Choose a start time." };
  if (!TIME.test(end)) return { error: "Choose an end time." };
  if (toMinutes(end) <= toMinutes(start)) return { error: "The end time must be after the start time." };
  if (notes.length > 500) return { error: "Please keep notes under 500 characters." };

  return {
    activity: {
      title,
      subject: subject as Subject,
      activity_date: date,
      start_time: start.slice(0, 5),
      end_time: end.slice(0, 5),
      notes,
    },
  };
}

// What the learner typed, so a form can be refilled after an error.
export const ACTIVITY_FIELDS = ["title", "subject", "activity_date", "start_time", "end_time", "notes"] as const;
export type ActivityFormValues = Partial<Record<(typeof ACTIVITY_FIELDS)[number], string>>;
export function activityFormValues(form: FormData): ActivityFormValues {
  return formValues(form, ACTIVITY_FIELDS);
}

// "16:30" or "16:30:00" → minutes since midnight.
export function toMinutes(time: string) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

// "4:00 – 5:30 PM" style label for a time range.
export function formatTimeRange(start: string, end: string) {
  return `${formatTime(start)} – ${formatTime(end)}`;
}

export function formatTime(time: string) {
  const [h, m] = time.split(":").map(Number);
  return new Date(Date.UTC(2000, 0, 1, h, m)).toLocaleTimeString("en-PH", {
    timeZone: "UTC",
    hour: "numeric",
    minute: "2-digit",
  });
}

// The days the Schedule shows: Monday of this week through Sunday of next
// week (14 days), as "YYYY-MM-DD" in Philippine time.
export function scheduleDays(today: string) {
  const [y, m, d] = today.split("-").map(Number);
  const weekday = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0 = Sunday
  const monday = addDays(today, -((weekday + 6) % 7));
  return Array.from({ length: 14 }, (_, i) => addDays(monday, i));
}

// A day heading: "Today · Fri, Oct 16" or "Mon, Oct 19".
export function formatDay(date: string, today: string) {
  const [y, m, d] = date.split("-").map(Number);
  const label = new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-PH", {
    timeZone: "UTC",
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  return date === today ? `Today · ${label}` : label;
}

// Minutes since 1970 for a Philippine date and time — so times on
// different days (e.g. a session at 11:30 PM) compare correctly.
function absoluteMinutes(date: string, time: string) {
  const [y, m, d] = date.split("-").map(Number);
  return Date.UTC(y, m - 1, d) / 60000 + toMinutes(time);
}

// Does this activity overlap a tutoring session (1 hour long)? That's
// allowed, but the Schedule shows a warning. Works across midnight.
export function overlapsSession(
  activity: Pick<StudyActivity, "activity_date" | "start_time" | "end_time">,
  sessions: { date: string; time: string }[],
) {
  const start = absoluteMinutes(activity.activity_date, activity.start_time);
  const end = absoluteMinutes(activity.activity_date, activity.end_time);
  return sessions.some((s) => {
    const sStart = absoluteMinutes(s.date, s.time);
    return sStart < end && start < sStart + 60;
  });
}

// The moment an activity starts or ends, as an ISO time (Philippine time
// is UTC+8 all year — no daylight saving).
export function activityInstant(date: string, time: string) {
  return new Date(`${date}T${time.slice(0, 5)}:00+08:00`).toISOString();
}

// The next activity that hasn't finished yet, from a list sorted by date
// and start time. `nowTime` is the current Philippine time, "HH:MM".
export function nextActivity<T extends Pick<StudyActivity, "activity_date" | "end_time">>(
  activities: T[],
  today: string,
  nowTime: string,
) {
  return activities.find(
    (a) => a.activity_date > today || (a.activity_date === today && toMinutes(a.end_time) > toMinutes(nowTime)),
  );
}

// The current time in the Philippines as "HH:MM" (Vercel runs on UTC).
export function manilaNowTime(now = new Date()) {
  return now.toLocaleTimeString("en-GB", { timeZone: "Asia/Manila", hour: "2-digit", minute: "2-digit", hour12: false });
}
