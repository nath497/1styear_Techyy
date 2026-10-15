// SERVER ONLY. Reads the private preview list from the
// SUBSCRIPTION_PREVIEW_EMAILS setting (Vercel, and .env.local for local
// work). It has no NEXT_PUBLIC_ prefix, so Next.js never sends it to the
// browser — only the yes/no answer leaves the server.
import { isPreviewEmail } from "@/lib/subscription";

export function canPreviewSubscription(email: string | null | undefined) {
  return isPreviewEmail(email, process.env.SUBSCRIPTION_PREVIEW_EMAILS);
}
