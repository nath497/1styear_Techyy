"use client";

import { useActionState, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { activityFormValues, type ActivityFormValues } from "@/lib/schedule";
import { addActivity, type ActivityFormState } from "./actions";
import { ActivityFields } from "./activity-fields";

type State = ActivityFormState & { values?: ActivityFormValues; attempt?: number };

// "Add an activity": a button that opens the form. After a successful add
// the form clears (keeping the date, since activities often come in a
// batch for one day) and stays open.
export function AddActivityForm({ today }: { today: string }) {
  const [open, setOpen] = useState(false);
  const [lastDate, setLastDate] = useState(today);

  if (!open) {
    return (
      <Button type="button" onClick={() => setOpen(true)} className="self-start">
        <Plus className="h-4 w-4" aria-hidden /> Add a study activity
      </Button>
    );
  }
  // The form is its own component, so closing it throws away its messages
  // and typing — reopening always starts fresh.
  return <OpenForm lastDate={lastDate} onAdded={setLastDate} onClose={() => setOpen(false)} />;
}

function OpenForm({
  lastDate,
  onAdded,
  onClose,
}: {
  lastDate: string;
  onAdded: (date: string) => void;
  onClose: () => void;
}) {
  const [state, formAction, pending] = useActionState<State, FormData>(async (prev, formData) => {
    let result: ActivityFormState;
    try {
      result = await addActivity(prev, formData);
    } catch {
      result = { error: "We couldn't add the activity — check your connection and try again." };
    }
    if (!result.error) {
      onAdded(String(formData.get("activity_date") ?? ""));
      return result;
    }
    // React empties a form after every submit, so refill what was typed.
    return { ...result, values: activityFormValues(formData), attempt: Date.now() };
  }, {});

  return (
    <form action={formAction} className="flex flex-col gap-4 rounded-[var(--radius)] border border-border bg-card p-4">
      {/* Re-mounting the fields (new key) is what puts the values back. */}
      <div key={state.attempt ?? state.saved} className="flex flex-col gap-4">
        <ActivityFields idPrefix="new-activity" values={state.values ?? { activity_date: lastDate }} />
      </div>

      {state.error ? (
        <p role="alert" className="rounded-[var(--radius)] bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      ) : state.saved ? (
        <div role="status" className="flex flex-col gap-1 text-sm">
          <p className="text-green-800">Activity added.{state.note ? ` ${state.note}` : ""}</p>
          {state.warning && <p className="text-amber-800">⚠ {state.warning}</p>}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Adding…" : "Add activity"}
        </Button>
        <Button type="button" variant="ghost" onClick={onClose}>
          Close
        </Button>
      </div>
    </form>
  );
}
