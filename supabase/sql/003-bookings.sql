-- 003 — bookings: session requests (Ticket 06)
--
-- Run in: Supabase -> SQL Editor -> New query -> paste -> Run
-- Needs 002 first. It only CREATES things; it does not drop or delete
-- anything.
--
-- This ticket lets a learner CREATE a request and lets both people SEE
-- it. Changing the status (accept / decline / cancel) comes in ticket
-- 07, so for now nobody can update a booking at all.

-- 1. The table ---------------------------------------------------------

create table if not exists public.bookings (
  id             uuid primary key default gen_random_uuid(),
  -- Filled in from the logged-in user if the app doesn't send it.
  learner_id     uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  tutor_id       uuid not null references public.tutor_profiles (tutor_id) on delete cascade,
  subject        text not null check (
                   subject in ('math', 'science', 'english', 'filipino',
                               'programming_ict', 'accounting_business')
                 ),
  topic          text not null check (char_length(trim(topic)) between 1 and 200),
  starts_at      timestamptz not null,
  -- Money is whole centavos: ₱150 is stored as 15000. Set by the
  -- database from the tutor's rate (see the trigger below).
  price_centavos integer not null check (price_centavos > 0),
  status         text not null default 'pending' check (
                   status in ('pending', 'accepted', 'declined', 'completed', 'cancelled')
                 ),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  check (learner_id <> tutor_id)
);

create index if not exists bookings_learner_idx on public.bookings (learner_id);
create index if not exists bookings_tutor_idx on public.bookings (tutor_id);

drop trigger if exists bookings_set_updated_at on public.bookings;
create trigger bookings_set_updated_at
  before update on public.bookings
  for each row execute function public.set_updated_at();

-- 2. The database fills in the price and status itself ---------------
--
-- Runs before every new booking is saved. Whatever the browser sends,
-- the price is copied from the tutor's CURRENT rate and the status is
-- always 'pending'. It also checks the tutor teaches that subject and
-- the time is in the future. The messages below are shown to the user.

create or replace function public.prepare_new_booking()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  tutor public.tutor_profiles;
begin
  select * into tutor from public.tutor_profiles where tutor_id = new.tutor_id;
  if not found then
    raise exception 'This tutor is no longer on TutorMatch.';
  end if;
  if not (new.subject = any (tutor.subjects)) then
    raise exception 'This tutor does not teach that subject.';
  end if;
  if new.starts_at <= now() then
    raise exception 'Please pick a date and time in the future.';
  end if;

  new.price_centavos := tutor.rate_centavos;
  new.status := 'pending';
  new.created_at := now();
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists bookings_prepare_new on public.bookings;
create trigger bookings_prepare_new
  before insert on public.bookings
  for each row execute function public.prepare_new_booking();

-- 3. Row Level Security ------------------------------------------------

alter table public.bookings enable row level security;

-- Only the learner and the tutor on a booking can see it.
create policy "learner and tutor can read their bookings"
  on public.bookings for select
  to authenticated
  using ((select auth.uid()) in (learner_id, tutor_id));

-- Only a learner can create a booking, only for themselves, only as
-- 'pending'.
create policy "learners can request sessions for themselves"
  on public.bookings for insert
  to authenticated
  with check (
    (select auth.uid()) = learner_id
    and status = 'pending'
    and exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.role = 'learner'
    )
  );

-- The app may only send these columns when creating a booking. The
-- price, status and dates are not in the list, so the browser cannot
-- set them even by calling the API directly.
revoke insert, update, delete on public.bookings from anon, authenticated;
grant insert (learner_id, tutor_id, subject, topic, starts_at) on public.bookings to authenticated;

-- No update policy yet (ticket 07 adds status changes).
-- No delete policy, ever: bookings are never deleted through the app.

-- 4. Check it worked ---------------------------------------------------
--
-- Table Editor should now show `bookings` with no "RLS disabled"
-- warning.
