"use client";

import { useActionState, useState } from "react";
import { Clock, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { GoalOption } from "@/lib/goals";
import { formatDue, PRIORITIES, PRIORITY_STYLE, taskFormValues, type StudyTask } from "@/lib/planner";
import { SUBJECTS } from "@/lib/tutormatch";
import { deleteTask, updateTask, type TaskFormState } from "./actions";
import { InProgressBadge } from "./in-progress-badge";
import { TaskDoneButton, TaskStatusButton } from "./task-done-button";
import { TaskFields } from "./task-fields";

// One study task: shown as a card with Start / Mark done / Edit / Delete,
// or as an edit form.
export function TaskItem({ task, today, goals = [] }: { task: StudyTask; today: string; goals?: GoalOption[] }) {
  const [editing, setEditing] = useState(false);
  const done = task.status === "done";

  const [deleteState, deleteAction, deleting] = useActionState<TaskFormState, FormData>(async (prev, formData) => {
    try {
      return await deleteTask(prev, formData);
    } catch {
      return { error: "Couldn't delete — check your connection." };
    }
  }, {});

  // The edit form is its own component, so Cancel throws away a failed
  // attempt — the next Edit always starts from the saved task.
  if (editing) return <EditTaskForm task={task} today={today} goals={goals} onDone={() => setEditing(false)} />;
  const goal = goals.find((g) => g.id === task.goal_id);

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 pt-4 pb-4 text-sm sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-col gap-1">
          <p className={`font-medium break-words ${done ? "text-muted-foreground line-through" : ""}`}>
            {task.status === "in_progress" && <InProgressBadge />}
            {task.title}
          </p>
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-muted-foreground">
            <span>{SUBJECTS[task.subject]}</span>
            <span aria-hidden>·</span>
            <span>{formatDue(task.due_date, task.due_time)}</span>
            {task.estimated_minutes && (
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" aria-hidden /> {task.estimated_minutes} min
              </span>
            )}
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_STYLE[task.priority]}`}>
              {PRIORITIES[task.priority]}
            </span>
          </p>
          {goal && <p className="text-xs text-primary">Goal: {goal.title}</p>}
          {task.notes && <p className="whitespace-pre-line break-words text-muted-foreground">{task.notes}</p>}
          {deleteState.error && (
            <p role="alert" className="text-xs text-destructive">
              {deleteState.error}
            </p>
          )}
        </div>

        <div className="flex shrink-0 flex-wrap items-start gap-1 sm:justify-end">
          {task.status === "todo" && (
            <TaskStatusButton
              taskId={task.id}
              to="in_progress"
              label="Start"
              ariaLabel={`Start "${task.title}" (mark it In Progress)`}
              variant="ghost"
            />
          )}
          {task.status === "in_progress" && (
            <TaskStatusButton
              taskId={task.id}
              to="todo"
              label="Not started"
              ariaLabel={`Move "${task.title}" back to To Do`}
              variant="ghost"
            />
          )}
          <TaskDoneButton taskId={task.id} title={task.title} done={done} />
          <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(true)} aria-label={`Edit ${task.title}`}>
            <Pencil className="h-4 w-4" aria-hidden />
            <span className="sm:sr-only">Edit</span>
          </Button>
          <form action={deleteAction}>
            <input type="hidden" name="task_id" value={task.id} />
            <Button
              type="submit"
              size="sm"
              variant="ghost"
              disabled={deleting}
              aria-label={`Delete ${task.title}`}
              className="text-destructive hover:bg-destructive/10"
              // Deleting can't be undone, so ask first.
              onClick={(e) => {
                if (!window.confirm(`Delete "${task.title}"? This can't be undone.`)) e.preventDefault();
              }}
            >
              <Trash2 className="h-4 w-4" aria-hidden />
              <span className="sm:sr-only">{deleting ? "Deleting…" : "Delete"}</span>
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}

function EditTaskForm({
  task,
  today,
  goals,
  onDone,
}: {
  task: StudyTask;
  today: string;
  goals: GoalOption[];
  onDone: () => void;
}) {
  const [state, formAction, saving] = useActionState<TaskFormState, FormData>(async (prev, formData) => {
    let result: TaskFormState;
    try {
      result = await updateTask(prev, formData);
    } catch {
      result = { error: "We couldn't save your changes — check your connection and try again." };
    }
    if (!result.error) {
      onDone();
      return result;
    }
    // React empties a form after every submit, so hand back what was typed.
    return { ...result, values: taskFormValues(formData), attempt: Date.now() };
  }, {});

  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="task_id" value={task.id} />
          <TaskFields
            key={state.attempt}
            idPrefix={`edit-${task.id}`}
            task={task}
            values={state.values}
            today={today}
            goals={goals}
          />
          {state.error && (
            <p role="alert" className="rounded-[var(--radius)] bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {state.error}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </Button>
            <Button type="button" variant="ghost" onClick={onDone}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
