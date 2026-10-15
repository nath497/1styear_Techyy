import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { createClient } from "@/lib/supabase/server";
import { spaceHref, SPACE_PATH } from "@/lib/learning-space";
import { groupBySubject, parseTopicFilter, TOPIC_STATUSES, type LearnTopic, type TopicStatus } from "@/lib/learntrack";
import { SUBJECTS } from "@/lib/tutormatch";
import { AddTopicForm } from "./add-topic-form";
import { TopicItem } from "./topic-item";

// The LearnTrack tab of My Learning Space. The page has already checked
// that this is a logged-in learner.
export async function LearnTrackTab({ params }: { params: Record<string, string | string[] | undefined> }) {
  const supabase = await createClient();

  // Row Level Security only returns this learner's own topics (SQL 016).
  const { data, error } = await supabase
    .from("learn_topics")
    .select("id, subject, name, status, note")
    .returns<LearnTopic[]>();
  if (error) console.error("LearnTrack: could not load topics", error);
  const filter = parseTopicFilter(params);
  // Progress always counts every topic in the subject; the filter only
  // changes which topics are listed underneath.
  const groups = groupBySubject(data ?? []).map((g) => ({
    ...g,
    shown: filter === "all" ? g.topics : g.topics.filter((t) => t.status === filter),
  }));
  const nothingMatches = groups.length > 0 && groups.every((g) => g.shown.length === 0);

  return (
    <div className="flex flex-col gap-6">
      <p className="text-muted-foreground">
        List the topics you&apos;re studying and mark how well you know each one, so you can see where you need
        help.
      </p>

      <AddTopicForm />

      {/* Filter: a plain GET form, so the choice is kept in the address. */}
      {groups.length > 0 && (
        <form method="get" action={SPACE_PATH} className="flex flex-wrap items-end gap-3">
          <input type="hidden" name="tab" value="learntrack" />
          <div className="flex min-w-40 flex-1 flex-col gap-1.5 sm:flex-none">
            <Label htmlFor="filter-status" className="text-xs text-muted-foreground">
              Show
            </Label>
            <Select id="filter-status" name="status" defaultValue={filter}>
              <option value="all">All topics</option>
              {(Object.keys(TOPIC_STATUSES) as TopicStatus[]).map((key) => (
                <option key={key} value={key}>
                  {TOPIC_STATUSES[key]}
                </option>
              ))}
            </Select>
          </div>
          <Button type="submit" variant="outline">
            Filter
          </Button>
          {filter !== "all" && (
            <Link href={spaceHref("learntrack")} className={buttonVariants({ variant: "ghost" })}>
              Reset
            </Link>
          )}
        </form>
      )}

      {error ? (
        <Card className="border-destructive">
          <CardContent className="pt-6 text-sm">
            <p className="font-medium text-destructive">We couldn&apos;t load your topics right now.</p>
            <p className="mt-1 text-muted-foreground">Please try again in a moment.</p>
          </CardContent>
        </Card>
      ) : groups.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 pt-6 text-center">
            <p className="font-medium">No topics yet — add the first topic you&apos;re studying.</p>
            <p className="text-sm text-muted-foreground">
              Start with the ones you find hardest. They&apos;ll begin at Need to Review.
            </p>
          </CardContent>
        </Card>
      ) : nothingMatches ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 pt-6 text-center">
            <p className="font-medium">No topics at {TOPIC_STATUSES[filter as TopicStatus]}.</p>
            <Link href={spaceHref("learntrack")} className={buttonVariants({ variant: "outline", size: "sm" })}>
              Show all topics
            </Link>
          </CardContent>
        </Card>
      ) : (
        groups.map((g) => {
          if (g.shown.length === 0) return null;
          const percent = Math.round((g.understood / g.total) * 100);
          return (
            <section key={g.subject} className="flex flex-col gap-3">
              <div className="flex flex-col gap-2">
                <div className="flex items-baseline justify-between gap-3">
                  <h2 className="text-lg font-semibold tracking-tight">{SUBJECTS[g.subject]}</h2>
                  <p className="text-sm text-muted-foreground">
                    {g.understood} of {g.total} understood
                  </p>
                </div>
                <div
                  role="progressbar"
                  aria-label={`${SUBJECTS[g.subject]} progress`}
                  aria-valuemin={0}
                  aria-valuemax={g.total}
                  aria-valuenow={g.understood}
                  aria-valuetext={`${g.understood} of ${g.total} understood`}
                  className="h-2 overflow-hidden rounded-full bg-muted"
                >
                  <div className="h-full rounded-full bg-green-600 transition-all" style={{ width: `${percent}%` }} />
                </div>
              </div>
              <ul className="flex flex-col gap-2">
                {g.shown.map((t) => (
                  <li key={t.id}>
                    <TopicItem topic={t} />
                  </li>
                ))}
              </ul>
            </section>
          );
        })
      )}
    </div>
  );
}
