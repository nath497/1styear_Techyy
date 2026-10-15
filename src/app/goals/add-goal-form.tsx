"use client";

import { useActionState, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { goalFormValues, type GoalFormValues } from "@/lib/goals";
import { addGoal, type GoalFormState } from "./actions";
import { GoalFields } from "./goal-fields";

type State = GoalFormState & { values?: GoalFormValues; attempt?: number };

// "Add a goal": a button that opens the form.
export function AddGoalForm() {
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <Button type="button" onClick={() => setOpen(true)} className="self-start">
        <Plus className="h-4 w-4" aria-hidden /> Add a goal
      </Button>
    );
  }
  // Its own component, so closing it throws away messages and typing.
  return <OpenForm onClose={() => setOpen(false)} />;
}

function OpenForm({ onClose }: { onClose: () => void }) {
  const [state, formAction, pending] = useActionState<State, FormData>(async (prev, formData) => {
    let result: GoalFormState;
    try {
      result = await addGoal(prev, formData);
    } catch {
      result = { error: "We couldn't add the goal — check your connection and try again." };
    }
    if (!result.error) return result;
    // React empties a form after every submit, so refill what was typed.
    return { ...result, values: goalFormValues(formData), attempt: Date.now() };
  }, {});

  return (
    <form action={formAction} className="flex flex-col gap-4 rounded-[var(--radius)] border border-border bg-card p-4">
      <div key={state.attempt ?? state.saved} className="flex flex-col gap-4">
        <GoalFields idPrefix="new-goal" values={state.values ?? {}} />
      </div>

      {state.error ? (
        <p role="alert" className="rounded-[var(--radius)] bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      ) : state.saved ? (
        <p role="status" className="text-sm text-green-800">
          Goal added. Now link study tasks to it from Study Tasks.
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Adding…" : "Add goal"}
        </Button>
        <Button type="button" variant="ghost" onClick={onClose}>
          Close
        </Button>
      </div>
    </form>
  );
}
