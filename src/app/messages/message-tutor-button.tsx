"use client";

import { useActionState } from "react";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { messageTutor, type ChatFormState } from "./actions";

export function MessageTutorButton({ tutorId, tutorName }: { tutorId: string; tutorName: string }) {
  const [state, formAction, pending] = useActionState<ChatFormState, FormData>(messageTutor, {});

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="tutor_id" value={tutorId} />
      <Button type="submit" variant="outline" disabled={pending} className="w-full">
        <MessageCircle className="h-4 w-4" aria-hidden /> {pending ? "Opening…" : `Message ${tutorName}`}
      </Button>
      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
    </form>
  );
}
