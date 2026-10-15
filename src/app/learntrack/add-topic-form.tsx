"use client";

import { useActionState, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formValues } from "@/lib/form-values";
import { addTopic, type TopicFormState } from "./actions";
import { TOPIC_FIELDS, TopicFields, type TopicFieldValues } from "./topic-fields";

type State = TopicFormState & { values?: TopicFieldValues; attempt?: number };

// "Add a topic": a button that opens the form. After a successful add the
// form clears and stays open, so adding several topics is quick. The
// subject is kept, since topics usually come in batches per subject.
export function AddTopicForm() {
  const [open, setOpen] = useState(false);
  const [lastSubject, setLastSubject] = useState("");

  if (!open) {
    return (
      <Button type="button" onClick={() => setOpen(true)} className="self-start">
        <Plus className="h-4 w-4" aria-hidden /> Add a topic
      </Button>
    );
  }
  // The form is its own component, so closing it throws away its messages
  // and typing — reopening always starts fresh.
  return <OpenForm lastSubject={lastSubject} onAdded={setLastSubject} onClose={() => setOpen(false)} />;
}

function OpenForm({
  lastSubject,
  onAdded,
  onClose,
}: {
  lastSubject: string;
  onAdded: (subject: string) => void;
  onClose: () => void;
}) {
  const [state, formAction, pending] = useActionState<State, FormData>(async (prev, formData) => {
    let result: TopicFormState;
    try {
      result = await addTopic(prev, formData);
    } catch {
      result = { error: "We couldn't add the topic — check your connection and try again." };
    }
    if (!result.error) {
      onAdded(String(formData.get("subject") ?? ""));
      return result;
    }
    // React empties a form after every submit, so refill what was typed.
    return { ...result, values: formValues(formData, TOPIC_FIELDS), attempt: Date.now() };
  }, {});

  return (
    <form action={formAction} className="flex flex-col gap-4 rounded-[var(--radius)] border border-border bg-card p-4">
      {/* Re-mounting the fields (new key) is what puts the values back. */}
      <div key={state.attempt ?? state.saved} className="flex flex-col gap-4">
        <TopicFields idPrefix="new-topic" values={state.values ?? { subject: lastSubject }} />
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
        <Button type="button" variant="ghost" onClick={onClose}>
          Close
        </Button>
      </div>
    </form>
  );
}
