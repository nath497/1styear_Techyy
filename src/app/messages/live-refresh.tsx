"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Listens for new messages with Supabase Realtime and refreshes the page
// data when one arrives, so chats update without a manual refresh.
// Realtime uses Row Level Security, so this only ever hears about
// messages in MY conversations (SQL 010 + 011). Uses the public key the
// app already has — nothing secret in the browser.
export function LiveRefresh() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    let timer: ReturnType<typeof setTimeout> | undefined;
    let channel: ReturnType<typeof supabase.channel> | undefined;
    let stopped = false;

    (async () => {
      // Realtime has to know who is listening, or RLS sends nothing.
      const { data } = await supabase.auth.getSession();
      if (stopped || !data.session) return;
      await supabase.realtime.setAuth(data.session.access_token);

      channel = supabase
        .channel("my-messages")
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, () => {
          // Several messages at once → one refresh.
          clearTimeout(timer);
          timer = setTimeout(() => router.refresh(), 150);
        })
        .subscribe();
    })();

    return () => {
      stopped = true;
      clearTimeout(timer);
      if (channel) supabase.removeChannel(channel);
    };
  }, [router]);

  return null;
}
