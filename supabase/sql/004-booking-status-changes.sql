-- 004 — booking status changes: accept, decline, cancel (Ticket 07)
--
-- Run in: Supabase -> SQL Editor -> New query -> paste -> Run
-- Needs 003 first. Safe to run more than once.
--
-- Allowed changes (anything else is refused by the database):
--   tutor:   pending  -> accepted
--   tutor:   pending  -> declined
--   learner: pending  -> cancelled
--   learner: accepted -> cancelled
-- (tutor: accepted -> completed is added in ticket 08.)

-- 1. Only the status column can ever be changed through the app -------

revoke update on public.bookings from anon, authenticated;
grant update (status) on public.bookings to authenticated;

-- 2. Only the learner or tutor on a booking can change it --------------

drop policy if exists "learner and tutor can update their bookings" on public.bookings;
create policy "learner and tutor can update their bookings"
  on public.bookings for update
  to authenticated
  using ((select auth.uid()) in (learner_id, tutor_id))
  with check ((select auth.uid()) in (learner_id, tutor_id));

-- 3. ...and only along the allowed paths ------------------------------
--
-- Runs before every update. It looks at who is asking (auth.uid()) and
-- the old and new status. The messages below are shown to the user.

create or replace function public.check_booking_status_change()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  me uuid := auth.uid();
begin
  -- Edits made by the team in the Supabase dashboard have no logged-in
  -- user; let those through. (App users always have one.)
  if me is null then
    return new;
  end if;

  if new.status = old.status then
    return new;
  end if;

  if me = old.tutor_id
     and old.status = 'pending' and new.status in ('accepted', 'declined') then
    return new;
  end if;

  if me = old.learner_id
     and old.status in ('pending', 'accepted') and new.status = 'cancelled' then
    return new;
  end if;

  raise exception 'This session is % — it can''t be changed to %.', old.status, new.status;
end;
$$;

drop trigger if exists bookings_check_status_change on public.bookings;
create trigger bookings_check_status_change
  before update on public.bookings
  for each row execute function public.check_booking_status_change();

-- Still no delete policy: bookings are never deleted through the app.
