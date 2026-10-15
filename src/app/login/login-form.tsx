"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { logIn, type AuthFormState } from "@/app/auth-actions";
import { formValues } from "@/lib/form-values";

type LoginState = AuthFormState & { values?: { email?: string }; attempt?: number };

export function LoginForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(async (prev, formData) => {
    // No try/catch here: on success logIn redirects, and catching would block that.
    const result = await logIn(prev, formData);
    if (!result.error) return result;
    // React empties a form after every submit, so keep the email (never the
    // password) and refill it.
    return { ...result, values: formValues(formData, ["email"]), attempt: Date.now() };
  }, {});

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next} />
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          key={state.attempt}
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          defaultValue={state.values?.email ?? ""}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" required autoComplete="current-password" />
      </div>

      {state.error && (
        <p role="alert" className="rounded-[var(--radius)] bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={pending} size="lg">
        {pending ? "Logging in…" : "Log in"}
      </Button>
    </form>
  );
}
