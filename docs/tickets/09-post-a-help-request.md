# 09 — Post a help request

**What to build:** A logged-in learner posts what they need help with —
title, details, subject, level, budget per session in ₱, mode and
preferred days/times. It appears on their My help requests page as
Open, and they can cancel it while it is
Open. The learners' Request Help link in the navigation goes live.

**Blocked by:** None

**Status:** todo

- [ ] `help_requests` is created from a numbered SQL file with RLS ON and no delete
- [ ] Only learners can post, only for themselves, always as Open; the budget is saved as whole centavos and must be above ₱0
- [ ] The form checks every field and shows friendly errors
- [ ] My help requests shows title, subject, level, budget, mode, preferred time and status, with loading, empty and error states (the offer count arrives with offers in ticket 10)
- [ ] The learner can Cancel an Open request (with a confirmation); the database allows only Open → Cancelled by its owner here
- [ ] Request Help is no longer greyed out for learners
- [ ] Works on a phone
- [ ] Works on the live URL
