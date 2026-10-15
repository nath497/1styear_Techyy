import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { ActivityFormValues } from "@/lib/schedule";
import { SUBJECTS, type Subject } from "@/lib/tutormatch";

// The activity fields, shared by "Add an activity" and "Edit", so their
// limits can't drift apart. `idPrefix` keeps each form's labels pointing
// at its own boxes.
export function ActivityFields({ idPrefix, values }: { idPrefix: string; values: ActivityFormValues }) {
  const id = (name: string) => `${idPrefix}-${name}`;
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor={id("title")}>Activity</Label>
          <Input
            id={id("title")}
            name="title"
            required
            maxLength={100}
            placeholder="e.g. Practise past exam questions"
            defaultValue={values.title ?? ""}
            autoFocus
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor={id("subject")}>Subject</Label>
          <Select id={id("subject")} name="subject" required defaultValue={values.subject ?? ""}>
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
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor={id("date")}>Date</Label>
          <Input id={id("date")} name="activity_date" type="date" required defaultValue={values.activity_date ?? ""} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor={id("start")}>Start</Label>
          <Input
            id={id("start")}
            name="start_time"
            type="time"
            required
            defaultValue={values.start_time?.slice(0, 5) ?? ""}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor={id("end")}>End</Label>
          <Input id={id("end")} name="end_time" type="time" required defaultValue={values.end_time?.slice(0, 5) ?? ""} />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor={id("notes")}>Notes (optional)</Label>
        <Textarea
          id={id("notes")}
          name="notes"
          maxLength={500}
          rows={2}
          placeholder="What to cover, where you'll study…"
          defaultValue={values.notes ?? ""}
        />
      </div>
    </>
  );
}
