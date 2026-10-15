"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Check, Pencil, Trash2, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { spaceHref } from "@/lib/learning-space";
import { formatTargetDate, goalFormValues, type GoalFormValues, type LearningGoal } from "@/lib/goals";
import { deleteGoal, setGoalStatus, updateGoal, type GoalFormState } from "./actions";
import { GoalFields } from "./goal-fields";

type Progress = { done: number; total: number; percent: number | null };
type EditState = GoalFormState & { values?: GoalFormValues; attempt?: number };

// One goal: its progress from linked tasks, Mark achieved / Undo, Edit and
// Delete — or an edit form.
export function GoalItem({ goal, progress, today }: { goal: LearningGoal; progress: Progress; today: string }) {
  const [editing, setEditing] = useState(false);
  const run = (action: typeof deleteGoal, failure: string) => async (prev: GoalFormState, formData: FormData) => {
    try {
      return await action(prev, formData);
    } catch {
      return { error: failure };
    }
  };
  const [statusState, statusAction, statusPending] = useActionState<GoalFormState, FormData>(
    run(setGoalStatus, "Couldn't update — check your connection."),
    {},
  );
  const [deleteState, deleteAction, deleting] = useActionState<GoalFormState, FormData>(
    run(deleteGoal, "Couldn't delete — check your connection."),
    {},
  );

  if (editing) return <EditGoalForm goal={goal} onDone={() => setEditing(false)} />;

  const achieved = goal.status === "achieved";
  const overdue = !achieved && goal.target_date < today;
  const error = statusState.error ?? deleteState.error;

  return (
    <Card className={achieved ? "border-green-300 bg-green-50/50" : undefined}>
      <CardContent className="flex flex-col gap-3 pt-4 pb-4 text-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 flex-col gap-1">
            <p className="font-medium break-words">
              {achieved && (
                <span className="mr-2 inline-block rounded-full bg-green-100 px-2 py-0.5 align-middle text-xs font-medium text-green-900">
                  Achieved
                </span>
              )}
              {goal.title}
            </p>
            <p className={overdue ? "text-destructive" : "text-muted-foreground"}>
              {overdue ? "Past its target date · " : "Target: "}
              {formatTargetDate(goal.target_date)}
            </p>
            {goal.description && (
              <p className="whitespace-pre-line break-words text-muted-foreground">{goal.description}</p>
            )}
          </div>

          <div className="flex shrink-0 flex-wrap gap-1 sm:justify-end">
            <form action={statusAction}>
              <input type="hidden" name="goal_id" value={goal.id} />
              <input type="hidden" name="status" value={achieved ? "active" : "achieved"} />
              <Button
                type="submit"
                size="sm"
                variant={achieved ? "ghost" : "outline"}
                disabled={statusPending}
                aria-label={achieved ? `Undo: mark "${goal.title}" active again` : `Mark "${goal.title}" achieved`}
              >
                {achieved ? <Undo2 className="h-4 w-4" aria-hidden /> : <Check className="h-4 w-4" aria-hidden />}
                {statusPending ? "Saving…" : achieved ? "Undo" : "Mark achieved"}
              </Button>
            </form>
            <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(true)} aria-label={`Edit ${goal.title}`}>
              <Pencil className="h-4 w-4" aria-hidden />
              <span className="sm:sr-only">Edit</span>
            </Button>
            <form action={deleteAction}>
              <input type="hidden" name="goal_id" value={goal.id} />
              <Button
                type="submit"
                size="sm"
                variant="ghost"
                disabled={deleting}
                aria-label={`Delete ${goal.title}`}
                className="text-destructive hover:bg-destructive/10"
                onClick={(e) => {
                  if (!window.confirm(`Delete "${goal.title}"? Its tasks are kept, just no longer linked.`))
                    e.preventDefault();
                }}
              >
                <Trash2 className="h-4 w-4" aria-hidden />
                <span className="sm:sr-only">{deleting ? "Deleting…" : "Delete"}</span>
              </Button>
            </form>
          </div>
        </div>

        {/* Progress: completed linked tasks out of all linked tasks. */}
        {progress.total === 0 ? (
          <p className="text-muted-foreground">
            <Link href={spaceHref("tasks")} className="font-medium text-primary hover:underline">
              Link study tasks
            </Link>{" "}
            to track progress.
          </p>
        ) : (
          <div className="flex flex-col gap-1.5">
            <p className="text-muted-foreground">
              {progress.done} of {progress.total} linked {progress.total === 1 ? "task" : "tasks"} completed
            </p>
            <div
              role="progressbar"
              aria-label={`${goal.title} progress`}
              aria-valuemin={0}
              aria-valuemax={progress.total}
              aria-valuenow={progress.done}
              aria-valuetext={`${progress.done} of ${progress.total} linked tasks completed`}
              className="h-2 overflow-hidden rounded-full bg-muted"
            >
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress.percent}%` }} />
            </div>
            {!achieved && progress.done === progress.total && (
              <p className="text-xs text-green-800">All linked tasks done — tap Mark achieved when you&apos;re ready.</p>
            )}
          </div>
        )}

        {error && (
          <p role="alert" className="text-xs text-destructive">
            {error}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function EditGoalForm({ goal, onDone }: { goal: LearningGoal; onDone: () => void }) {
  const [state, formAction, saving] = useActionState<EditState, FormData>(async (prev, formData) => {
    let result: GoalFormState;
    try {
      result = await updateGoal(prev, formData);
    } catch {
      result = { error: "We couldn't save your changes — check your connection and try again." };
    }
    if (!result.error) {
      onDone();
      return result;
    }
    return { ...result, values: goalFormValues(formData), attempt: Date.now() };
  }, {});

  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="goal_id" value={goal.id} />
          <div key={state.attempt} className="flex flex-col gap-4">
            <GoalFields idPrefix={`edit-${goal.id}`} values={state.values ?? goal} />
          </div>
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
