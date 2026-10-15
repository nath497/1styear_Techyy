-- 012 — tutors can start a chat from a help request (Ticket 14)
--
-- Run in: Supabase -> SQL Editor -> New query -> paste -> Run
-- Needs 008 and 010 first. It only ADDS a rule; it does not change or
-- delete any existing data. Safe to run more than once.
--
-- A tutor may start a conversation with a learner ONLY if the tutor made
-- an offer on one of that learner's help requests. Tutors can't
-- cold-message learners. (Learners can still start a chat with any tutor,
-- from 010.)

-- A yes/no helper: "did I make an offer on any of this learner's help
-- requests?" It answers only about the logged-in user. `security
-- definer` lets it look across offers and requests without tripping the
-- tables' own read rules.
create or replace function public.i_offered_to_learner(learner uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.help_offers o
    join public.help_requests r on r.id = o.request_id
    where o.tutor_id = (select auth.uid())
      and r.learner_id = learner
  );
$$;

revoke execute on function public.i_offered_to_learner(uuid) from public, anon;
grant execute on function public.i_offered_to_learner(uuid) to authenticated;

drop policy if exists "tutors can start conversations with learners they offered to help" on public.conversations;
create policy "tutors can start conversations with learners they offered to help"
  on public.conversations for insert
  to authenticated
  with check (
    (select auth.uid()) = tutor_id
    and public.i_offered_to_learner(learner_id)
  );

-- (Reading, sending, one-conversation-per-pair and no edits/deletes are
-- unchanged from 010 and 011.)
