import { Card, CardContent } from "@/components/ui/card";

// Next.js shows this automatically while the Study Planner loads.
export default function Loading() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8">
      <h1 className="text-3xl font-semibold tracking-tight">Study Planner</h1>
      <Card>
        <CardContent className="pt-6 text-center text-sm text-muted-foreground" role="status">
          Loading your study tasks…
        </CardContent>
      </Card>
    </main>
  );
}
