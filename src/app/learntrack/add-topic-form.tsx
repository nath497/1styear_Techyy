"use client";

import { useActionState, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formValues } from "@/lib/form-values";
import { SUBJECTS, type Subject } from "@/lib/tutormatch";
import { addTopic, type TopicFormState } from "./actions";

const FIELDS = ["name", "subject", "note"] as const;
type State = TopicFormState & { values?: Partial<Record<(typeof FIELDS)[number], string>>; attempt?: number };

// "Add a topic": a button that opens the form. After a successful add the
// form clears and stays open, so adding several topics is quick. The
// subject is kept, since topics usually come in batches per subject.
export function AddTopicForm() {
  const [open, setOpen] = useState(false);
  const [lastSubject, setLastSubject] = useState("");
  const [state, formAction, pending] = useActionState<State, FormData>(async (prev, formData) => {
    let result: TopicFormState;
    try {
      result = await addTopic(prev, formData);
    } catch {
      result = { error: "We couldn't add the topic — check your connection and try again." };
    }
    if (!result.error) {
      setLastSubject(String(formData.get("subject") ?? ""));
      return result;
    }
    // React empties a form after every submit, so refill what was typed.
    return { ...result, values: formValues(formData, FIELDS), attempt: Date.now() };
  }, {});

  if (!open) {
    return (
      <Button type="button" onClick={() => setOpen(true)} className="self-start">
        <Plus className="h-4 w-4" aria-hidden /> Add a topic
      </Button>
    );
  }

  const v = state.values ?? {};
  return (
    <form
      action={formAction}
      className="flex flex-col gap-4 rounded-[var(--radius)] border border-border bg-card p-4"
    >
      {/* Re-mounting the fields (new key) is what puts the values back. */}
      <div key={state.attempt ?? state.saved} className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="topic-name">Topic</Label>
            <Input
              id="topic-name"
              name="name"
              required
              maxLength={100}
              placeholder="e.g. Fractions"
              defaultValue={v.name ?? ""}
              autoFocus
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="topic-subject">Subject</Label>
            <Select id="topic-subject" name="subject" required defaultValue={v.subject ?? lastSubject}>
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
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="topic-note">Note (optional)</Label>
          <Textarea
            id="topic-note"
            name="note"
            maxLength={300}
            rows={2}
            placeholder="What's tricky about it, pages to reread…"
            defaultValue={v.note ?? ""}
          />
        </div>
      </div>

      {state.error ? (
        <p role="alert" className="rounded-[var(--radius)] bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      ) : state.saved ? (
        <p role="status" className="text-sm text-green-800">
          Topic added. It starts at Need to Review.
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Adding…" : "Add topic"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          Close
        </Button>
      </div>
    </form>
  );
}
