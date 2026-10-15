-- 008 — help_offers: tutors browse open help requests and offer (Ticket 10)
--
-- Run in: Supabase -> SQL Editor -> New query -> paste -> Run
-- Needs 007 first. It only ADDS things (a table, a column, rules); it
-- does not change or delete any existing data. Safe to run more than once.
--
-- After this:
--   * logged-in tutors can see OPEN help requests (the board);
--   * a tutor can make one offer per open request;
--   * a request remembers how many offers it has (offer_count);
--   * once a request is Matched or Cancelled, only its learner and the
--     tutors who offered can still see it.

-- 1. The offers table --------------------------------------------------

create table if not exists public.help_offers (
  id            uuid primary key default gen_random_uuid(),
  request_id    uuid not null references public.help_requests (id) on delete cascade,
  -- Must be a tutor with a tutor profile.
  tutor_id      uuid not null default auth.uid() references public.tutor_profiles (tutor_id) on delete cascade,
  message       text not null check (char_length(trim(message)) between 1 and 500),
  proposed_time text not null check (char_length(trim(proposed_time)) between 1 and 200),
  created_at    timestamptz not null default now(),
  -- One offer per tutor per request.
  unique (request_id, tutor_id)
);

create index if not exists help_offers_tutor_idx on public.help_offers (tutor_id);

-- 2. Each request counts its offers ------------------------------------
--
-- A tutor may only read their OWN offers, so they couldn't count
-- everyone's. Instead the request keeps a count that the database
-- updates itself whenever an offer is made.

alter table public.help_requests add column if not exists offer_count integer not null default 0;

-- New requests always start with 0 offers (same as 007, plus the count).
create or replace function public.prepare_new_help_request()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.status := 'open';
  new.chosen_offer_id := null;
  new.offer_count := 0;
  new.created_at := now();
  new.updated_at := now();
  return new;
end;
$$;

-- `security definer` lets this add 1 to the count even though nobody
-- may update offer_count through the app.
create or replace function public.count_new_help_offer()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.help_requests set offer_count = offer_count + 1 where id = new.request_id;
  return new;
end;
$$;

drop trigger if exists help_offers_count on public.help_offers;
create trigger help_offers_count
  after insert on public.help_offers
  for each row execute function public.count_new_help_offer();

-- 3. Two yes/no helpers ------------------------------------------------
--
-- "Tutors who offered can see the request" and "the learner can see the
-- offers on their request" each need to look at the other table. Written
-- as plain rules they would check each other forever, so these helpers
-- answer just yes or no, about the logged-in user only.

create or replace function public.i_offered_on(request uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.help_offers
    where request_id = request and tutor_id = (select auth.uid())
  );
$$;

create or replace function public.i_own_help_request(request uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.help_requests
    where id = request and learner_id = (select auth.uid())
  );
$$;

create or replace function public.help_request_is_open(request uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.help_requests where id = request and status = 'open');
$$;

-- Logged-out visitors never need these.
revoke execute on function public.i_offered_on(uuid) from public, anon;
revoke execute on function public.i_own_help_request(uuid) from public, anon;
revoke execute on function public.help_request_is_open(uuid) from public, anon;
grant execute on function public.i_offered_on(uuid) to authenticated;
grant execute on function public.i_own_help_request(uuid) to authenticated;
grant execute on function public.help_request_is_open(uuid) to authenticated;

-- 4. Who can see help requests now -------------------------------------

-- Logged-in tutors can see OPEN requests (the board).
drop policy if exists "tutors can read open help requests" on public.help_requests;
create policy "tutors can read open help requests"
  on public.help_requests for select
  to authenticated
  using (
    status = 'open'
    and exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.role = 'tutor'
    )
  );

-- Tutors who made an offer can still see the request after it closes.
drop policy if exists "tutors who offered can read the help request" on public.help_requests;
create policy "tutors who offered can read the help request"
  on public.help_requests for select
  to authenticated
  using (public.i_offered_on(id));

-- (The learner's own-requests rule from 007 stays as it is.)

-- 5. Row Level Security on offers --------------------------------------

alter table public.help_offers enable row level security;

-- An offer can be seen by the tutor who wrote it and the learner who
-- owns the request. Nobody else.
drop policy if exists "tutor and learner can read the offer" on public.help_offers;
create policy "tutor and learner can read the offer"
  on public.help_offers for select
  to authenticated
  using (
    (select auth.uid()) = tutor_id
    or public.i_own_help_request(request_id)
  );

-- Only a tutor, for themselves, only on an Open request. (The tutor
-- profile is required by the table itself; "once per request" by the
-- unique rule.)
drop policy if exists "tutors can offer on open help requests" on public.help_offers;
create policy "tutors can offer on open help requests"
  on public.help_offers for insert
  to authenticated
  with check (
    (select auth.uid()) = tutor_id
    and public.help_request_is_open(request_id)
  );

-- The app may only send these columns. Offers can never be edited or
-- deleted, and offer_count can only be changed by the trigger above.
revoke insert, update, delete on public.help_offers from anon, authenticated;
grant insert (request_id, tutor_id, message, proposed_time) on public.help_offers to authenticated;

-- 6. Check it worked ---------------------------------------------------
--
-- Table Editor should now show `help_offers` with no "RLS disabled"
-- warning, and `help_requests` should have an `offer_count` column.
