-- 015 — Study Planner: a learner's private study tasks (Tickets 16 + 17)
--
-- Run in: Supabase -> SQL Editor -> New query -> paste -> Run
-- Needs 002 first. It only CREATES things; it does not change or delete
-- any existing data. Safe to run more than once.
--
-- Every rule the planner needs is here (adding, marking done, editing
-- and deleting), so ticket 17 needs no new SQL.
--
-- Only the learner who created a task can see, change or delete it.
-- Tutors, other learners and logged-out visitors can't see anyone's
-- planner. Deleting is allowed: these are a learner's private notes, not
-- shared records like session requests.

-- 1. The table ---------------------------------------------------------

create table if not exists public.study_tasks (
  id                uuid primary key default gen_random_uuid(),
  learner_id        uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  title             text not null check (char_length(title) <= 100 and btrim(title, E' \t\r\n') <> ''),
  subject           text not null check (
                      subject in ('math', 'science', 'english', 'filipino',
                                  'programming_ict', 'accounting_business')
                    ),
  due_date          date not null,
  -- Philippine time; optional.
  due_time          time,
  priority          text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  estimated_minutes integer check (estimated_minutes between 5 and 600),
  notes             text not null default '' check (char_length(notes) <= 500),
  status            text not null default 'todo' check (status in ('todo', 'done')),
  completed_at      timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists study_tasks_learner_due_idx on public.study_tasks (learner_id, due_date);

-- 2. The database fills in the owner, the completed time and the dates ------
--
-- Whatever the browser sends: the owner is the logged-in user, a new task
-- starts as "to do", completed_at follows the status, and the dates are
-- the real time.

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
    elsif new.status = 'todo' then
      new.completed_at := null;
    else
      new.completed_at := old.completed_at;
    end if;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists study_tasks_prepare on public.study_tasks;
create trigger study_tasks_prepare
  before insert or update on public.study_tasks
  for each row execute function public.prepare_study_task();

-- 3. Row Level Security ------------------------------------------------------

alter table public.study_tasks enable row level security;

-- Only the owner can see their tasks.
drop policy if exists "learners can read their own study tasks" on public.study_tasks;
create policy "learners can read their own study tasks"
  on public.study_tasks for select
  to authenticated
  using ((select auth.uid()) = learner_id);

-- Only learners can add tasks, and only for themselves.
drop policy if exists "learners can add their own study tasks" on public.study_tasks;
create policy "learners can add their own study tasks"
  on public.study_tasks for insert
  to authenticated
  with check (
    (select auth.uid()) = learner_id
    and exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.role = 'learner'
    )
  );

-- Only the owner can change their tasks...
drop policy if exists "learners can update their own study tasks" on public.study_tasks;
create policy "learners can update their own study tasks"
  on public.study_tasks for update
  to authenticated
  using ((select auth.uid()) = learner_id)
  with check ((select auth.uid()) = learner_id);

-- ...or delete them.
drop policy if exists "learners can delete their own study tasks" on public.study_tasks;
create policy "learners can delete their own study tasks"
  on public.study_tasks for delete
  to authenticated
  using ((select auth.uid()) = learner_id);

-- The app may only send the task's own fields. The owner, completed time
-- and dates are set by the trigger above.
revoke insert, update, delete on public.study_tasks from anon, authenticated;
grant insert (title, subject, due_date, due_time, priority, estimated_minutes, notes)
  on public.study_tasks to authenticated;
grant update (title, subject, due_date, due_time, priority, estimated_minutes, notes, status)
  on public.study_tasks to authenticated;
grant delete on public.study_tasks to authenticated;

-- 4. Check it worked ---------------------------------------------------------
--
-- Table Editor should now show `study_tasks` with no "RLS disabled"
-- warning.
