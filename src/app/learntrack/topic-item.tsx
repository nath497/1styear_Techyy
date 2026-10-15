"use client";

import { useActionState, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formValues } from "@/lib/form-values";
import { TOPIC_STATUSES, type LearnTopic, type TopicStatus } from "@/lib/learntrack";
import { SUBJECTS, type Subject } from "@/lib/tutormatch";
import { deleteTopic, updateTopic, type TopicFormState } from "./actions";
import { TopicStatusButtons } from "./topic-status";

const FIELDS = ["name", "subject", "status", "note"] as const;
type EditState = TopicFormState & { values?: Partial<Record<(typeof FIELDS)[number], string>>; attempt?: number };

// One topic: shown as a card with the status buttons, Edit and Delete, or
// as an edit form.
export function TopicItem({ topic }: { topic: LearnTopic }) {
  const [editing, setEditing] = useState(false);

  const [editState, editAction, saving] = useActionState<EditState, FormData>(async (prev, formData) => {
    let result: TopicFormState;
    try {
      result = await updateTopic(prev, formData);
    } catch {
      result = { error: "We couldn't save your changes — check your connection and try again." };
    }
    if (!result.error) {
      setEditing(false);
      return result;
    }
    // React empties a form after every submit, so hand back what was typed.
    return { ...result, values: formValues(formData, FIELDS), attempt: Date.now() };
  }, {});
  const [deleteState, deleteAction, deleting] = useActionState<TopicFormState, FormData>(async (prev, formData) => {
    try {
      return await deleteTopic(prev, formData);
    } catch {
      return { error: "Couldn't delete — check your connection." };
    }
  }, {});

  if (editing) {
    const v = editState.values ?? {};
    const id = (name: string) => `edit-${topic.id}-${name}`;
    return (
      <Card>
        <CardContent className="pt-4 pb-4">
          <form action={editAction} className="flex flex-col gap-4">
            <input type="hidden" name="topic_id" value={topic.id} />
            {/* Re-mounting the fields (new key) is what puts the values back. */}
            <div key={editState.attempt} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor={id("name")}>Topic</Label>
                <Input
                  id={id("name")}
                  name="name"
                  required
                  maxLength={100}
                  defaultValue={v.name ?? topic.name}
                  autoFocus
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor={id("subject")}>Subject</Label>
                  <Select id={id("subject")} name="subject" required defaultValue={v.subject ?? topic.subject}>
                    {(Object.keys(SUBJECTS) as Subject[]).map((key) => (
                      <option key={key} value={key}>
                        {SUBJECTS[key]}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor={id("status")}>How well you know it</Label>
                  <Select id={id("status")} name="status" defaultValue={v.status ?? topic.status}>
                    {(Object.keys(TOPIC_STATUSES) as TopicStatus[]).map((key) => (
                      <option key={key} value={key}>
                        {TOPIC_STATUSES[key]}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor={id("note")}>Note (optional)</Label>
                <Textarea id={id("note")} name="note" maxLength={300} rows={2} defaultValue={v.note ?? topic.note} />
              </div>
            </div>
            {editState.error && (
              <p role="alert" className="rounded-[var(--radius)] bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {editState.error}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : "Save changes"}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setEditing(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 pt-4 pb-4 text-sm sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-col gap-1">
          <p className="font-medium break-words">{topic.name}</p>
          {topic.note && <p className="whitespace-pre-line break-words text-muted-foreground">{topic.note}</p>}
          {deleteState.error && (
            <p role="alert" className="text-xs text-destructive">
              {deleteState.error}
            </p>
          )}
        </div>

        <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
          <TopicStatusButtons topicId={topic.id} name={topic.name} status={topic.status} />
          <div className="flex gap-1">
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
