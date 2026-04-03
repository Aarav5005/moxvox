-- Add menu_items column for storing selected menu items from BookingForm
-- Run in Supabase SQL Editor once for your project.

alter table public.bookings
add column if not exists menu_items text[] default '{}'::text[];

update public.bookings
set menu_items = '{}'::text[]
where menu_items is null;
