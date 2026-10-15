# Spec: TutorMatch

## Problem
I'm a college **learner** stuck on Math, like Mathematics in the Modern
World. When I'm stuck, I study on my own, search online, or ask a
senior or friend I know, but they're often busy and I'm still stuck.
I'd pay a fellow student to explain it, but only within my budget
(₱100–₱150 a session).

## Solution
TutorMatch shows me student **tutors** who teach my subject, at my
level, in my preferred **mode**, and within my budget — and tells me
*why* each one matches (**BudgetMatch**). I send a **session request**
for a topic, date and time, and I can see when the tutor accepts. When
the session is completed, TutorMatch records a transparent 10%
**commission** so everyone can see how the price is split.

## The user
The **learner**: a college student in the Philippines like Josh,
Jamaica or Angel, struggling with a subject, with a tutoring budget of
around ₱100–₱150. Senior High learners can also use the app, but the
demo is built around Josh. Tutors are supporting users — they need a
profile and must respond to requests — but every screen exists to get
the learner from "stuck" to "session accepted".

## User stories
1. As a learner, I want to sign up and log in, so that my session
   requests are saved under my name.
2. As a tutor, I want to create and edit a profile with my subjects,
   levels, rate, mode and availability, so that learners can find me.
3. As a learner, I want to enter my subject, level, budget and mode and
   see only tutors who fit, with the reason they match, so that I don't
   waste time on tutors I can't afford.
4. As a learner, I want to send a session request with a topic, date
   and time, so that the tutor knows exactly what I need help with.
5. As a tutor, I want to accept or decline incoming requests, so that I
   only take sessions I can do.
6. As a learner, I want to see the status of my requests and cancel one
   that is still Pending or Accepted, so that I stay in control.
7. As a tutor, I want to mark a session completed and see the 10%
   commission and my share, clearly labelled as recorded and not
   collected, so that the platform's cut is transparent.

