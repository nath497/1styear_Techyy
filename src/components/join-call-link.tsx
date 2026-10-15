import { Video } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { meetingAppName } from "@/lib/tutormatch";

// "Join video call" for an Accepted session. Opens the tutor's Meet /
// Zoom / Teams / Jitsi link in a new tab and says so — TutorMatch
// doesn't run the call itself. `noopener` stops that site from
// controlling the TutorMatch tab.
export function JoinCallLink({ link, size = "sm" }: { link: string; size?: "sm" | "default" }) {
  const app = meetingAppName(link);
  return (
    <span className="flex flex-col items-start gap-1">
      <a href={link} target="_blank" rel="noopener noreferrer" className={buttonVariants({ size })}>
        <Video className="h-4 w-4" aria-hidden /> Join video call
        <span className="sr-only"> (opens {app} in a new tab)</span>
      </a>
      <span className="text-xs text-muted-foreground">Opens {app} — you&apos;re leaving TutorMatch.</span>
    </span>
  );
}
