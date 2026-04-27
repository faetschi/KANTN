-- Run this in Supabase SQL editor to create required tables for the app.

create extension if not exists pgcrypto;

-- Dev reset (optional): drop app tables so re-running this file is idempotent.
-- Note: this does NOT delete auth.users. Uncomment the line below if you want to wipe users in dev.
-- delete from auth.users;
drop table if exists workout_session_sets cascade;
drop table if exists workout_session_exercises cascade;
drop table if exists workout_sessions cascade;
drop table if exists workout_plan_exercises cascade;
drop table if exists workout_plan_shares cascade;
drop table if exists workout_plans cascade;
drop table if exists exercise_shares cascade;
drop table if exists exercises cascade;
drop table if exists profiles cascade;

-- Drop storage policies before dropping helper functions they reference.
drop policy if exists "exercise_images_select" on storage.objects;
drop policy if exists "exercise_images_insert_admin" on storage.objects;
drop policy if exists "exercise_images_update_admin" on storage.objects;
drop policy if exists "exercise_images_delete_admin" on storage.objects;
drop policy if exists "exercise_images_insert" on storage.objects;
drop policy if exists "exercise_images_update" on storage.objects;
drop policy if exists "exercise_images_delete" on storage.objects;
drop policy if exists "avatars_select" on storage.objects;
drop policy if exists "avatars_insert" on storage.objects;
drop policy if exists "avatars_update" on storage.objects;
drop policy if exists "avatars_delete" on storage.objects;

drop function if exists is_admin();
drop function if exists touch_updated_at();
drop function if exists calc_burned_calories(numeric, numeric, integer);
drop function if exists get_my_stats(timestamptz, timestamptz);
drop function if exists create_workout_session_tx(uuid, uuid, timestamptz, timestamptz, integer, numeric, jsonb);
drop function if exists seed_beginner_plans_for_user(uuid);
drop function if exists set_user_role_by_email(text, boolean, boolean);
drop trigger if exists trg_auth_users_profile_sync on auth.users;
drop function if exists sync_profile_from_auth_user();

-- Core profile data
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  avatar_url text,
  fun_fact text,
  height int,
  weight int,
  age int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  approved boolean not null default false,
  is_admin boolean not null default false
);

