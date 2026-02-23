-- Supabase initialization SQL for fit_track
-- Run this in Supabase SQL editor to create required tables for the app.

-- Profiles table links to auth.users
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  created_at timestamptz default now(),
  approved boolean default false
);

-- Index on approved for quick lookup
create index if not exists idx_profiles_approved on profiles (approved);

-- Example admin user insertion (optional):
-- insert into profiles (id, email, display_name, approved)
-- values ('00000000-0000-0000-0000-000000000000','admin@example.com','Admin',true);
