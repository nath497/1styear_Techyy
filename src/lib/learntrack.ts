// LearnTrack rules (SQL 016). The database checks the same limits; these
// give the learner friendly messages before it has to.
import { SUBJECTS, type Subject } from "@/lib/tutormatch";

export const TOPIC_STATUSES = {
  need_review: "Need to Review",
  learning: "Learning",
  understood: "Understood",
} as const;
export type TopicStatus = keyof typeof TOPIC_STATUSES;

// Red, amber, green — the "selected" colour of each status button.
export const TOPIC_STATUS_STYLE: Record<TopicStatus, string> = {
  need_review: "bg-rose-100 text-rose-900 border-rose-300",
  learning: "bg-amber-100 text-amber-900 border-amber-300",
  understood: "bg-green-100 text-green-900 border-green-300",
};

export type LearnTopic = {
  id: string;
  subject: Subject;
  name: string;
  status: TopicStatus;
  note: string;
};

export type TopicInput = { subject: Subject; name: string; note: string };

// Read and check the add / edit form. Returns the clean values, or the
// first problem as a friendly message.
export function parseTopicForm(form: FormData): { topic: TopicInput } | { error: string } {
  const text = (k: string) => String(form.get(k) ?? "").trim();
  const name = text("name");
  const subject = text("subject");
  const note = text("note");

  // At least one letter or number — the database refuses names made only
  // of spaces, dashes or invisible characters.
  if (!/[\p{L}\p{N}]/u.test(name)) return { error: "Give the topic a name." };
  if (name.length > 100) return { error: "Please keep the topic name under 100 characters." };
  if (!Object.hasOwn(SUBJECTS, subject)) return { error: "Choose a subject." };
  if (note.length > 300) return { error: "Please keep the note under 300 characters." };

  return { topic: { subject: subject as Subject, name, note } };
}

export function isTopicStatus(value: unknown): value is TopicStatus {
  return typeof value === "string" && Object.hasOwn(TOPIC_STATUSES, value);
}

// Read ?status=… from the page address: one status, or everything. An
// unknown value shows everything, so a bad link never breaks the page.
export function parseTopicFilter(params: Record<string, string | string[] | undefined>): TopicStatus | "all" {
  const v = params.status;
  return isTopicStatus(v) ? v : "all";
}

// Topics grouped by subject (in the usual subject order), each group with
// its progress: how many topics are Understood out of how many.
export function groupBySubject(topics: LearnTopic[]) {
  return (Object.keys(SUBJECTS) as Subject[])
    .map((subject) => {
      const items = topics
        .filter((t) => t.subject === subject)
        .sort((a, b) => a.name.localeCompare(b.name, "en", { sensitivity: "base" }));
      return {
        subject,
        topics: items,
        understood: items.filter((t) => t.status === "understood").length,
        total: items.length,
      };
    })
    .filter((g) => g.total > 0);
}
