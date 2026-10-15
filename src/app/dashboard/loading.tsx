import { Card, CardContent } from "@/components/ui/card";

// Next.js shows this automatically while a dashboard loads its data.
export default function Loading() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-8">
      <Card>
        <CardContent className="pt-6 text-center text-sm text-muted-foreground" role="status">
          Loading your dashboard…
        </CardContent>
      </Card>
    </main>
  );
}
