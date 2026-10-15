import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LearnTrackTab } from "@/app/learntrack/learntrack-tab";
import { StudyTasksTab } from "@/app/planner/tasks-tab";
import { ScheduleTab } from "@/app/schedule/schedule-tab";
import { createClient } from "@/lib/supabase/server";
import { parseTab, SPACE_TABS, type SpaceTab } from "@/lib/learning-space";
import { manilaToday } from "@/lib/planner";
import { OverviewTab } from "./overview";
import { TabBar } from "./tab-bar";

export const metadata: Metadata = { title: "My Learning Space · TutorMatch" };

// Tabs whose tickets aren't built yet (25, 26).
const COMING_NEXT: Partial<Record<SpaceTab, string>> = {
  goals: "Set learning goals and watch them fill up as you complete linked tasks.",
  notes: "Write questions before a tutoring session and a reflection after it.",
};

export default async function LearningSpacePage({ searchParams }: PageProps<"/learning-space">) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/learning-space");

  // My Learning Space is a learner tool (the database enforces this too).
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role === "tutor") {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">My Learning Space is for learners</CardTitle>
            <CardDescription>
              Learners use it to plan their study, track topics and prepare for sessions with you.
            </CardDescription>
          </CardHeader>
        </Card>
      </main>
    );
  }

  const params = await searchParams;
  const tab = parseTab(params.tab);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">My Learning Space ♡</h1>
        <p className="text-muted-foreground">
          Plan your study time, organize your tasks, and track how much you&apos;re learning. Only you can see it.
        </p>
      </header>

      <TabBar current={tab} />

      <h2 className="sr-only">{SPACE_TABS[tab]}</h2>
      {tab === "overview" ? (
        <OverviewTab learnerId={user.id} today={manilaToday()} />
      ) : tab === "tasks" ? (
        <StudyTasksTab learnerId={user.id} params={params} />
      ) : tab === "schedule" ? (
        <ScheduleTab learnerId={user.id} today={manilaToday()} />
      ) : tab === "learntrack" ? (
        <LearnTrackTab params={params} />
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 pt-6 text-center">
            <p className="font-medium">{SPACE_TABS[tab]} is coming next.</p>
            <p className="text-sm text-muted-foreground">{COMING_NEXT[tab]}</p>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
