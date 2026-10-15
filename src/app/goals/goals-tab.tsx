import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { goalProgress, type LearningGoal } from "@/lib/goals";
import { AddGoalForm } from "./add-goal-form";
import { GoalItem } from "./goal-item";

// The Goals tab of My Learning Space. Progress comes from study tasks
// linked to each goal. The page has already checked that this is a
// logged-in learner.
export async function GoalsTab({ today }: { today: string }) {
  const supabase = await createClient();

  // Row Level Security only returns this learner's own goals and tasks
  // (SQL 015, 017).
  const [goalsRes, linkedRes] = await Promise.all([
    supabase
      .from("learning_goals")
      .select("id, title, description, target_date, status")
      .order("target_date", { ascending: true })
      .returns<LearningGoal[]>(),
    supabase
      .from("study_tasks")
      .select("goal_id, status")
      .not("goal_id", "is", null)
      .returns<{ goal_id: string; status: string }[]>(),
  ]);
  if (goalsRes.error) console.error("Goals: could not load goals", goalsRes.error);
  if (linkedRes.error) console.error("Goals: could not load linked tasks", linkedRes.error);

  const goals = goalsRes.data ?? [];
  const linked = linkedRes.data ?? [];
  // Active goals first (soonest target), then achieved ones.
  const sorted = [...goals.filter((g) => g.status === "active"), ...goals.filter((g) => g.status === "achieved")];

  return (
    <div className="flex flex-col gap-6">
      <p className="text-muted-foreground">
        Set a goal, then link study tasks to it from Study Tasks. Progress is the share of linked tasks you&apos;ve
        completed.
      </p>

      <AddGoalForm />

      {goalsRes.error ? (
        <Card className="border-destructive">
          <CardContent className="pt-6 text-sm">
            <p className="font-medium text-destructive">We couldn&apos;t load your goals right now.</p>
            <p className="mt-1 text-muted-foreground">Please try again in a moment.</p>
          </CardContent>
        </Card>
      ) : sorted.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 pt-6 text-center">
            <p className="font-medium">No goals yet — add your first one.</p>
            <p className="text-sm text-muted-foreground">
              For example: &ldquo;Finish five programming exercises by Friday&rdquo;.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {linkedRes.error && (
            <p className="text-sm text-destructive">We couldn&apos;t load goal progress right now.</p>
          )}
          <ul className="flex flex-col gap-3">
            {sorted.map((g) => (
              <li key={g.id}>
                <GoalItem goal={g} progress={goalProgress(linked.filter((t) => t.goal_id === g.id))} today={today} />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
