"use client";

import { Fragment, useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formValues } from "@/lib/form-values";
import { LEVELS, SUBJECTS, type Level, type Subject } from "@/lib/tutormatch";
import { postHelpRequest, type HelpFormState } from "../actions";

const FIELDS = ["title", "details", "subject", "level", "budget", "mode", "preferred_time"] as const;
type PostState = HelpFormState & { values?: Partial<Record<(typeof FIELDS)[number], string>>; attempt?: number };

export function PostHelpRequestForm({ defaultLevel }: { defaultLevel: string }) {
  const [state, formAction, pending] = useActionState<PostState, FormData>(async (prev, formData) => {
    // No try/catch here: on success postHelpRequest redirects, and catching would block that.
    const result = await postHelpRequest(prev, formData);
    if (!result.error) return result;
    // React empties a form after every submit, so hand back what was typed
    // and refill the boxes with it.
    return { ...result, values: formValues(formData, FIELDS), attempt: Date.now() };
  }, {});
  const values = state.values ?? {};

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {/* A new `key` after an error re-creates the boxes, so they pick up the refilled values. */}
      <Fragment key={state.attempt}>
        <div className="flex flex-col gap-2">
          <Label htmlFor="title">Title</Label>
          <Input id="title" name="title" required maxLength={100} placeholder="e.g. Need help with truth tables"
            defaultValue={values.title ?? ""}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="details">What do you need help with?</Label>
          <Textarea
            id="details"
            name="details"
            required
            maxLength={1000}
            placeholder="What topic, what you've tried, and what you're stuck on."
            defaultValue={values.details ?? ""}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="subject">Subject</Label>
            <Select id="subject" name="subject" required defaultValue={values.subject ?? ""}>
              <option value="" disabled>
                Choose a subject
              </option>
              {(Object.keys(SUBJECTS) as Subject[]).map((key) => (
                <option key={key} value={key}>
                  {SUBJECTS[key]}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="level">Level</Label>
            <Select id="level" name="level" required defaultValue={values.level ?? defaultLevel}>
              <option value="" disabled>
                Choose your level
              </option>
              {(Object.keys(LEVELS) as Level[]).map((key) => (
                <option key={key} value={key}>
                  {LEVELS[key]}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="budget">Budget per session (₱)</Label>
            <Input
              id="budget"
              name="budget"
              type="number"
              inputMode="decimal"
              min="1"
              max="100000"
              step="0.01"
              required
              placeholder="e.g. 100"
              defaultValue={values.budget ?? ""}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="mode">Mode</Label>
            <Select id="mode" name="mode" required defaultValue={values.mode ?? ""}>
              <option value="" disabled>
                Online or face-to-face
              </option>
              <option value="online">Online</option>
              <option value="face_to_face">Face-to-face</option>
            </Select>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="preferred_time">Preferred days or times (optional)</Label>
          <Input id="preferred_time" name="preferred_time" maxLength={200} placeholder="e.g. Weekdays after 4pm"
            defaultValue={values.preferred_time ?? ""}
          />
        </div>
      </Fragment>

      {state.error && (
        <p role="alert" className="rounded-[var(--radius)] bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={pending} size="lg">
        {pending ? "Posting…" : "Post my request"}
      </Button>
    </form>
  );
}