-- Exercise master data:
-- - default: admin-managed and visible to all users
-- - private/shared: user-created exercises
create table if not exists exercises (
  id uuid primary key default gen_random_uuid(),
  created_by uuid references profiles(id) on delete set null,
  name text not null,
  description text,
  image_url text,
  muscle_group text,
  exercise_type text not null default 'general',
  met_value numeric(5, 2) not null default 5.00,
  visibility text not null default 'default' check (visibility in ('default', 'private', 'shared')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists exercise_shares (
  id uuid primary key default gen_random_uuid(),
  exercise_id uuid not null references exercises(id) on delete cascade,
  shared_with_user_id uuid not null references profiles(id) on delete cascade,
  created_by uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (exercise_id, shared_with_user_id)
);

-- Workout plan definitions (per user, optional sharing)
create table if not exists workout_plans (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  category text check (category in ('upper body', 'lower body', 'core', 'cardio', 'mobility')),
  description text,
  visibility text not null default 'private' check (visibility in ('private', 'shared', 'public')),
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_performed_at timestamptz
);

create table if not exists workout_plan_shares (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references workout_plans(id) on delete cascade,
  shared_with_user_id uuid not null references profiles(id) on delete cascade,
  created_by uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (plan_id, shared_with_user_id)
);

create table if not exists workout_plan_exercises (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references workout_plans(id) on delete cascade,
  exercise_id uuid not null references exercises(id) on delete restrict,
  position int not null,
  target_sets int,
  target_reps int,
  notes text,
  created_at timestamptz not null default now(),
  unique (plan_id, position)
);

-- Completed workout data and detailed exercise/set results
create table if not exists workout_sessions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id) on delete cascade,
  plan_id uuid references workout_plans(id) on delete set null,
  started_at timestamptz not null,
  finished_at timestamptz,
  duration_seconds int not null default 0,
  total_calories numeric(10, 2) not null default 0,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists workout_session_exercises (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references workout_sessions(id) on delete cascade,
  exercise_id uuid references exercises(id) on delete set null,
  exercise_name_snapshot text,
  exercise_type_snapshot text,
  met_value_snapshot numeric(5, 2) not null default 5.00,
  position int not null default 0,
  duration_seconds int not null default 0,
  calories_burned numeric(10, 2) not null default 0,
  created_at timestamptz not null default now(),
  unique (session_id, position)
);

create table if not exists workout_session_sets (
  id uuid primary key default gen_random_uuid(),
  session_exercise_id uuid not null references workout_session_exercises(id) on delete cascade,
  set_order int not null,
  reps int,
  weight numeric(8, 2),
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  unique (session_exercise_id, set_order)
);

create index if not exists idx_profiles_approved on profiles (approved);
create index if not exists idx_profiles_admin on profiles (is_admin);
create index if not exists idx_exercises_visibility on exercises (visibility, is_active);
create index if not exists idx_exercises_created_by on exercises (created_by);
create index if not exists idx_workout_plans_owner on workout_plans (owner_id);
create index if not exists idx_workout_sessions_owner_created on workout_sessions (owner_id, created_at desc);
create index if not exists idx_workout_sessions_owner_finished on workout_sessions (owner_id, finished_at desc);

create or replace function touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_profiles_updated_at
before update on profiles
for each row execute function touch_updated_at();

create trigger trg_exercises_updated_at
before update on exercises
for each row execute function touch_updated_at();

create trigger trg_workout_plans_updated_at
before update on workout_plans
for each row execute function touch_updated_at();

create or replace function sync_profile_from_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into profiles (id, email, display_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data ->> 'name',
      split_part(coalesce(new.email, ''), '@', 1)
    ),
    coalesce(
      new.raw_user_meta_data ->> 'avatar_url',
      new.raw_user_meta_data ->> 'picture'
    )
  )
  on conflict (id) do update
  set
    email = excluded.email,
    display_name = coalesce(excluded.display_name, profiles.display_name),
    avatar_url = coalesce(excluded.avatar_url, profiles.avatar_url),
    updated_at = now();

  return new;
end;
$$;

create trigger trg_auth_users_profile_sync
after insert or update of email, raw_user_meta_data on auth.users
for each row execute function sync_profile_from_auth_user();

insert into profiles (id, email, display_name, avatar_url)
select
  u.id,
  u.email,
  coalesce(
    u.raw_user_meta_data ->> 'name',
    split_part(coalesce(u.email, ''), '@', 1)
  ),
  coalesce(
    u.raw_user_meta_data ->> 'avatar_url',
    u.raw_user_meta_data ->> 'picture'
  )
from auth.users u
on conflict (id) do update
set
  email = excluded.email,
  display_name = coalesce(excluded.display_name, profiles.display_name),
  avatar_url = coalesce(excluded.avatar_url, profiles.avatar_url),
  updated_at = now();

create or replace function is_admin()
returns boolean
language sql
security definer
set search_path = public
set row_security = off
as $$
  select exists (
    select 1
    from profiles p
    where p.id = auth.uid() and p.is_admin = true
  );
$$;

-- Calories formula: kcal = MET * 3.5 * body_weight_kg / 200 * minutes
create or replace function calc_burned_calories(weight_kg numeric, met numeric, duration_seconds integer)
returns numeric
language sql
immutable
as $$
  select coalesce(round((greatest(met, 0) * 3.5 * greatest(weight_kg, 0) / 200.0) * (greatest(duration_seconds, 0) / 60.0), 2), 0);
$$;

create or replace function get_my_stats(from_ts timestamptz, to_ts timestamptz)
returns table (
  workout_count bigint,
  total_duration_seconds bigint,
  total_calories numeric
)
language sql
security definer
set search_path = public
set row_security = off
as $$
  select
    count(*)::bigint as workout_count,
    coalesce(sum(ws.duration_seconds), 0)::bigint as total_duration_seconds,
    coalesce(sum(ws.total_calories), 0)::numeric as total_calories
  from workout_sessions ws
  where ws.owner_id = auth.uid()
    and ws.created_at >= from_ts
    and ws.created_at < to_ts;
$$;

