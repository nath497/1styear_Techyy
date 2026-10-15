"use client";

import { usePathname } from "next/navigation";

// The footer on every page — except Messages, which fills the screen like
// a chat app (a footer underneath would make the whole page scroll).
export function SiteFooter() {
  const pathname = usePathname();
  if (pathname === "/messages" || pathname.startsWith("/messages/")) return null;

  return (
    <footer className="mt-auto border-t border-border">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-1 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:justify-between">
        <p>TutorMatch · Find Your Match. Learn Together. Grow Together.</p>
        <p>A student demo. No real money moves on TutorMatch.</p>
      </div>
    </footer>
  );
}
