// Shared TutorMatch values. These must match the check rules in
// supabase/sql/002-profiles-and-tutor-profiles.sql.

export const SUBJECTS = {
  math: "Mathematics",
  science: "Science",
  english: "English",
  filipino: "Filipino",
  programming_ict: "Programming/ICT",
  accounting_business: "Accounting/Business",
} as const;

export const LEVELS = {
  shs: "Senior High",
  college: "College",
} as const;

export const MODES = {
  online: "Online",
  face_to_face: "Face-to-face",
  both: "Online or face-to-face",
} as const;

export type Subject = keyof typeof SUBJECTS;
export type Level = keyof typeof LEVELS;
export type Mode = keyof typeof MODES;

// Money is stored as whole centavos (₱150 = 15000) to avoid rounding errors.
export function formatPeso(centavos: number) {
  const pesos = centavos / 100;
  return `₱${pesos.toLocaleString("en-PH", {
    minimumFractionDigits: Number.isInteger(pesos) ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

// ---- BudgetMatch -----------------------------------------------------

// What a learner wants: online or face-to-face. ("both" is only for tutors.)
export type WantedMode = Exclude<Mode, "both">;

export type MatchFilters = {
  subject: Subject;
  level: Level;
  budgetCentavos: number;
  mode: WantedMode;
};

type SearchParams = Record<string, string | string[] | undefined>;

export const MAX_BUDGET_CENTAVOS = 10_000_000; // ₱100,000

// Read the Find a Tutor form from the page address (?subject=math&...).
// Returns null unless all four answers are present and valid.
export function parseMatchFilters(params: SearchParams): MatchFilters | null {
  const one = (key: string) => (typeof params[key] === "string" ? params[key] : "");
  const subject = one("subject");
  const level = one("level");
  const budget = one("budget").trim();
  const mode = one("mode");

  if (!Object.hasOwn(SUBJECTS, subject) || !Object.hasOwn(LEVELS, level)) return null;
  if (mode !== "online" && mode !== "face_to_face") return null;
  // Budget is typed in pesos ("100" or "100.50") and compared in centavos.
  if (!/^\d+(\.\d{1,2})?$/.test(budget)) return null;
  const budgetCentavos = Math.round(Number(budget) * 100);
  // Over ₱100,000 is a typo, not a budget (and huge numbers show as ₱∞).
  if (budgetCentavos <= 0 || budgetCentavos > MAX_BUDGET_CENTAVOS) return null;

  return { subject: subject as Subject, level: level as Level, budgetCentavos, mode };
}

// The BudgetMatch rule, in one place. A "both" tutor fits either mode.
// (Find a Tutor loads every listing and filters with this. That's fine
// for a class-sized app; with thousands of tutors, move it into the query.)
export function tutorMatches(
  tutor: { subjects: Subject[]; levels: Level[]; rate_centavos: number; mode: Mode },
  f: MatchFilters,
) {
  return (
    tutor.subjects.includes(f.subject) &&
    tutor.levels.includes(f.level) &&
    tutor.rate_centavos <= f.budgetCentavos &&
    (tutor.mode === f.mode || tutor.mode === "both")
  );
}

// e.g. "₱100 ≤ your ₱100 budget · teaches Mathematics · face-to-face"
export function matchReason(rateCentavos: number, f: MatchFilters) {
  const mode = f.mode === "online" ? "online" : "face-to-face";
  return `${formatPeso(rateCentavos)} ≤ your ${formatPeso(f.budgetCentavos)} budget · teaches ${SUBJECTS[f.subject]} · ${mode}`;
}

// ---- Session requests (bookings) ---------------------------------------

export const STATUSES = {
  pending: "Pending",
  accepted: "Accepted",
  declined: "Declined",
  completed: "Completed",
  cancelled: "Cancelled",
} as const;

export type Status = keyof typeof STATUSES;

// TutorMatch runs in the Philippines, but Vercel's servers run on UTC.
// A date-time picker sends e.g. "2026-10-20T16:00" with no time zone, so
// we pin it to Philippine time (UTC+8, no daylight saving).
export function parseManilaDateTime(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  const date = new Date(`${value}:00+08:00`);
  if (Number.isNaN(date.getTime())) return null;
  // JavaScript quietly turns "Feb 30" into "Mar 2". Convert back to
  // Philippine time and make sure it's the same date and time we were given.
  const backInManila = new Date(date.getTime() + 8 * 60 * 60 * 1000).toISOString().slice(0, 16);
  return backInManila === value ? date : null;
}

// e.g. "Tue, Oct 20, 2026, 4:00 PM" in Philippine time.
export function formatSessionTime(iso: string) {
  return new Date(iso).toLocaleString("en-PH", {
    timeZone: "Asia/Manila",
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// Split My sessions into its three sections:
//   pending  — waiting for the tutor (soonest first)
//   upcoming — accepted (soonest first)
//   history  — declined, cancelled or completed (most recent first)
export function groupSessions<T extends { status: Status; starts_at: string }>(sessions: T[]) {
  const time = (s: T) => new Date(s.starts_at).getTime();
  const soonestFirst = (a: T, b: T) => time(a) - time(b);
  return {
    pending: sessions.filter((s) => s.status === "pending").sort(soonestFirst),
    upcoming: sessions.filter((s) => s.status === "accepted").sort(soonestFirst),
    history: sessions
      .filter((s) => s.status !== "pending" && s.status !== "accepted")
      .sort((a, b) => time(b) - time(a)),
  };
}
