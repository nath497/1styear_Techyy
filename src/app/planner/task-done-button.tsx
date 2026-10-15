"use client";

import { useActionState } from "react";
import { Check, Play, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TaskStatus } from "@/lib/planner";
import { setTaskStatus, type TaskFormState } from "./actions";

// One tap that moves a task to another status. `ariaLabel` includes the
// task's title, so screen readers can tell the buttons apart.
export function TaskStatusButton({
  taskId,
  to,
  label,
  ariaLabel,
  variant = "outline",
}: {
  taskId: string;
  to: TaskStatus;
  label: string;
  ariaLabel: string;
  variant?: "outline" | "ghost";
}) {
  const [state, formAction, pending] = useActionState<TaskFormState, FormData>(async (prev, formData) => {
    try {
      return await setTaskStatus(prev, formData);
    } catch {
      return { error: "Couldn't update — check your connection." };
    }
  }, {});
  const Icon = to === "done" ? Check : to === "in_progress" ? Play : Undo2;

  return (
    <form action={formAction} className="flex flex-col items-end gap-1">
      <input type="hidden" name="task_id" value={taskId} />
      <input type="hidden" name="status" value={to} />
      <Button type="submit" size="sm" variant={variant} disabled={pending} aria-label={ariaLabel}>
        <Icon className="h-4 w-4" aria-hidden />
        {pending ? "Saving…" : label}
      </Button>
      {state.error && (
        <p role="alert" className="text-xs text-destructive">
          {state.error}
        </p>
      )}
    </form>
  );
}

// "Mark done" on an unfinished task, "Undo" (back to To Do) on a done one.
export function TaskDoneButton({ taskId, title, done }: { taskId: string; title: string; done: boolean }) {
  return done ? (
    <TaskStatusButton
      taskId={taskId}
      to="todo"
      label="Undo"
      ariaLabel={`Undo: move "${title}" back to To Do`}
      variant="ghost"
    />
  ) : (
    <TaskStatusButton taskId={taskId} to="done" label="Mark done" ariaLabel={`Mark "${title}" done`} />
  );
}
