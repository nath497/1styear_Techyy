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

// ---- Find a Tutor: search, BudgetMatch filters and sorting -------------
//
// Every filter is optional, and all the ones you fill in apply together.
// The page address holds the answers (?q=algebra&subject=math&budget=100…)
// so results can be shared, bookmarked or refreshed.

// What a learner wants: online or face-to-face. ("both" is only for tutors.)
export type WantedMode = Exclude<Mode, "both">;

export const SORTS = {
  relevance: "Best match",
  price: "Lowest price",
  newest: "Newest tutors",
} as const;
export type Sort = keyof typeof SORTS;

export type MarketFilters = {
  q: string; // tutor name or keyword, e.g. "algebra"
  subject?: Subject;
  level?: Level;
  minCentavos?: number;
  maxCentavos?: number; // the BudgetMatch budget
  mode?: WantedMode;
  sort: Sort;
};

// One tutor listing, as Find a Tutor loads it.
export type Listing = {
  name: string;
  bio: string;
  subjects: Subject[];
  levels: Level[];
  rate_centavos: number;
  mode: Mode;
  created_at: string;
};

type SearchParams = Record<string, string | string[] | undefined>;

export const MAX_BUDGET_CENTAVOS = 10_000_000; // ₱100,000

// "100" or "100.50" pesos → whole centavos. Anything else → undefined.
export function pesosToCentavos(value: string) {
  if (!/^\d+(\.\d{1,2})?$/.test(value)) return undefined;
  const centavos = Math.round(Number(value) * 100);
  // Over ₱100,000 is a typo, not a budget (and huge numbers show as ₱∞).
  return centavos > 0 && centavos <= MAX_BUDGET_CENTAVOS ? centavos : undefined;
}

// Read the Find a Tutor form from the page address. Unknown or invalid
// values are ignored, so a bad link never breaks the page. `notes` are
// friendly messages about anything we had to ignore.
export function parseMarketFilters(params: SearchParams): { filters: MarketFilters; notes: string[] } {
  const one = (key: string) => {
    const value = params[key];
    return typeof value === "string" ? value.trim() : "";
  };
  const notes: string[] = [];

  const subject = one("subject");
  const level = one("level");
  const mode = one("mode");
  const sort = one("sort");
  let minCentavos = pesosToCentavos(one("min"));
  const maxCentavos = pesosToCentavos(one("budget"));

  if (one("budget") && maxCentavos === undefined) notes.push("Your budget wasn't a valid amount, so it was ignored.");
  if (one("min") && minCentavos === undefined) notes.push("The minimum price wasn't a valid amount, so it was ignored.");
  if (minCentavos !== undefined && maxCentavos !== undefined && minCentavos > maxCentavos) {
    notes.push("The minimum price was higher than your budget, so the minimum was ignored.");
    minCentavos = undefined;
  }

  return {
    filters: {
      q: one("q").slice(0, 100),
      subject: Object.hasOwn(SUBJECTS, subject) ? (subject as Subject) : undefined,
      level: Object.hasOwn(LEVELS, level) ? (level as Level) : undefined,
      minCentavos,
      maxCentavos,
      mode: mode === "online" || mode === "face_to_face" ? mode : undefined,
      sort: Object.hasOwn(SORTS, sort) ? (sort as Sort) : "relevance",
    },
    notes,
  };
}

export function hasAnyFilter(f: MarketFilters) {
  return Boolean(f.q || f.subject || f.level || f.minCentavos || f.maxCentavos || f.mode);
}

// The individual checks, by name, so we can also ask "which one is
// stopping results?" for the empty state.
const words = (q: string) => q.toLowerCase().split(/\s+/).filter(Boolean);
const searchableText = (t: Listing) =>
  [t.name, t.bio, ...t.subjects.map((s) => SUBJECTS[s]), ...t.levels.map((l) => LEVELS[l])].join(" ").toLowerCase();

const CHECKS = {
  q: (t: Listing, f: MarketFilters) => words(f.q).every((w) => searchableText(t).includes(w)),
  subject: (t: Listing, f: MarketFilters) => !f.subject || t.subjects.includes(f.subject),
  level: (t: Listing, f: MarketFilters) => !f.level || t.levels.includes(f.level),
  minCentavos: (t: Listing, f: MarketFilters) => f.minCentavos === undefined || t.rate_centavos >= f.minCentavos,
  maxCentavos: (t: Listing, f: MarketFilters) => f.maxCentavos === undefined || t.rate_centavos <= f.maxCentavos,
  // A "both" tutor fits either mode.
  mode: (t: Listing, f: MarketFilters) => !f.mode || t.mode === f.mode || t.mode === "both",
};
type CheckName = keyof typeof CHECKS;

