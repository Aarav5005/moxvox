-- Add payment_note column for payment-specific notes.
-- Run in Supabase SQL Editor once for your project.

alter table public.bookings
add column if not exists payment_note text;

-- One-time backfill from legacy notes field to avoid data loss.
update public.bookings
set payment_note = other_details
where payment_note is null
  and coalesce(other_details, '') <> '';

comment on column public.bookings.payment_note is 'Payment-specific notes entered from Billing section.';
