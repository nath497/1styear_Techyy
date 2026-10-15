import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { logOut } from "@/app/auth-actions";

// The same top navigation on every page. It checks who is logged in on
// the server, so it shows Log in / Sign up or your name and Log out.
export async function SiteNav() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let displayName: string | null = null;
  let isTutor = false;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("display_name, role")
      .eq("id", user.id)
      .maybeSingle();
    displayName = data?.display_name ?? null;
    isTutor = data?.role === "tutor";
  }

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/90 backdrop-blur">
      <nav className="mx-auto flex h-16 w-full max-w-5xl items-center gap-2 px-4">
        <Link href="/" className="mr-auto flex items-center gap-2 font-semibold">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <GraduationCap className="h-5 w-5" aria-hidden />
          </span>
          <span className="text-lg tracking-tight">TutorMatch</span>
        </Link>

        <Link href="/tutors" className={buttonVariants({ variant: "ghost", size: "sm" })}>
          Find a Tutor
        </Link>

        {user ? (
          <>
            {isTutor && (
              <Link href="/tutor-profile" className={buttonVariants({ variant: "ghost", size: "sm" })}>
                My profile
              </Link>
            )}
            <span className="hidden max-w-40 truncate text-sm text-muted-foreground sm:inline">
              {displayName ?? user.email}
            </span>
            <form action={logOut}>
              <button type="submit" className={buttonVariants({ variant: "outline", size: "sm" })}>
                Log out
              </button>
            </form>
          </>
        ) : (
          <>
            <Link href="/login" className={buttonVariants({ variant: "ghost", size: "sm" })}>
              Log in
            </Link>
            <Link href="/signup" className={buttonVariants({ size: "sm" })}>
              Sign up
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
