import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { TOPIC_STATUSES, type TopicStatus } from "@/lib/learntrack";
import { SUBJECTS, type Subject } from "@/lib/tutormatch";

export const TOPIC_FIELDS = ["name", "subject", "status", "note"] as const;
export type TopicFieldValues = Partial<Record<(typeof TOPIC_FIELDS)[number], string>>;

// The topic fields, shared by "Add a topic" and "Edit", so their limits
// can't drift apart. `idPrefix` keeps each form's labels pointing at its
// own boxes. The status box only appears when editing — new topics always
// start at Need to Review.
export function TopicFields({
  idPrefix,
  values,
  withStatus = false,
}: {
  idPrefix: string;
  values: TopicFieldValues;
  withStatus?: boolean;
}) {
  const id = (name: string) => `${idPrefix}-${name}`;
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor={id("name")}>Topic</Label>
          <Input
            id={id("name")}
            name="name"
            required
            maxLength={100}
            placeholder="e.g. Fractions"
            defaultValue={values.name ?? ""}
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

      {withStatus && (
        <div className="flex flex-col gap-2">
          <Label htmlFor={id("status")}>How well you know it</Label>
          <Select id={id("status")} name="status" defaultValue={values.status ?? "need_review"}>
            {(Object.keys(TOPIC_STATUSES) as TopicStatus[]).map((key) => (
              <option key={key} value={key}>
                {TOPIC_STATUSES[key]}
              </option>
            ))}
          </Select>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor={id("note")}>Note (optional)</Label>
        <Textarea
          id={id("note")}
          name="note"
          maxLength={300}
          rows={2}
          placeholder="What's tricky about it, pages to reread…"
          defaultValue={values.note ?? ""}
        />
      </div>
    </>
  );
}
