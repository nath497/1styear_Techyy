-- 019 — Schedule: no clashes even when two saves arrive at once
--
-- Run in: Supabase -> SQL Editor -> New query -> paste -> Run
-- Needs 017 first. It only REPLACES one function; no data is changed or
-- deleted. Safe to run more than once. No add-ons needed.
--
-- 017 checks that a learner's study activities don't overlap. But two
-- saves at the very same moment (say, a double-tap on Add) could both pass
-- the check before either was saved. This version takes a short lock per
-- learner first, so their saves are checked one after the other — the same
-- idea 018 uses for bookings. Other learners are never held up.

create or replace function public.prepare_study_activity()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  clash text;
begin
  if tg_op = 'INSERT' then
    new.learner_id := auth.uid();
    new.created_at := now();
  else
    new.learner_id := old.learner_id;
    new.created_at := old.created_at;
  end if;
  new.updated_at := now();

  -- One save at a time per learner. Released automatically when the save
  -- finishes.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext('study_activities:' || new.learner_id::text));

  -- Refuse an activity that overlaps one of the learner's own activities
  -- on the same date. (Back-to-back is fine.) Row Level Security means this
  -- only ever sees the learner's own activities.
  select a.title into clash
  from public.study_activities a
  where a.learner_id = new.learner_id
    and a.id <> new.id
    and a.activity_date = new.activity_date
    and a.start_time < new.end_time
    and new.start_time < a.end_time
  limit 1;
  if clash is not null then
    raise exception using
      errcode = 'exclusion_violation',
      message = 'This clashes with another study activity.',
      detail = clash;
  end if;

  return new;
end;
$$;

-- Check it worked: this should return true.
--
--   select prosrc like '%pg_advisory_xact_lock%' from pg_proc where proname = 'prepare_study_activity';
