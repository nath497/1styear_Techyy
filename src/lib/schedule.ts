// Schedule rules (SQL 017, ticket 24). The database checks the same limits
// and refuses clashes; these give the learner friendly messages first.
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

  if (!/[\p{L}\p{N}]/u.test(title)) return { error: "Give the activity a title." };
  if (title.length > 100) return { error: "Please keep the title under 100 characters." };
  if (!Object.hasOwn(SUBJECTS, subject)) return { error: "Choose a subject." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(`${date}T00:00:00Z`)))
    return { error: "Choose a date." };
  // Reject impossible dates (Feb 30) and far-off years (a typo like 9999).
  if (new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) !== date) return { error: "Choose a real date." };
  const year = Number(date.slice(0, 4));
  if (year < 2020 || year > 2100) return { error: "Choose a date between 2020 and 2100." };
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

// Does this activity overlap a tutoring session (1 hour long) on the same
// day? That's allowed, but the Schedule shows a warning.
export function overlapsSession(
  activity: Pick<StudyActivity, "activity_date" | "start_time" | "end_time">,
  sessions: { date: string; time: string }[],
) {
  const start = toMinutes(activity.start_time);
  const end = toMinutes(activity.end_time);
  return sessions.some((s) => {
    if (s.date !== activity.activity_date) return false;
    const sStart = toMinutes(s.time);
    return sStart < end && start < sStart + 60;
  });
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
