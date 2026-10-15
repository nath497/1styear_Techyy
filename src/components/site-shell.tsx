import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";
import { MobileMenu, ProfileMenu, Sidebar, type Account } from "@/components/nav-links";
import { navFor } from "@/components/nav-items";
import { canPreviewSubscription } from "@/lib/subscription-access";

// The frame around every page: top bar, sidebar (desktop) or menu
// (phones), then the page itself. It checks who is logged in once, on
// the server.
export async function SiteShell({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let account: Account = null;
  if (user) {
    const { data } = await supabase.from("profiles").select("display_name, role").eq("id", user.id).maybeSingle();
    account = {
      name: data?.display_name ?? user.email ?? "You",
      role: data?.role === "tutor" ? "tutor" : "learner",
    };
  }
  // Only the yes/no answer goes to the menus — never the email or the list.
  const items = navFor(account, { subscriptionPreview: Boolean(user) && canPreviewSubscription(user?.email) });

  return (
    <>
      <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur">
        <div className="relative flex h-16 w-full items-center gap-2 px-4">
          <Link href="/" aria-label="TutorMatch home" className="mr-auto flex items-center gap-2 font-semibold">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <GraduationCap className="h-5 w-5" aria-hidden />
            </span>
            <span className="text-lg tracking-tight">TutorMatch</span>
          </Link>

          {account ? (
            <ProfileMenu account={account} />
          ) : (
            <>
              <Link href="/login" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "hidden md:inline-flex")}>
                Log in
              </Link>
              <Link href="/signup" className={buttonVariants({ size: "sm" })}>
                Sign up
              </Link>
            </>
          )}
          <MobileMenu items={items} account={account} />
        </div>
      </header>

      <div className="flex flex-1">
        <Sidebar items={items} />
        <div className="flex min-w-0 flex-1 flex-col">{children}</div>
      </div>
    </>
  );
}
