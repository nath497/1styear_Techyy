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
