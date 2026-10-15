-- 017 — My Learning Space (Tickets 22–26)
--
-- Run in: Supabase -> SQL Editor -> New query -> paste -> Run
-- Needs 002, 003, 006 and 015 first. Safe to run more than once.
--
-- It only ADDS things and WIDENS one rule; no data is deleted:
--   1. study_tasks: a new "In Progress" status, and an optional link to
--      a goal. (The old "todo / done" rule is replaced by "todo /
--      in_progress / done" — every existing task still fits it.)
--   2. study_activities — planned study time (the Schedule tab)
--   3. learning_goals — personal goals (the Goals tab)
--   4. session_notes — private notes on a booking (the Session Notes tab)
--
-- Supabase may warn that the query has "destructive operations". That's
-- the `drop constraint` / `drop policy` lines: each one is immediately
-- replaced by a new version. Your data is not touched.
--
-- Every new table has Row Level Security with explicit policies: only
-- the learner who owns a row can see or change it. Tutors, other learners
-- and logged-out visitors get nothing.

-- Titles need at least one letter or number (`~ '[[:alnum:]]'`), so they
-- can't be only spaces or invisible characters — the same rule as 016.

-- 1. learning_goals (created first: study_tasks links to it) ---------------

create table if not exists public.learning_goals (
  id          uuid primary key default gen_random_uuid(),
  learner_id  uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  title       text not null check (char_length(title) <= 100 and title ~ '[[:alnum:]]'),
  description text not null default '' check (char_length(description) <= 500),
  target_date date not null,
  status      text not null default 'active' check (status in ('active', 'achieved')),
  achieved_at timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists learning_goals_learner_idx on public.learning_goals (learner_id, target_date);

-- The owner is the logged-in user, a new goal starts Active, achieved_at
-- follows the status, and the dates are the real time.
create or replace function public.prepare_learning_goal()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.learner_id := auth.uid();
    new.status := 'active';
    new.achieved_at := null;
    new.created_at := now();
  else
    new.learner_id := old.learner_id;
    new.created_at := old.created_at;
    if new.status = 'achieved' and old.status <> 'achieved' then
      new.achieved_at := now();
    elsif new.status = 'active' then
      new.achieved_at := null;
    else
      new.achieved_at := old.achieved_at;
    end if;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists learning_goals_prepare on public.learning_goals;
create trigger learning_goals_prepare
  before insert or update on public.learning_goals
  for each row execute function public.prepare_learning_goal();

alter table public.learning_goals enable row level security;

drop policy if exists "learners can read their own goals" on public.learning_goals;
create policy "learners can read their own goals"
  on public.learning_goals for select
  to authenticated
  using ((select auth.uid()) = learner_id);

drop policy if exists "learners can add their own goals" on public.learning_goals;
create policy "learners can add their own goals"
  on public.learning_goals for insert
  to authenticated
  with check (
    (select auth.uid()) = learner_id
    and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'learner')
  );

drop policy if exists "learners can update their own goals" on public.learning_goals;
create policy "learners can update their own goals"
  on public.learning_goals for update
  to authenticated
  using ((select auth.uid()) = learner_id)
  with check ((select auth.uid()) = learner_id);

drop policy if exists "learners can delete their own goals" on public.learning_goals;
create policy "learners can delete their own goals"
  on public.learning_goals for delete
  to authenticated
  using ((select auth.uid()) = learner_id);

revoke all on public.learning_goals from anon, authenticated;
grant select on public.learning_goals to authenticated;
grant insert (title, description, target_date) on public.learning_goals to authenticated;
grant update (title, description, target_date, status) on public.learning_goals to authenticated;
grant delete on public.learning_goals to authenticated;

-- 2. study_tasks: "In Progress" and a link to a goal -----------------------

alter table public.study_tasks drop constraint if exists study_tasks_status_check;
alter table public.study_tasks
  add constraint study_tasks_status_check check (status in ('todo', 'in_progress', 'done'));

-- Deleting a goal keeps its tasks and just clears the link.
alter table public.study_tasks
  add column if not exists goal_id uuid references public.learning_goals (id) on delete set null;
create index if not exists study_tasks_goal_idx on public.study_tasks (goal_id);

-- Same as 015, except completed_at is cleared for any status that isn't
-- "done" (so In Progress works too).
create or replace function public.prepare_study_task()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.learner_id := auth.uid();
    new.status := 'todo';
    new.completed_at := null;
    new.created_at := now();
  else
    new.learner_id := old.learner_id;
    new.created_at := old.created_at;
    if new.status = 'done' and old.status <> 'done' then
      new.completed_at := now();
    elsif new.status <> 'done' then
      new.completed_at := null;
    else
      new.completed_at := old.completed_at;
    end if;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

-- A task can only link to one of its owner's own goals. (Row Level
-- Security already hides other people's goals, so this sees only yours.)
create or replace function public.check_study_task_goal()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.goal_id is not null
     and (tg_op = 'INSERT' or new.goal_id is distinct from old.goal_id)
     and not exists (
       select 1 from public.learning_goals g
       where g.id = new.goal_id and g.learner_id = auth.uid()
     ) then
    raise exception 'You can only link a task to one of your own goals.';
  end if;
  return new;
end;
$$;

drop trigger if exists study_tasks_check_goal on public.study_tasks;
create trigger study_tasks_check_goal
  before insert or update of goal_id on public.study_tasks
  for each row execute function public.check_study_task_goal();

-- The app may now also send goal_id. Logged-out visitors get nothing, and
-- table-wide extras (truncate, references, trigger) are taken away.
revoke all on public.study_tasks from anon;
revoke truncate, references, trigger on public.study_tasks from authenticated;
grant insert (goal_id), update (goal_id) on public.study_tasks to authenticated;

-- 3. study_activities: planned study time ----------------------------------

-- The time an activity takes up on its date. (A rule can't do this maths
-- directly, so it lives in a function — like session_slot in 006.)
create or replace function public.activity_slot(activity_date date, start_time time, end_time time)
returns tsrange
language sql
immutable
set search_path = ''
as $$
  select tsrange(activity_date + start_time, activity_date + end_time, '[)');
$$;

create table if not exists public.study_activities (
  id            uuid primary key default gen_random_uuid(),
  learner_id    uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  title         text not null check (char_length(title) <= 100 and title ~ '[[:alnum:]]'),
  subject       text not null check (
                  subject in ('math', 'science', 'english', 'filipino',
                              'programming_ict', 'accounting_business')
                ),
  activity_date date not null,
  -- Philippine time.
  start_time    time not null,
  end_time      time not null,
  notes         text not null default '' check (char_length(notes) <= 500),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint study_activities_end_after_start check (end_time > start_time)
);

-- Two of a learner's own activities can't overlap. (Back-to-back is fine:
-- 4:00–5:00 and 5:00–6:00 don't clash.)
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'study_activities_no_overlap') then
    alter table public.study_activities
      add constraint study_activities_no_overlap
      exclude using gist (
        learner_id with =,
        public.activity_slot(activity_date, start_time, end_time) with &&
      );
  end if;
end;
$$;

create or replace function public.prepare_study_activity()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.learner_id := auth.uid();
    new.created_at := now();
  else
    new.learner_id := old.learner_id;
    new.created_at := old.created_at;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists study_activities_prepare on public.study_activities;
create trigger study_activities_prepare
  before insert or update on public.study_activities
  for each row execute function public.prepare_study_activity();

alter table public.study_activities enable row level security;

drop policy if exists "learners can read their own activities" on public.study_activities;
create policy "learners can read their own activities"
  on public.study_activities for select
  to authenticated
  using ((select auth.uid()) = learner_id);

drop policy if exists "learners can add their own activities" on public.study_activities;
create policy "learners can add their own activities"
  on public.study_activities for insert
  to authenticated
  with check (
    (select auth.uid()) = learner_id
    and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'learner')
  );

