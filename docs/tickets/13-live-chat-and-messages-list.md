# 13 — Live chat and the Messages inbox

**What to build:** A Messenger-style Messages page. On desktop, my
chats are listed on the left (other person's name, start of the latest
message, when) and the open chat is on the right; on phones, the list
comes first and tapping a chat opens it, with a back arrow to the list.
A chat only appears in the list once it has messages. New messages
appear without refreshing, and the list re-orders itself. Both
dashboards show a Messages card with my latest chats, only once I have
any. Messages is in the sidebar and phone menu for learners and tutors.

**Blocked by:** 12

**Status:** done

- [x] Messages are switched on for Supabase Realtime from a numbered SQL file; no new keys or environment variables
- [x] Both people see a new message appear without refreshing; people outside the conversation never receive it
- [x] The database keeps each conversation's last-message time up to date; no one can change it by hand
- [x] The Messages page lists only my conversations that have messages, newest first, with loading, empty and error states
- [x] Desktop shows the list and the open chat side by side; phones show one at a time with a back arrow
- [x] Both dashboards show my latest chats, only when I have at least one
- [x] Messages is in the sidebar and phone menu for both roles (no longer greyed out)
- [x] Works on a phone
- [x] Works on the live URL
