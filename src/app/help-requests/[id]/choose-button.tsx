"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { chooseHelpOffer, type HelpFormState } from "../actions";

export function ChooseOfferButton({
  requestId,
  offerId,
  tutorName,
}: {
  requestId: string;
  offerId: string;
  tutorName: string;
}) {
  const [state, formAction, pending] = useActionState<HelpFormState, FormData>(chooseHelpOffer, {});

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="request_id" value={requestId} />
      <input type="hidden" name="offer_id" value={offerId} />
      <Button
        type="submit"
        size="sm"
        disabled={pending}
        className="self-start"
        // Choosing can't be undone, so ask first.
        onClick={(e) => {
          if (!window.confirm(`Choose ${tutorName}? You can't change your choice afterwards.`)) e.preventDefault();
        }}
      >
        {pending ? "Saving…" : "Choose this tutor"}
      </Button>
      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
    </form>
  );
}
