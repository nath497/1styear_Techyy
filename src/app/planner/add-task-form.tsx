"use client";

import { useActionState, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { addTask, type TaskFormState } from "./actions";
import { TaskFields } from "./task-fields";
import { taskFormValues } from "@/lib/planner";

// "Add a task": a button that opens the form. After a successful add the
// form clears and stays open, so adding several tasks is quick.
export function AddTaskForm({ today }: { today: string }) {
  const [open, setOpen] = useState(false);
  const form = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState<TaskFormState, FormData>(async (prev, formData) => {
    let result: TaskFormState;
    try {
      result = await addTask(prev, formData);
    } catch {
      result = { error: "We couldn't add the task — check your connection and try again." };
    }
    if (!result.error) {
      form.current?.reset();
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
      <TaskFields key={state.attempt} idPrefix="new-task" values={state.values} today={today} />

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
