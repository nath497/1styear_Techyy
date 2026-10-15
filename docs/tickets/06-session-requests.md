# 06 — Session requests

**What to build:** A logged-in learner sends a session request from a
tutor page. It shows as Pending on both people's My sessions screens.
The tutor accepts or declines it; the learner can cancel it while it is
Pending or Accepted.

**Blocked by:** 05

**Status:** todo

- [ ] `bookings` is created from a numbered SQL file with RLS ON and no delete
- [ ] The request form takes a subject from the tutor's list, a topic, and a future date and time
- [ ] Only learners can send requests, only for themselves, always as Pending
- [ ] The price is copied from the tutor's rate by the database, never sent from the browser
- [ ] Only the learner and tutor on a booking can see it
- [ ] The database only allows: tutor Pending → Accepted or Declined; learner Pending or Accepted → Cancelled
- [ ] Learner and tutor each have a My sessions screen in the navigation, showing the other person's name, subject, topic, date, price and status, with an empty state
- [ ] Works on the live URL
