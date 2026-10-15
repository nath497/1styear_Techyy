import type { Metadata } from "next";
import { Check, Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { PLANS } from "@/lib/subscription";
import { canPreviewSubscription } from "@/lib/subscription-access";
import { cn } from "@/lib/utils";
import { SubscribeButton } from "./subscribe-button";

export const metadata: Metadata = { title: "Subscription · TutorMatch" };

// Subscription preview (ticket 27): only accounts on the private preview
// list see the plans. Everyone else — including logged-out visitors — sees
// "coming soon". The check runs here, on the server.
export default async function SubscriptionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !canPreviewSubscription(user.email)) {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Subscriptions are coming soon</CardTitle>
            <CardDescription>
              TutorMatch is free while we&apos;re getting started. Paid plans with extra features are on the way.
            </CardDescription>
          </CardHeader>
        </Card>
      </main>
    );
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  const role = profile?.role === "tutor" ? "tutor" : "learner";

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8">
      <header className="flex flex-col gap-2">
        <p className="inline-flex w-fit items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">
          <Sparkles className="h-3.5 w-3.5" aria-hidden /> Prototype — preview only
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">Subscription</h1>
        <p className="text-muted-foreground">
          How TutorMatch plans to grow: the core stays free, with optional plans for learners and tutors. Paid
          features below are planned, not live yet — and nothing here charges you.
        </p>
      </header>

      <ul className="grid gap-4 md:grid-cols-3">
        {PLANS.map((plan) => {
          const yours = plan.role === role;
          return (
            <li key={plan.id}>
              <Card className={cn("flex h-full flex-col", yours && "border-2 border-primary shadow-md")}>
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    {yours && (
                      <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                        For you
                      </span>
                    )}
                  </div>
                  <CardDescription>{plan.forWhom}</CardDescription>
                  <p className="pt-2">
                    <span className="text-3xl font-semibold">{plan.price}</span>
                    <span className="text-sm text-muted-foreground">{plan.per}</span>
                  </p>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-4">
                  <ul className="flex flex-1 flex-col gap-2 text-sm">
                    {plan.benefits.map((b) => (
                      <li key={b} className="flex items-start gap-2">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                  {plan.id === "free" ? (
                    <p className="rounded-[var(--radius)] bg-muted px-3 py-2 text-center text-sm text-muted-foreground">
                      Your current plan
                    </p>
                  ) : (
                    <SubscribeButton planName={plan.name} highlighted={yours} />
                  )}
                </CardContent>
              </Card>
            </li>
          );
        })}
      </ul>

      <p className="text-xs text-muted-foreground">
        Prices in Philippine pesos. Planned features may change before plans go live.
      </p>
    </main>
  );
}
