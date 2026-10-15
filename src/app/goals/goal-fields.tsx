import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { GoalFormValues } from "@/lib/goals";

// The goal fields, shared by "Add a goal" and "Edit".
export function GoalFields({ idPrefix, values }: { idPrefix: string; values: GoalFormValues }) {
  const id = (name: string) => `${idPrefix}-${name}`;
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
        <div className="flex flex-col gap-2">
          <Label htmlFor={id("title")}>Goal</Label>
          <Input
            id={id("title")}
            name="title"
            required
            maxLength={100}
            placeholder="e.g. Finish five programming exercises"
            defaultValue={values.title ?? ""}
            autoFocus
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor={id("date")}>Target date</Label>
          <Input id={id("date")} name="target_date" type="date" required defaultValue={values.target_date ?? ""} />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor={id("description")}>Description (optional)</Label>
        <Textarea
          id={id("description")}
          name="description"
          maxLength={500}
          rows={2}
          placeholder="Why it matters, what counts as done…"
          defaultValue={values.description ?? ""}
        />
      </div>
    </>
  );
}
