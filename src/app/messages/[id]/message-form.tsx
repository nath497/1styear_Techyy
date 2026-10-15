"use client";

import { useActionState, useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { sendMessage, type SendState } from "../actions";

const MAX = 1000;

// The send box. The text is only cleared once the message really sent,
// so a failed send never loses what you typed.
export function MessageForm({ conversationId }: { conversationId: string }) {
  const [text, setText] = useState("");
  const [state, formAction, pending] = useActionState<SendState, FormData>(async (prev, formData) => {
    const result = await sendMessage(prev, formData);
    if (!result.error) setText("");
    return result;
  }, {});

  const left = MAX - text.length;

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="conversation_id" value={conversationId} />
      <Label htmlFor="body" className="sr-only">
        Message
      </Label>
      <div className="flex items-end gap-2">
        <Textarea
          id="body"
          name="body"
          required
          maxLength={MAX}
          rows={2}
          value={text}
          onChange={(e) => setText(e.target.value)}
          // Enter sends; Shift+Enter makes a new line.
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              if (text.trim() && !pending) e.currentTarget.form?.requestSubmit();
            }
          }}
          placeholder="Write a message…"
          className="min-h-11 flex-1 resize-none"
        />
        <Button type="submit" disabled={pending || !text.trim()} aria-label="Send message" className="h-11">
          <Send className="h-4 w-4" aria-hidden />
          <span className="hidden sm:inline">{pending ? "Sending…" : "Send"}</span>
        </Button>
      </div>
      <div className="flex justify-between gap-3 text-xs">
        {state.error ? (
          <p role="alert" className="text-destructive">
            {state.error}
          </p>
        ) : (
          <span className="text-muted-foreground">Enter to send · Shift+Enter for a new line</span>
        )}
        <span className={left < 50 ? "text-destructive" : "text-muted-foreground"}>{left}</span>
      </div>
    </form>
  );
}
