# 16 — Plan study tasks

**What to build:** A logged-in learner opens the Study Planner from the
sidebar, adds study tasks (title, subject, due date and optional time,
priority, estimated minutes, notes) and sees them grouped into Overdue,
Today, Upcoming and Done. They can mark a task done with one tap and
undo it. Tutors don't get a planner.

**Blocked by:** None

**Status:** done

- [x] `study_tasks` is created from a numbered SQL file with RLS ON, with every rule the planner needs (so ticket 17 needs no new SQL)
- [x] Only the learner who created a task can read, edit or delete it; only learners can create tasks, for themselves
- [x] The database sets the owner, the completed time (filled when done, cleared on undo) and the dates
- [x] The form checks every field (title up to 100 characters, due date required, estimated minutes 5–600, notes up to 500) with friendly messages
- [x] Tasks are grouped into Overdue, Today, Upcoming and Done in Philippine time, with loading, empty and error states
- [x] Mark done and Undo work
- [x] Study Planner is no longer greyed out for learners; tutors don't see it
- [x] Works on a phone
- [x] Works on the live URL
