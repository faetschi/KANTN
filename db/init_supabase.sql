-- Run this in Supabase SQL editor to create required tables for the app.

-- Dev reset (optional): drop app tables so re-running this file is idempotent.
-- Note: this does NOT delete auth.users. Uncomment the line below if you want to wipe users in dev.
-- delete from auth.users;
drop table if exists profiles cascade;

-- Profiles table links to auth.users
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  avatar_url text,
  fun_fact text,
  height int,
  weight int,
  age int,
  created_at timestamptz default now(),
  approved boolean default false,
  is_admin boolean default false
);

-- Ensure new profile fields exist when re-running in dev
alter table profiles add column if not exists avatar_url text;
alter table profiles add column if not exists fun_fact text;
alter table profiles add column if not exists height int;
alter table profiles add column if not exists weight int;
alter table profiles add column if not exists age int;

-- Index on approved for quick lookup
create index if not exists idx_profiles_approved on profiles (approved);

-- Enable Row Level Security and allow users to manage their own profile
alter table profiles enable row level security;

-- Ensure authenticated users can read/write profiles through RLS policies
grant select, insert, update on table profiles to authenticated;
grant select on table profiles to anon;

drop policy if exists "profiles_select" on profiles;
drop policy if exists "profiles_insert_own" on profiles;
drop policy if exists "profiles_update" on profiles;

drop function if exists is_admin;

create or replace function is_admin()
returns boolean
language sql
security definer
set search_path = public
set row_security = off
as $$
  select exists (
    select 1 from profiles p
    where p.id = auth.uid() and p.is_admin = true
  );
$$;

create policy "profiles_select" on profiles
  for select using (auth.uid() = id or is_admin());

create policy "profiles_insert_own" on profiles
  for insert with check (auth.uid() = id);

create policy "profiles_update" on profiles
  for update using (auth.uid() = id or is_admin())
  with check (auth.uid() = id or is_admin());

-- Example admin user insertion (optional):
-- insert into profiles (id, email, display_name, approved)
-- values ('00000000-0000-0000-0000-000000000000','admin@example.com','Admin',true);
