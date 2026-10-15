# 22 — Study Tasks: In Progress, Description and the priority filter

**What to build:** a learner's study tasks can be To Do, In Progress or
Completed. "Notes" is called Description. Tasks can be filtered by
priority as well as subject and status. This ticket also adds the one
database change for all of My Learning Space (SQL 017): the new task
status and goal link, plus the study_activities, learning_goals and
session_notes tables, each with Row Level Security and explicit
policies.

**Blocked by:** 21

**Status:** done

- [x] SQL 017 runs with no errors; study_activities, learning_goals and
      session_notes show RLS enabled
- [x] A task moves To Do → In Progress → Completed, and back
- [x] In Progress tasks stay in their Overdue / Today / Upcoming group,
      marked clearly
- [x] The priority filter works with the subject and status filters,
      with a way to reset
- [x] The Overview and dashboard still count tasks correctly
- [x] A second learner and a tutor still can't see or change the tasks
- [x] Works on the live URL, on a phone
