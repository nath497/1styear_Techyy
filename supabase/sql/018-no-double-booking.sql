-- 018 — no double-booking a tutor, without add-ons (replaces 006's rule)
--
-- Run in: Supabase -> SQL Editor -> New query -> paste -> Run
-- Needs 003 and 004 first. It only ADDS a check; it does not change or
-- delete any booking. Safe to run more than once.
--
-- Why: 006 used a Postgres add-on (btree_gist) that this Supabase
-- project doesn't have, so its rule was never added. This file enforces
-- the same rule with a plain trigger:
--
--   A tutor can't have two ACTIVE sessions (Pending or Accepted) whose
--   times overlap. Every session is 1 hour, so 4:00 PM and 5:00 PM are
--   both fine, but 4:00 PM and 4:30 PM clash. Declined, Cancelled and
--   Completed sessions don't count.
--
-- Only NEW requests need checking: a booking's time and tutor can never
-- change (column grants, 003/004), and a Declined or Cancelled booking can
-- never become active again (004).
--
-- Existing clashes (if any slipped in before this rule) are left alone —
-- this file never fails because of old data. To see them, run:
--
--   select a.id, b.id as clashes_with, a.tutor_id, a.starts_at, b.starts_at
--   from public.bookings a
--   join public.bookings b
--     on a.tutor_id = b.tutor_id and a.id < b.id
--    and a.status in ('pending', 'accepted')
--    and b.status in ('pending', 'accepted')
--    and a.starts_at < b.starts_at + interval '1 hour'
--    and b.starts_at < a.starts_at + interval '1 hour';

-- The check. It runs AFTER the request is saved (so it sees the final
-- time and status), and undoes the request if it clashes.
--
-- `security definer`: a learner can only see their own bookings, but the
-- clash may be with someone else's — so this check runs with the table
-- owner's rights. It only answers "clash or not": no one else's booking
-- details are ever returned. A trigger function can't be called directly.
--
-- The lock queues requests for the SAME tutor one at a time, so two
-- requests sent at the very same moment can't both get in.
create or replace function public.check_tutor_not_double_booked()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status not in ('pending', 'accepted') then
    return null;
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext(new.tutor_id::text));

  if exists (
    select 1
    from public.bookings b
    where b.tutor_id = new.tutor_id
      and b.id <> new.id
      and b.status in ('pending', 'accepted')
      and b.starts_at < new.starts_at + interval '1 hour'
      and new.starts_at < b.starts_at + interval '1 hour'
  ) then
    -- Same error code as 006's rule, so the app's friendly message works.
    raise exception using
      errcode = 'exclusion_violation',
      message = 'This tutor already has a session within an hour of that time.';
  end if;

  return null;
end;
$$;

drop trigger if exists bookings_no_double_booking on public.bookings;
create trigger bookings_no_double_booking
  after insert on public.bookings
  for each row execute function public.check_tutor_not_double_booked();

-- Nobody needs to call this directly (it only works as a trigger anyway).
revoke all on function public.check_tutor_not_double_booked() from public, anon, authenticated;

-- Check it worked: this should return 1.
--
--   select count(*) from pg_trigger where tgname = 'bookings_no_double_booking';