create or replace function create_workout_session_tx(
  p_owner_id uuid,
  p_plan_id uuid,
  p_started_at timestamptz,
  p_finished_at timestamptz,
  p_duration_seconds integer,
  p_total_calories numeric,
  p_exercises jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v_session_id uuid;
  v_session_exercise_id uuid;
  v_set_order int;
  ex_item jsonb;
  set_item jsonb;
begin
  if auth.uid() is distinct from p_owner_id and not is_admin() then
    raise exception 'Not allowed to create workout session for this user';
  end if;

  insert into workout_sessions (
    owner_id,
    plan_id,
    started_at,
    finished_at,
    duration_seconds,
    total_calories
  )
  values (
    p_owner_id,
    p_plan_id,
    p_started_at,
    p_finished_at,
    p_duration_seconds,
    p_total_calories
  )
  returning id into v_session_id;

  for ex_item in select value from jsonb_array_elements(coalesce(p_exercises, '[]'::jsonb))
  loop
    insert into workout_session_exercises (
      session_id,
      exercise_id,
      exercise_name_snapshot,
      exercise_type_snapshot,
      met_value_snapshot,
      position,
      duration_seconds,
      calories_burned
    )
    values (
      v_session_id,
      nullif(ex_item ->> 'exerciseId', '')::uuid,
      ex_item ->> 'exerciseNameSnapshot',
      ex_item ->> 'exerciseTypeSnapshot',
      coalesce((ex_item ->> 'metValueSnapshot')::numeric, 5),
      coalesce((ex_item ->> 'position')::int, 0),
      coalesce((ex_item ->> 'durationSeconds')::int, 0),
      coalesce((ex_item ->> 'caloriesBurned')::numeric, 0)
    )
    returning id into v_session_exercise_id;

    v_set_order := 0;
    for set_item in select value from jsonb_array_elements(coalesce(ex_item -> 'sets', '[]'::jsonb))
    loop
      insert into workout_session_sets (
        session_exercise_id,
        set_order,
        reps,
        weight,
        completed
      )
      values (
        v_session_exercise_id,
        v_set_order,
        (set_item ->> 'reps')::int,
        (set_item ->> 'weight')::numeric,
        coalesce((set_item ->> 'completed')::boolean, false)
      );
      v_set_order := v_set_order + 1;
    end loop;
  end loop;

  if p_plan_id is not null then
    update workout_plans
    set last_performed_at = p_finished_at
    where id = p_plan_id
      and owner_id = p_owner_id;
  end if;

  return v_session_id;
end;
$$;

create or replace function seed_beginner_plans_for_user(p_owner_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v_created boolean := false;
  v_plan_a_id uuid;
  v_plan_b_id uuid;
begin
  if auth.uid() is distinct from p_owner_id and not is_admin() then
    raise exception 'Not allowed to seed plans for this user';
  end if;

  insert into exercises (id, created_by, name, description, image_url, muscle_group, exercise_type, met_value, visibility, is_active)
  values
    (
      '11111111-1111-1111-1111-111111111101',
      null,
      'Bodyweight Squat',
      'Foundational lower-body exercise for beginner strength and control.',
      'https://api.dicebear.com/7.x/shapes/svg?seed=bodyweight-squat',
      'Legs',
      'strength',
      5.0,
      'default',
      true
    ),
    (
      '11111111-1111-1111-1111-111111111102',
      null,
      'Push-Up',
      'Upper-body push movement targeting chest, shoulders, and triceps.',
      'https://api.dicebear.com/7.x/shapes/svg?seed=push-up',
      'Chest',
      'strength',
      8.0,
      'default',
      true
    ),
    (
      '11111111-1111-1111-1111-111111111103',
      null,
      'Bent-Over Row',
      'Pull movement focused on upper back and posture support.',
      'https://api.dicebear.com/7.x/shapes/svg?seed=bent-over-row',
      'Back',
      'strength',
      6.0,
      'default',
      true
    ),
    (
      '11111111-1111-1111-1111-111111111104',
      null,
      'Plank Hold',
      'Core stabilization exercise for trunk strength and endurance.',
      'https://api.dicebear.com/7.x/shapes/svg?seed=plank-hold',
      'Core',
      'core',
      3.5,
      'default',
      true
    )
  on conflict (id) do update
  set
    name = excluded.name,
    description = excluded.description,
    image_url = excluded.image_url,
    muscle_group = excluded.muscle_group,
    exercise_type = excluded.exercise_type,
    met_value = excluded.met_value,
    visibility = 'default',
    is_active = true,
    updated_at = now();

  if not exists (
    select 1
    from workout_plans p
    where p.owner_id = p_owner_id
      and p.name = 'Beginner Full Body A'
  ) then
    insert into workout_plans (owner_id, name, description, visibility, is_active)
    values (
      p_owner_id,
      'Beginner Full Body A',
      'Intro full-body workout focused on squat, push, and core fundamentals.',
      'private',
      false
    )
    returning id into v_plan_a_id;

    insert into workout_plan_exercises (plan_id, exercise_id, position, target_sets, target_reps)
    values
      (v_plan_a_id, '11111111-1111-1111-1111-111111111101', 0, 3, 12),
      (v_plan_a_id, '11111111-1111-1111-1111-111111111102', 1, 3, 10),
      (v_plan_a_id, '11111111-1111-1111-1111-111111111104', 2, 3, 30);

    v_created := true;
  end if;

  if not exists (
    select 1
    from workout_plans p
    where p.owner_id = p_owner_id
      and p.name = 'Beginner Full Body B'
  ) then
    insert into workout_plans (owner_id, name, description, visibility, is_active)
    values (
      p_owner_id,
      'Beginner Full Body B',
      'Beginner progression day with balanced lower body, pull, and core work.',
      'private',
      false
    )
    returning id into v_plan_b_id;

    insert into workout_plan_exercises (plan_id, exercise_id, position, target_sets, target_reps)
    values
      (v_plan_b_id, '11111111-1111-1111-1111-111111111103', 0, 3, 10),
      (v_plan_b_id, '11111111-1111-1111-1111-111111111101', 1, 3, 12),
      (v_plan_b_id, '11111111-1111-1111-1111-111111111104', 2, 3, 30);

    v_created := true;
  end if;

  return v_created;
end;
$$;

create or replace function set_user_role_by_email(
  target_email text,
  target_approved boolean default true,
  target_is_admin boolean default false
)
returns table (
  user_id uuid,
  email text,
  approved boolean,
  is_admin boolean
)
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
begin
  if target_email is null or btrim(target_email) = '' then
    raise exception 'target_email must not be empty';
  end if;

  if not exists (
    select 1
    from auth.users u
    where lower(u.email) = lower(target_email)
  ) then
    raise exception 'No auth.users row found for email: %', target_email;
  end if;

  insert into profiles (id, email, display_name, approved, is_admin)
  select
    u.id,
    u.email,
    coalesce(u.raw_user_meta_data ->> 'name', split_part(u.email, '@', 1)),
    target_approved,
    target_is_admin
  from auth.users u
  where lower(u.email) = lower(target_email)
  on conflict (id) do update
  set
    email = excluded.email,
    approved = excluded.approved,
    is_admin = excluded.is_admin,
    updated_at = now();

  return query
  select p.id, p.email, p.approved, p.is_admin
  from profiles p
  where lower(p.email) = lower(target_email);
end;
$$;

grant select on table profiles to anon;
grant select, insert, update on table profiles to authenticated;

grant select, insert, update, delete on table exercises to authenticated;
grant select, insert, delete on table exercise_shares to authenticated;

grant select, insert, update, delete on table workout_plans to authenticated;
grant select, insert, delete on table workout_plan_shares to authenticated;
grant select, insert, update, delete on table workout_plan_exercises to authenticated;

grant select, insert, update, delete on table workout_sessions to authenticated;
grant select, insert, update, delete on table workout_session_exercises to authenticated;
grant select, insert, update, delete on table workout_session_sets to authenticated;

grant execute on function calc_burned_calories(numeric, numeric, integer) to authenticated;
grant execute on function get_my_stats(timestamptz, timestamptz) to authenticated;
grant execute on function create_workout_session_tx(uuid, uuid, timestamptz, timestamptz, integer, numeric, jsonb) to authenticated;
grant execute on function seed_beginner_plans_for_user(uuid) to authenticated;

revoke execute on function set_user_role_by_email(text, boolean, boolean) from public;
revoke execute on function set_user_role_by_email(text, boolean, boolean) from anon;
revoke execute on function set_user_role_by_email(text, boolean, boolean) from authenticated;
grant execute on function set_user_role_by_email(text, boolean, boolean) to service_role;

alter table profiles enable row level security;
alter table exercises enable row level security;
alter table exercise_shares enable row level security;
alter table workout_plans enable row level security;
alter table workout_plan_shares enable row level security;
alter table workout_plan_exercises enable row level security;
alter table workout_sessions enable row level security;
alter table workout_session_exercises enable row level security;
alter table workout_session_sets enable row level security;

drop policy if exists "profiles_select" on profiles;
drop policy if exists "profiles_insert_own" on profiles;
drop policy if exists "profiles_update" on profiles;

create policy "profiles_select" on profiles
  for select using (auth.uid() = id or is_admin());

create policy "profiles_insert_own" on profiles
  for insert with check (auth.uid() = id);

create policy "profiles_update" on profiles
  for update using (auth.uid() = id or is_admin())
  with check (auth.uid() = id or is_admin());

drop policy if exists "exercises_select" on exercises;
drop policy if exists "exercises_insert" on exercises;
drop policy if exists "exercises_update" on exercises;
drop policy if exists "exercises_delete" on exercises;

create policy "exercises_select" on exercises
  for select
  using (
    visibility = 'default'
    or created_by = auth.uid()
    or exists (
      select 1
      from exercise_shares es
      where es.exercise_id = exercises.id
        and es.shared_with_user_id = auth.uid()
    )
    or is_admin()
  );

create policy "exercises_insert" on exercises
  for insert
  with check (
    (visibility in ('private', 'shared') and created_by = auth.uid())
    or (visibility = 'default' and is_admin())
  );

create policy "exercises_update" on exercises
  for update
  using (
    (created_by = auth.uid() and visibility in ('private', 'shared'))
    or is_admin()
  )
  with check (
    (created_by = auth.uid() and visibility in ('private', 'shared'))
    or (visibility = 'default' and is_admin())
    or is_admin()
  );

create policy "exercises_delete" on exercises
  for delete
  using (
    (created_by = auth.uid() and visibility in ('private', 'shared'))
    or is_admin()
  );

drop policy if exists "exercise_shares_select" on exercise_shares;
drop policy if exists "exercise_shares_insert" on exercise_shares;
drop policy if exists "exercise_shares_delete" on exercise_shares;

create policy "exercise_shares_select" on exercise_shares
  for select
  using (
    created_by = auth.uid()
    or shared_with_user_id = auth.uid()
    or is_admin()
  );

create policy "exercise_shares_insert" on exercise_shares
  for insert
  with check (
    created_by = auth.uid()
    and exists (
      select 1
      from exercises e
      where e.id = exercise_shares.exercise_id
        and (e.created_by = auth.uid() or is_admin())
    )
  );

create policy "exercise_shares_delete" on exercise_shares
  for delete
  using (created_by = auth.uid() or is_admin());

drop policy if exists "plans_select" on workout_plans;
drop policy if exists "plans_insert" on workout_plans;
drop policy if exists "plans_update" on workout_plans;
drop policy if exists "plans_delete" on workout_plans;

create policy "plans_select" on workout_plans
  for select
  using (
    owner_id = auth.uid()
    or visibility = 'public'
    or exists (
      select 1
      from workout_plan_shares ps
      where ps.plan_id = workout_plans.id
        and ps.shared_with_user_id = auth.uid()
    )
    or is_admin()
  );

create policy "plans_insert" on workout_plans
  for insert
  with check (owner_id = auth.uid() or is_admin());

create policy "plans_update" on workout_plans
  for update
  using (owner_id = auth.uid() or is_admin())
  with check (owner_id = auth.uid() or is_admin());

create policy "plans_delete" on workout_plans
  for delete
  using (owner_id = auth.uid() or is_admin());

drop policy if exists "plan_shares_select" on workout_plan_shares;
drop policy if exists "plan_shares_insert" on workout_plan_shares;
drop policy if exists "plan_shares_delete" on workout_plan_shares;

create policy "plan_shares_select" on workout_plan_shares
  for select
  using (
    created_by = auth.uid()
    or shared_with_user_id = auth.uid()
    or is_admin()
  );

create policy "plan_shares_insert" on workout_plan_shares
  for insert
  with check (
    created_by = auth.uid()
    and exists (
      select 1
      from workout_plans p
      where p.id = workout_plan_shares.plan_id
        and (p.owner_id = auth.uid() or is_admin())
    )
  );

create policy "plan_shares_delete" on workout_plan_shares
  for delete
  using (created_by = auth.uid() or is_admin());

drop policy if exists "plan_exercises_select" on workout_plan_exercises;
drop policy if exists "plan_exercises_insert" on workout_plan_exercises;
drop policy if exists "plan_exercises_update" on workout_plan_exercises;
drop policy if exists "plan_exercises_delete" on workout_plan_exercises;

create policy "plan_exercises_select" on workout_plan_exercises
  for select
  using (
    exists (
      select 1
      from workout_plans p
      where p.id = workout_plan_exercises.plan_id
        and (
          p.owner_id = auth.uid()
          or p.visibility = 'public'
          or exists (
            select 1 from workout_plan_shares s
            where s.plan_id = p.id
              and s.shared_with_user_id = auth.uid()
          )
          or is_admin()
        )
    )
  );

create policy "plan_exercises_insert" on workout_plan_exercises
  for insert
  with check (
    exists (
      select 1
      from workout_plans p
      where p.id = workout_plan_exercises.plan_id
        and (p.owner_id = auth.uid() or is_admin())
    )
  );

create policy "plan_exercises_update" on workout_plan_exercises
  for update
  using (
    exists (
      select 1
      from workout_plans p
      where p.id = workout_plan_exercises.plan_id
        and (p.owner_id = auth.uid() or is_admin())
    )
  )
  with check (
    exists (
      select 1
      from workout_plans p
      where p.id = workout_plan_exercises.plan_id
        and (p.owner_id = auth.uid() or is_admin())
    )
  );

create policy "plan_exercises_delete" on workout_plan_exercises
  for delete
  using (
    exists (
      select 1
      from workout_plans p
      where p.id = workout_plan_exercises.plan_id
        and (p.owner_id = auth.uid() or is_admin())
    )
  );

drop policy if exists "sessions_select" on workout_sessions;
drop policy if exists "sessions_insert" on workout_sessions;
drop policy if exists "sessions_update" on workout_sessions;
drop policy if exists "sessions_delete" on workout_sessions;

create policy "sessions_select" on workout_sessions
  for select
  using (owner_id = auth.uid() or is_admin());

create policy "sessions_insert" on workout_sessions
  for insert
  with check (owner_id = auth.uid() or is_admin());

create policy "sessions_update" on workout_sessions
  for update
  using (owner_id = auth.uid() or is_admin())
  with check (owner_id = auth.uid() or is_admin());

create policy "sessions_delete" on workout_sessions
  for delete
  using (owner_id = auth.uid() or is_admin());

drop policy if exists "session_exercises_select" on workout_session_exercises;
drop policy if exists "session_exercises_insert" on workout_session_exercises;
drop policy if exists "session_exercises_update" on workout_session_exercises;
drop policy if exists "session_exercises_delete" on workout_session_exercises;

create policy "session_exercises_select" on workout_session_exercises
  for select
  using (
    exists (
      select 1
      from workout_sessions s
      where s.id = workout_session_exercises.session_id
        and (s.owner_id = auth.uid() or is_admin())
    )
  );

create policy "session_exercises_insert" on workout_session_exercises
  for insert
  with check (
    exists (
      select 1
      from workout_sessions s
      where s.id = workout_session_exercises.session_id
        and (s.owner_id = auth.uid() or is_admin())
    )
  );

create policy "session_exercises_update" on workout_session_exercises
  for update
  using (
    exists (
      select 1
      from workout_sessions s
      where s.id = workout_session_exercises.session_id
        and (s.owner_id = auth.uid() or is_admin())
    )
  )
  with check (
    exists (
      select 1
      from workout_sessions s
      where s.id = workout_session_exercises.session_id
        and (s.owner_id = auth.uid() or is_admin())
    )
  );

create policy "session_exercises_delete" on workout_session_exercises
  for delete
  using (
    exists (
      select 1
      from workout_sessions s
      where s.id = workout_session_exercises.session_id
        and (s.owner_id = auth.uid() or is_admin())
    )
  );

drop policy if exists "session_sets_select" on workout_session_sets;
drop policy if exists "session_sets_insert" on workout_session_sets;
drop policy if exists "session_sets_update" on workout_session_sets;
drop policy if exists "session_sets_delete" on workout_session_sets;

create policy "session_sets_select" on workout_session_sets
  for select
  using (
    exists (
      select 1
      from workout_session_exercises se
      join workout_sessions s on s.id = se.session_id
      where se.id = workout_session_sets.session_exercise_id
        and (s.owner_id = auth.uid() or is_admin())
    )
  );

create policy "session_sets_insert" on workout_session_sets
  for insert
  with check (
    exists (
      select 1
      from workout_session_exercises se
      join workout_sessions s on s.id = se.session_id
      where se.id = workout_session_sets.session_exercise_id
        and (s.owner_id = auth.uid() or is_admin())
    )
  );

create policy "session_sets_update" on workout_session_sets
  for update
  using (
    exists (
      select 1
      from workout_session_exercises se
      join workout_sessions s on s.id = se.session_id
      where se.id = workout_session_sets.session_exercise_id
        and (s.owner_id = auth.uid() or is_admin())
    )
  )
  with check (
    exists (
      select 1
      from workout_session_exercises se
      join workout_sessions s on s.id = se.session_id
      where se.id = workout_session_sets.session_exercise_id
        and (s.owner_id = auth.uid() or is_admin())
    )
  );

create policy "session_sets_delete" on workout_session_sets
  for delete
  using (
    exists (
      select 1
      from workout_session_exercises se
      join workout_sessions s on s.id = se.session_id
      where se.id = workout_session_sets.session_exercise_id
        and (s.owner_id = auth.uid() or is_admin())
    )
  );

-- Exercise image storage (admins manage default image library)
insert into storage.buckets (id, name, public)
values ('exercise-images', 'exercise-images', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "exercise_images_select" on storage.objects;
drop policy if exists "exercise_images_insert_admin" on storage.objects;
drop policy if exists "exercise_images_update_admin" on storage.objects;
drop policy if exists "exercise_images_delete_admin" on storage.objects;
drop policy if exists "exercise_images_insert" on storage.objects;
drop policy if exists "exercise_images_update" on storage.objects;
drop policy if exists "exercise_images_delete" on storage.objects;
drop policy if exists "avatars_select" on storage.objects;
drop policy if exists "avatars_insert" on storage.objects;
drop policy if exists "avatars_update" on storage.objects;
drop policy if exists "avatars_delete" on storage.objects;

create policy "exercise_images_select" on storage.objects
  for select
  using (bucket_id = 'exercise-images');

create policy "exercise_images_insert" on storage.objects
  for insert
  with check (bucket_id = 'exercise-images' and auth.role() = 'authenticated');

create policy "exercise_images_update" on storage.objects
  for update
  using (
    bucket_id = 'exercise-images'
    and (
      is_admin()
      or owner = auth.uid()
    )
  )
  with check (
    bucket_id = 'exercise-images'
    and (
      is_admin()
      or owner = auth.uid()
    )
  );

create policy "exercise_images_delete" on storage.objects
  for delete
  using (
    bucket_id = 'exercise-images'
    and (
      is_admin()
      or owner = auth.uid()
    )
  );

create policy "avatars_select" on storage.objects
  for select
  using (bucket_id = 'avatars');

create policy "avatars_insert" on storage.objects
  for insert
  with check (
    bucket_id = 'avatars'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars_update" on storage.objects
  for update
  using (
    bucket_id = 'avatars'
    and owner = auth.uid()
  )
  with check (
    bucket_id = 'avatars'
    and owner = auth.uid()
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars_delete" on storage.objects
  for delete
  using (
    bucket_id = 'avatars'
    and owner = auth.uid()
  );

-- Example admin user insertion (optional):
-- insert into profiles (id, email, display_name, approved, is_admin)
-- values ('00000000-0000-0000-0000-000000000000','admin@example.com','Admin',true,true);

-- Example helper usage (run in SQL editor or with service_role key):
-- select * from set_user_role_by_email('faetschi.ai@gmail.com', true, true);
