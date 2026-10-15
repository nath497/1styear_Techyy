# 11 — Compare offers and choose a tutor

**What to build:** On their help request page, the learner sees every
offer: the tutor's name, the tutor's listed rate with a "within your
budget" or "₱X over your budget" tag, the proposed time and the
message. They choose one tutor; the request becomes Matched and links
to that tutor's page, where they send a normal session request.
Choosing never books anything by itself.

**Blocked by:** 10

**Status:** done

- [x] The learner sees all offers on their own request, with the correct budget tag from the tutor's current rate
- [x] Choose this tutor marks the request Matched, only with an offer made on that request, only by its learner, only while Open (enforced by the database)
- [x] After choosing, the page shows the chosen tutor and a link to request a session; no session is created automatically
- [x] Once Matched or Cancelled, only the learner and the tutors who offered can still see the request
- [x] Checked with a second learner account: they can't see the first learner's help requests or offers
- [x] `help_requests` and `help_offers` show RLS enabled in the Supabase Table Editor
- [x] Works on a phone
- [x] Works on the live URL
