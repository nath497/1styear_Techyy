# 14 — Tutors message learners from help requests

**What to build:** A tutor who made an offer on a help request sees a
"Message [learner]" button on that request's page. It opens their
conversation with the learner, or starts one. Tutors can't start
conversations with learners they haven't offered to help.

**Blocked by:** 13

**Status:** todo

- [ ] A tutor can start a conversation only with a learner whose help request they made an offer on (enforced by the database)
- [ ] The button opens the existing conversation if there already is one
- [ ] Checked with a third account: they can't open, read or send to someone else's conversation
- [ ] `conversations` and `messages` show RLS enabled in the Supabase Table Editor
- [ ] The spec's chat demo checks pass on the live URL
- [ ] Works on a phone
- [ ] Works on the live URL
