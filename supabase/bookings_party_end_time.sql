-- Add party_end_time column for storing booking end time.
-- Run in Supabase SQL Editor once for your project.

alter table public.bookings
add column if not exists party_end_time text;
