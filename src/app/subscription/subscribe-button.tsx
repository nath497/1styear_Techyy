"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

// The prototype's Subscribe button: it never charges or saves anything —
// it just says so.
export function SubscribeButton({ planName, highlighted }: { planName: string; highlighted: boolean }) {
  const [pressed, setPressed] = useState(false);
  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        variant={highlighted ? "default" : "outline"}
        className="w-full"
        onClick={() => setPressed(true)}
        aria-label={`Subscribe to ${planName} (prototype)`}
      >
        Subscribe
      </Button>
      {pressed && (
        <p role="status" className="rounded-[var(--radius)] bg-secondary px-3 py-2 text-xs text-secondary-foreground">
          This is a prototype. Payments aren&apos;t live yet, and nothing was charged.
        </p>
      )}
    </div>
  );
}
