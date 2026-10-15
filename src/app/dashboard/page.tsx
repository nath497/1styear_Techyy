import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// /dashboard sends each person to their own dashboard, using the role
// stored in the database (never anything from the browser).
export default async function DashboardRedirect() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  redirect(profile?.role === "tutor" ? "/dashboard/tutor" : "/dashboard/learner");
}
