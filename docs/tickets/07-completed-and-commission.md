# 07 — Completed sessions and commission

**What to build:** A tutor marks an accepted session Completed. The
database automatically records the 10% commission — e.g. ₱200 session,
₱20 TutorMatch, ₱180 tutor — exactly once. The tutor's My sessions
shows each split and a total labelled "Recorded, not collected — no
real money has moved."

**Blocked by:** 06

**Status:** todo

- [ ] Only the tutor can move a booking accepted → completed; a learner cannot
- [ ] `commission_records` created from a numbered SQL file, with RLS ON; nobody can insert or edit rows through the app
- [ ] Commission is calculated in whole centavos and commission + tutor amount always equals the price
- [ ] Completing the same booking twice never creates a second record
- [ ] Only the tutor on the booking can see its commission record
- [ ] Checked with a second learner account: they cannot see other people's bookings or commission records
- [ ] Every table shows RLS enabled in the Supabase Table Editor
- [ ] Works on the live URL
