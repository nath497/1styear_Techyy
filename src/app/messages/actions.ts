"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isUuid } from "@/lib/tutormatch";

export type ChatFormState = { error?: string };

// "Message [tutor]": open the conversation with this tutor, or start one.
// One conversation per learner–tutor pair (SQL 010).
export async function messageTutor(_prev: ChatFormState, formData: FormData): Promise<ChatFormState> {
  const tutorId = String(formData.get("tutor_id") ?? "");
  if (!isUuid(tutorId)) return { error: "Something went wrong. Please refresh." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please log in again." };

  const find = () =>
    supabase.from("conversations").select("id").eq("learner_id", user.id).eq("tutor_id", tutorId).maybeSingle();

  let { data: existing } = await find();
  if (!existing) {
    const { error } = await supabase.from("conversations").insert({ learner_id: user.id, tutor_id: tutorId });
    // 23505 = it was just created (e.g. a double tap) — fine, open it.
    if (error && error.code !== "23505") {
      console.error("Message a tutor: could not start conversation", error.code, error.message);
      if (error.code === "42501") return { error: "Only learner accounts can start a conversation with a tutor." };
      return { error: "We couldn't open the chat. Please try again." };
    }
    ({ data: existing } = await find());
  }
  if (!existing) return { error: "We couldn't open the chat. Please try again." };

  redirect(`/messages/${existing.id}`);
}

export type SendState = { error?: string; sentAt?: number };

// Send one message. The database sets who sent it and when, and checks
// you're in the conversation (SQL 010).
export async function sendMessage(_prev: SendState, formData: FormData): Promise<SendState> {
  const conversationId = String(formData.get("conversation_id") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  if (!isUuid(conversationId)) return { error: "Something went wrong. Please refresh." };
  if (!body) return { error: "Type a message first." };
  if (body.length > 1000) return { error: "Please keep messages under 1000 characters." };

  const supabase = await createClient();
  const { error } = await supabase.from("messages").insert({ conversation_id: conversationId, body });

  if (error) {
    console.error("Send a message: insert failed", error.code, error.message);
    if (error.code === "42501") return { error: "You can't send messages in this conversation." };
    return { error: "Your message didn't send. Please try again." };
  }

  // Refresh the chat and the inbox order (the other person's screen
  // updates through Realtime).
  revalidatePath("/messages", "layout");
  return { sentAt: Date.now() };
}
