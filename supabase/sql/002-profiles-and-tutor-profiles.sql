-- 002 — profiles and tutor_profiles (Ticket 02)
--
-- Run in: Supabase -> SQL Editor -> New query -> paste -> Run
-- Safe to run on an empty project. It only CREATES things; it does not
-- drop or delete anything.

-- 0. Shared helper: keep updated_at current -------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 1. profiles: one row per account ----------------------------------

create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(trim(display_name)) between 1 and 80),
  role         text not null check (role in ('learner', 'tutor')),
  level        text not null check (level in ('shs', 'college')),
  created_at   timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Logged-in users can read every profile (so names show on sessions).
create policy "logged-in users can read profiles"
  on public.profiles for select
  to authenticated
  using (true);

-- Logged-out visitors can read TUTOR names only, so Find a Tutor works
-- without an account. Learner profiles stay hidden from the public.
create policy "anyone can read tutor profiles"
  on public.profiles for select
  to anon
  using (role = 'tutor');

-- A user may update only their own row...
create policy "users can update their own profile"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- ...and only these two columns. `role` is not in the list, so it can
-- never be changed after sign-up, even by someone calling the API
-- directly.
revoke update on public.profiles from anon, authenticated;
grant update (display_name, level) on public.profiles to authenticated;

-- No insert policy: the profile row is created by the database itself,
-- the moment the account is created (see the trigger below).
-- No delete policy: nobody can delete profiles through the app.

-- Create the profile automatically on sign-up, from the details the
-- sign-up form sends. Only 'learner' or 'tutor' are accepted (the
-- table's check rules reject anything else, so nobody can sign up as
-- an admin). `security definer` lets it write the row even though
-- users have no insert permission.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, role, level)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''), 'New user'),
    coalesce(new.raw_user_meta_data ->> 'role', 'learner'),
    coalesce(new.raw_user_meta_data ->> 'level', 'college')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2. tutor_profiles: the public listing for a tutor -----------------

create table if not exists public.tutor_profiles (
  tutor_id      uuid primary key references public.profiles (id) on delete cascade,
  bio           text not null default '' check (char_length(bio) <= 1000),
  subjects      text[] not null check (
                  cardinality(subjects) >= 1
                  and subjects <@ array['math', 'science', 'english', 'filipino',
                                        'programming_ict', 'accounting_business']
                ),
  levels        text[] not null check (
                  cardinality(levels) >= 1
                  and levels <@ array['shs', 'college']
                ),
  -- Money is whole centavos: ₱150 is stored as 15000.
  rate_centavos integer not null check (rate_centavos > 0),
  mode          text not null check (mode in ('online', 'face_to_face', 'both')),
  availability  text not null default '' check (char_length(availability) <= 200),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists tutor_profiles_rate_idx on public.tutor_profiles (rate_centavos);

drop trigger if exists tutor_profiles_set_updated_at on public.tutor_profiles;
create trigger tutor_profiles_set_updated_at
  before update on public.tutor_profiles
  for each row execute function public.set_updated_at();

alter table public.tutor_profiles enable row level security;

-- Anyone, logged in or not, can browse tutor listings.
create policy "anyone can read tutor listings"
  on public.tutor_profiles for select
  to anon, authenticated
  using (true);

-- Only a user whose role is 'tutor' can create a listing, and only
-- for themselves.
create policy "tutors can create their own listing"
  on public.tutor_profiles for insert
  to authenticated
  with check (
    (select auth.uid()) = tutor_id
    and exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.role = 'tutor'
    )
  );

-- A tutor can edit only their own listing.
create policy "tutors can update their own listing"
  on public.tutor_profiles for update
  to authenticated
  using ((select auth.uid()) = tutor_id)
  with check ((select auth.uid()) = tutor_id);

-- No delete policy: listings cannot be deleted through the app.

-- 3. Check it worked -------------------------------------------------
--
-- Table Editor should now show `profiles` and `tutor_profiles`, and
-- neither should have an "RLS disabled" warning.
