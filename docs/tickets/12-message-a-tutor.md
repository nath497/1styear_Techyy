# 12 — Message a tutor

**What to build:** A logged-in learner taps "Message [tutor]" on a
tutor's page. That opens their conversation with that tutor, or starts
one (one per learner–tutor pair). The conversation page shows messages
oldest first, each with the sender's first name and time, and a box to
send a message. For now, new messages show after a refresh.

**Blocked by:** None

**Status:** done

- [x] `conversations` and `messages` are created from a numbered SQL file with RLS ON; no one can delete either
- [x] Only one conversation per learner–tutor pair; a learner can start one only for themselves, with a tutor who has a tutor profile
- [x] Only the two people in a conversation can read it or send to it
- [x] The sender is always the logged-in user (set by the database); no one can send as someone else
- [x] Messages are 1–1000 characters and not blank; they can't be edited or deleted
- [x] The conversation page shows messages oldest first with sender first name and time, with loading, empty and error states; a failed send says so and keeps the text to try again
- [x] Only display names are shown — never emails
- [x] Works on a phone
- [x] Works on the live URL
