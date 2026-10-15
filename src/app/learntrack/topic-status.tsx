"use client";

import { useActionState } from "react";
import { cn } from "@/lib/utils";
import { TOPIC_STATUS_STYLE, TOPIC_STATUSES, type TopicStatus } from "@/lib/learntrack";
import { setTopicStatus, type TopicFormState } from "./actions";

// Three buttons — Need to Review, Currently Learning, Understood. The current one is
// coloured in; tapping another saves it straight away.
export function TopicStatusButtons({ topicId, name, status }: { topicId: string; name: string; status: TopicStatus }) {
  const [state, formAction, pending] = useActionState<TopicFormState, FormData>(async (prev, formData) => {
    try {
      return await setTopicStatus(prev, formData);
    } catch {
      return { error: "Couldn't update — check your connection." };
    }
  }, {});

  return (
    <form action={formAction} className="flex flex-col gap-1">
      <input type="hidden" name="topic_id" value={topicId} />
      <div role="group" aria-label={`How well you know ${name}`} className="flex flex-wrap gap-1.5">
        {(Object.keys(TOPIC_STATUSES) as TopicStatus[]).map((key) => {
          const current = key === status;
          return (
            <button
              key={key}
              type="submit"
              name="status"
              value={key}
              disabled={pending || current}
              aria-pressed={current}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors disabled:cursor-default",
                current
                  ? TOPIC_STATUS_STYLE[key]
                  : "border-border bg-background text-muted-foreground hover:bg-muted disabled:opacity-60",
              )}
            >
              {TOPIC_STATUSES[key]}
            </button>
          );
        })}
      </div>
      {state.error && (
        <p role="alert" className="text-xs text-destructive">
          {state.error}
        </p>
      )}
    </form>
  );
}
