# 18 — Profile: see and change your name and level

**What to build:** any logged-in user can open a Profile page that shows
their display name, level (SHS or College), email, role and the date
they joined, and can change their name and level. The learner sidebar's
Profile link stops being greyed out, and the header's profile menu links
to the page. Tutors keep My Profile for their tutor listing.

**Blocked by:** None.

**Status:** done

- [x] Profile shows name, level, email, role and join date
- [x] Changing name and level saves, with a clear message; blank or
      too-long names are refused with a friendly error
- [x] The new name shows in the header and to the learner's tutor
- [x] Role can't be changed, even by calling the database directly
- [x] Logged-out visitors are sent to log in
- [x] Profile is no longer greyed out in the learner sidebar
- [x] Works on the live URL, on a phone
