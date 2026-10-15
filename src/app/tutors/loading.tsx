import { Card, CardContent } from "@/components/ui/card";

// Next.js shows this automatically while Find a Tutor loads its data.
export default function Loading() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Find a Tutor</h1>
        <p className="text-muted-foreground">
          Student tutors who teach your subject, at a price that fits your budget.
        </p>
      </header>
      <Card>
        <CardContent className="pt-6 text-center text-sm text-muted-foreground" role="status">
          Loading tutors…
        </CardContent>
      </Card>
    </main>
  );
}
