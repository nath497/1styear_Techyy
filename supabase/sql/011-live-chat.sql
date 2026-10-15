-- 011 — live chat (Ticket 13)
--
-- Run in: Supabase -> SQL Editor -> New query -> paste -> Run
-- Needs 010 first. It only ADDS things; it does not change or delete any
-- existing data. Safe to run more than once.
--
-- 1. Each conversation remembers when its latest message arrived, so the
--    Messages list can show the newest chats first.
-- 2. Messages are switched on for Supabase Realtime, so new messages
--    appear without refreshing. Realtime still uses Row Level Security:
--    each person only receives messages from their own conversations.
--    No new keys or environment variables are needed.

-- 1. Keep last_message_at up to date ---------------------------------------
--
-- `security definer` lets the database set this even though nobody may
-- update conversations through the app.

create or replace function public.touch_conversation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.conversations
     set last_message_at = new.created_at
   where id = new.conversation_id;
  return new;
end;
$$;

drop trigger if exists messages_touch_conversation on public.messages;
create trigger messages_touch_conversation
  after insert on public.messages
  for each row execute function public.touch_conversation();

-- Conversations that already have messages get their time filled in once.
update public.conversations c
   set last_message_at = m.latest
  from (select conversation_id, max(created_at) as latest from public.messages group by conversation_id) m
 where m.conversation_id = c.id
   and c.last_message_at is distinct from m.latest;

create index if not exists conversations_last_message_idx on public.conversations (last_message_at desc);

-- 2. Switch messages on for Realtime -----------------------------------------

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
       where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages'
     ) then
    alter publication supabase_realtime add table public.messages;
  end if;
end;
$$;

-- 3. Check it worked ---------------------------------------------------------
--
-- Database -> Publications -> supabase_realtime should now include
-- `messages`. (Or: Table Editor -> messages shows "Realtime on".)