drop policy if exists "learners can update their own activities" on public.study_activities;
create policy "learners can update their own activities"
  on public.study_activities for update
  to authenticated
  using ((select auth.uid()) = learner_id)
  with check ((select auth.uid()) = learner_id);

drop policy if exists "learners can delete their own activities" on public.study_activities;
create policy "learners can delete their own activities"
  on public.study_activities for delete
  to authenticated
  using ((select auth.uid()) = learner_id);

revoke all on public.study_activities from anon, authenticated;
grant select on public.study_activities to authenticated;
grant insert (title, subject, activity_date, start_time, end_time, notes) on public.study_activities to authenticated;
grant update (title, subject, activity_date, start_time, end_time, notes) on public.study_activities to authenticated;
grant delete on public.study_activities to authenticated;

-- 4. session_notes: a learner's private notes on one booking ----------------

create table if not exists public.session_notes (
  id          uuid primary key default gen_random_uuid(),
  booking_id  uuid not null unique references public.bookings (id) on delete cascade,
  learner_id  uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  questions   text not null default '' check (char_length(questions) <= 1000),
  help_topics text not null default '' check (char_length(help_topics) <= 500),
  reflection  text not null default '' check (char_length(reflection) <= 1000),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create or replace function public.prepare_session_note()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.learner_id := auth.uid();
    new.created_at := now();
  else
    new.learner_id := old.learner_id;
    new.booking_id := old.booking_id;
    new.created_at := old.created_at;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists session_notes_prepare on public.session_notes;
create trigger session_notes_prepare
  before insert or update on public.session_notes
  for each row execute function public.prepare_session_note();

alter table public.session_notes enable row level security;

-- Only the learner who wrote the notes can read them — not the tutor.
drop policy if exists "learners can read their own session notes" on public.session_notes;
create policy "learners can read their own session notes"
  on public.session_notes for select
  to authenticated
  using ((select auth.uid()) = learner_id);

-- Only on your own booking, and only while it's Accepted or Completed.
drop policy if exists "learners can add notes to their own sessions" on public.session_notes;
create policy "learners can add notes to their own sessions"
  on public.session_notes for insert
  to authenticated
  with check (
    (select auth.uid()) = learner_id
    and exists (
      select 1 from public.bookings b
      where b.id = booking_id
        and b.learner_id = (select auth.uid())
        and b.status in ('accepted', 'completed')
    )
  );

drop policy if exists "learners can update notes on their own sessions" on public.session_notes;
create policy "learners can update notes on their own sessions"
  on public.session_notes for update
  to authenticated
  using ((select auth.uid()) = learner_id)
  with check (
    (select auth.uid()) = learner_id
    and exists (
      select 1 from public.bookings b
      where b.id = booking_id
        and b.learner_id = (select auth.uid())
        and b.status in ('accepted', 'completed')
    )
  );

-- No delete policy: clearing the text does the same job.
revoke all on public.session_notes from anon, authenticated;
grant select on public.session_notes to authenticated;
grant insert (booking_id, questions, help_topics, reflection) on public.session_notes to authenticated;
grant update (questions, help_topics, reflection) on public.session_notes to authenticated;

-- 5. Check it worked ---------------------------------------------------------
--
-- Table Editor should show learning_goals, study_activities and
-- session_notes, each with no "RLS disabled" warning.
