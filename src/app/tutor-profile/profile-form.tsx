"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LEVELS, MODES, SUBJECTS, type Level, type Mode, type Subject } from "@/lib/tutormatch";
import { saveTutorProfile, type ProfileFormState } from "./actions";

const choice =
  "flex cursor-pointer items-center gap-2 rounded-[var(--radius)] border border-input bg-card px-3 py-2.5 text-sm has-[:checked]:border-primary has-[:checked]:bg-secondary has-[:checked]:text-secondary-foreground";

export type ExistingProfile = {
  bio: string;
  subjects: Subject[];
  levels: Level[];
  rate_centavos: number;
  mode: Mode;
  availability: string;
};

export function ProfileForm({ existing }: { existing: ExistingProfile | null }) {
  const [state, formAction, pending] = useActionState<ProfileFormState, FormData>(saveTutorProfile, {});

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium">Subjects I teach</legend>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(SUBJECTS).map(([value, label]) => (
            <label key={value} className={choice}>
              <input
                type="checkbox"
                name="subjects"
                value={value}
                defaultChecked={existing?.subjects.includes(value as Subject)}
                className="accent-primary"
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium">Levels I teach</legend>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(LEVELS).map(([value, label]) => (
            <label key={value} className={choice}>
              <input
                type="checkbox"
                name="levels"
                value={value}
                defaultChecked={existing?.levels.includes(value as Level)}
                className="accent-primary"
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-col gap-2">
        <Label htmlFor="rate">Rate per session (₱)</Label>
        <Input
          id="rate"
          name="rate"
          inputMode="decimal"
          required
          placeholder="e.g. 100"
          defaultValue={existing ? String(existing.rate_centavos / 100) : ""}
        />
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium">Mode</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {Object.entries(MODES).map(([value, label]) => (
            <label key={value} className={choice}>
              <input
                type="radio"
                name="mode"
                value={value}
                required
                defaultChecked={(existing?.mode ?? "both") === value}
                className="accent-primary"
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-col gap-2">
        <Label htmlFor="availability">Availability</Label>
        <Input
          id="availability"
          name="availability"
          maxLength={200}
          placeholder="e.g. Weekdays after 4pm"
          defaultValue={existing?.availability ?? ""}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="bio">About me</Label>
        <Textarea
          id="bio"
          name="bio"
          maxLength={1000}
          placeholder="What you're good at, and how you like to explain things."
          defaultValue={existing?.bio ?? ""}
        />
      </div>

      {state.error && (
        <p role="alert" className="rounded-[var(--radius)] bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}
      {state.message && (
        <p role="status" className="rounded-[var(--radius)] bg-success/10 px-3 py-2 text-sm text-green-800">
          {state.message}
        </p>
      )}

      <Button type="submit" disabled={pending} size="lg">
        {pending ? "Saving…" : existing ? "Save changes" : "Create my tutor profile"}
      </Button>
    </form>
  );
}