export function tutorMatches(t: Listing, f: MarketFilters, skip?: CheckName) {
  return (Object.keys(CHECKS) as CheckName[]).every((name) => name === skip || CHECKS[name](t, f));
}

// Why a tutor showed up: one short reason per filter the learner used.
// e.g. ["₱100 ≤ your ₱100 budget", "teaches Mathematics", "College", "face-to-face"]
export function matchReasons(t: Listing, f: MarketFilters) {
  const reasons: string[] = [];
  if (f.maxCentavos !== undefined) {
    const spare = f.maxCentavos - t.rate_centavos;
    reasons.push(
      `${formatPeso(t.rate_centavos)} ≤ your ${formatPeso(f.maxCentavos)} budget` +
        (spare > 0 ? ` (${formatPeso(spare)} to spare)` : ""),
    );
  }
  if (f.subject) reasons.push(`teaches ${SUBJECTS[f.subject]}`);
  if (f.level) reasons.push(LEVELS[f.level]);
  if (f.mode) reasons.push(f.mode === "online" ? "online" : "face-to-face");
  if (f.q) reasons.push(`matches "${f.q}"`);
  return reasons;
}

// Best match: tutors whose NAME matches the search first, then subject,
// then anything else (bio); ties go to the lower price. Without a search
// it's simply lowest price first.
function relevance(t: Listing, f: MarketFilters) {
  if (!f.q) return 0;
  const q = f.q.toLowerCase();
  if (t.name.toLowerCase().includes(q)) return 3;
  if (t.subjects.some((s) => SUBJECTS[s].toLowerCase().includes(q))) return 2;
  return 1;
}

export function sortListings<T extends Listing>(list: T[], f: MarketFilters) {
  const byPrice = (a: T, b: T) => a.rate_centavos - b.rate_centavos;
  return [...list].sort((a, b) => {
    if (f.sort === "newest") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    if (f.sort === "relevance") return relevance(b, f) - relevance(a, f) || byPrice(a, b);
    return byPrice(a, b);
  });
}

// For the empty state: which single filter, if dropped, would show
// tutors — and how many. Based only on the real listings.
const CHECK_LABELS: Record<CheckName, string> = {
  q: "your search words",
  subject: "the subject",
  level: "the level",
  minCentavos: "the minimum price",
  maxCentavos: "your budget",
  mode: "the mode",
};

export function whatIsLimiting(all: Listing[], f: MarketFilters) {
  const used = (Object.keys(CHECKS) as CheckName[]).filter((name) =>
    name === "q" ? Boolean(f.q) : f[name] !== undefined,
  );
  return used
    .map((name) => {
      const found = all.filter((t) => tutorMatches(t, f, name));
      return {
        filter: CHECK_LABELS[name],
        count: found.length,
        cheapest: found.length ? Math.min(...found.map((t) => t.rate_centavos)) : undefined,
        isBudget: name === "maxCentavos",
      };
    })
    .filter((x) => x.count > 0);
}

// The cost before requesting. The learner pays the listed price — no fees
// are added on top. TutorMatch's 10% is recorded on the TUTOR's side
// (same rounding as the database, SQL 005).
export function budgetBreakdown(rateCentavos: number) {
  const commission = Math.round(rateCentavos * 0.1);
  return { youPay: rateCentavos, commission, tutorGets: rateCentavos - commission };
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

// ---- Help Request Board -------------------------------------------------

export const HELP_STATUSES = {
  open: "Open",
  matched: "Matched",
  cancelled: "Cancelled",
} as const;

export type HelpStatus = keyof typeof HELP_STATUSES;

// The honest budget tag on an offer: the tutor's listed rate against the
// learner's budget. Never says "within budget" when it isn't.
export function budgetTag(rateCentavos: number, budgetCentavos: number) {
  const over = rateCentavos - budgetCentavos;
  return over > 0
    ? { within: false, text: `${formatPeso(over)} over your budget` }
    : { within: true, text: "Within your budget" };
}
