"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { LEVELS, MODES, SUBJECTS } from "@/lib/tutormatch";

export type ProfileFormState = { error?: string; message?: string };

export async function saveTutorProfile(
  _prev: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const bio = String(formData.get("bio") ?? "").trim();
  const availability = String(formData.get("availability") ?? "").trim();
  const mode = String(formData.get("mode") ?? "");
  const rate = String(formData.get("rate") ?? "").trim();
  // Checkboxes send one value per ticked box; keep only values from our lists.
  const subjects = formData.getAll("subjects").map(String).filter((s) => s in SUBJECTS);
  const levels = formData.getAll("levels").map(String).filter((l) => l in LEVELS);

  if (subjects.length === 0) return { error: "Tick at least one subject you teach." };
  if (levels.length === 0) return { error: "Tick at least one level you teach." };
  if (!(mode in MODES)) return { error: "Choose online, face-to-face, or both." };
  if (bio.length > 1000) return { error: "Please keep your bio under 1000 characters." };
  if (availability.length > 200) return { error: "Please keep availability under 200 characters." };

  // The rate is typed in pesos ("150" or "150.50") and saved as whole
  // centavos (15000 or 15050), so there are never rounding errors.
  if (!/^\d+(\.\d{1,2})?$/.test(rate)) return { error: "Enter your rate in pesos, e.g. 150." };
  const rateCentavos = Math.round(Number(rate) * 100);
  if (rateCentavos <= 0) return { error: "Your rate must be more than ₱0." };
  if (rateCentavos > 1_000_000) return { error: "Please enter a rate of ₱10,000 or less." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please log in again." };

  // Creates the listing the first time, updates it after that. The
  // database's RLS policies only allow this for your own row, and only
  // if your role is tutor — even if someone bypasses this form.
  const { error } = await supabase.from("tutor_profiles").upsert({
    tutor_id: user.id,
    bio,
    subjects,
    levels,
    rate_centavos: rateCentavos,
    mode,
    availability,
  });

  if (error) {
    console.error("Tutor profile: could not save", error);
    return { error: "We couldn't save your profile. Please try again." };
  }

  revalidatePath("/tutor-profile");
  revalidatePath("/tutors");
  return { message: "Saved! Learners can now find you on Find a Tutor." };
}
