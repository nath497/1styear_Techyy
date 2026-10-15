# 15 — Video call links on accepted sessions

**What to build:** When a session request is Accepted, the tutor can add
a video call link (Google Meet, Zoom, Microsoft Teams or Jitsi) on My
sessions, and change or remove it later. The learner then sees a "Join
video call" button on that session — on My sessions and on their
dashboard — that opens the call in a new tab. The tutor's dashboard
shows the same button. TutorMatch doesn't run the call itself.

**Blocked by:** None

**Status:** done

- [x] `meeting_link` is added to bookings from a numbered SQL file; nothing else about bookings changes
- [x] Only the tutor on a booking can set, change or remove the link, and only while it is Accepted (enforced by the database, not just the screen)
- [x] The link must be https and from Google Meet, Zoom, Microsoft Teams or Jitsi, up to 300 characters; anything else gets a clear message
- [x] A learner can never set or change the link
- [x] Learners see "Join video call" (opens in a new tab, says it leaves TutorMatch) or "Your tutor hasn't added a video link yet"
- [x] Both dashboards show "Join video call" on upcoming sessions that have a link
- [x] The link never shows on Pending, Declined, Cancelled or Completed sessions, and no one outside the session can see it
- [x] Works on a phone
- [x] Works on the live URL
