// Session Notes rules (SQL 017, ticket 26). The database checks the same
// limits and that the booking is the learner's own Accepted or Completed
// one; these give friendly messages first.
import { formValues } from "@/lib/form-values";

export type SessionNote = {
  id: string;
  booking_id: string;
  questions: string;
  help_topics: string;
  reflection: string;
};

export type NoteInput = { questions: string; help_topics: string; reflection?: string };

// Read and check the notes form. The reflection box only appears once the
// session has ended, so it's only saved when it was on the form.
export function parseNoteForm(form: FormData): { note: NoteInput } | { error: string } {
  const text = (k: string) => String(form.get(k) ?? "").trim();
  const questions = text("questions");
  const helpTopics = text("help_topics");
  const reflection = text("reflection");

  if (questions.length > 1000) return { error: "Please keep your questions under 1000 characters." };
  if (helpTopics.length > 500) return { error: "Please keep the topics under 500 characters." };
  if (reflection.length > 1000) return { error: "Please keep your reflection under 1000 characters." };

  return {
    note: { questions, help_topics: helpTopics, ...(form.has("reflection") ? { reflection } : {}) },
  };
}

export const NOTE_FIELDS = ["questions", "help_topics", "reflection"] as const;
export type NoteFormValues = Partial<Record<(typeof NOTE_FIELDS)[number], string>>;
export function noteFormValues(form: FormData): NoteFormValues {
  return formValues(form, NOTE_FIELDS);
}

// Has the 1-hour session finished? The reflection box appears from then
// on, and the session moves from "Coming up" to "Past sessions".
export function sessionHasEnded(startsAt: string, now = new Date()) {
  return new Date(startsAt).getTime() + 60 * 60 * 1000 <= now.getTime();
}

// "Add from LearnTrack": add topic names to what's already in the box,
// one per line, skipping any that are already there (ignoring case).
export function addTopicNames(existing: string, names: string[]) {
  const lines = existing.split("\n").map((l) => l.trim()).filter(Boolean);
  const have = new Set(lines.map((l) => l.toLowerCase()));
  for (const name of names) {
    if (!have.has(name.toLowerCase())) {
      lines.push(name);
      have.add(name.toLowerCase());
    }
  }
  return lines.join("\n");
}
