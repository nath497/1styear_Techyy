"use client";

import { Fragment, useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formValues } from "@/lib/form-values";
import { sendHelpOffer, type HelpFormState } from "../actions";

const FIELDS = ["proposed_time", "message"] as const;
type OfferState = HelpFormState & { values?: Partial<Record<(typeof FIELDS)[number], string>>; attempt?: number };

export function OfferForm({ requestId, rateLabel }: { requestId: string; rateLabel: string }) {
  const [state, formAction, pending] = useActionState<OfferState, FormData>(async (prev, formData) => {
    const result = await sendHelpOffer(prev, formData);
    if (!result.error) return result;
    // React empties a form after every submit, so hand back what was typed
    // and refill the boxes with it.
    return { ...result, values: formValues(formData, FIELDS), attempt: Date.now() };
  }, {});
  const values = state.values ?? {};

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="request_id" value={requestId} />

      {/* A new `key` after an error re-creates the boxes, so they pick up the refilled values. */}
      <Fragment key={state.attempt}>

        <div className="flex flex-col gap-2">
          <Label htmlFor="proposed_time">When could you do the session?</Label>
          <Input id="proposed_time" name="proposed_time" required maxLength={200} placeholder="e.g. Saturday 2–3pm"
            defaultValue={values.proposed_time ?? ""}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="message">Message to the learner</Label>
          <Textarea
            id="message"
            name="message"
            required
            maxLength={500}
            placeholder="How you'd help, and anything you'd like them to bring."
            defaultValue={values.message ?? ""}
          />
        </div>
      </Fragment>

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
