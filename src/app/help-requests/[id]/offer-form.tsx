"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { sendHelpOffer, type HelpFormState } from "../actions";

export function OfferForm({ requestId, rateLabel }: { requestId: string; rateLabel: string }) {
  const [state, formAction, pending] = useActionState<HelpFormState, FormData>(sendHelpOffer, {});

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="request_id" value={requestId} />

      <div className="flex flex-col gap-2">
        <Label htmlFor="proposed_time">When could you do the session?</Label>
        <Input id="proposed_time" name="proposed_time" required maxLength={200} placeholder="e.g. Saturday 2–3pm" />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="message">Message to the learner</Label>
        <Textarea
          id="message"
          name="message"
          required
          maxLength={500}
          placeholder="How you'd help, and anything you'd like them to bring."
        />
      </div>

      <p className="text-sm text-muted-foreground">
        Your offer shows your listed rate ({rateLabel} per session). You can make one offer per request, and it
        can&apos;t be edited later.
      </p>

      {state.error && (
        <p role="alert" className="rounded-[var(--radius)] bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={pending} size="lg">
        {pending ? "Sending…" : "Send my offer"}
      </Button>
    </form>
  );
}
