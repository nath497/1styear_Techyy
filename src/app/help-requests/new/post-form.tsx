"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { LEVELS, SUBJECTS, type Level, type Subject } from "@/lib/tutormatch";
import { postHelpRequest, type HelpFormState } from "../actions";

export function PostHelpRequestForm({ defaultLevel }: { defaultLevel: string }) {
  const [state, formAction, pending] = useActionState<HelpFormState, FormData>(postHelpRequest, {});

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" required maxLength={100} placeholder="e.g. Need help with truth tables" />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="details">What do you need help with?</Label>
        <Textarea
          id="details"
          name="details"
          required
          maxLength={1000}
          placeholder="What topic, what you've tried, and what you're stuck on."
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="subject">Subject</Label>
          <Select id="subject" name="subject" required defaultValue="">
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
          <Select id="level" name="level" required defaultValue={defaultLevel}>
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
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="mode">Mode</Label>
          <Select id="mode" name="mode" required defaultValue="">
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
        <Input id="preferred_time" name="preferred_time" maxLength={200} placeholder="e.g. Weekdays after 4pm" />
      </div>

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
