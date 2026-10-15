-- 013 — chat hardening (from the chat code review)
--
-- Run in: Supabase -> SQL Editor -> New query -> paste -> Run
-- Needs 010 and 011 first. It does NOT change or delete any existing
-- message. Safe to run more than once.
--
-- 1. A message must be at most 1000 characters IN TOTAL and contain some
--    visible text. (Before, the length was measured after trimming spaces,
--    so a message padded with thousands of spaces — or made only of line
--    breaks — could get through.)
-- 2. At most 20 messages per minute per person, so nobody can spam a
--    chat.
-- 3. Each conversation stores its latest message (text and sender), so
--    the Messages list can always show a preview.

-- 1. The real length rule ----------------------------------------------------
--
-- The old rule from 010 is replaced. `not valid` means it applies to every
-- NEW message without re-checking (or touching) old ones.

do $$
begin
  if exists (select 1 from pg_constraint where conname = 'messages_body_check') then
    alter table public.messages drop constraint messages_body_check;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'messages_body_ok') then
    alter table public.messages
      add constraint messages_body_ok
      check (char_length(body) <= 1000 and btrim(body, E' \t\r\n') <> '')
      not valid;
  end if;
end;
$$;

-- 2. Sender, time and a send limit ------------------------------------------
--
-- Same as 010 (the sender is always the logged-in user, the time is now),
-- plus: no more than 20 messages in the last minute. The message below is
-- shown to the user.

create index if not exists messages_sender_time_idx on public.messages (sender_id, created_at desc);

create or replace function public.prepare_new_message()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.sender_id := auth.uid();
  new.created_at := now();

  if (
    select count(*) from public.messages
    where sender_id = new.sender_id and created_at > now() - interval '1 minute'
  ) >= 20 then
    raise exception 'You''re sending messages very fast. Please wait a moment and try again.';
  end if;

  return new;
end;
$$;

-- 3. Remember the latest message on the conversation -------------------------

alter table public.conversations add column if not exists last_message_body text;
alter table public.conversations add column if not exists last_message_sender_id uuid;

-- Same as 011, plus the preview text (first 200 characters) and sender.
create or replace function public.touch_conversation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.conversations
     set last_message_at = new.created_at,
         last_message_body = left(new.body, 200),
         last_message_sender_id = new.sender_id
   where id = new.conversation_id;
  return new;
end;
$$;

-- Fill in the preview for conversations that already have messages.
update public.conversations c
   set last_message_at = m.created_at,
       last_message_body = left(m.body, 200),
       last_message_sender_id = m.sender_id
  from (
    select distinct on (conversation_id) conversation_id, created_at, body, sender_id
    from public.messages
    order by conversation_id, created_at desc
  ) m
 where m.conversation_id = c.id
   and c.last_message_body is distinct from left(m.body, 200);

-- (Nobody can change these columns through the app: there is still no
-- update permission on conversations — see 010.)
