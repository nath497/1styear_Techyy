# 02 — Connected to Supabase

**What to build:** The app reads from the team's hosted Supabase
project. The `profiles` and `tutor_profiles` tables exist with Row
Level Security on, and Find a Tutor lists tutors from the database.

**Blocked by:** 01

**Status:** done

- [x] Supabase URL and publishable key are set locally and in Vercel; no secret or service_role key anywhere
- [x] Both tables are created from a numbered SQL file, matching the spec's columns
- [x] RLS is ON for both, with the spec's rules: role never changes after sign-up; only tutors write their own tutor profile; anyone can read tutor profiles
- [x] Find a Tutor loads from Supabase, with an empty state and an error state
- [x] Works on the live URL
