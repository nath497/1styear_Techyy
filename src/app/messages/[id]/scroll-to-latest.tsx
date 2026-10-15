"use client";

import { useEffect, useRef } from "react";

// The scrolling message area. Jumps to the newest message when the chat
// opens and whenever a new one arrives.
export function ScrollToLatest({ count, children }: { count: number; children: React.ReactNode }) {
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    end.current?.scrollIntoView({ block: "end" });
  }, [count]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4" aria-live="polite">
      {children}
      <div ref={end} />
    </div>
  );
}
