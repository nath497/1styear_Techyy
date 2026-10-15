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
   Made for you.") with an icon illustration, how it works in 3 steps,
   an "I'm looking for help with…" search card (subject, budget, level,
   mode) that opens Find a Tutor filled in, the subject list, and
   **Find a Tutor** / **Become a Tutor** buttons. No pricing or FAQ.
2. **Sign up** — display name, email, password, "I am a Learner /
   Tutor", level (Senior High or College).
3. **Log in** — email and password; you land on your own dashboard.
   **Log out** is one tap away on every page: in the profile menu (your
   initials, top right) on desktop, and in the Menu on phones.
4. **My tutor profile** (tutors only) — bio, subjects taught, levels
   taught, rate per session in ₱, mode (online / face-to-face / both),
   availability as text (e.g. "Weekdays after 4pm"). Create and edit.
5. **Find a Tutor (BudgetMatch)** — search by tutor name or keyword,
   plus optional subject, level, mode, minimum price and budget per
   session (the maximum); sort by best match, lowest price or newest;
   **Reset filters**. Every filter you fill in applies together, and a
   tutor over your budget is never shown. Tutor cards show initials,
   subjects, levels, mode, intro, availability, price, a "Within budget"
   tag and a "why it matches" line (e.g. "₱100 ≤ your ₱120 budget (₱20
   to spare) · teaches Mathematics · face-to-face"). Empty state: "No
   tutors within ₱X yet — try raising your budget." when the budget is
   what's in the way, otherwise "No tutors match all your filters yet.",
   plus which filter is limiting results (from real listings). Browsing
   works without logging in.
