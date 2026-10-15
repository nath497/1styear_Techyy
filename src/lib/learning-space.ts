// My Learning Space: one page with tabs (ticket 21). The tab lives in the
// address (?tab=…), so Back, refresh and shared links all keep it.

export const SPACE_PATH = "/learning-space";

export const SPACE_TABS = {
  overview: "Overview",
  tasks: "Study Tasks",
  schedule: "Schedule",
  learntrack: "LearnTrack",
  goals: "Goals",
  notes: "Session Notes",
} as const;
export type SpaceTab = keyof typeof SPACE_TABS;

// Read ?tab=… — anything unknown opens the Overview.
export function parseTab(value: string | string[] | undefined): SpaceTab {
  return typeof value === "string" && Object.hasOwn(SPACE_TABS, value) ? (value as SpaceTab) : "overview";
}

// A link to one tab, with optional filters (empty values are left out).
export function spaceHref(tab: SpaceTab, params: Record<string, string | undefined> = {}) {
  const query = new URLSearchParams(tab === "overview" ? {} : { tab });
  for (const [k, v] of Object.entries(params)) if (v) query.set(k, v);
  const qs = query.toString();
  return qs ? `${SPACE_PATH}?${qs}` : SPACE_PATH;
}

// "2026-10-16" plus n days, as "YYYY-MM-DD" (calendar maths, no time zone).
export function addDays(date: string, n: number) {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

// Overall progress: the share of LearnTrack topics marked Understood, as a
// whole percent — or null when there are no topics yet (never a made-up 0%).
export function overallProgress(understood: number, total: number) {
  return total > 0 ? Math.round((understood / total) * 100) : null;
}
