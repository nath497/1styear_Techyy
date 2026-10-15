"use client";

import { useActionState, useState } from "react";
import { AlertTriangle, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { activityFormValues, formatTimeRange, type ActivityFormValues, type StudyActivity } from "@/lib/schedule";
import { SUBJECTS } from "@/lib/tutormatch";
import { deleteActivity, updateActivity, type ActivityFormState } from "./actions";
import { ActivityFields } from "./activity-fields";

type EditState = ActivityFormState & { values?: ActivityFormValues; attempt?: number };

// One study activity: a card with Edit and Delete, or an edit form.
// `sessionClash` shows a warning when it overlaps a tutoring session.
export function ActivityItem({ activity, sessionClash }: { activity: StudyActivity; sessionClash: boolean }) {
  const [editing, setEditing] = useState(false);
  const [deleteState, deleteAction, deleting] = useActionState<ActivityFormState, FormData>(async (prev, formData) => {
    try {
      return await deleteActivity(prev, formData);
    } catch {
      return { error: "Couldn't delete — check your connection." };
    }
  }, {});

  // The edit form is its own component, so Cancel throws away a failed
  // attempt — the next Edit always starts from the saved activity.
  if (editing) return <EditActivityForm activity={activity} onDone={() => setEditing(false)} />;

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 pt-4 pb-4 text-sm sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-col gap-1">
          <p className="font-medium break-words">{activity.title}</p>
          <p className="text-muted-foreground">
            {formatTimeRange(activity.start_time, activity.end_time)} · {SUBJECTS[activity.subject]}
          </p>
          {activity.notes && <p className="whitespace-pre-line break-words text-muted-foreground">{activity.notes}</p>}
          {sessionClash && (
            <p className="flex items-center gap-1 text-xs text-amber-800">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden />
              Overlaps a tutoring session.
            </p>
          )}
          {deleteState.error && (
            <p role="alert" className="text-xs text-destructive">
              {deleteState.error}
            </p>
          )}
        </div>

        <div className="flex shrink-0 gap-1 sm:justify-end">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setEditing(true)}
            aria-label={`Edit ${activity.title}`}
          >
            <Pencil className="h-4 w-4" aria-hidden />
            <span className="sm:sr-only">Edit</span>
          </Button>
          <form action={deleteAction}>
            <input type="hidden" name="activity_id" value={activity.id} />
            <Button
              type="submit"
              size="sm"
              variant="ghost"
              disabled={deleting}
              aria-label={`Delete ${activity.title}`}
              className="text-destructive hover:bg-destructive/10"
              // Deleting can't be undone, so ask first.
              onClick={(e) => {
                if (!window.confirm(`Delete "${activity.title}"? This can't be undone.`)) e.preventDefault();
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

function EditActivityForm({ activity, onDone }: { activity: StudyActivity; onDone: () => void }) {
  const [state, formAction, saving] = useActionState<EditState, FormData>(async (prev, formData) => {
    let result: ActivityFormState;
    try {
      result = await updateActivity(prev, formData);
    } catch {
      result = { error: "We couldn't save your changes — check your connection and try again." };
    }
    if (!result.error) {
      onDone();
      return result;
    }
    // React empties a form after every submit, so hand back what was typed.
    return { ...result, values: activityFormValues(formData), attempt: Date.now() };
  }, {});

  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="activity_id" value={activity.id} />
          {/* Re-mounting the fields (new key) is what puts the values back. */}
          <div key={state.attempt} className="flex flex-col gap-4">
            <ActivityFields idPrefix={`edit-${activity.id}`} values={state.values ?? activity} />
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
