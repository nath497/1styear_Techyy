import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { GoalOption } from "@/lib/goals";
import { PRIORITIES, type Priority, type StudyTask, type TaskFormValues } from "@/lib/planner";
import { SUBJECTS, type Subject } from "@/lib/tutormatch";

// The task fields, shared by "Add a task" and "Edit". `idPrefix` keeps
// each form's labels pointing at its own boxes. `values` (what the learner
// typed before an error) wins over the saved task.
export function TaskFields({
  idPrefix,
  task,
  values = {},
  today,
  goals = [],
}: {
  idPrefix: string;
  task?: StudyTask;
  values?: TaskFormValues;
  today: string;
  goals?: GoalOption[];
}) {
  const id = (name: string) => `${idPrefix}-${name}`;
  // Goals to offer: the active ones, plus the task's current goal even if
  // it's already achieved (so editing doesn't hide it).
  const goalChoices = goals.filter((g) => g.status === "active" || g.id === task?.goal_id);
  return (
    <>
      <div className="flex flex-col gap-2">
        <Label htmlFor={id("title")}>Task</Label>
        <Input
          id={id("title")}
          name="title"
          required
          maxLength={100}
          placeholder="e.g. Review truth tables"
          defaultValue={values.title ?? task?.title ?? ""}
          autoFocus
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor={id("subject")}>Subject</Label>
          <Select id={id("subject")} name="subject" required defaultValue={values.subject ?? task?.subject ?? ""}>
            <option value="" disabled>
              Choose a subject
            </option>
            {(Object.keys(SUBJECTS) as Subject[]).map((key) => (
              <option key={key} value={key}>
                {SUBJECTS[key]}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor={id("priority")}>Priority</Label>
          <Select id={id("priority")} name="priority" defaultValue={values.priority ?? task?.priority ?? "medium"}>
            {(Object.keys(PRIORITIES) as Priority[]).map((key) => (
              <option key={key} value={key}>
                {PRIORITIES[key]}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor={id("date")}>Due date</Label>
          <Input
            id={id("date")}
            name="due_date"
            type="date"
            required
            defaultValue={values.due_date ?? task?.due_date ?? today}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor={id("time")}>Time (optional)</Label>
          <Input
            id={id("time")}
            name="due_time"
            type="time"
            defaultValue={values.due_time ?? task?.due_time?.slice(0, 5) ?? ""}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor={id("minutes")}>Estimated minutes (optional)</Label>
          <Input
            id={id("minutes")}
            name="estimated_minutes"
            type="number"
            inputMode="numeric"
            min={5}
            max={600}
            placeholder="e.g. 45"
            defaultValue={values.estimated_minutes ?? task?.estimated_minutes ?? ""}
          />
        </div>
      </div>

      {goalChoices.length > 0 && (
        <div className="flex flex-col gap-2">
          <Label htmlFor={id("goal")}>Counts towards a goal (optional)</Label>
          <Select id={id("goal")} name="goal_id" defaultValue={values.goal_id ?? task?.goal_id ?? ""}>
            <option value="">No goal</option>
            {goalChoices.map((g) => (
              <option key={g.id} value={g.id}>
                {g.title}
                {g.status === "achieved" ? " (achieved)" : ""}
              </option>
            ))}
          </Select>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor={id("notes")}>Description (optional)</Label>
        <Textarea
          id={id("notes")}
          name="notes"
          maxLength={500}
          rows={2}
          placeholder="Pages, links, what to focus on…"
          defaultValue={values.notes ?? task?.notes ?? ""}
        />
      </div>
    </>
  );
}
