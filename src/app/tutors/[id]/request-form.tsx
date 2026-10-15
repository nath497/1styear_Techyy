"use client";

import { Fragment, useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { formValues } from "@/lib/form-values";
import { SUBJECTS, type Subject } from "@/lib/tutormatch";
import { requestSession, type RequestFormState } from "./actions";

const FIELDS = ["subject", "topic", "starts_at"] as const;
type RequestState = RequestFormState & { values?: Partial<Record<(typeof FIELDS)[number], string>>; attempt?: number };

export function RequestForm({
  tutorId,
  subjects,
  priceLabel,
}: {
  tutorId: string;
  subjects: Subject[];
  priceLabel: string;
}) {
  const [state, formAction, pending] = useActionState<RequestState, FormData>(async (prev, formData) => {
    // No try/catch here: on success requestSession redirects, and catching would block that.
    const result = await requestSession(prev, formData);
    if (!result.error) return result;
    // React empties a form after every submit, so hand back what was typed
    // and refill the boxes with it.
    return { ...result, values: formValues(formData, FIELDS), attempt: Date.now() };
  }, {});
  const values = state.values ?? {};

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="tutor_id" value={tutorId} />

      {/* A new `key` after an error re-creates the boxes, so they pick up the refilled values. */}
      <Fragment key={state.attempt}>

        <div className="flex flex-col gap-2">
          <Label htmlFor="subject">Subject</Label>
          <Select id="subject" name="subject" required defaultValue={values.subject ?? (subjects.length === 1 ? subjects[0] : "")}>
            <option value="" disabled>
              Choose a subject
            </option>
            {subjects.map((key) => (
              <option key={key} value={key}>
                {SUBJECTS[key]}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="topic">Topic</Label>
          <Input id="topic" name="topic" required maxLength={200} placeholder="e.g. Logic and truth tables"
            defaultValue={values.topic ?? ""}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="starts_at">Date and time</Label>
          <Input id="starts_at" name="starts_at" type="datetime-local" required defaultValue={values.starts_at ?? ""} />
          <p className="text-xs text-muted-foreground">Philippine time.</p>
        </div>
      </Fragment>

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
