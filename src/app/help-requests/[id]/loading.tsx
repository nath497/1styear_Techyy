import { Card, CardContent } from "@/components/ui/card";

// Next.js shows this automatically while a help request loads.
export default function Loading() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col px-4 py-10">
      <Card>
        <CardContent className="pt-6 text-center text-sm text-muted-foreground" role="status">
          Loading help request…
        </CardContent>
      </Card>
    </main>
  );
}
