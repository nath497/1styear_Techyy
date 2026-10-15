# 08 — Completed sessions and commission

**What to build:** A tutor marks an accepted session Completed. The
database records the 10% commission exactly once (₱100 session → ₱10
TutorMatch, ₱90 tutor). The tutor's My sessions shows each split and a
total labelled "Recorded, not collected — no real money has moved."

**Blocked by:** 07

**Status:** todo

- [ ] Only the tutor can move a booking Accepted → Completed; a learner never can
- [x] `commission_records` is created from a numbered SQL file with RLS ON; nobody can insert, edit or delete rows through the app
- [x] Commission is in whole centavos, and commission + tutor amount always equals the price
- [ ] Completing the same booking twice never creates a second record
- [ ] Only the tutor on the booking can see its commission record
- [ ] Checked with a second learner account: they cannot see other people's bookings or any commission records
- [ ] Every table shows RLS enabled in the Supabase Table Editor
- [ ] The full 3-minute demo runs end to end on a phone, with real tutor profiles
- [ ] Works on the live URL
