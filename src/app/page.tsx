import Link from "next/link";
import { Caveat } from "next/font/google";
import {
  ArrowRight,
  BookOpen,
  Calculator,
  CalendarCheck,
  Code,
  FlaskConical,
  GraduationCap,
  Heart,
  Languages,
  Laptop,
  Lightbulb,
  Search,
  Sigma,
  UserRound,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { LEVELS, SUBJECTS, type Level, type Subject } from "@/lib/tutormatch";

// The handwritten font for the little notes, like the design mock-up.
const handwriting = Caveat({ subsets: ["latin"], weight: ["500", "700"] });

const steps = [
  {
    icon: Search,
    tint: "bg-secondary text-primary",
    title: "Tell us what you need",
    body: "Pick your subject, your level, your budget per session, and online or face-to-face.",
  },
  {
    icon: UserRound,
    tint: "bg-accent/15 text-accent",
    title: "See tutors who fit",
    body: "BudgetMatch shows only student tutors within your budget — and tells you why each one matches.",
  },
  {
    icon: CalendarCheck,
    tint: "bg-secondary text-primary",
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
      <section className="overflow-hidden bg-gradient-to-b from-secondary/70 to-background">
        <div className="mx-auto grid w-full max-w-5xl items-center gap-10 px-4 py-14 sm:py-20 md:grid-cols-2">
          <div className="flex flex-col items-start gap-5">
            <h1 className="text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
              Learn from fellow students.
            </h1>
            <p className="text-2xl font-medium text-primary">Affordable. Flexible. Made for you.</p>
            <p className="max-w-md text-muted-foreground">
              Get help with your subjects, or share what you know and earn — TutorMatch is
              student-to-student tutoring for high school and college learners.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/tutors" className={buttonVariants({ size: "lg" })}>
                Find a Tutor
              </Link>
              <Link href="/signup?role=tutor" className={buttonVariants({ size: "lg", variant: "outline" })}>
                Become a Tutor
              </Link>
            </div>
          </div>

          <HeroIllustration />
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto w-full max-w-5xl px-4 py-14">
        <h2 className="text-2xl font-semibold tracking-tight">How TutorMatch works</h2>
        <ol className="mt-8 grid gap-8 sm:grid-cols-3 sm:gap-4">
          {steps.map((step, i) => (
            <li key={step.title} className="relative flex flex-col items-center gap-3 text-center">
              <span className={`flex h-16 w-16 items-center justify-center rounded-full ${step.tint}`}>
                <step.icon className="h-7 w-7" aria-hidden />
              </span>
              {i < steps.length - 1 && (
                <ArrowRight
                  className="absolute top-5 -right-4 hidden h-5 w-5 text-brand-soft/60 sm:block"
                  aria-hidden
                />
              )}
              <p className="font-semibold">
                {i + 1}. {step.title}
              </p>
              <p className="max-w-60 text-sm text-muted-foreground">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Quick search: a plain GET form that opens BudgetMatch filled in. */}
      <section className="mx-auto w-full max-w-5xl px-4 pb-14">
        <div className="rounded-[calc(var(--radius)*1.5)] bg-secondary/70 p-5 sm:p-6">
          <h2 className="text-lg font-semibold">I&apos;m looking for help with…</h2>
          <form
            method="get"
            action="/tutors"
            className="mt-4 grid gap-3 sm:grid-cols-[1.4fr_1fr_1fr_1fr_auto] sm:items-end"
          >
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="home-subject" className="text-xs text-muted-foreground">
                Subject
              </Label>
              <Select id="home-subject" name="subject" defaultValue="" className="bg-card">
                <option value="" disabled>
                  e.g. Mathematics
                </option>
                {(Object.keys(SUBJECTS) as Subject[]).map((key) => (
                  <option key={key} value={key}>
                    {SUBJECTS[key]}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="home-budget" className="text-xs text-muted-foreground">
                Budget (₱)
              </Label>
              <Input
                id="home-budget"
                name="budget"
                type="number"
                inputMode="decimal"
                min="1"
                max="100000"
                step="0.01"
                placeholder="e.g. 100"
                className="bg-card"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="home-level" className="text-xs text-muted-foreground">
                Level
              </Label>
              <Select id="home-level" name="level" defaultValue="" className="bg-card">
                <option value="" disabled>
                  Level
                </option>
                {(Object.keys(LEVELS) as Level[]).map((key) => (
                  <option key={key} value={key}>
                    {LEVELS[key]}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="home-mode" className="text-xs text-muted-foreground">
                Mode
              </Label>
              <Select id="home-mode" name="mode" defaultValue="" className="bg-card">
                <option value="" disabled>
                  Mode
                </option>
                <option value="online">Online</option>
                <option value="face_to_face">Face-to-face</option>
              </Select>
            </div>
            <Button type="submit" className="h-10" aria-label="Search tutors">
              <Search className="h-4 w-4" aria-hidden />
              <span className="sm:hidden">Search tutors</span>
            </Button>
          </form>
        </div>
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
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-primary">
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
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

// A drawing made of icons instead of a photo: a laptop and graduation cap
// on a lavender blob, with floating idea/book/heart icons and a
// handwritten note. Purely decorative, so screen readers skip it.
function HeroIllustration() {
  return (
    <div aria-hidden className="relative mx-auto aspect-square w-full max-w-[17rem] select-none sm:max-w-sm">
      <div className="absolute inset-6 rounded-[46%_54%_42%_58%/55%_45%_55%_45%] bg-brand-soft/30" />
      <div className="absolute inset-14 rounded-[58%_42%_55%_45%/45%_58%_42%_55%] bg-secondary" />

      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30">
            <GraduationCap className="h-10 w-10" />
          </span>
          <span className="flex h-24 w-36 items-center justify-center rounded-2xl border border-border bg-card shadow-md">
            <Laptop className="h-12 w-12 text-brand-soft" />
          </span>
        </div>
      </div>

      <span className="absolute top-6 left-8 flex h-12 w-12 items-center justify-center rounded-2xl bg-card shadow-md">
        <Lightbulb className="h-6 w-6 text-warning" />
      </span>
      <span className="absolute bottom-10 left-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-card shadow-md">
        <BookOpen className="h-6 w-6 text-primary" />
      </span>
      <span className="absolute right-6 bottom-6 flex h-11 w-11 items-center justify-center rounded-full bg-accent text-white shadow-md">
        <Heart className="h-5 w-5" fill="currentColor" />
      </span>

      <p
        className={`${handwriting.className} absolute top-2 right-0 rotate-6 text-right text-2xl leading-6 text-secondary-foreground`}
      >
        Better Students,
        <br />
        Brighter Futures <span className="text-accent">♡</span>
      </p>
    </div>
  );
}
