"use client";

import { useActionState } from "react";
import { BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { addTopicNames, noteFormValues, type NoteFormValues, type SessionNote } from "@/lib/session-notes";
import { saveSessionNote, type NoteFormState } from "./actions";

type State = NoteFormState & { values?: NoteFormValues; attempt?: number };

export type NoteSession = {
  id: string;
  when: string; // "Tue, Oct 20, 2026, 4:00 PM"
  tutorName: string;
  subjectName: string;
  topic: string;
  ended: boolean;
};

// One real tutoring session with the learner's private notes: questions
// to ask, topics they need help with, and (once it has ended) a
// reflection. `reviewTopics` are their Need to Review topics in this
// session's subject, for "Add from LearnTrack".
export function NoteCard({
  session,
  note,
  reviewTopics,
}: {
  session: NoteSession;
  note: SessionNote | null;
  reviewTopics: string[];
}) {
  const [state, formAction, pending] = useActionState<State, FormData>(async (prev, formData) => {
    let result: NoteFormState;
    try {
      result = await saveSessionNote(prev, formData);
    } catch {
      result = { error: "We couldn't save your notes — check your connection and try again." };
    }
    if (!result.error) return result;
    // React empties a form after every submit, so refill what was typed.
    return { ...result, values: noteFormValues(formData), attempt: Date.now() };
  }, {});

  const v: NoteFormValues = state.values ?? note ?? {};
  const id = (name: string) => `note-${session.id}-${name}`;

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 pt-4 pb-4 text-sm">
        <div className="flex flex-col gap-1">
          <p className="font-medium">
            {session.subjectName} with {session.tutorName}
          </p>
          <p className="text-muted-foreground">{session.when}</p>
          <p className="break-words text-muted-foreground">Topic: {session.topic}</p>
        </div>

        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="booking_id" value={session.id} />
          {/* Re-mounting the fields (new key) puts saved or typed values back. */}
          <div key={state.attempt ?? state.saved} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor={id("questions")}>Questions to ask</Label>
              <Textarea
                id={id("questions")}
                name="questions"
                maxLength={1000}
                rows={3}
                placeholder="What do you want to ask your tutor?"
                defaultValue={v.questions ?? ""}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor={id("help")}>Topics I need help with</Label>
              <Textarea
                id={id("help")}
                name="help_topics"
                maxLength={500}
                rows={2}
                placeholder="One per line"
                defaultValue={v.help_topics ?? ""}
              />
              {reviewTopics.length > 0 && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="self-start"
                  onClick={() => {
                    // Adds to what's typed (skipping repeats), never replaces it.
                    const box = document.getElementById(id("help"));
                    if (box instanceof HTMLTextAreaElement) box.value = addTopicNames(box.value, reviewTopics);
                  }}
                >
                  <BookOpen className="h-4 w-4" aria-hidden />
                  Add from LearnTrack ({reviewTopics.length} to review)
                </Button>
              )}
            </div>

            {session.ended && (
              <div className="flex flex-col gap-2">
                <Label htmlFor={id("reflection")}>Reflection</Label>
                <Textarea
                  id={id("reflection")}
                  name="reflection"
                  maxLength={1000}
                  rows={3}
                  placeholder="What did you learn? What's still unclear?"
                  defaultValue={v.reflection ?? ""}
                />
              </div>
            )}
          </div>

          {state.error ? (
            <p role="alert" className="rounded-[var(--radius)] bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {state.error}
            </p>
          ) : state.saved ? (
            <p role="status" className="text-sm text-green-800">
              Notes saved. Only you can see them.
            </p>
          ) : null}

          <Button type="submit" disabled={pending} className="self-start">
            {pending ? "Saving…" : "Save notes"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
