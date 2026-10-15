# 05 — BudgetMatch and tutor page

**What to build:** On Find a Tutor, anyone (logged in or not) picks
subject, level, budget per session and mode, and sees only tutors who
fit, each with a "why it matches" line. Clicking a tutor opens their
tutor page.

**Blocked by:** 04

**Status:** todo

- [x] A tutor matches when they teach the subject and level, their rate is at or below the budget, and their mode fits (a "both" tutor fits online and face-to-face)
- [x] Each card shows name, subjects, rate, mode and a line like "₱100 ≤ your ₱100 budget · teaches Mathematics · face-to-face"
- [ ] Demo check: with Mathematics, College, ₱100, a ₱100 tutor appears and a ₱150 tutor does not
- [x] With no matches: "No tutors within ₱X yet — try raising your budget"
- [x] The tutor page shows bio, subjects, levels, rate, mode and availability, plus a Request a Session button that asks logged-out visitors to log in
- [ ] Works on a phone
- [ ] Works on the live URL
