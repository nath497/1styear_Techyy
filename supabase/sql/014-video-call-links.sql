-- 014 — video call links on accepted sessions (Ticket 15)
--
-- Run in: Supabase -> SQL Editor -> New query -> paste -> Run
-- Needs 003 and 004 first. It only ADDS a column and rules; it does not
-- change or delete any existing booking. Safe to run more than once.
--
-- The tutor on an Accepted session can add a video call link (Google
-- Meet, Zoom, Microsoft Teams or Jitsi). TutorMatch doesn't run the call
-- itself. Only the learner and tutor on the booking can see it (the
-- bookings read rule from 003 is unchanged).

-- 1. The column, and what a link may look like ------------------------------
--
-- https only, and the address must really be one of these apps — so
-- look-alikes such as "meet.google.com.evil.com" or
-- "meet.google.com@evil.com" are refused. Zoom allows school subdomains
-- like "school.zoom.us".

alter table public.bookings add column if not exists meeting_link text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'bookings_meeting_link_ok') then
    alter table public.bookings
      add constraint bookings_meeting_link_ok
      check (
        meeting_link is null
        or (
          char_length(meeting_link) <= 300
          and meeting_link ~* '^https://(meet\.google\.com|([a-z0-9-]+\.)?zoom\.us|teams\.microsoft\.com|teams\.live\.com|meet\.jit\.si)(/[^[:space:]]*)?$'
        )
      );
  end if;
end;
$$;

-- 2. Who may change it, and when --------------------------------------------
--
-- Only the tutor on the booking, only while it is Accepted. When a session
-- stops being Accepted (cancelled or completed), its link is cleared so an
-- old call link never lingers. The messages below are shown to the user.

create or replace function public.check_booking_meeting_link()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  me uuid := auth.uid();
begin
  -- Leaving Accepted: clear the link (whoever made the status change).
  if old.status = 'accepted' and new.status <> 'accepted' then
    new.meeting_link := null;
    return new;
  end if;

  if new.meeting_link is not distinct from old.meeting_link then
    return new;
  end if;

  -- Edits made by the team in the Supabase dashboard have no logged-in
  -- user; let those through. (App users always have one.)
  if me is null then
    return new;
  end if;

  if me <> old.tutor_id then
    raise exception 'Only the tutor can set the video call link.';
  end if;

  if old.status <> 'accepted' then
    raise exception 'You can add a video call link once the session is accepted.';
  end if;

  return new;
end;
$$;

drop trigger if exists bookings_check_meeting_link on public.bookings;
create trigger bookings_check_meeting_link
  before update on public.bookings
  for each row execute function public.check_booking_meeting_link();

-- The app may now change the status (as before) and the link — nothing
-- else on a booking.
revoke update on public.bookings from anon, authenticated;
grant update (status, meeting_link) on public.bookings to authenticated;
