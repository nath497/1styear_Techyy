"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SUBJECTS, type Subject } from "@/lib/tutormatch";
import { requestSession, type RequestFormState } from "./actions";

const select =
  "flex h-10 w-full rounded-[var(--radius)] border border-input bg-background px-3 py-2 text-base md:text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

export function RequestForm({
  tutorId,
  subjects,
  priceLabel,
}: {
  tutorId: string;
  subjects: Subject[];
  priceLabel: string;
}) {
  const [state, formAction, pending] = useActionState<RequestFormState, FormData>(requestSession, {});

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="tutor_id" value={tutorId} />

      <div className="flex flex-col gap-2">
        <Label htmlFor="subject">Subject</Label>
        <select id="subject" name="subject" required defaultValue={subjects.length === 1 ? subjects[0] : ""} className={select}>
          <option value="" disabled>
            Choose a subject
          </option>
          {subjects.map((key) => (
            <option key={key} value={key}>
              {SUBJECTS[key]}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="topic">Topic</Label>
        <Input id="topic" name="topic" required maxLength={200} placeholder="e.g. Logic and truth tables" />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="starts_at">Date and time</Label>
        <Input id="starts_at" name="starts_at" type="datetime-local" required />
        <p className="text-xs text-muted-foreground">Philippine time.</p>
      </div>

      {state.error && (
        <p role="alert" className="rounded-[var(--radius)] bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={pending} size="lg">
        {pending ? "Sending…" : `Send request · ${priceLabel}`}
      </Button>
    </form>
  );
}
