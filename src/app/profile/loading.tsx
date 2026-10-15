import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Next.js shows this automatically while Profile loads its data.
export default function Loading() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Profile</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground" role="status">
          Loading your account…
        </CardContent>
      </Card>
    </main>
  );
}
