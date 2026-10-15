"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { cancelHelpRequest, type HelpFormState } from "./actions";

export function CancelHelpRequestButton({ requestId }: { requestId: string }) {
  const [state, formAction, pending] = useActionState<HelpFormState, FormData>(cancelHelpRequest, {});

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="request_id" value={requestId} />
      <Button
        type="submit"
        size="sm"
        variant="outline"
        disabled={pending}
        className="self-start"
        // Cancelling can't be undone, so ask first.
        onClick={(e) => {
          if (!window.confirm("Cancel this help request? This can't be undone.")) e.preventDefault();
        }}
      >
        {pending ? "Cancelling…" : "Cancel request"}
      </Button>
      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
    </form>
  );
}
