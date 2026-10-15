-- 007 — help_requests: learners post what they need help with (Ticket 09)
--
-- Run in: Supabase -> SQL Editor -> New query -> paste -> Run
-- Needs 002 first. It only CREATES things; it does not change or delete
-- any existing data. Safe to run more than once.
--
-- This ticket lets a learner POST a request, SEE their own, and CANCEL
-- one while it is Open. Tutors seeing open requests comes in ticket 10;
-- choosing an offer (Open -> Matched) comes in ticket 11.

-- 1. The table ---------------------------------------------------------

create table if not exists public.help_requests (
  id              uuid primary key default gen_random_uuid(),
  -- Filled in from the logged-in user if the app doesn't send it.
  learner_id      uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  title           text not null check (char_length(trim(title)) between 1 and 100),
  details         text not null check (char_length(trim(details)) between 1 and 1000),
  subject         text not null check (
                    subject in ('math', 'science', 'english', 'filipino',
                                'programming_ict', 'accounting_business')
                  ),
  level           text not null check (level in ('shs', 'college')),
  -- Money is whole centavos: ₱150 is stored as 15000. Max ₱100,000.
  budget_centavos integer not null check (budget_centavos > 0 and budget_centavos <= 10000000),
  mode            text not null check (mode in ('online', 'face_to_face')),
  preferred_time  text not null default '' check (char_length(preferred_time) <= 200),
  status          text not null default 'open' check (status in ('open', 'matched', 'cancelled')),
  -- Which offer the learner chose (ticket 11 links this to help_offers).
  chosen_offer_id uuid,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists help_requests_learner_idx on public.help_requests (learner_id);
create index if not exists help_requests_open_idx on public.help_requests (created_at desc) where status = 'open';

drop trigger if exists help_requests_set_updated_at on public.help_requests;
create trigger help_requests_set_updated_at
  before update on public.help_requests
  for each row execute function public.set_updated_at();

-- 2. A new request always starts Open, whatever the browser sends -------

create or replace function public.prepare_new_help_request()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.status := 'open';
  new.chosen_offer_id := null;
  new.created_at := now();
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists help_requests_prepare_new on public.help_requests;
create trigger help_requests_prepare_new
  before insert on public.help_requests
  for each row execute function public.prepare_new_help_request();

-- 3. Only allowed status changes ---------------------------------------
--
-- For now the only change is: the learner cancels an Open request.
-- (Ticket 11 adds Open -> Matched.) The message is shown to the user.

create or replace function public.check_help_request_status_change()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  me uuid := auth.uid();
begin
  -- Edits made by the team in the Supabase dashboard have no logged-in
  -- user; let those through. (App users always have one.)
  if me is null or new.status = old.status then
    return new;
  end if;

  if me = old.learner_id and old.status = 'open' and new.status = 'cancelled' then
    return new;
  end if;

  raise exception 'This help request is % — it can''t be changed to %.', old.status, new.status;
end;
$$;

drop trigger if exists help_requests_check_status_change on public.help_requests;
create trigger help_requests_check_status_change
  before update on public.help_requests
  for each row execute function public.check_help_request_status_change();

-- 4. Row Level Security -------------------------------------------------

alter table public.help_requests enable row level security;

-- A learner can see their own requests. (Ticket 10 lets tutors see Open
-- ones.)
drop policy if exists "learners can read their own help requests" on public.help_requests;
create policy "learners can read their own help requests"
  on public.help_requests for select
  to authenticated
  using ((select auth.uid()) = learner_id);

-- Only a learner can post, only for themselves, only as Open.
drop policy if exists "learners can post help requests" on public.help_requests;
create policy "learners can post help requests"
  on public.help_requests for insert
  to authenticated
  with check (
    (select auth.uid()) = learner_id
    and status = 'open'
    and exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.role = 'learner'
    )
  );

-- Only the learner who posted it can change it (and only its status —
-- see the grants below and the trigger above).
drop policy if exists "learners can update their own help requests" on public.help_requests;
create policy "learners can update their own help requests"
  on public.help_requests for update
  to authenticated
  using ((select auth.uid()) = learner_id)
  with check ((select auth.uid()) = learner_id);

-- The app may only send these columns. Status, the chosen offer and the
-- dates are set by the database; only `status` can ever be updated.
revoke insert, update, delete on public.help_requests from anon, authenticated;
grant insert (learner_id, title, details, subject, level, budget_centavos, mode, preferred_time)
  on public.help_requests to authenticated;
grant update (status) on public.help_requests to authenticated;

-- No delete policy, ever: help requests are never deleted through the app.

-- 5. Check it worked ---------------------------------------------------
--
-- Table Editor should now show `help_requests` with no "RLS disabled"
-- warning.
