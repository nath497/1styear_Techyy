# 13 — Live chat and the Messages list

**What to build:** New messages appear in an open conversation without
refreshing. A Messages page lists my conversations, newest activity
first, with the other person's name, the start of the latest message
and when it was sent. Messages is in the sidebar and phone menu for
learners and tutors.

**Blocked by:** 12

**Status:** todo

- [ ] Messages are switched on for Supabase Realtime from a numbered SQL file; no new keys or environment variables
- [ ] Both people see a new message appear without refreshing; people outside the conversation never receive it
- [ ] The database keeps each conversation's last-message time up to date; no one can change it by hand
- [ ] The Messages page lists only my conversations, newest first, with loading, empty and error states
- [ ] Messages is in the sidebar and phone menu for both roles (no longer greyed out)
- [ ] Works on a phone
- [ ] Works on the live URL
