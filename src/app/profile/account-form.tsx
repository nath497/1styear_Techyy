"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formValues } from "@/lib/form-values";
import { LEVELS, type Level } from "@/lib/tutormatch";
import { saveAccount, type AccountFormState } from "./actions";

type State = AccountFormState & { values?: { display_name?: string; level?: string }; attempt?: number };

// Name and level — the two things anyone can change about their account.
export function AccountForm({ name, level }: { name: string; level: Level }) {
  const [state, formAction, pending] = useActionState<State, FormData>(async (prev, formData) => {
    let result: AccountFormState;
    try {
      result = await saveAccount(prev, formData);
    } catch {
      result = { error: "We couldn't save — check your connection and try again." };
    }
    if (!result.error) return result;
    // React empties a form after every submit, so refill what was typed.
    return { ...result, values: formValues(formData, ["display_name", "level"]), attempt: Date.now() };
  }, {});

  const shownName = state.values?.display_name ?? name;
  const shownLevel = state.values?.level ?? level;

  return (
    <form action={formAction} className="flex flex-col gap-4" key={state.attempt ?? state.saved}>
      <div className="flex flex-col gap-2">
        <Label htmlFor="display_name">Display name</Label>
        <Input id="display_name" name="display_name" required maxLength={80} defaultValue={shownName} />
        <p className="text-xs text-muted-foreground">This is the name tutors and learners see.</p>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium">Level</legend>
        <div className="flex flex-wrap gap-4">
          {(Object.keys(LEVELS) as Level[]).map((key) => (
            <label key={key} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="level"
                value={key}
                defaultChecked={shownLevel === key}
                className="accent-primary"
              />
              {LEVELS[key]}
            </label>
          ))}
        </div>
      </fieldset>

      {state.error ? (
        <p role="alert" className="rounded-[var(--radius)] bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      ) : state.saved ? (
        <p role="status" className="text-sm text-green-800">
          Saved.
        </p>
      ) : null}

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Saving…" : "Save"}
      </Button>
    </form>
  );
}
