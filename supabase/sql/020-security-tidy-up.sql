-- 020 — Security tidy-up (Supabase security scanner warnings)
--
-- Run in: Supabase -> SQL Editor -> New query -> paste -> Run
-- Needs 002, 005, 008 and 011 first. It only TAKES AWAY permissions that
-- nobody needs and tightens one setting; no data is changed or deleted.
-- Safe to run more than once. No add-ons needed.
--
-- 1. These four functions only ever run as TRIGGERS (automatically, when
--    a row is saved). Postgres refuses to run a trigger function on its
--    own, so they couldn't be misused — but the scanner still lists them
--    as "callable by anyone" through the API. Removing that permission
--    makes the API refuse them outright. Triggers keep working: Postgres
--    doesn't check this permission when it runs a trigger.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.record_commission() from public, anon, authenticated;
revoke execute on function public.touch_conversation() from public, anon, authenticated;
revoke execute on function public.count_new_help_offer() from public, anon, authenticated;

-- 2. set_updated_at (from 002) didn't pin its search path. Pinning it
--    means nobody can trick it into using a look-alike function.
alter function public.set_updated_at() set search_path = '';

-- 3. Check it worked: this should return no rows.
--
--   select p.proname
--   from pg_proc p join pg_namespace n on n.oid = p.pronamespace
--   where n.nspname = 'public'
--     and p.proname in ('handle_new_user', 'record_commission', 'touch_conversation', 'count_new_help_offer')
--     and (has_function_privilege('anon', p.oid, 'execute')
--          or has_function_privilege('authenticated', p.oid, 'execute'));
