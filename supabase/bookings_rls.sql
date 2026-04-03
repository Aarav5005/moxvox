-- Run this in Supabase SQL Editor for the project used by VITE_SUPABASE_URL.
-- It grants table access and enables RLS policies for logged-in users.

-- 1) Ensure API roles can access the table
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on table public.bookings to authenticated;

-- If you also want public/unauthenticated read access, uncomment:
-- grant select on table public.bookings to anon;

-- 2) Enable RLS
alter table public.bookings enable row level security;

-- 3) Create policies for authenticated users
drop policy if exists "authenticated can read bookings" on public.bookings;
create policy "authenticated can read bookings"
on public.bookings
for select 
to authenticated
using (true);

drop policy if exists "authenticated can insert bookings" on public.bookings;
create policy "authenticated can insert bookings"
on public.bookings
for insert
to authenticated
with check (true);

drop policy if exists "authenticated can update bookings" on public.bookings;
create policy "authenticated can update bookings"
on public.bookings
for update
to authenticated
using (true)
with check (true);

drop policy if exists "authenticated can delete bookings" on public.bookings;
create policy "authenticated can delete bookings"
on public.bookings
for delete
to authenticated
using (true);

