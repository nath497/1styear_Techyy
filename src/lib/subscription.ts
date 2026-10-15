// Subscription preview (ticket 27). A PROTOTYPE: the plans are fixed text,
// nothing is charged and nothing is saved. Benefits are planned features,
// not live ones — the page says so.

export type Plan = {
  id: "free" | "plus" | "pro";
  name: string;
  price: string; // shown as-is, e.g. "₱49"
  per: string; // "/month", or "" for free
  forWhom: string;
  role: "learner" | "tutor" | null; // whose plan it is (null = everyone)
  benefits: string[];
};

export const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    price: "₱0",
    per: "",
    forWhom: "Everyone",
    role: null,
    benefits: [
      "Find tutors with BudgetMatch",
      "Request sessions and chat",
      "Help Request Board",
      "My Learning Space",
    ],
  },
  {
    id: "plus",
    name: "TutorMatch Plus",
    price: "₱49",
    per: "/month",
    forWhom: "For learners",
    role: "learner",
    benefits: [
      "Everything in Free",
      "Priority on the Help Request Board",
      "Unlimited LearnTrack topics",
      "Session reminders",
    ],
  },
  {
    id: "pro",
    name: "Tutor Pro",
    price: "₱99",
    per: "/month",
    forWhom: "For tutors",
    role: "tutor",
    benefits: ["Everything in Free", "Featured spot on Find a Tutor", "Profile badge", "Earnings reports"],
  },
];

// Is this email on the preview list? The list is a comma-separated
// setting; spaces and capital letters don't matter. An empty list lets
// no one in.
export function isPreviewEmail(email: string | null | undefined, list: string | undefined) {
  if (!email || !list) return false;
  const wanted = email.trim().toLowerCase();
  return list
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .some((e) => e !== "" && e === wanted);
}
