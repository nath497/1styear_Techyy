-- 016 — LearnTrack: the topics a learner is studying (Tickets 19 + 20)
--
-- Run in: Supabase -> SQL Editor -> New query -> paste -> Run
-- Needs 002 first. It only CREATES things; it does not change or delete
-- any existing data. Safe to run more than once.
--
-- Every rule LearnTrack needs is here (adding, changing the status,
-- editing and deleting), so ticket 20 needs no new SQL.
--
-- Only the learner who added a topic can see, change or delete it.
-- Tutors, other learners and logged-out visitors can't see anyone's
-- LearnTrack.

-- 1. The table ---------------------------------------------------------

create table if not exists public.learn_topics (
  id         uuid primary key default gen_random_uuid(),
  learner_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  subject    text not null check (
               subject in ('math', 'science', 'english', 'filipino',
                           'programming_ict', 'accounting_business')
             ),
  -- At least one letter or number, so a name can't be only spaces or
  -- invisible characters.
  name       text not null check (char_length(name) <= 100 and name ~ '[[:alnum:]]'),
  status     text not null default 'need_review'
             check (status in ('need_review', 'learning', 'understood')),
  note       text not null default '' check (char_length(note) <= 300),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- A learner can't add the same topic twice in one subject. "Fractions",
-- "fractions" and " Fractions " count as the same.
create unique index if not exists learn_topics_one_name_per_subject
  on public.learn_topics (learner_id, subject, lower(btrim(name)));

-- 2. The database fills in the owner and the dates ---------------------
--
-- Whatever the browser sends: the owner is the logged-in user and the
-- dates are the real time. The owner can never be changed later.

create or replace function public.prepare_learn_topic()
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

drop trigger if exists learn_topics_prepare on public.learn_topics;
create trigger learn_topics_prepare
  before insert or update on public.learn_topics
  for each row execute function public.prepare_learn_topic();

-- 3. Row Level Security ------------------------------------------------------

alter table public.learn_topics enable row level security;

-- Only the owner can see their topics.
drop policy if exists "learners can read their own topics" on public.learn_topics;
create policy "learners can read their own topics"
  on public.learn_topics for select
  to authenticated
  using ((select auth.uid()) = learner_id);

-- Only learners can add topics, and only for themselves.
drop policy if exists "learners can add their own topics" on public.learn_topics;
create policy "learners can add their own topics"
  on public.learn_topics for insert
  to authenticated
  with check (
    (select auth.uid()) = learner_id
    and exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.role = 'learner'
    )
  );

-- Only the owner can change their topics...
drop policy if exists "learners can update their own topics" on public.learn_topics;
create policy "learners can update their own topics"
  on public.learn_topics for update
  to authenticated
  using ((select auth.uid()) = learner_id)
  with check ((select auth.uid()) = learner_id);

-- ...or delete them.
drop policy if exists "learners can delete their own topics" on public.learn_topics;
create policy "learners can delete their own topics"
  on public.learn_topics for delete
  to authenticated
  using ((select auth.uid()) = learner_id);

-- Start from nothing, then allow only what the app needs: logged-in
-- users may read (the policies above still limit them to their own
-- rows) and send the topic's own fields. Logged-out visitors get nothing.
revoke all on public.learn_topics from anon, authenticated;
grant select on public.learn_topics to authenticated;
grant insert (subject, name, status, note) on public.learn_topics to authenticated;
grant update (subject, name, status, note) on public.learn_topics to authenticated;
grant delete on public.learn_topics to authenticated;

-- 4. Check it worked ---------------------------------------------------------
--
-- Table Editor should now show `learn_topics` with no "RLS disabled"
-- warning.
