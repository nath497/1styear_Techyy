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
  // Display names only — never emails.
  learner: { display_name: string } | null;
  tutor: { profiles: { display_name: string } | null } | null;
};

// My conversations that have at least one message, newest first, with a
// preview of the latest message. Row Level Security only returns
// conversations I'm in (SQL 010); empty ones have no last_message_at
// (SQL 011), so they stay out of the inbox — like Messenger.
export async function loadInbox(supabase: Supabase, userId: string, limit = 50) {
  const { data: convos, error } = await supabase
    .from("conversations")
    .select("id, learner_id, last_message_at, learner:profiles(display_name), tutor:tutor_profiles(profiles(display_name))")
    .not("last_message_at", "is", null)
    .order("last_message_at", { ascending: false })
    .limit(limit)
    .returns<ConversationRow[]>();
  if (error) return { items: [] as InboxItem[], error };
  if (!convos.length) return { items: [] as InboxItem[], error: null };

  // The latest message of each conversation, for the preview line.
  const { data: recent, error: recentError } = await supabase
    .from("messages")
    .select("conversation_id, sender_id, body, created_at")
    .in(
      "conversation_id",
      convos.map((c) => c.id),
    )
    .order("created_at", { ascending: false })
    .limit(convos.length * 5);
  if (recentError) return { items: [] as InboxItem[], error: recentError };

  const latest = new Map<string, { sender_id: string; body: string; created_at: string }>();
  for (const m of recent ?? []) if (!latest.has(m.conversation_id)) latest.set(m.conversation_id, m);

  const items: InboxItem[] = convos.map((c) => {
    const iAmLearner = c.learner_id === userId;
    const last = latest.get(c.id);
    return {
      id: c.id,
      otherName: (iAmLearner ? c.tutor?.profiles?.display_name : c.learner?.display_name) ?? (iAmLearner ? "Tutor" : "Learner"),
      otherRole: iAmLearner ? "tutor" : "learner",
      lastBody: last?.body ?? "",
      lastFromMe: last?.sender_id === userId,
      lastAt: last?.created_at ?? c.last_message_at,
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
