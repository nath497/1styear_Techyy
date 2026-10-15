# 10 — Browse requests and send an offer

**What to build:** A logged-in tutor opens the Help Request Board, sees
open help requests newest first, filters them by subject and level, and
opens one. On the request page they send one offer — a proposed time
and a short message — and then see "Your offer" instead of the form.
The tutors' Help Requests link in the navigation goes live.

**Blocked by:** 09

**Status:** done

- [x] `help_offers` is created from a numbered SQL file with RLS ON; no one can edit or delete offers
- [x] The board shows only Open requests, to logged-in tutors only; each card shows subject, level, title, budget, mode, preferred time, the learner's first name and the offer count
- [x] Subject and level filters work, with an empty state when nothing matches
- [x] Only tutors with a tutor profile can offer, only for themselves, only on Open requests, and at most once per request (enforced by the database)
- [x] Learners can't see the board or other learners' requests
- [x] My help requests (ticket 09) now shows each request's offer count
- [x] Help Requests is no longer greyed out for tutors
- [x] Works on a phone
- [x] Works on the live URL
