"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { logOut } from "@/app/auth-actions";

export type NavItem = { href: string; label: string };

// "/tutors/abc" still counts as being on "Find a Tutor".
function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

// The links in the desktop bar, with the current page highlighted.
export function DesktopNavLinks({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  return (
    <>
      {items.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              active && "bg-secondary text-secondary-foreground",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </>
  );
}

// Phones: a Menu button that opens a panel with every link plus the
// account actions. It closes when you pick a page or press Escape.
export function MobileMenu({ items, userName }: { items: NavItem[]; userName: string | null }) {
  const pathname = usePathname();
  // Remember which page the menu was opened on: on any other page (after a
  // link, or the phone's Back button) it's automatically closed.
  const [openedOn, setOpenedOn] = useState<string | null>(null);
  const open = openedOn === pathname;
  const setOpen = (next: boolean | ((was: boolean) => boolean)) =>
    setOpenedOn((typeof next === "function" ? next(open) : next) ? pathname : null);

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
        onClick={() => setOpen((o) => !o)}
        className={buttonVariants({ variant: "ghost", size: "sm" })}
      >
        {open ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
      </button>

      {open && (
        <div
          id="mobile-menu"
          className="absolute inset-x-0 top-16 border-b border-border bg-background px-4 pb-4 shadow-lg"
        >
          {userName && <p className="truncate py-3 text-sm text-muted-foreground">Logged in as {userName}</p>}
          <ul className="flex flex-col gap-1">
            {items.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "block rounded-[var(--radius)] px-3 py-3 font-medium",
                      active ? "bg-secondary text-secondary-foreground" : "hover:bg-muted",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className="mt-3 flex gap-2 border-t border-border pt-3">
            {userName !== null ? (
              <form action={logOut} className="w-full">
                <button type="submit" className={buttonVariants({ variant: "outline", className: "w-full" })}>
                  Log out
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
