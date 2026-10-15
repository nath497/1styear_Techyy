# Later

Good ideas that are not in the MVP.

Parking something here is a decision, not a loss. It is how the MVP
stays small enough to actually ship by Session 3.


## Parked from the TutorMatch MVP (grill session, 2026-10-15)

- **Help Request Board with tutor offers** — first stretch goal, only
  if the core flow is live on Vercel by ~1:30 PM.
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
- **Full dashboards** — earnings charts, profile completeness, learning
  goals (MVP has a simple "My sessions" list).
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
- **Learner dashboard with stat tiles** (upcoming, active, completed,
  average rating) — My sessions covers the MVP.
- **Send a Message** button and notification bell — need Chat (above).
- **Mon–Fri availability grid** — availability is free text today.
- **Help Request Board** and **LearnTrack** screens — already parked above.
- **Text search box** ("e.g. Mathematics, Programming") — the home
  search uses the subject list instead, which BudgetMatch understands.

## Parked from the "master prompt" (2026-10-15)

The team approved Phase 1 + 2 only (phone menu, marketplace search,
filters, sorting, Budget Breakdown, smarter empty states — no SQL).
Everything below needs new tables and a spec update first
(`/to-spec`, then `/to-tickets`). The Help Request Board is the first
stretch goal if there is time.

- **Help Request Board + tutor offers + Help Request Match Score.**
- **Chatbox / messaging** — needs Supabase Realtime and careful RLS.
- **LearnTrack** — goals, topics, confidence, Learning Gap Finder,
  Next Best Study Step, progress over time.
- **Study Planner** — tasks, due dates, priorities, Smart Study
  Suggestions; connect to LearnTrack.
- **Trust Score + Trust Breakdown** — only from real data (profile
  completeness, completed sessions); "Not enough data yet" otherwise.
- **Learner and tutor dashboards** — wait until there's more to show
  than My sessions already does.
- **Sidebar navigation** — the top bar + phone menu covers today's pages;
  revisit when the new pages above exist.
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
