"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { changeBookingStatus, type StatusFormState } from "./actions";

type Choice = { status: "accepted" | "declined" | "cancelled" | "completed"; label: string; confirm?: string };

// One small form per booking. Each button sends the status it stands for.
export function StatusButtons({ bookingId, choices }: { bookingId: string; choices: Choice[] }) {
  const [state, formAction, pending] = useActionState<StatusFormState, FormData>(changeBookingStatus, {});

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="booking_id" value={bookingId} />
      <div className="flex flex-wrap gap-2">
        {choices.map((c) => (
          <Button
            key={c.status}
            type="submit"
            name="status"
            value={c.status}
            size="sm"
            variant={c.status === "accepted" || c.status === "completed" ? "default" : "outline"}
            disabled={pending}
            // Declining or cancelling can't be undone, so ask first.
            onClick={(e) => {
              if (c.confirm && !window.confirm(c.confirm)) e.preventDefault();
            }}
          >
            {c.label}
          </Button>
        ))}
      </div>
      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
    </form>
  );
}
