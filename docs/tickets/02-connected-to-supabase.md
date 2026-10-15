# 02 — Connected to Supabase

**What to build:** The app talks to the team's hosted Supabase project.
The `profiles` and `tutor_profiles` tables from the spec exist with Row
Level Security on, and a Find a Tutor page on the live site reads from
`tutor_profiles` (showing a friendly "no tutors yet" message while it is
empty).

**Blocked by:** 01

**Status:** todo

- [x] Supabase URL and publishable key are set in `.env.local` and in Vercel (no secret / service_role key anywhere)
- [x] `profiles` and `tutor_profiles` are created from a numbered SQL file in the repo, matching the spec's columns
- [x] RLS is ON for both tables, with the read/write rules from the spec (role cannot change after sign-up; only tutors can write their own tutor profile; anyone can read tutor profiles)
- [x] The Find a Tutor page loads data from Supabase and shows the empty state, or a clear error if it cannot connect
- [ ] Works on the live URL
