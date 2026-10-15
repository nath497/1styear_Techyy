import { redirect } from "next/navigation";
import { spaceHref } from "@/lib/learning-space";

// LearnTrack now lives in My Learning Space (ticket 21). Old links and
// bookmarks land on its LearnTrack tab, keeping any filter.
export default async function LearnTrackRedirect({ searchParams }: PageProps<"/learntrack">) {
  const { status } = await searchParams;
  redirect(spaceHref("learntrack", { status: typeof status === "string" ? status : undefined }));
}
