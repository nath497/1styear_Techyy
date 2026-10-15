# Later

Good ideas that are not in the MVP.

Parking something here is a decision, not a loss. It is how the MVP
stays small enough to actually ship by Session 3.

**Since built** (moved into docs/SPEC.md, so no longer parked): the
Help Request Board with tutor offers; learner and tutor dashboards
(with stat tiles and a tutor profile checklist); the sidebar; keyword
search on Find a Tutor.


## Parked from the TutorMatch MVP (grill session, 2026-10-15)

- **Subscriptions** — pricing page, TutorMatch Plus (₱99/month) and
  Tutor Pro (₱149/month), demo entitlements. Show as a pitch slide.
- **Real payments** — payment collection and tutor payouts need a
  payment provider.
- **LearnTrack** — topics marked Need to Review / Learning / Understood.
- **Reviews and ratings** — only for completed sessions, one per session.
- **Favourite tutors.**
- **Admin dashboard** — counts, commission totals, reports, moderation.
- **Profile photos.**
- **Forgot-password / password-reset flow.**
- **Dashboard charts** — earnings graphs and learning goals (the
  dashboards show counts and lists only).
- **Video calling built into TutorMatch.** (Text chat and video call
  links are in the spec as stretch goals.)
- **Email confirmation on sign-up** — turned off for the demo because
  Supabase's built-in email has a low hourly limit. Turn it back on
  (with a real email provider) before real users.

## Parked from the UI design mock-up (2026-10-15)

The team chose "look only": restyle existing pages with real data.
These parts of the mock-up need features or data TutorMatch doesn't
have yet, so showing them now would mean fake numbers.

- **Star ratings, review counts, session counts, "Verified" badges** —
  need Reviews (above) and a verification process first.
- **Profile photos** — pages use initials in a coloured circle for now.
- **Average rating** on the learner dashboard — needs Reviews first.
- **Send a Message** button and notification bell — need Chat (above).
- **Mon–Fri availability grid** — availability is free text today.
- **LearnTrack** screens — already parked above.

## Parked from the "master prompt" (2026-10-15)

The team approved Phase 1 + 2 only (phone menu, marketplace search,
filters, sorting, Budget Breakdown, smarter empty states — no SQL).
Everything below needs new tables and a spec update first
(`/to-spec`, then `/to-tickets`). (The Help Request Board, the first
stretch goal, has since been built.)

- **Help Request Match Score** (the board itself is built).
- **LearnTrack** — goals, topics, confidence, Learning Gap Finder,
  Next Best Study Step, progress over time.
- **Smart Study Suggestions** for the Study Planner (the planner itself
  is in the spec as a stretch goal).
- **Trust Score + Trust Breakdown** — only from real data (profile
  completeness, completed sessions); "Not enough data yet" otherwise.
- **Subscription page** — information only, no payments (pitch slide).
- **Availability filter** — needs structured availability (days/times),
  not today's free text.
- **Session Preparation Notes, Post-Session Reflection, Study Buddy
  Path, Achievement Milestones.**

## Parked from the Help Request Board spec (2026-10-15)

- **Custom offer prices** — offers use the tutor's listed rate for now.
- **Editing a help request** — cancel and post a new one instead.
- **Help Request Match Score** — offers show a plain budget tag instead.
- **Tutors withdrawing an offer.**
- **Closing a help request automatically** when the session is booked.

## Parked from the Chat spec (2026-10-15)

- **Blocking and reporting users** — needs moderation tools to be safe.
- **Read receipts and typing indicators.**
- **Attachments** (photos, files).
- **Group chats.**
- **Message notifications** (emails, push) when you're not on the page.

## Parked from the Video call links spec (2026-10-15)

- **Built-in video calling** (WebRTC, like FaceTime inside TutorMatch) —
  needs a relay (TURN) server to work on school wifi and mobile data,
  which costs money or hosting, plus ringing, hang-up and reconnecting.
- **Automatically created meeting rooms** (e.g. Jitsi) — a new outside
  service; tutors paste their own link instead.
- **Call reminders** before a session starts.
- **Recording online/face-to-face on each session** — today the tutor
  just doesn't add a link for face-to-face sessions.

## Parked from the Study Planner spec (2026-10-15)

- **Smart Study Suggestions** — breaking a big goal into smaller tasks.
- **Reminders and notifications** for tasks that are due.
- **Recurring tasks** (e.g. "every Monday").
- **Linking tasks to LearnTrack** — LearnTrack doesn't exist yet.
- **A planner for tutors.**
