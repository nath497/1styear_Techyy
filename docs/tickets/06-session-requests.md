# 06 — Session requests

**What to build:** A logged-in learner sends a session request from a
tutor page (subject, topic, date and time). It appears as Pending in
the learner's My sessions and in the tutor's My sessions, where the
tutor can accept or decline it. The learner can cancel while it is
Pending or Accepted.

**Blocked by:** 05

**Status:** todo

- [ ] `bookings` table created from a numbered SQL file, with RLS ON
- [ ] The price is copied from the tutor's rate by the database, not sent from the browser
- [ ] Only the learner and tutor on a booking can see it
- [ ] Status rules are enforced by the database: tutor pending → accepted/declined; learner pending/accepted → cancelled; nothing else
- [ ] Both My sessions screens show status clearly, with empty states for new users
- [ ] Works on the live URL
