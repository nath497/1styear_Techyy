# 24 — Schedule: plan study activities without clashes

**What to build:** in the Schedule tab a learner adds study activities —
title, subject, date, start and end time, optional notes — and sees them
for this week and next, grouped by day, with their accepted tutoring
sessions shown read-only. They can edit and delete activities. Two of
their own activities can't overlap; overlapping a tutoring session is
allowed with a warning. The Overview shows the next activity.

**Blocked by:** 22

**Status:** done

- [x] Adding, editing and deleting an activity work; mistakes keep what
      was typed and show a friendly error
- [x] An end time before the start time is refused
- [x] An activity that clashes with another is refused with "clashes
      with …" (checked on the database, not just the screen)
- [x] Overlapping a tutoring session shows a warning but saves
- [x] This week and next are listed by day, with sessions shown
- [x] The Overview shows the next activity
- [x] A second learner and a tutor can't see the activities
- [x] Works on the live URL, on a phone