## Screens
1. **Home** — hero ("Learn from fellow students. Affordable. Flexible.
   Made for you."), how it works in 3 steps, the subject list, and
   **Find a Tutor** / **Become a Tutor** buttons. No pricing or FAQ.
2. **Sign up** — display name, email, password, "I am a Learner /
   Tutor", level (Senior High or College).
3. **Log in** — email and password. **Log out** is in the top
   navigation on every page.
4. **My tutor profile** (tutors only) — bio, subjects taught, levels
   taught, rate per session in ₱, mode (online / face-to-face / both),
   availability as text (e.g. "Weekdays after 4pm"). Create and edit.
5. **Find a Tutor (BudgetMatch)** — learner picks subject, level,
   budget per session and mode; matching tutor cards each show a "why
   it matches" line (e.g. "₱100 ≤ your ₱100 budget · teaches
   Mathematics · face-to-face"). Empty state: "No tutors within ₱X yet —
   try raising your budget." Browsing works without logging in.
6. **Tutor page** — full tutor profile plus a **Request a Session**
   form (subject from the tutor's list, topic, date and time). Asks the
   visitor to log in first if they are not.
7. **My sessions (learner)** — my requests with status (Pending /
   Accepted / Declined / Completed / Cancelled); **Cancel** while
   Pending or Accepted.
8. **My sessions (tutor)** — incoming requests with **Accept /
   Decline**; Accepted sessions have **Mark completed**; Completed
   sessions show "₱200 session → ₱20 TutorMatch (10%) → ₱180 you". A
   total at the top labelled **"Recorded, not collected — no real money
   has moved."**

Both My sessions screens group sessions under **Pending**, **Upcoming**
(Accepted) and **History** (Declined / Cancelled / Completed). Pending
and Upcoming are soonest first; History is most recent first.

Every screen has loading, empty and error states, works on a phone, and
uses the TutorMatch colours (primary purple #6D40F4, lavender #EDE9FE,
background #FAFAFF, white cards).

**Subjects (fixed list):** Mathematics, Science, English, Filipino,
Programming/ICT, Accounting/Business.

## Data
All money is stored as whole **centavos** (₱200 = 20000) to avoid
decimal rounding errors. Row Level Security is ON for every table.

**profiles** — one row per account.
- Columns: id (the Supabase Auth user id), display_name, role
  (`learner` or `tutor`), level (`shs` or `college`), created_at.
- Read: any logged-in user (so names show on sessions).
- Write: a user may create and update only their own row. The role
  cannot be changed after sign-up. There is no admin role.

**tutor_profiles** — the public listing for a tutor.
- Columns: tutor_id (the tutor's profile id), bio, subjects (list from
  the fixed subject list), levels (list of `shs` / `college`),
  rate_centavos (whole number, greater than 0), mode (`online`,
  `face_to_face` or `both`), availability (text), created_at,
  updated_at.
- Read: anyone, including logged-out visitors.
- Write: only the tutor themself, and only if their profile role is
  `tutor`.

**bookings** — a **session request**.
- Columns: id, learner_id, tutor_id, subject, topic, starts_at (date
  and time), price_centavos, status (`pending`, `accepted`, `declined`,
  `completed`, `cancelled`), created_at, updated_at.
- Read: only the learner and the tutor on that booking.
- Create: a logged-in learner, for themselves only, always as
  `pending`. The price is **copied from the tutor's current rate by the
  database**, never taken from the browser.
- No double-booking: a tutor can't have two active (Pending or
  Accepted) sessions that overlap. Every session counts as **1 hour**,
  so back-to-back sessions are fine. Enforced by the database, so
  simultaneous requests can't both get in; cancelling or declining
  frees the time.
- Update: only the status may change, and only along these paths:
  tutor `pending → accepted` or `pending → declined`; tutor
  `accepted → completed`; learner `pending → cancelled` or
  `accepted → cancelled`. A learner can never mark a booking completed.
  No one can delete bookings.

**commission_records** — the platform's recorded 10% share.
- Columns: id, booking_id (unique — one record per booking), tutor_id,
  price_centavos, commission_rate (10%), commission_centavos,
  tutor_amount_centavos, status (`recorded`), created_at.
- Commission is calculated in whole centavos; the tutor amount is the
  price minus the commission, so the two always add up exactly.
- Read: only the tutor on that booking.
- Write: **nobody through the app.** The database creates the record
  automatically when a booking becomes `completed`, and never twice for
  the same booking.

`recorded` means calculated and saved. It does **not** mean money was
collected from the learner or paid out to the tutor — that needs a
payment provider (see LATER.md).

## Login
Yes — the app needs accounts, because session requests belong to a
specific learner and tutor. Supabase Auth with email and password.
Sign-up asks for the role (learner or tutor). For the demo, **"Confirm
email" is turned off** in Supabase so sign-up doesn't stall on email
rate limits; re-enabling it is in LATER.md.

## Done for the demo
On the **live Vercel URL**, on a phone:
- [x] Home page loads and both buttons go somewhere real.
- [x] A tutor can sign up, create a profile, and edit it.
- [x] A logged-out visitor can use BudgetMatch and see matching tutors
      with a "why it matches" line, or the empty state.
- [x] A learner can sign up, log in, log out, and send a session
      request (shows as Pending).
- [x] The tutor sees the request and can accept or decline it.
- [x] The learner sees the new status and can cancel.
- [x] The tutor marks an accepted session completed, and the ₱/10%/
      tutor split appears, labelled "recorded, not collected".
- [x] A learner cannot see other people's bookings or any commission
      records (checked with a second learner account).
- [x] Every table shows RLS enabled in the Supabase Table Editor.
- [x] At least 2–3 real classmates have tutor profiles (no fake data).

## Stretch goal: Help Request Board

Built only after everything above works on the live URL. A **help
request** is a learner describing what they need help with, so tutors
can come to them. A **help offer** is a tutor's reply. Choosing an offer
never books anything — the learner then sends a normal **session
request**, so pricing, statuses and commission stay exactly as above.

### Stretch user stories
8. As a learner, I want to post what I need help with (subject, level,
   budget, mode and preferred time), so that tutors can come to me.
9. As a tutor, I want to browse open help requests and make an offer,
   so that I can find learners who need what I teach.
10. As a learner, I want to compare the offers on my request and choose
    one, so that I can then request a session with that tutor.

### Stretch screens
9. **Help Request Board** (logged-in tutors) — open help requests,
   newest first, filter by subject and level. Each card: subject,
   level, title, budget, mode, preferred time, the learner's first name
   and the number of offers.
10. **Post a help request** (learners) — title, details, subject,
    level, budget per session in ₱, mode, preferred days/times (text).
11. **My help requests** (learners) — my requests with status (Open /
    Matched / Cancelled) and offer count; **Cancel** while Open.
12. **Help request page** — the learner who posted it sees every offer:
    tutor name, the tutor's listed rate with a "within your budget" or
    "₱X over your budget" tag, proposed time and message, and **Choose
    this tutor** (marks the request Matched and links to that tutor's
    page to send a session request). A tutor sees the request and a
    **Send an offer** form (proposed time + short message), or "Your
    offer" if they already made one.

The navigation shows **Request Help** to learners and **Help Requests**
to tutors.

### Stretch data
**help_requests** — what a learner needs help with.
- Columns: id, learner_id, title, details, subject, level,
  budget_centavos (whole number, greater than 0), mode (`online` or
  `face_to_face`), preferred_time (text), status (`open`, `matched`,
  `cancelled`), chosen_offer_id, created_at, updated_at.
- Read: the learner who posted it; any logged-in tutor while it is
  `open`. Once `matched` or `cancelled`, only the learner and the tutors
  who made an offer on it.
- Create: a logged-in learner, for themselves only, always as `open`.
- Update: only the learner who posted it, and only `open → cancelled`,
  or `open → matched` by choosing an offer made on that request.
- No one can delete help requests.

**help_offers** — a tutor's reply to a help request.
- Columns: id, request_id, tutor_id, message, proposed_time (text),
  created_at.
- An offer has no price of its own: it shows the tutor's current listed
  rate, because that is what a session request will cost.
- Read: the tutor who wrote it, and the learner who owns the request.
- Create: a logged-in tutor with a tutor profile, for themselves only,
  only on an `open` request, at most one offer per tutor per request.
- No one can edit or delete offers.

### Stretch: done for the demo
- [x] A learner posts a help request; it appears on the tutors' board.
- [x] A tutor makes an offer; the learner sees it with the right
      budget tag.
- [x] The learner chooses the offer (request shows Matched) and then
      sends a session request to that tutor.
- [x] A second learner cannot see the first learner's help requests or
      offers, and help_requests / help_offers show RLS enabled.

## Stretch: Dashboards

Each role gets its own home page after logging in, so learners and
tutors only see what matters to them. Built from existing data only —
no new tables, no invented numbers.

- **Learner dashboard** — greeting and today's date; Find a Tutor and
  Request Help buttons; counts of pending, upcoming and completed
  sessions; next upcoming and pending sessions; BudgetMatch suggestions
  based on their latest help request (or a button to start
  BudgetMatch); their latest help requests with status.
- **Tutor dashboard** — greeting and today's date; Manage Tutor Profile
  and Find Help Requests buttons; counts of pending, upcoming and
  completed sessions and recorded earnings (labelled "recorded, not
  collected"); requests waiting for an answer with Accept / Decline;
  upcoming sessions; open help requests that fit their subjects,
  levels, rate and mode, with why; a profile checklist.
- Logged-out visitors are sent to log in; each role can only open its
  own dashboard (checked on the server from the database role).

## Out of scope
- Subscriptions, pricing page, TutorMatch Plus / Tutor Pro
- Real payments, collection and payouts
- Study Planner, LearnTrack
- Reviews and ratings, favourite tutors
- Admin dashboard, reports, moderation
- Profile photos
- Forgot-password / password-reset flow
- Email confirmation on sign-up (off for the demo)
- Dashboard charts and earnings graphs
- Chat, messaging, video calls
