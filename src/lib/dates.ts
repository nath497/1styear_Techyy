// Checking a "YYYY-MM-DD" date typed into a form — shared by study tasks,
// the schedule and goals, so they all accept and refuse the same dates.
// Returns a friendly problem, or null when the date is fine.
export function calendarDateError(date: string, what = "a date"): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(`${date}T00:00:00Z`))) return `Choose ${what}.`;
  // Impossible dates like Feb 30 roll over to another day — refuse them.
  if (new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) !== date) return "Choose a real date.";
  // Far-off years are almost always typos (e.g. 9999).
  const year = Number(date.slice(0, 4));
  if (year < 2020 || year > 2100) return "Choose a date between 2020 and 2100.";
  return null;
}

// A title, name or topic needs at least one letter or number, so it can't
// be only spaces, dots or invisible characters.
export function hasLetterOrNumber(text: string) {
  return /[\p{L}\p{N}]/u.test(text);
}
