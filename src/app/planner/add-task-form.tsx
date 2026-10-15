"use client";

import { useActionState, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PRIORITIES, type Priority } from "@/lib/planner";
import { SUBJECTS, type Subject } from "@/lib/tutormatch";
import { addTask, type TaskFormState } from "./actions";

// "Add a task": a button that opens the form. After a successful add the
// form clears and stays open, so adding several tasks is quick.
export function AddTaskForm({ today }: { today: string }) {
  const [open, setOpen] = useState(false);
  const form = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState<TaskFormState, FormData>(async (prev, formData) => {
    try {
      const result = await addTask(prev, formData);
      if (!result.error) form.current?.reset();
      return result;
    } catch {
      return { error: "We couldn't add the task — check your connection and try again." };
    }
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
      <div className="flex flex-col gap-2">
        <Label htmlFor="task-title">Task</Label>
        <Input id="task-title" name="title" required maxLength={100} placeholder="e.g. Review truth tables" autoFocus />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="task-subject">Subject</Label>
          <Select id="task-subject" name="subject" required defaultValue="">
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
          <Label htmlFor="task-priority">Priority</Label>
          <Select id="task-priority" name="priority" defaultValue="medium">
            {(Object.keys(PRIORITIES) as Priority[]).map((key) => (
              <option key={key} value={key}>
                {PRIORITIES[key]}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="task-date">Due date</Label>
          <Input id="task-date" name="due_date" type="date" required defaultValue={today} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="task-time">Time (optional)</Label>
          <Input id="task-time" name="due_time" type="time" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="task-minutes">Estimated minutes (optional)</Label>
          <Input id="task-minutes" name="estimated_minutes" type="number" inputMode="numeric" min={5} max={600} step={5} placeholder="e.g. 45" />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="task-notes">Notes (optional)</Label>
        <Textarea id="task-notes" name="notes" maxLength={500} rows={2} placeholder="Pages, links, what to focus on…" />
      </div>

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
