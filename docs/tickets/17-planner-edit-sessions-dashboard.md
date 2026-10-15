# 17 — Edit, delete, sessions and the dashboard card

**What to build:** A learner can edit or delete their study tasks,
filter the planner by subject and status, and see their accepted
tutoring sessions on their dates alongside their tasks. The learner
dashboard shows a "Today's study tasks" card with a quick Mark done,
once they have tasks.

**Blocked by:** 16

**Status:** done

- [x] Edit a task (same checks as adding); Delete asks "are you sure?" first
- [x] Filters by subject and status work, with an empty state when nothing matches
- [x] The learner's own Accepted tutoring sessions appear on their dates as read-only "Session with [tutor]" rows
- [x] The learner dashboard shows up to 3 tasks due today or overdue with Mark done, only when there are tasks
- [x] Checked with a second learner and a tutor: they can't see the first learner's tasks; `study_tasks` shows RLS enabled
- [x] The spec's Study Planner demo checks pass on the live URL
- [x] Works on a phone
- [x] Works on the live URL
