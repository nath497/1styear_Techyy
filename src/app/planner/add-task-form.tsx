"use client";

import { useActionState, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { addTask, type TaskFormState } from "./actions";
import { TaskFields } from "./task-fields";
import type { GoalOption } from "@/lib/goals";
import { spaceHref } from "@/lib/learning-space";
import { taskFormValues, type TaskFormValues } from "@/lib/planner";

// "Add a task": a button that opens the form. After a successful add the
// form clears and stays open, so adding several tasks is quick.
// `prefill` (from LearnTrack's "Create study task") opens the form already
// filled in.
export function AddTaskForm({
  today,
  prefill,
  goals,
}: {
  today: string;
  prefill?: TaskFormValues;
  goals?: GoalOption[];
}) {
  const [open, setOpen] = useState(Boolean(prefill));
  const form = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const [state, formAction, pending] = useActionState<TaskFormState, FormData>(async (prev, formData) => {
    let result: TaskFormState;
    try {
      result = await addTask(prev, formData);
    } catch {
      result = { error: "We couldn't add the task — check your connection and try again." };
    }
    if (!result.error) {
      form.current?.reset();
      // Came from "Create study task"? Clear it from the address, so a
      // refresh or Back doesn't open the filled-in form again.
      if (prefill) router.replace(spaceHref("tasks"), { scroll: false });
      return result;
    }
    // React empties a form after every submit, so hand back what was typed
    // and refill the boxes with it.
    return { ...result, values: taskFormValues(formData), attempt: Date.now() };
  }, {});

  if (!open) {
    return (
      <Button type="button" onClick={() => setOpen(true)} className="self-start">
        <Plus className="h-4 w-4" aria-hidden /> Add a task
      </Button>
    );
  }

  return (
    <form ref={form} action={formAction} className="flex flex-col gap-4 rounded-[var(--radius)] border border-border bg-card p-4">
      {/* After an error: what was typed. After a successful add: empty.
          Otherwise: the prefill, if any. A new key re-fills the boxes. */}
      <TaskFields
        key={state.attempt ?? state.saved}
        idPrefix="new-task"
        values={state.values ?? (state.saved ? undefined : prefill)}
        today={today}
        goals={goals}
      />

      {state.error ? (
        <p role="alert" className="rounded-[var(--radius)] bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      ) : state.saved ? (
        <p role="status" className="text-sm text-green-800">
          Task added.
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Adding…" : "Add task"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          Close
        </Button>
      </div>
    </form>
  );
}
