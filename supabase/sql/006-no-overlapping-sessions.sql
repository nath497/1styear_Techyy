-- 006 — no double-booking a tutor
--
-- Run in: Supabase -> SQL Editor -> New query -> paste -> Run
-- Needs 003 first. It only ADDS a rule; it does not change or delete any
-- booking. Safe to run more than once.
--
-- The rule: a tutor can't have two ACTIVE sessions (Pending or
-- Accepted) whose times overlap. Every session is treated as 1 hour
-- long, so 4:00–5:00 PM and 5:00–6:00 PM are both fine, but 4:00 PM and
-- 4:30 PM clash. Declined, Cancelled and Completed sessions don't count,
-- so cancelling or declining frees the slot again.
--
-- The database checks this itself, so even two requests sent at the
-- very same moment can't both get in.
--
-- BEFORE RUNNING: run this read-only check. It lists existing active
-- sessions that already clash. If it returns any rows, the rule below
-- can't be added yet (Supabase will show an error and change nothing) —
-- have the tutor decline or the learner cancel one of each pair first.
--
--   select a.id, b.id as clashes_with, a.tutor_id, a.starts_at, b.starts_at
--   from public.bookings a
--   join public.bookings b
--     on a.tutor_id = b.tutor_id and a.id < b.id
--    and a.status in ('pending', 'accepted')
--    and b.status in ('pending', 'accepted')
--    and a.starts_at < b.starts_at + interval '1 hour'
--    and b.starts_at < a.starts_at + interval '1 hour';

-- 1. A helper that lets the database compare time ranges per tutor -----

create extension if not exists btree_gist with schema extensions;

-- The 1-hour time slot a session takes up. (A plain "starts_at + 1 hour"
-- isn't allowed inside a rule like this, so it lives in a function.)
create or replace function public.session_slot(starts_at timestamptz)
returns tstzrange
language sql
immutable
set search_path = ''
as $$
  select tstzrange(starts_at, starts_at + interval '1 hour', '[)');
$$;

-- 2. The rule ------------------------------------------------------------

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'bookings_no_overlapping_sessions'
  ) then
    alter table public.bookings
      add constraint bookings_no_overlapping_sessions
      exclude using gist (
        tutor_id with =,
        public.session_slot(starts_at) with &&
      )
      where (status in ('pending', 'accepted'));
  end if;
end;
$$;
