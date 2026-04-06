-- Run this once in the Supabase SQL editor for the project used by VITE_SUPABASE_URL.
-- It adds a small credential store that Pages Functions can update without switching platforms.

create table if not exists public.admin_credentials (
  scope text primary key,
  email text not null,
  password text not null,
  updated_at timestamptz not null default now(),
  constraint admin_credentials_scope_check check (scope in ('admin', 'admin_edit'))
);

alter table public.admin_credentials enable row level security;

revoke all on table public.admin_credentials from anon, authenticated;

drop policy if exists "deny direct access to admin_credentials" on public.admin_credentials;
create policy "deny direct access to admin_credentials"
on public.admin_credentials
for all
to anon, authenticated
using (false)
with check (false);

create or replace function public.admin_credentials_configured(p_scope text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_credentials
    where scope = p_scope
  );
$$;

create or replace function public.verify_admin_credentials(p_scope text, p_email text, p_password text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  stored_email text;
  stored_password text;
begin
  select email, password
  into stored_email, stored_password
  from public.admin_credentials
  where scope = p_scope;

  if not found then
    return false;
  end if;

  return p_email = stored_email and p_password = stored_password;
end;
$$;

create or replace function public.set_admin_credentials(p_scope text, p_email text, p_password text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.admin_credentials (scope, email, password, updated_at)
  values (p_scope, p_email, p_password, now())
  on conflict (scope) do update
    set email = excluded.email,
        password = excluded.password,
        updated_at = now();
end;
$$;

grant execute on function public.admin_credentials_configured(text) to anon;
grant execute on function public.verify_admin_credentials(text, text, text) to anon;
grant execute on function public.set_admin_credentials(text, text, text) to anon;