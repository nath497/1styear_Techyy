"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  CalendarCheck,
  CalendarDays,
  ChevronDown,
  CreditCard,
  HandHelping,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircle,
  Search,
  UserPlus,
  UserRound,
  X,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { logOut } from "@/app/auth-actions";

// Icons are picked by name, because the server builds the list and can
// only send plain data to the browser.
const ICONS = {
  home: Home,
  dashboard: LayoutDashboard,
  search: Search,
  help: HandHelping,
  sessions: CalendarCheck,
  planner: CalendarDays,
  learntrack: BarChart3,
  subscription: CreditCard,
  profile: UserRound,
  join: UserPlus,
  chat: MessageCircle,
};
export type IconName = keyof typeof ICONS;

// A page in the navigation. `soon` = not built yet: shown greyed out with
// a "Soon" tag, and never clickable, so nothing leads to a missing page.
export type NavItem = { href: string; label: string; icon: IconName; soon?: boolean };

export type Account = { name: string; role: "learner" | "tutor" } | null;

// "/tutors/abc" still counts as being on "Find a Tutor".
function isActive(pathname: string, href: string) {
  const path = href.split("?")[0];
  return path === "/" ? pathname === "/" : pathname === path || pathname.startsWith(`${path}/`);
}

function NavList({ items, onPick }: { items: NavItem[]; onPick?: () => void }) {
  const pathname = usePathname();
  return (
    <ul className="flex flex-col gap-1">
      {items.map((item) => {
        const Icon = ICONS[item.icon];
        if (item.soon) {
          return (
            <li key={item.label}>
              <span
                aria-disabled="true"
                className="flex cursor-not-allowed items-center gap-3 rounded-[var(--radius)] px-3 py-2.5 text-sm text-muted-foreground/70"
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden />
                <span className="flex-1">{item.label}</span>
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide">
                  Soon
                </span>
              </span>
            </li>
          );
        }
        const active = isActive(pathname, item.href);
        return (
          <li key={item.label}>
            <Link
              href={item.href}
              onClick={onPick}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-[var(--radius)] px-3 py-2.5 text-sm font-medium transition-colors",
                active ? "bg-secondary text-secondary-foreground" : "hover:bg-muted",
              )}
            >
              <Icon className={cn("h-4 w-4 shrink-0", active ? "text-primary" : "text-muted-foreground")} aria-hidden />
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

// Desktop: a compact sidebar on the left that stays put while you scroll.
export function Sidebar({ items }: { items: NavItem[] }) {
  return (
    <aside className="hidden w-60 shrink-0 border-r border-border md:block">
      <nav aria-label="Main" className="sticky top-16 p-3">
        <NavList items={items} />
      </nav>
    </aside>
  );
}

// Phones: a Menu button that opens the same list plus the account
// actions. It closes when you pick a page or press Escape.
export function MobileMenu({ items, account }: { items: NavItem[]; account: Account }) {
  const pathname = usePathname();
  // Remember which page the menu was opened on: on any other page (after a
  // link, or the phone's Back button) it's automatically closed.
  const [openedOn, setOpenedOn] = useState<string | null>(null);
  const open = openedOn === pathname;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpenedOn(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpenedOn(open ? null : pathname)}
        className={buttonVariants({ variant: "ghost", size: "sm" })}
      >
        {open ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
      </button>

      {open && (
        <div
          id="mobile-menu"
          className="absolute inset-x-0 top-16 max-h-[calc(100dvh-4rem)] overflow-y-auto border-b border-border bg-background px-4 pb-4 shadow-lg"
        >
          {account && (
            <p className="truncate py-3 text-sm text-muted-foreground">
              Logged in as {account.name} · {account.role === "tutor" ? "Tutor" : "Learner"}
            </p>
          )}
          <nav aria-label="Main" className={account ? "" : "pt-3"}>
            <NavList items={items} onPick={() => setOpenedOn(null)} />
          </nav>
          <div className="mt-3 flex gap-2 border-t border-border pt-3">
            {account ? (
              <form action={logOut} className="w-full">
                <button type="submit" className={buttonVariants({ variant: "outline", className: "w-full" })}>
                  <LogOut className="h-4 w-4" aria-hidden /> Log out
                </button>
              </form>
            ) : (
              <>
                <Link href="/login" className={buttonVariants({ variant: "outline", className: "flex-1" })}>
                  Log in
                </Link>
                <Link href="/signup" className={buttonVariants({ className: "flex-1" })}>
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Desktop: your initials at the top right open a small account menu.
export function ProfileMenu({ account }: { account: NonNullable<Account> }) {
  const pathname = usePathname();
  const [openedOn, setOpenedOn] = useState<string | null>(null);
  const open = openedOn === pathname;
  const box = useRef<HTMLDivElement>(null);

  // Close on Escape or a click anywhere else.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpenedOn(null);
    const onClick = (e: MouseEvent) => !box.current?.contains(e.target as Node) && setOpenedOn(null);
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  const initials = account.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

  return (
    <div ref={box} className="relative hidden md:block">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="profile-menu"
        onClick={() => setOpenedOn(open ? null : pathname)}
        className="flex items-center gap-2 rounded-full py-1 pr-2 pl-1 text-sm hover:bg-muted"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">
          {initials || "?"}
        </span>
        <span className="max-w-36 truncate">{account.name}</span>
        <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden />
      </button>

      {open && (
        <div
          id="profile-menu"
          className="absolute right-0 mt-2 w-56 rounded-[var(--radius)] border border-border bg-card p-2 shadow-lg"
        >
          <p className="px-2 py-1.5 text-xs text-muted-foreground">
            Signed in as a {account.role === "tutor" ? "Tutor" : "Learner"}
          </p>
          <Link
            href="/profile"
            onClick={() => setOpenedOn(null)}
            className="flex items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-muted"
          >
            <UserRound className="h-4 w-4" aria-hidden /> {account.role === "tutor" ? "Account details" : "Profile"}
          </Link>
          {account.role === "tutor" && (
            <Link
              href="/tutor-profile"
              onClick={() => setOpenedOn(null)}
              className="flex items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-muted"
            >
              <UserRound className="h-4 w-4" aria-hidden /> My profile
            </Link>
          )}
          <Link
            href="/sessions"
            onClick={() => setOpenedOn(null)}
            className="flex items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-muted"
          >
            <CalendarCheck className="h-4 w-4" aria-hidden /> My sessions
          </Link>
          <form action={logOut}>
            <button
              type="submit"
              className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4" aria-hidden /> Log out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
