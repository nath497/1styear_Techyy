"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { ListPlus, Pencil, Trash2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formValues } from "@/lib/form-values";
import { spaceHref } from "@/lib/learning-space";
import { formatUpdated, reviewTaskTitle, type LearnTopic } from "@/lib/learntrack";
import { deleteTopic, updateTopic, type TopicFormState } from "./actions";
import { TOPIC_FIELDS, TopicFields, type TopicFieldValues } from "./topic-fields";
import { TopicStatusButtons } from "./topic-status";

type EditState = TopicFormState & { values?: TopicFieldValues; attempt?: number };

// One topic: shown as a card with the status buttons, Edit and Delete, or
// as an edit form.
export function TopicItem({ topic }: { topic: LearnTopic }) {
  const [editing, setEditing] = useState(false);
  const [deleteState, deleteAction, deleting] = useActionState<TopicFormState, FormData>(async (prev, formData) => {
    try {
      return await deleteTopic(prev, formData);
    } catch {
      return { error: "Couldn't delete — check your connection." };
    }
  }, {});

  // The edit form is its own component, so Cancel throws away a failed
  // attempt — the next Edit always starts from the saved topic.
  if (editing) return <EditTopicForm topic={topic} onDone={() => setEditing(false)} />;

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 pt-4 pb-4 text-sm sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-col gap-1">
          <p className="font-medium break-words">{topic.name}</p>
          {topic.note && <p className="whitespace-pre-line break-words text-muted-foreground">{topic.note}</p>}
          <p className="text-xs text-muted-foreground">Last updated {formatUpdated(topic.updated_at)}</p>
          {deleteState.error && (
            <p role="alert" className="text-xs text-destructive">
              {deleteState.error}
            </p>
          )}
        </div>

        <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
          <TopicStatusButtons topicId={topic.id} name={topic.name} status={topic.status} />
          <div className="flex flex-wrap gap-1 sm:justify-end">
            {/* Opens Study Tasks with the add form filled in for this topic. */}
            <Link
              href={spaceHref("tasks", { new_title: reviewTaskTitle(topic.name), new_subject: topic.subject })}
              className={buttonVariants({ size: "sm", variant: "outline" })}
              aria-label={`Create a study task to review ${topic.name}`}
            >
              <ListPlus className="h-4 w-4" aria-hidden />
              Create study task
            </Link>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setEditing(true)}
              aria-label={`Edit ${topic.name}`}
            >
              <Pencil className="h-4 w-4" aria-hidden />
              <span className="sm:sr-only">Edit</span>
            </Button>
            <form action={deleteAction}>
              <input type="hidden" name="topic_id" value={topic.id} />
              <Button
                type="submit"
                size="sm"
                variant="ghost"
                disabled={deleting}
                aria-label={`Delete ${topic.name}`}
                className="text-destructive hover:bg-destructive/10"
                // Deleting can't be undone, so ask first.
                onClick={(e) => {
                  if (!window.confirm(`Delete "${topic.name}"? This can't be undone.`)) e.preventDefault();
                }}
              >
                <Trash2 className="h-4 w-4" aria-hidden />
                <span className="sm:sr-only">{deleting ? "Deleting…" : "Delete"}</span>
              </Button>
            </form>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EditTopicForm({ topic, onDone }: { topic: LearnTopic; onDone: () => void }) {
  const [state, formAction, saving] = useActionState<EditState, FormData>(async (prev, formData) => {
    let result: TopicFormState;
    try {
      result = await updateTopic(prev, formData);
    } catch {
      result = { error: "We couldn't save your changes — check your connection and try again." };
    }
    if (!result.error) {
      onDone();
      return result;
    }
    // React empties a form after every submit, so hand back what was typed.
    return { ...result, values: formValues(formData, TOPIC_FIELDS), attempt: Date.now() };
  }, {});

  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="topic_id" value={topic.id} />
          {/* Re-mounting the fields (new key) is what puts the values back. */}
          <div key={state.attempt} className="flex flex-col gap-4">
            <TopicFields idPrefix={`edit-${topic.id}`} values={state.values ?? topic} withStatus />
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
