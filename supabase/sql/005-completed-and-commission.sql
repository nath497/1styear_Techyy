-- 005 — completed sessions and the 10% commission (Ticket 08)
--
-- Run in: Supabase -> SQL Editor -> New query -> paste -> Run
-- Needs 003 and 004 first. Safe to run more than once.
--
-- "recorded" means calculated and saved. It does NOT mean money was
-- collected from the learner or paid to the tutor — that needs a
-- payment provider (see docs/LATER.md).

-- 1. commission_records: the platform's recorded share ----------------

create table if not exists public.commission_records (
  id                    uuid primary key default gen_random_uuid(),
  -- unique: one record per booking, ever.
  booking_id            uuid not null unique references public.bookings (id) on delete cascade,
  tutor_id              uuid not null references public.tutor_profiles (tutor_id) on delete cascade,
  price_centavos        integer not null check (price_centavos > 0),
  commission_rate       numeric(4, 2) not null default 0.10 check (commission_rate = 0.10),
  commission_centavos   integer not null check (commission_centavos >= 0),
  tutor_amount_centavos integer not null check (tutor_amount_centavos >= 0),
  status                text not null default 'recorded' check (status = 'recorded'),
  created_at            timestamptz not null default now(),
  -- The two parts always add up to the price, to the centavo.
  check (commission_centavos + tutor_amount_centavos = price_centavos)
);

create index if not exists commission_records_tutor_idx on public.commission_records (tutor_id);

alter table public.commission_records enable row level security;

-- Only the tutor on the booking can see its commission record.
drop policy if exists "tutors can read their commission records" on public.commission_records;
create policy "tutors can read their commission records"
  on public.commission_records for select
  to authenticated
  using ((select auth.uid()) = tutor_id);

-- Nobody can write commission records through the app: no insert,
-- update or delete policies, and no permission either. Only the
-- database trigger below creates them.
revoke insert, update, delete on public.commission_records from anon, authenticated;

-- 2. Let the tutor mark an accepted session completed -----------------
--
-- Same rules as 004, plus one new path: tutor accepted -> completed.
-- A learner can never mark a booking completed.

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

  if me = old.tutor_id
     and old.status = 'accepted' and new.status = 'completed' then
    return new;
  end if;

  if me = old.learner_id
     and old.status in ('pending', 'accepted') and new.status = 'cancelled' then
    return new;
  end if;

  raise exception 'This session is % — it can''t be changed to %.', old.status, new.status;
end;
$$;

-- 3. Record the commission when a booking becomes completed -----------
--
-- Runs after the status change is saved. Commission is 10% rounded to
-- the nearest whole centavo; the tutor gets the rest, so the two always
-- add up exactly. "on conflict do nothing" + the unique booking_id mean
-- a booking can never get a second record.
--
-- `security definer` lets this function write the record even though
-- users have no insert permission on commission_records.

create or replace function public.record_commission()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  commission integer;
begin
  if new.status = 'completed' and old.status is distinct from 'completed' then
    commission := round(new.price_centavos * 0.10)::integer;
    insert into public.commission_records
      (booking_id, tutor_id, price_centavos, commission_centavos, tutor_amount_centavos)
    values
      (new.id, new.tutor_id, new.price_centavos, commission, new.price_centavos - commission)
    on conflict (booking_id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists bookings_record_commission on public.bookings;
create trigger bookings_record_commission
  after update of status on public.bookings
  for each row execute function public.record_commission();

-- 4. Check it worked ---------------------------------------------------
--
-- Table Editor should now show `commission_records` with no
-- "RLS disabled" warning.
