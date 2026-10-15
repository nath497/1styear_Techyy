# TutorMatch — Security and safety script

A spoken segment about how TutorMatch keeps user accounts safe. About
**90 seconds**, plus an optional **30-second live proof**. Fits after the
demo, or as the answer when someone asks "Is it safe?"

Replace **Speaker** with your name. Lines in *italics* are what you
**do**; plain text is what you **say**.

---

## The script (~90 seconds)

### 1. Why it matters (15s)

TutorMatch holds things students care about: who they're learning
with, their messages, their study plans, and their private notes. So
from day one, our rule was simple: **everything is private unless it
has to be shared.**

### 2. Logging in (20s)

When you sign up, your password goes to Supabase, the service that runs
our database and logins. It's stored scrambled, so even our team can
never read it. Every page that needs an account checks who you are on
the server, not just in your browser. And after you log in, we only
ever send you to pages inside TutorMatch — never to an outside site.

### 3. Your role can't be faked (15s)

You choose Learner or Tutor when you sign up, and that can never be
changed afterwards — not even by someone who tries to get around our
website. Only tutors can accept sessions. Only learners can book. The
database itself checks that.

### 4. Your data is yours (25s)

Every table in our database has Row Level Security. That means the
database decides, row by row, who can see what.

Your sessions are visible only to you and your tutor. A chat can only
be read by the two people in it. Your study tasks, schedule, goals and
LearnTrack are yours alone. And your session notes are so private that
even your tutor can't read them.

We didn't just switch this on. We tried to break in — reading other
people's data, changing it, pretending to be someone else — and every
attempt was refused.

### 5. Keys and honesty (15s)

Our secret database keys never reach your phone or browser. Money is
handled the same careful way: we only record our ten percent — we don't
collect any real money yet.

TutorMatch is built so that staying safe doesn't depend on everyone
being honest.

---

## Optional live proof (~30 seconds)

*Have a second learner account logged in on another phone.*

Let me prove it. This is a different learner.

*On the second learner's phone, open **My Sessions** and **My Learning
Space**.*

They can't see any of Josh's sessions, chats, study tasks or notes —
because the database won't give them to anyone but Josh.

*Then hold up the tutor's phone: its sidebar has no My Learning Space
or Session Notes.*

And Josh's tutor has no way to open his private notes at all.

---

## Honest limits (say these if asked — don't hide them)

1. **Email confirmation is off** to keep the demo simple, so someone
   could sign up with an email they don't own. We'd turn it on before a
   real launch.
2. **No "forgot password" yet.** It's on our list.
3. **No two-step login** (a code sent to your phone) yet.
4. **Display names are visible to logged-in users**, so they can appear
   on sessions and chats. **Email addresses are never shown** to other
   users.

---

## Questions you might get

### "Can your team read users' passwords?"

"No. Passwords go straight to Supabase, which stores them scrambled.
Our code never sees or saves them."

### "What stops a user from seeing someone else's data by hacking the website?"

"The rules live in the database, not just the website. Even if someone
skipped our screens and talked to the database directly, it would only
give them their own rows. We tested exactly that, and it refused."

### "What if two learners book the same tutor at the same time?"

"The database checks it at the moment of booking and only lets one in.
A tutor can never be double-booked for the same hour."

### "Is the payment information safe?"

"There isn't any yet — on purpose. We don't collect card details or real
money. We only record our ten percent commission. Real payments would
go through a trusted provider like GCash, not through our own code."

### "What would you improve before a real launch?"

"Turn email confirmation back on, add a forgot-password flow, and later
two-step login. We left those out on purpose to keep the demo simple."

---

## One-line version (if you only have five seconds)

"Everything is private by default, and the database itself enforces it
— we tried to break in, and every attempt was refused."
