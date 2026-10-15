import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { inboxTime, loadInbox } from "@/lib/chat";
import { LiveRefresh } from "./live-refresh";
import { MessengerShell } from "./messenger-shell";

// The frame for /messages and every chat in it: the inbox on the left (or
// first, on phones) and the open chat on the right.
export default async function MessagesLayout({ children }: LayoutProps<"/messages">) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/messages");

  const { items, error } = await loadInbox(supabase, user.id);
  if (error) console.error("Messages: could not load inbox", error);
  const times = Object.fromEntries(items.map((c) => [c.id, inboxTime(c.lastAt)]));

  return (
    <>
      <LiveRefresh />
      <MessengerShell items={items} times={times} failed={Boolean(error)}>
        {children}
      </MessengerShell>
    </>
  );
}
