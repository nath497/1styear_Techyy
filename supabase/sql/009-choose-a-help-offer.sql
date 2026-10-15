-- 009 — choosing an offer: Open -> Matched (Ticket 11)
--
-- Run in: Supabase -> SQL Editor -> New query -> paste -> Run
-- Needs 007 and 008 first. It only ADDS rules; it does not change or
-- delete any existing data. Safe to run more than once.
--
-- After this, the learner who posted a help request can choose ONE of
-- the offers made on it. The request becomes Matched and remembers the
-- chosen offer. Choosing never books a session — the learner then sends
-- a normal session request, with the usual price and rules.

-- 1. The chosen offer must be a real offer -----------------------------

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'help_requests_chosen_offer_fkey'
  ) then
    alter table public.help_requests
      add constraint help_requests_chosen_offer_fkey
      foreign key (chosen_offer_id) references public.help_offers (id) on delete set null;
  end if;
end;
$$;

-- 2. The learner may now set the chosen offer (and still only the status
--    otherwise). Nothing else on a request can be changed by the app.

revoke update on public.help_requests from anon, authenticated;
grant update (status, chosen_offer_id) on public.help_requests to authenticated;

-- 3. Allowed changes ------------------------------------------------------
--
-- Same as 007, plus: the learner moves Open -> Matched by choosing an
-- offer that was made on THIS request. The chosen offer can't be set
-- any other way, and can't be changed afterwards.

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
  if me is null then
    return new;
  end if;

  -- Nothing changed.
  if new.status = old.status and new.chosen_offer_id is not distinct from old.chosen_offer_id then
    return new;
  end if;

  -- Learner cancels an Open request (without choosing anyone).
  if me = old.learner_id and old.status = 'open' and new.status = 'cancelled'
     and new.chosen_offer_id is not distinct from old.chosen_offer_id then
    return new;
  end if;

  -- Learner chooses an offer made on this request.
  if me = old.learner_id and old.status = 'open' and new.status = 'matched' then
    if new.chosen_offer_id is null or not exists (
      select 1 from public.help_offers o
      where o.id = new.chosen_offer_id and o.request_id = old.id
    ) then
      raise exception 'Please choose one of the offers made on this request.';
    end if;
    return new;
  end if;

  raise exception 'This help request is % — it can''t be changed like that.', old.status;
end;
$$;

-- (The trigger from 007 already runs this function; replacing the
-- function is enough.)
