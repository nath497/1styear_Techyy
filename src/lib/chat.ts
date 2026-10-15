import type { createClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;

// One row in the Messages inbox.
export type InboxItem = {
  id: string;
  otherName: string;
  otherRole: "learner" | "tutor";
  lastBody: string;
  lastFromMe: boolean;
  lastAt: string;
};

type ConversationRow = {
  id: string;
  learner_id: string;
  last_message_at: string;
  last_message_body: string | null;
  last_message_sender_id: string | null;
  // Display names only — never emails.
  learner: { display_name: string } | null;
  tutor: { profiles: { display_name: string } | null } | null;
};

// My conversations that have at least one message, newest first, with a
// preview of the latest message. Row Level Security only returns
// conversations I'm in (SQL 010). The database keeps the latest message's
// time, text and sender on each conversation (SQL 011 + 013), so one
// query is enough and a preview is never missing. Empty conversations
// have no last_message_at, so they stay out of the inbox — like Messenger.
export async function loadInbox(supabase: Supabase, userId: string, limit = 50) {
  const { data, error } = await supabase
    .from("conversations")
    .select(
      "id, learner_id, last_message_at, last_message_body, last_message_sender_id, learner:profiles(display_name), tutor:tutor_profiles(profiles(display_name))",
    )
    .not("last_message_at", "is", null)
    .order("last_message_at", { ascending: false })
    .limit(limit)
    .returns<ConversationRow[]>();
  if (error) return { items: [] as InboxItem[], error };

  const items: InboxItem[] = data.map((c) => {
    const iAmLearner = c.learner_id === userId;
    return {
      id: c.id,
      otherName: (iAmLearner ? c.tutor?.profiles?.display_name : c.learner?.display_name) ?? (iAmLearner ? "Tutor" : "Learner"),
      otherRole: iAmLearner ? "tutor" : "learner",
      lastBody: c.last_message_body ?? "",
      lastFromMe: c.last_message_sender_id === userId,
      lastAt: c.last_message_at,
    };
  });
  return { items, error: null };
}

// "4:05 PM" today, "Oct 14" otherwise — in Philippine time.
export function inboxTime(iso: string, now = new Date()) {
  const opts = { timeZone: "Asia/Manila" } as const;
  const day = (d: Date) => d.toLocaleDateString("en-PH", opts);
  const d = new Date(iso);
  return day(d) === day(now)
    ? d.toLocaleTimeString("en-PH", { ...opts, hour: "numeric", minute: "2-digit" })
    : d.toLocaleDateString("en-PH", { ...opts, month: "short", day: "numeric" });
}
