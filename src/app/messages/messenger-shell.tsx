"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { firstName } from "@/lib/tutormatch";
import type { InboxItem } from "@/lib/chat";

// Messenger-style layout: chat list + open chat side by side on
// desktop; on phones, the list on /messages and just the chat once one
// is open.
export function MessengerShell({
  items,
  times,
  failed,
  children,
}: {
  items: InboxItem[];
  times: Record<string, string>; // pre-formatted on the server
  failed: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const onList = pathname === "/messages";

  return (
    <div className="mx-auto flex h-[calc(100dvh-4rem)] w-full max-w-5xl md:gap-4 md:p-4">
      <aside
        className={cn(
          "w-full flex-col overflow-hidden border-border bg-card md:flex md:w-80 md:shrink-0 md:rounded-[var(--radius)] md:border",
          onList ? "flex" : "hidden",
        )}
      >
        <h1 className="border-b border-border px-4 py-3 text-xl font-semibold">Messages</h1>
        <div className="flex-1 overflow-y-auto">
          {failed ? (
            <p className="p-4 text-sm text-destructive">We couldn&apos;t load your chats right now. Please refresh.</p>
          ) : items.length === 0 ? (
            <div className="flex flex-col gap-2 p-4 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">No chats yet.</p>
              <p>
                Learners: tap <span className="font-medium">Message</span> on a tutor&apos;s page. Tutors: tap{" "}
                <span className="font-medium">Message</span> on a help request you offered on. Your chats will show up
                here.
              </p>
            </div>
          ) : (
            <ul>
              {items.map((c) => {
                const active = pathname === `/messages/${c.id}`;
                return (
                  <li key={c.id}>
                    <Link
                      href={`/messages/${c.id}`}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-3 border-b border-border/60 px-4 py-3 transition-colors",
                        active ? "bg-secondary" : "hover:bg-muted",
                      )}
                    >
                      <span
                        aria-hidden
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-secondary-foreground"
                      >
                        {firstName(c.otherName, "?").slice(0, 1).toUpperCase()}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-baseline justify-between gap-2">
                          <span className="truncate font-medium">{c.otherName}</span>
                          <span className="shrink-0 text-xs text-muted-foreground">{times[c.id]}</span>
                        </span>
                        <span className="block truncate text-sm text-muted-foreground">
                          {c.lastFromMe ? "You: " : ""}
                          {c.lastBody}
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>

      <section
        className={cn(
          "min-w-0 flex-1 flex-col overflow-hidden bg-card md:flex md:rounded-[var(--radius)] md:border md:border-border",
          onList ? "hidden" : "flex",
        )}
      >
        {children}
      </section>
    </div>
  );
}
