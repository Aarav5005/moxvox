-- Add starter/maincourse required flags for booking timing decisions.
-- Run in Supabase SQL Editor once for your project.

alter table public.bookings
add column if not exists starter_required text default 'No';

alter table public.bookings
add column if not exists maincourse_required text default 'No';

alter table public.bookings
add column if not exists party_end_time text;

alter table public.bookings
add column if not exists jain_members integer default 0;

update public.bookings
set starter_required = coalesce(starter_required, 'No'),
    maincourse_required = coalesce(maincourse_required, 'No'),
    jain_members = coalesce(jain_members, 0);
