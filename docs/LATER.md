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
  Tutor Pro (₱149/month), demo entitlements. (A preview page for one
  account is now in the spec as a prototype.)
- **Real payments** — payment collection and tutor payouts need a
  payment provider.
- **LearnTrack** — topics marked Need to Review / Learning / Understood. (Now in the spec as a stretch goal.)
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
- **LearnTrack** screens — now in the spec as a stretch goal.

## Parked from the "master prompt" (2026-10-15)

The team approved Phase 1 + 2 only (phone menu, marketplace search,
filters, sorting, Budget Breakdown, smarter empty states — no SQL).
Everything below needs new tables and a spec update first
(`/to-spec`, then `/to-tickets`). (The Help Request Board, the first
stretch goal, has since been built.)

- **Help Request Match Score** (the board itself is built).
- **LearnTrack** (the topic list is now in the spec) — goals, confidence, Learning Gap Finder,
  Next Best Study Step, progress over time.
- **Smart Study Suggestions** for the Study Planner (the planner itself
  is in the spec as a stretch goal).
- **Trust Score + Trust Breakdown** — only from real data (profile
  completeness, completed sessions); "Not enough data yet" otherwise.
- **Subscription page** — now in the spec as a preview prototype.
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
- **Linking tasks to LearnTrack topics** (LearnTrack itself is now in
  the spec).
- **A planner for tutors.**

## Parked from the LearnTrack and Profile spec (2026-10-15)

- **Learning goals** (e.g. "finish Algebra by November").
- **Learning Gap Finder** and **Next Best Study Step** suggestions.
- **Progress-over-time charts** — LearnTrack shows today's progress bar
  per subject only.
- **Tutors seeing a learner's LearnTrack** — it stays private for now.
- **Changing your email or password** from the Profile page.
- **Deleting your account.**
- **A bio or school for learners.**
- **Profile photos** — already parked above.

## Parked from the My Learning Space spec (2026-10-16)

- **Tutors seeing a learner's session questions** — notes stay private
  to the learner for now.
- **Time-based goals** ("study English 30 minutes a day") — goals count
  linked tasks only.
- **Reminders and notifications** for tasks, activities and sessions.
- **Calendar sync** (Google Calendar etc.) and a **drag-and-drop
  calendar** — the Schedule is a simple two-week list.
- **Recurring activities** ("every Monday").
- **Achievements and badges.**
- **Linking a session note to specific LearnTrack topics** (beyond
  inserting their names as text).

## Parked from the Subscription preview spec (2026-10-16)

- **Real payments** (GCash, cards) — needs a payment provider.
- **Switching plan benefits on** (priority help requests, featured
  tutors, badges, reminders, earnings reports).
- **Invoices and receipts.**
- **Cancelling or changing a plan.**
- **An admin screen to manage preview accounts** — for now they're a
  Vercel setting.
