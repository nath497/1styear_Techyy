# 06 — Send a session request

**What to build:** A logged-in learner sends a session request from a
tutor page: a subject from the tutor's list, a topic, and a date and
time. It appears as Pending on the learner's My sessions screen.

**Blocked by:** 05

**Status:** done

- [x] `bookings` is created from a numbered SQL file with RLS ON and no delete
- [x] The request form takes a subject from the tutor's list, a topic, and a future date and time
- [x] Only learners can send requests, only for themselves, always as Pending
- [x] The price is copied from the tutor's rate by the database, never sent from the browser
- [x] Only the learner and tutor on a booking can see it
- [x] The learner has a My sessions screen in the navigation, showing the tutor's name, subject, topic, date, price and status, with an empty state
- [x] Works on the live URL
