"use client";

import { useActionState } from "react";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { messageLearner, type ChatFormState } from "./actions";

export function MessageLearnerButton({ requestId, learnerName }: { requestId: string; learnerName: string }) {
  const [state, formAction, pending] = useActionState<ChatFormState, FormData>(messageLearner, {});

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="request_id" value={requestId} />
      <Button type="submit" variant="outline" size="sm" disabled={pending} className="self-start">
        <MessageCircle className="h-4 w-4" aria-hidden /> {pending ? "Opening…" : `Message ${learnerName}`}
      </Button>
      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
    </form>
  );
}
