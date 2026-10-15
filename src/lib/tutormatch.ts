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
  if (budgetCentavos <= 0) return null;

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
