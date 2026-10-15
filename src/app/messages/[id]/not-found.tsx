import Link from "next/link";

// Shown for a chat that doesn't exist — or one you're not part of (the
// database won't reveal it).
export default function ChatNotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
      <p className="font-medium">This chat could not be found.</p>
      <Link href="/messages" className="text-sm font-medium text-primary hover:underline">
        Back to Messages
      </Link>
    </div>
  );
}