6. **Tutor page** — full tutor profile, a **Budget breakdown** (you
   pay the listed price, ₱0 extra; TutorMatch's 10% comes from the
   tutor's side and is recorded, not collected), and a **Request a
   Session** form (subject from the tutor's list, topic, date and time).
   Asks the visitor to log in first if they are not.
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

**Navigation:** a sidebar on desktop and a Menu button on phones,
built per role on the server — logged-out visitors see Home, Find a
Tutor and Become a Tutor; learners and tutors see their own Dashboard
first and only their own tools. Planned features from LATER.md
(LearnTrack, Subscription, account Profile) show greyed
out with a "Soon" tag and can't be clicked. Hiding a link is only
tidiness; pages and the database do the real permission checks.

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

## Stretch goal: Chat

Learners and tutors can message each other inside TutorMatch, so they
can ask questions before a **session request** without sharing phone
numbers or emails. Text only. Messages appear without refreshing.

### Chat user stories
11. As a learner, I want to message a tutor before I request a session,
    so that I can check they can help with my topic.
12. As a tutor, I want to message a learner about their help request,
    so that I can understand what they need before they choose.

### Chat screens
13. **Messages** (learners and tutors) — my conversations, newest
    activity first: the other person's name, the start of the latest
    message and when it was sent; an empty state when there are none.
    **Messages** is in the sidebar and phone menu for both roles.
14. **Conversation** — messages oldest first, mine on one side, each
    with the sender's first name and time; a box to send a message (up
    to 1000 characters). New messages appear without refreshing. If a
    message fails to send, it says so and lets you try again.
15. A **"Message [tutor]"** button on each tutor page, for logged-in
    learners — opens the conversation, or starts one.
16. A **"Message [learner]"** button on a help request page, for a tutor
    who made an offer on it.

Only display names are shown — never emails or phone numbers.

### Chat data
**conversations** — one per learner–tutor pair.
- Columns: id, learner_id, tutor_id, created_at, last_message_at. Only
  one conversation per learner–tutor pair.
- Read: only the learner and the tutor in it.
- Create: a logged-in learner, for themselves, with any tutor who has a
  tutor profile; or a logged-in tutor, for themselves, only with a
  learner whose help request they made an offer on.
- Update: only `last_message_at`, set by the database when a message
  arrives. No one can delete conversations.

**messages** — what people say.
- Columns: id, conversation_id, sender_id, body (1–1000 characters,
  not blank), created_at.
- Read: only the two people in that conversation.
- Create: only someone in that conversation, and the sender is always
  the logged-in user (set by the database), so no one can send as
  someone else.
- No one can edit or delete messages.
- Messages are switched on for Supabase Realtime so they appear without
  refreshing; Row Level Security still decides who receives each one.

### Chat: done for the demo
- [x] A learner messages a tutor from the tutor page; the tutor replies;
      both see the messages appear without refreshing.
- [x] A tutor who offered on a help request messages that learner.
- [x] A third account cannot open or send to their conversation.
- [x] No one can send a message as someone else; conversations and
      messages show RLS enabled.

## Stretch goal: Video call links

Tutors and learners meet online using apps students already use. When a
**session request** is Accepted, the tutor can add a video call link
(Google Meet, Zoom, Microsoft Teams or Jitsi), and both people get a
**Join video call** button. TutorMatch doesn't run the call itself.
Session requests don't record online vs face-to-face, so the tutor
simply doesn't add a link for face-to-face sessions.

### Video call user stories
13. As a tutor, I want to add a video call link to an accepted session,
    so that my learner knows where to meet me online.
14. As a learner, I want a Join video call button on my accepted
    session, so that I can join without searching through messages.

### Video call screens
17. **My sessions (tutor)** — each Accepted session has an **Add video
    call link** box and **Save**; once saved it shows the link with
    **Change** and **Remove**. A link that isn't from Google Meet, Zoom,
    Microsoft Teams or Jitsi gets a clear message.
18. **My sessions (learner)** — an Accepted session with a link shows
    **Join video call** (opens in a new tab, noting that it leaves
    TutorMatch, e.g. "Opens Google Meet"); without one: "Your tutor
    hasn't added a video link yet."
19. **Both dashboards** — Next / Upcoming sessions show the same **Join
    video call** button when there is a link.

The link only appears on Accepted sessions — never on Pending, Declined,
Cancelled or Completed ones.

### Video call data
**bookings** — one new column; nothing else changes.
- meeting_link (text, optional, up to 300 characters). Must start with
  `https://` and point to meet.google.com, zoom.us (including
  subdomains like school.zoom.us), teams.microsoft.com, teams.live.com
  or meet.jit.si.
- Read: only the learner and tutor on that booking (unchanged).
- Set, change or remove: only the tutor on that booking, and only while
  it is Accepted. A learner can never set it. Enforced by the database.

### Video call links: done for the demo
- [x] A tutor adds a Google Meet link to an accepted session; the
      learner sees Join video call and it opens.
- [x] A link from any other site is refused with a clear message.
- [x] A learner cannot set or change the link (checked on the database,
      not just the screen).
- [x] No one outside the session can see the link.

## Stretch goal: Study Planner

Learners plan their own study around their **session requests**: a
private to-do list of study tasks with due dates and priorities, with
their accepted tutoring sessions shown alongside. Learners only — tutors
don't see a planner.

### Study Planner user stories
15. As a learner, I want to add study tasks with a subject, due date and
    priority, so that I know what to study and when.
16. As a learner, I want to see what's due today and mark tasks done, so
    that I keep on top of my studying.
17. As a learner, I want my accepted tutoring sessions to appear in my
    planner, so that I see my study tasks and sessions together.

### Study Planner screens
20. **Study Planner** (learners only; the sidebar link stops being
    greyed out) — tasks grouped into **Overdue**, **Today**,
    **Upcoming** and **Done**, each showing title, subject, due date
    (and time), priority (High / Medium / Low, colour-coded) and
    estimated time. Filters by subject and status. Accepted tutoring
    sessions appear on their dates as read-only "Session with [tutor]"
    rows. Empty state: "No study tasks yet — add your first one." Plus
    loading and error states.
21. **Add / edit a task** — title (required, up to 100 characters),
    subject (fixed list), due date (required) and optional time
    (Philippine time), priority (Low / Medium / High), estimated minutes
    (optional, 5–600), notes (optional, up to 500 characters).
22. **Task actions** — **Mark done** (one tap; **Undo** moves it back),
    **Edit**, **Delete** (asks "are you sure?").
23. **Learner dashboard** — a **Today's study tasks** card with up to 3
    tasks due today or overdue, each with a quick **Mark done**; only
    shown once the learner has tasks.

### Study Planner data
**study_tasks** — a learner's own study to-do list.
- Columns: id, learner_id, title, subject, due_date, due_time
  (optional), priority (`low`, `medium` or `high`), estimated_minutes
  (optional, 5–600), notes, status (`todo` or `done`), completed_at,
  created_at, updated_at.
- Read, edit, delete: only the learner who created the task. Tutors,
  other learners and logged-out visitors can't see anyone's planner.
- Create: a logged-in learner, for themselves only (tutors can't).
- The database sets learner_id (always the logged-in user),
  completed_at (filled when marked done, cleared on undo), created_at
  and updated_at.
- Delete is allowed — these are a learner's private notes, not shared
  records like session requests.

Sessions in the planner are read from **bookings** (the learner's own
Accepted ones only). Nothing new is stored for them.

### Study Planner: done for the demo
- [x] A learner adds a task, sees it under Today, and marks it done
      (and can undo).
- [x] Editing and deleting a task work.
- [x] The dashboard card shows today's tasks.
- [x] An accepted tutoring session appears in the planner on its date.
- [x] A second learner and a tutor can't see the first learner's tasks;
      study_tasks shows RLS enabled.

## Stretch goal: LearnTrack

Learners keep a list of the topics they're studying in each subject and
mark how well they understand each one, so they can see where they're
weak before booking a **session request**. A progress bar shows how far
they've got in each subject. Learners only — tutors don't have
LearnTrack.

### LearnTrack user stories
18. As a learner, I want to list the topics I'm studying under each
    subject, so that I can see everything I need to learn.
19. As a learner, I want to mark each topic Need to Review, Learning or
    Understood, so that I can see where I'm weak.
20. As a learner, I want a progress bar for each subject, so that I can
    see how far I've come.

### LearnTrack screens
24. **LearnTrack** (learners only; the sidebar link stops being greyed
    out) — topics grouped by subject, each subject with a progress bar
    ("3 of 5 understood"). Each topic shows its name and status —
    **Need to Review** (red), **Learning** (amber) or **Understood**
    (green) — changeable in one tap. A status filter. Empty state: "No
    topics yet — add the first topic you're studying." Plus loading and
    error states.
25. **Add / edit a topic** — topic name (required, up to 100
    characters), subject (fixed list), status (starts at Need to
    Review), note (optional, up to 300 characters). **Delete** asks
    "are you sure?".
26. **Learner dashboard** — a **LearnTrack** card with the number of
    topics at Need to Review and up to 3 of them; only shown once the
    learner has topics.

### LearnTrack data
**learn_topics** — one row per topic a learner is studying.
- Columns: id, learner_id, subject, name, status (`need_review`,
  `learning` or `understood`), note, created_at, updated_at.
- A learner can't add the same topic name twice in one subject.
- Read, edit, delete: only the learner who added the topic. Tutors,
  other learners and logged-out visitors can't see anyone's LearnTrack.
- Create: a logged-in learner, for themselves only (tutors can't).
- The database sets learner_id (always the logged-in user), created_at
  and updated_at.

### LearnTrack: done for the demo
- [ ] A learner adds topics in two subjects, changes a status in one
      tap, and the progress bar updates.
- [ ] Editing and deleting a topic work.
- [ ] The dashboard card shows the topics to review.
- [ ] A second learner and a tutor can't see the first learner's
      topics; learn_topics shows RLS enabled.

## Stretch goal: Profile

### Profile user story
21. As a learner, I want to see and change my name and level, so that
    tutors see the right name and my matches fit my level.

### Profile screens
27. **Profile** (any logged-in user; in the learner sidebar — which
    stops greying it out — and the header's profile menu) — shows
    display name, level (SHS or College), email, role and the date they
    joined. They can change their name and level and press **Save**.
    Tutors keep **My Profile** for their tutor listing.

### Profile data
No new table. The page edits the user's own row in **profiles**: only
`display_name` and `level` can change — the database already blocks
everything else, including changing your role. The email comes from the
login account and is shown, not edited.

### Profile: done for the demo
- [ ] A learner changes their name on Profile and the new name shows in
      the header and to their tutor.
- [ ] Changing level works; role can't be changed (checked on the
      database, not just the screen).

## Out of scope
- Subscriptions, pricing page, TutorMatch Plus / Tutor Pro
- Real payments, collection and payouts
- LearnTrack goals, Learning Gap Finder, Next Best Study Step and
  progress-over-time charts
- Reviews and ratings, favourite tutors
- Admin dashboard, reports, moderation
- Profile photos
- Forgot-password / password-reset flow
- Email confirmation on sign-up (off for the demo)
- Dashboard charts and earnings graphs
- Video calling built into TutorMatch
