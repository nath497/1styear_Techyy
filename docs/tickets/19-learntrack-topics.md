# 19 — LearnTrack: add topics and track understanding

**What to build:** a learner opens LearnTrack, adds the topics they're
studying (name, subject, optional note), and sees them grouped by
subject with a progress bar ("3 of 5 understood"). Each topic shows its
status — Need to Review, Learning or Understood, colour-coded — and one
tap changes it. The topics are stored in a new learn_topics table that
only their owner can see.

**Blocked by:** None.

**Status:** done

- [x] learn_topics exists with Row Level Security on and policies: only
      the owner reads and changes their topics; only learners can add
- [x] A learner adds a topic; it starts at Need to Review
- [x] Adding the same topic name twice in one subject is refused with a
      friendly message
- [x] Changing a topic's status takes one tap and the progress bar
      updates
- [x] Empty, loading and error states; tutors see a learners-only note
- [x] A second learner and a tutor can't see the first learner's topics
- [x] LearnTrack is no longer greyed out in the learner sidebar
- [x] Works on the live URL, on a phone
