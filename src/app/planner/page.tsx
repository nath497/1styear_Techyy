import { redirect } from "next/navigation";
import { spaceHref } from "@/lib/learning-space";

// The Study Planner now lives in My Learning Space (ticket 21). Old links
// and bookmarks land on its Study Tasks tab, keeping any filters.
export default async function StudyPlannerRedirect({ searchParams }: PageProps<"/planner">) {
  const { subject, status } = await searchParams;
  redirect(
    spaceHref("tasks", {
      subject: typeof subject === "string" ? subject : undefined,
      status: typeof status === "string" ? status : undefined,
    }),
  );
}
