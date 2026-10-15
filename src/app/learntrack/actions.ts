"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isTopicStatus, parseTopicForm } from "@/lib/learntrack";
import { isUuid, SUBJECTS } from "@/lib/tutormatch";

export type TopicFormState = { error?: string; saved?: number };

// Add a topic. The database sets the owner and the dates, starts it at
// Need to Review, and only lets learners add topics (SQL 016).
export async function addTopic(_prev: TopicFormState, formData: FormData): Promise<TopicFormState> {
  const parsed = parseTopicForm(formData);
  if ("error" in parsed) return { error: parsed.error };

  const supabase = await createClient();
  const { error } = await supabase.from("learn_topics").insert(parsed.topic);
  if (error) {
    console.error("LearnTrack: add failed", error.code, error.message);
    if (error.code === "23505")
      return { error: `You already have "${parsed.topic.name}" in ${SUBJECTS[parsed.topic.subject]}.` };
    if (error.code === "42501") return { error: "Only learner accounts can use LearnTrack." };
    return { error: "We couldn't add the topic. Please try again." };
  }

  revalidatePath("/learntrack");
  return { saved: Date.now() };
}

// Change a topic's status in one tap. Row Level Security means a learner
// can only change their own topics.
export async function setTopicStatus(_prev: TopicFormState, formData: FormData): Promise<TopicFormState> {
  const topicId = String(formData.get("topic_id") ?? "");
  const status = formData.get("status");
  if (!isUuid(topicId) || !isTopicStatus(status)) return { error: "Something went wrong. Please refresh." };

  const supabase = await createClient();
  const { data, error } = await supabase.from("learn_topics").update({ status }).eq("id", topicId).select("id");
  if (error) {
    console.error("LearnTrack: status change failed", error.code, error.message);
    return { error: "We couldn't update the topic. Please try again." };
  }
  if (!data || data.length === 0) return { error: "You can't change this topic. Please refresh." };

  revalidatePath("/learntrack");
  return { saved: Date.now() };
}
