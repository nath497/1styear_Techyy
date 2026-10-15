"use client";

import { Fragment, useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signUp, type AuthFormState } from "@/app/auth-actions";
import { formValues } from "@/lib/form-values";
import { LEVELS } from "@/lib/tutormatch";

const choice =
  "flex cursor-pointer items-center gap-2 rounded-[var(--radius)] border border-input bg-card px-3 py-2.5 text-sm has-[:checked]:border-primary has-[:checked]:bg-secondary has-[:checked]:text-secondary-foreground";

// Everything except the password, which is never sent back to the browser.
const FIELDS = ["role", "level", "display_name", "email"] as const;
type SignupState = AuthFormState & { values?: Partial<Record<(typeof FIELDS)[number], string>>; attempt?: number };

export function SignupForm({ defaultRole, next }: { defaultRole: string; next: string }) {
  const [state, formAction, pending] = useActionState<SignupState, FormData>(async (prev, formData) => {
    // No try/catch here: on success signUp redirects, and catching would block that.
    const result = await signUp(prev, formData);
    if (!result.error) return result;
    // React empties a form after every submit, so hand back what was typed
    // (not the password) and refill the boxes with it.
    return { ...result, values: formValues(formData, FIELDS), attempt: Date.now() };
  }, {});
  const values = state.values ?? {};
  const role = values.role ?? defaultRole;

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next} />

      {/* A new `key` after an error re-creates these boxes, so they pick up the refilled values. */}
      <Fragment key={state.attempt}>
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-sm font-medium">I am a…</legend>
          <div className="grid grid-cols-2 gap-2">
            <label className={choice}>
              <input type="radio" name="role" value="learner" defaultChecked={role !== "tutor"} className="accent-primary" />
              Learner
            </label>
            <label className={choice}>
              <input type="radio" name="role" value="tutor" defaultChecked={role === "tutor"} className="accent-primary" />
              Tutor
            </label>
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-sm font-medium">My level</legend>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(LEVELS).map(([value, label], i) => (
              <label key={value} className={choice}>
                <input type="radio" name="level" value={value} defaultChecked={values.level ? values.level === value : i === 0} className="accent-primary" />
                {label}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="flex flex-col gap-2">
          <Label htmlFor="display_name">Display name</Label>
          <Input id="display_name" name="display_name" required maxLength={80} autoComplete="name" defaultValue={values.display_name ?? ""} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required autoComplete="email" defaultValue={values.email ?? ""} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" name="password" type="password" required minLength={6} autoComplete="new-password" />
          <p className="text-xs text-muted-foreground">At least 6 characters.</p>
        </div>
      </Fragment>

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
        {pending ? "Creating your account…" : "Create account"}
      </Button>
    </form>
  );
}
