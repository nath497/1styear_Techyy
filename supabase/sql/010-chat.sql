-- 010 — chat: conversations and messages (Ticket 12)
--
-- Run in: Supabase -> SQL Editor -> New query -> paste -> Run
-- Needs 002 first. It only CREATES things; it does not change or delete
-- any existing data. Safe to run more than once.
--
-- One conversation per learner–tutor pair. Only the two people in it can
-- read it or send to it. The database sets who sent each message, so no
-- one can send as someone else. Messages can't be edited or deleted.
--
-- This ticket: a LEARNER starts a conversation with a tutor. (Tutors
-- starting one from a help request comes in ticket 14; live updates and
-- last_message_at in ticket 13.)

-- 1. Conversations -----------------------------------------------------

create table if not exists public.conversations (
  id              uuid primary key default gen_random_uuid(),
  learner_id      uuid not null references public.profiles (id) on delete cascade,
  -- Must be a tutor with a tutor profile.
  tutor_id        uuid not null references public.tutor_profiles (tutor_id) on delete cascade,
  created_at      timestamptz not null default now(),
  -- Set by the database when a message arrives (ticket 13).
  last_message_at timestamptz,
  unique (learner_id, tutor_id),
  check (learner_id <> tutor_id)
);

create index if not exists conversations_tutor_idx on public.conversations (tutor_id);

alter table public.conversations enable row level security;

-- Only the learner and the tutor in a conversation can see it.
drop policy if exists "people in a conversation can read it" on public.conversations;
create policy "people in a conversation can read it"
  on public.conversations for select
  to authenticated
  using ((select auth.uid()) in (learner_id, tutor_id));

-- A learner can start a conversation for themselves with any tutor.
drop policy if exists "learners can start conversations" on public.conversations;
create policy "learners can start conversations"
  on public.conversations for insert
  to authenticated
  with check (
    (select auth.uid()) = learner_id
    and exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.role = 'learner'
    )
  );

-- The app may only send who the conversation is between. Nothing can be
-- updated or deleted through the app.
revoke insert, update, delete on public.conversations from anon, authenticated;
grant insert (learner_id, tutor_id) on public.conversations to authenticated;

-- 2. Messages ----------------------------------------------------------

create table if not exists public.messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id       uuid not null references public.profiles (id) on delete cascade,
  body            text not null check (char_length(trim(body)) between 1 and 1000),
  created_at      timestamptz not null default now()
);

create index if not exists messages_conversation_idx on public.messages (conversation_id, created_at);

-- Whatever the browser sends, the sender is the logged-in user and the
-- time is now.
create or replace function public.prepare_new_message()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.sender_id := auth.uid();
  new.created_at := now();
  return new;
end;
$$;

drop trigger if exists messages_prepare_new on public.messages;
create trigger messages_prepare_new
  before insert on public.messages
  for each row execute function public.prepare_new_message();

alter table public.messages enable row level security;

-- Only the two people in the conversation can read its messages.
drop policy if exists "people in a conversation can read its messages" on public.messages;
create policy "people in a conversation can read its messages"
  on public.messages for select
  to authenticated
  using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (select auth.uid()) in (c.learner_id, c.tutor_id)
    )
  );

-- Only someone in the conversation can send, and only as themselves.
drop policy if exists "people in a conversation can send" on public.messages;
create policy "people in a conversation can send"
  on public.messages for insert
  to authenticated
  with check (
    sender_id = (select auth.uid())
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (select auth.uid()) in (c.learner_id, c.tutor_id)
    )
  );

-- The app sends only which conversation and the text. The sender and the
-- time come from the trigger above. Messages can't be edited or deleted.
revoke insert, update, delete on public.messages from anon, authenticated;
grant insert (conversation_id, body) on public.messages to authenticated;

-- 3. Check it worked ---------------------------------------------------
--
-- Table Editor should now show `conversations` and `messages`, neither
-- with an "RLS disabled" warning.
