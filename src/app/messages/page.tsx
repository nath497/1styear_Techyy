import type { Metadata } from "next";
import { MessageCircle } from "lucide-react";

export const metadata: Metadata = { title: "Messages · TutorMatch" };

// The right-hand side of the inbox before a chat is opened (desktop only;
// on phones the list fills the screen).
export default function MessagesHome() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center text-muted-foreground">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-primary">
        <MessageCircle className="h-7 w-7" aria-hidden />
      </span>
      <p className="font-medium text-foreground">Your messages</p>
      <p className="max-w-xs text-sm">Choose a chat on the left. New messages appear here without refreshing.</p>
    </div>
  );
}
