import type { Account, NavItem } from "@/components/nav-links";

// Which pages each kind of visitor sees. Pages marked `soon` aren't built
// yet (see docs/LATER.md and the spec's stretch goal) — they show greyed
// out, so the menu never leads to a missing page.
// Hiding a link is only tidiness: each page and the database do the real
// permission checks.
export function navFor(account: Account): NavItem[] {
  if (!account) {
    return [
      { href: "/", label: "Home", icon: "home" },
      { href: "/tutors", label: "Find a Tutor", icon: "search" },
      { href: "/signup?role=tutor", label: "Become a Tutor", icon: "join" },
    ];
  }
  if (account.role === "tutor") {
    return [
      { href: "/dashboard/tutor", label: "Dashboard", icon: "dashboard" },
      { href: "/tutors", label: "Find a Tutor", icon: "search" },
      { href: "/help-requests", label: "Find Help Requests", icon: "help" },
      { href: "/sessions", label: "My Sessions", icon: "sessions" },
      { href: "/messages", label: "Messages", icon: "chat" },
      { href: "/tutor-profile", label: "My Profile", icon: "profile" },
      { href: "/subscription", label: "Subscription", icon: "subscription", soon: true },
    ];
  }
  return [
    { href: "/dashboard/learner", label: "Dashboard", icon: "dashboard" },
    { href: "/tutors", label: "Find a Tutor", icon: "search" },
    { href: "/help-requests", label: "Request Help", icon: "help" },
    { href: "/sessions", label: "My Sessions", icon: "sessions" },
    { href: "/messages", label: "Messages", icon: "chat" },
    { href: "/planner", label: "Study Planner", icon: "planner" },
    { href: "/learntrack", label: "LearnTrack", icon: "learntrack", soon: true },
    { href: "/subscription", label: "Subscription", icon: "subscription", soon: true },
    { href: "/profile", label: "Profile", icon: "profile", soon: true },
  ];
}
