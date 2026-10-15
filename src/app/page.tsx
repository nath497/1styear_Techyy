import Link from "next/link";
import {
  BookOpen,
  Calculator,
  CalendarCheck,
  FlaskConical,
  Code,
  Languages,
  Search,
  Sigma,
  UserRound,
  Wallet,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SUBJECTS, type Subject } from "@/lib/tutormatch";

const steps = [
  {
    icon: Search,
    title: "Tell us what you need",
    body: "Pick your subject, your level, your budget per session, and online or face-to-face.",
  },
  {
    icon: UserRound,
    title: "See tutors who fit",
    body: "BudgetMatch shows only student tutors within your budget — and tells you why each one matches.",
  },
  {
    icon: CalendarCheck,
    title: "Request a session",
    body: "Send a topic, date and time. Your tutor accepts, and you learn together.",
  },
];

const subjectIcons: Record<Subject, typeof Search> = {
  math: Sigma,
  science: FlaskConical,
  english: BookOpen,
  filipino: Languages,
  programming_ict: Code,
  accounting_business: Calculator,
};

export default function Home() {
  return (
    <main className="flex flex-1 flex-col">
      {/* Hero */}
      <section className="bg-gradient-to-b from-secondary to-background">
        <div className="mx-auto flex w-full max-w-5xl flex-col items-start gap-6 px-4 py-16 sm:py-24">
          <span className="rounded-full border border-primary/20 bg-card px-3 py-1 text-xs font-medium text-secondary-foreground">
            Find Your Match. Learn Together. Grow Together.
          </span>
          <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
            Learn from fellow students.{" "}
            <span className="text-primary">Affordable. Flexible.</span> Made for you.
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground">
            Find student tutors who understand your subjects, your school life, and your
            budget. Share what you know and earn by helping others learn.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/tutors" className={buttonVariants({ size: "lg" })}>
              <Search className="h-4 w-4" aria-hidden /> Find a Tutor
            </Link>
            <Link
              href="/signup?role=tutor&next=/tutor-profile"
              className={buttonVariants({ size: "lg", variant: "outline" })}
            >
              <Wallet className="h-4 w-4" aria-hidden /> Become a Tutor
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto w-full max-w-5xl px-4 py-14">
        <h2 className="text-2xl font-semibold tracking-tight">How it works</h2>
        <ol className="mt-6 grid gap-4 sm:grid-cols-3">
          {steps.map((step, i) => (
            <li key={step.title}>
              <Card className="h-full">
                <CardContent className="flex flex-col gap-3 pt-6">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-primary">
                    <step.icon className="h-5 w-5" aria-hidden />
                  </span>
                  <p className="font-semibold">
                    <span className="text-muted-foreground">{i + 1}.</span> {step.title}
                  </p>
                  <p className="text-sm text-muted-foreground">{step.body}</p>
                </CardContent>
              </Card>
            </li>
          ))}
        </ol>
      </section>

      {/* Subjects */}
      <section className="mx-auto w-full max-w-5xl px-4 pb-16">
        <h2 className="text-2xl font-semibold tracking-tight">Popular subjects</h2>
        <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {(Object.keys(SUBJECTS) as Subject[]).map((key) => {
            const Icon = subjectIcons[key];
            return (
              <li key={key}>
                <Link
                  href={`/tutors?subject=${key}`}
                  className="flex items-center gap-3 rounded-[var(--radius)] border border-border bg-card p-4 font-medium shadow-sm transition-colors hover:border-primary hover:text-primary"
                >
                  <Icon className="h-5 w-5 text-brand-soft" aria-hidden />
                  {SUBJECTS[key]}
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </main>
  );
}
