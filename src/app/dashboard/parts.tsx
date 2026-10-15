import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { inboxTime, type InboxItem } from "@/lib/chat";
import { todayInManila } from "@/lib/tutormatch";

// Small building blocks shared by the learner and tutor dashboards, so
// both look like the same app.

export function Welcome({
  name,
  message,
  children,
}: {
  name: string;
  message: string;
  children: React.ReactNode; // the action buttons
}) {
  return (
    <section className="rounded-[calc(var(--radius)*1.5)] bg-gradient-to-br from-secondary to-background p-6 sm:p-8">
      <p className="text-sm text-muted-foreground">{todayInManila()}</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight">
        Hi, {name} <span aria-hidden>👋</span>
      </h1>
      <p className="mt-2 max-w-xl text-muted-foreground">{message}</p>
      <div className="mt-5 flex flex-wrap gap-3">{children}</div>
    </section>
  );
}

export function StatCard({ label, value, href, note }: { label: string; value: string | number; href: string; note?: string }) {
  return (
    <Link
      href={href}
      className="flex flex-col gap-1 rounded-[var(--radius)] border border-border bg-card p-4 shadow-sm transition-colors hover:border-primary"
    >
      <span className="text-2xl font-semibold">{value}</span>
      <span className="text-sm text-muted-foreground">{label}</span>
      {note && <span className="text-xs text-muted-foreground">{note}</span>}
    </Link>
  );
}

export function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: { href: string; label: string };
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
        <CardTitle className="text-lg">{title}</CardTitle>
        {action && (
          <Link href={action.href} className="shrink-0 text-sm font-medium text-primary hover:underline">
            {action.label}
          </Link>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-3 text-sm">{children}</CardContent>
    </Card>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-muted-foreground">{children}</p>;
}

export function LoadError({ what }: { what: string }) {
  return <p className="text-destructive">We couldn&apos;t load {what} right now. Please refresh.</p>;
}

// The latest chats, like a Messenger preview. Only shown once there are
// any (the dashboards skip it when the list is empty).
export function RecentChats({ items }: { items: InboxItem[] }) {
  return (
    <Section title="Messages" action={{ href: "/messages", label: "Open Messages" }}>
      <ul className="flex flex-col gap-2">
        {items.map((c) => (
          <li key={c.id}>
            <Link
              href={`/messages/${c.id}`}
              className="flex items-center gap-3 rounded-[var(--radius)] bg-muted/60 px-3 py-2 hover:bg-muted"
            >
              <span
                aria-hidden
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-secondary-foreground"
              >
                {c.otherName.trim().slice(0, 1).toUpperCase() || "?"}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline justify-between gap-2">
                  <span className="truncate font-medium">{c.otherName}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">{inboxTime(c.lastAt)}</span>
                </span>
                <span className="block truncate text-muted-foreground">
                  {c.lastFromMe ? "You: " : ""}
                  {c.lastBody}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Section>
  );
}
