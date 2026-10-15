# 27 — Subscription preview: plans page for preview accounts

**What to build:** accounts on a private preview list (a Vercel setting,
starting with the team's preview account) can open a Subscription page
with three plan cards — Free (₱0), TutorMatch Plus (₱99/month, learners)
and Tutor Pro (₱149/month, tutors) — each listing its planned benefits,
with a clear "Prototype" label and the plan for their role highlighted.
Subscribe only shows "This is a prototype. Payments aren't live yet, and
nothing was charged." Everyone else still sees "Soon" in the sidebar and
a "coming soon" page at the address. No database changes.

**Blocked by:** None.

**Status:** done

- [x] The preview list is a private Vercel setting, checked on the
      server; no email appears in the code or the browser
- [x] The preview account sees Subscription unlocked in the sidebar and
      all three plans, with their role's plan highlighted
- [x] Subscribe shows the prototype message; nothing is charged or saved
- [x] Any other account (and logged-out visitors) sees "Soon" in the
      sidebar and "coming soon" at the address
- [x] Works on the live URL, on a phone
