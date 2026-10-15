"use client";

import { useActionState, useState } from "react";
import { Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formValues } from "@/lib/form-values";
import { saveMeetingLink, type LinkFormState } from "./actions";

type MeetingLinkState = LinkFormState & { values?: { meeting_link?: string }; attempt?: number };

// The tutor's video call link box on an Accepted session: add a link, or
// change / remove the saved one.
export function MeetingLinkForm({ bookingId, current }: { bookingId: string; current: string | null }) {
  const [editing, setEditing] = useState(!current);
  const [state, formAction, pending] = useActionState<MeetingLinkState, FormData>(async (prev, formData) => {
    let result: LinkFormState;
    try {
      result = await saveMeetingLink(prev, formData);
    } catch {
      const from = formData.get("intent") === "remove" ? "remove" : "save";
      result = { error: "We couldn't save the link — check your connection and try again.", from };
    }
    if (!result.error) {
      setEditing(false);
      return result;
    }
    // React empties a form after every submit, so hand back the link that
    // was typed and refill the box with it.
    return { ...result, values: formValues(formData, ["meeting_link"]), attempt: Date.now() };
  }, {});

  if (current && !editing) {
    return (
      <div className="flex flex-col gap-2 rounded-[var(--radius)] bg-secondary/60 px-3 py-2">
        <p className="flex items-center gap-2 text-secondary-foreground">
          <Video className="h-4 w-4 shrink-0" aria-hidden />
          <span className="min-w-0 truncate">{current}</span>
        </p>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="outline" onClick={() => setEditing(true)}>
            Change
          </Button>
          <form action={formAction}>
            <input type="hidden" name="booking_id" value={bookingId} />
            <input type="hidden" name="meeting_link" value="" />
            <input type="hidden" name="intent" value="remove" />
            <Button type="submit" size="sm" variant="ghost" disabled={pending}>
              {pending ? "Removing…" : "Remove"}
            </Button>
          </form>
        </div>
        {state.error && state.from === "remove" && (
          <p role="alert" className="text-sm text-destructive">
            {state.error}
          </p>
        )}
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="booking_id" value={bookingId} />
      <input type="hidden" name="intent" value="save" />
      <Label htmlFor={`link-${bookingId}`}>Video call link (for online sessions)</Label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          // A new `key` after an error re-creates the box, so it picks up the refilled link.
          key={state.attempt}
          id={`link-${bookingId}`}
          name="meeting_link"
          // A plain text box (not type="url"), so our own clear message
          // shows instead of the browser's generic "Please enter a URL".
          type="text"
          inputMode="url"
          autoComplete="off"
          spellCheck={false}
          maxLength={300}
          required
          defaultValue={state.values?.meeting_link ?? current ?? ""}
          placeholder="https://meet.google.com/abc-defg-hij"
          className="flex-1"
        />
        <div className="flex gap-2">
          <Button type="submit" size="sm" disabled={pending} className="h-10">
            {pending ? "Saving…" : "Save"}
          </Button>
          {current && (
            <Button type="button" size="sm" variant="ghost" className="h-10" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          )}
        </div>
      </div>
      {state.error && state.from === "save" ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">Google Meet, Zoom, Microsoft Teams or Jitsi. Face-to-face? Leave it empty.</p>
      )}
    </form>
  );
}
