"use client";

import { useActionState } from "react";
import { Check, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { setTaskStatus, type TaskFormState } from "./actions";

// One tap: "Mark done" on a to-do task, "Undo" on a done one. The task's
// title goes in the label, so screen readers can tell the buttons apart.
export function TaskDoneButton({ taskId, title, done }: { taskId: string; title: string; done: boolean }) {
  const [state, formAction, pending] = useActionState<TaskFormState, FormData>(async (prev, formData) => {
    try {
      return await setTaskStatus(prev, formData);
    } catch {
      return { error: "Couldn't update — check your connection." };
    }
  }, {});

  return (
    <form action={formAction} className="flex flex-col items-end gap-1">
      <input type="hidden" name="task_id" value={taskId} />
      <input type="hidden" name="status" value={done ? "todo" : "done"} />
      <Button
        type="submit"
        size="sm"
        variant={done ? "ghost" : "outline"}
        disabled={pending}
        aria-label={done ? `Undo: move "${title}" back to to do` : `Mark "${title}" done`}
      >
        {done ? <Undo2 className="h-4 w-4" aria-hidden /> : <Check className="h-4 w-4" aria-hidden />}
        {pending ? "Saving…" : done ? "Undo" : "Mark done"}
      </Button>
      {state.error && (
        <p role="alert" className="text-xs text-destructive">
          {state.error}
        </p>
      )}
    </form>
  );
}
