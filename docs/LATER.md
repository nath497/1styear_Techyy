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
- **Study Planner** — personal study tasks with due dates and priority.
- **LearnTrack** — topics marked Need to Review / Learning / Understood.
- **Reviews and ratings** — only for completed sessions, one per session.
- **Favourite tutors.**
- **Admin dashboard** — counts, commission totals, reports, moderation.
- **Profile photos.**
- **Forgot-password / password-reset flow.**
- **Dashboard charts** — earnings graphs and learning goals (the
  dashboards show counts and lists only).
- **Chat, messaging, video calls.**
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
- **Chatbox / messaging** — needs Supabase Realtime and careful RLS.
- **LearnTrack** — goals, topics, confidence, Learning Gap Finder,
  Next Best Study Step, progress over time.
- **Study Planner** — tasks, due dates, priorities, Smart Study
  Suggestions; connect to LearnTrack.
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
