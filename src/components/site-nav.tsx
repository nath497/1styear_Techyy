import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { logOut } from "@/app/auth-actions";
import { DesktopNavLinks, MobileMenu, type NavItem } from "@/components/nav-links";

// The same top navigation on every page. It checks who is logged in on
// the server and shows only the links that make sense for them. (Hiding
// a link is just tidiness — the pages and the database do the real
// permission checks.)
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
    displayName = data?.display_name ?? user.email ?? "you";
    isTutor = data?.role === "tutor";
  }

  const items: NavItem[] = [
    { href: "/", label: "Home" },
    { href: "/tutors", label: "Find a Tutor" },
    ...(!user ? [{ href: "/signup?role=tutor", label: "Become a Tutor" }] : []),
    ...(user ? [{ href: "/sessions", label: "My sessions" }] : []),
    ...(isTutor ? [{ href: "/tutor-profile", label: "My profile" }] : []),
  ];

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/90 backdrop-blur">
      <nav className="relative mx-auto flex h-16 w-full max-w-5xl items-center gap-2 px-4">
        <Link href="/" aria-label="TutorMatch home" className="mr-auto flex items-center gap-2 font-semibold">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <GraduationCap className="h-5 w-5" aria-hidden />
          </span>
          <span className="text-lg tracking-tight">TutorMatch</span>
        </Link>

        {/* Desktop and tablet */}
        <div className="hidden items-center gap-1 md:flex">
          <DesktopNavLinks items={items} />
          {user ? (
            <>
              <span className="ml-2 max-w-40 truncate text-sm text-muted-foreground">{displayName}</span>
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
        </div>

        {/* Phones */}
        {!user && (
          <Link href="/signup" className={buttonVariants({ size: "sm", className: "md:hidden" })}>
            Sign up
          </Link>
        )}
        <MobileMenu items={items} userName={user ? displayName : null} />
      </nav>
    </header>
  );
}
