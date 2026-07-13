-- =====================================================================
-- db/seed_example_users.sql
-- Idempotent seed: 3 rich test users + 1 extra (Dana) for pending friend
-- request. All rows use fixed UUIDs so db/unseed_example_users.sql removes
-- everything by deleting these auth.users rows (cascades through profiles,
-- plans, sessions, friendships, ...).
--
-- Login:  <email>  /  Test1234!
--   alex.test@kantn.dev   (runner / cardio)
--   bilal.test@kantn.dev  (strength)
--   casey.test@kantn.dev  (mixed / cycling)
--   dana.test@kantn.dev   (new, no workouts — only here so Alex sees a
--                            pending friend request in the UI).
--
-- Re-run safe (ON CONFLICT / DO NOTHING). Does NOT touch real users or the
-- default exercises created by init_supabase.sql. Assumes init_supabase.sql
-- has already been run (tables + default exercises exist).
-- =====================================================================

begin; -- rollback all if anything fails

-- 1. auth.users (bypasses GoTrue signup; encrypted_password is bcrypt for "Test1234!")
insert into auth.users (
  id, aud, role, email, encrypted_password, email_confirmed_at,
  created_at, updated_at, raw_app_meta_data, raw_user_meta_data
) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'authenticated', 'authenticated', 'alex.test@kantn.dev', '$2b$10$QOkXyqdTZjVujyNwGbh2ye2KbUtnZitSwRIXvKhc.YOTgBEcCbFbW', now(),
   now(), now(), '{}'::jsonb, jsonb_build_object('name', 'Alex Tester', 'avatar_url', 'https://api.dicebear.com/7.x/avataaars/svg?seed=alex_kantn_test')),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'authenticated', 'authenticated', 'bilal.test@kantn.dev', '$2b$10$QOkXyqdTZjVujyNwGbh2ye2KbUtnZitSwRIXvKhc.YOTgBEcCbFbW', now(),
   now(), now(), '{}'::jsonb, jsonb_build_object('name', 'Bilal Tester', 'avatar_url', 'https://api.dicebear.com/7.x/avataaars/svg?seed=bilal_kantn_test')),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'authenticated', 'authenticated', 'casey.test@kantn.dev', '$2b$10$QOkXyqdTZjVujyNwGbh2ye2KbUtnZitSwRIXvKhc.YOTgBEcCbFbW', now(),
   now(), now(), '{}'::jsonb, jsonb_build_object('name', 'Casey Tester', 'avatar_url', 'https://api.dicebear.com/7.x/avataaars/svg?seed=casey_kantn_test')),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'authenticated', 'authenticated', 'dana.test@kantn.dev', '$2b$10$QOkXyqdTZjVujyNwGbh2ye2KbUtnZitSwRIXvKhc.YOTgBEcCbFbW', now(),
   now(), now(), '{}'::jsonb, jsonb_build_object('name', 'Dana Tester', 'avatar_url', 'https://api.dicebear.com/7.x/avataaars/svg?seed=dana_kantn_test'))
on conflict (id) do nothing;

-- 2. profiles (the trg_auth_users_profile_sync trigger created rows; refine them)
insert into profiles (id, email, username, display_name, avatar_url, fun_fact, height, weight, age, approved, is_admin, leaderboard_visible)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'alex.test@kantn.dev', 'alex_kantn_test', 'Alex Tester', 'https://api.dicebear.com/7.x/avataaars/svg?seed=alex_kantn_test', 'Runs before sunrise, even on weekends.', 178, 70, 28, true, false, true),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'bilal.test@kantn.dev', 'bilal_kantn_test', 'Bilal Tester', 'https://api.dicebear.com/7.x/avataaars/svg?seed=bilal_kantn_test', 'Lifter who never skips leg day.', 183, 82, 31, true, false, true),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'casey.test@kantn.dev', 'casey_kantn_test', 'Casey Tester', 'https://api.dicebear.com/7.x/avataaars/svg?seed=casey_kantn_test', 'Cycling commuter and part-time plank holder.', 170, 65, 25, true, false, true),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'dana.test@kantn.dev', 'dana_kantn_test', 'Dana Tester', 'https://api.dicebear.com/7.x/avataaars/svg?seed=dana_kantn_test', 'New here — still figuring out the squat rack.', 165, 58, 27, true, false, true)
on conflict (id) do update set
  email = excluded.email,
  username = excluded.username,
  display_name = excluded.display_name,
  avatar_url = excluded.avatar_url,
  fun_fact = excluded.fun_fact,
  height = excluded.height,
  weight = excluded.weight,
  age = excluded.age,
  approved = true,
  is_admin = false,
  leaderboard_visible = true,
  updated_at = now();

-- 3. workout_plans (one active plan per owner is enforced by a partial unique index)
insert into workout_plans (id, owner_id, name, category, description, visibility, is_active)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaa0a0001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Morning Run', 'running', 'Morning Run — seeded cardio plan (category defines the activity).', 'private', true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaa0a0002', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Full Body Burn', 'full body', 'Full Body Burn — seeded example plan.', 'private', false),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaa0a0003', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Push Day', 'upper body', 'Push Day — seeded example plan.', 'private', false),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbb0b0001', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Push Strength', 'upper body', 'Push Strength — seeded example plan.', 'private', true),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbb0b0002', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Pull Strength', 'upper body', 'Pull Strength — seeded example plan.', 'private', false),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbb0b0003', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Leg Day', 'lower body', 'Leg Day — seeded example plan.', 'private', false),
  ('cccccccc-cccc-cccc-cccc-cccccc0c0001', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Full Body Flow', 'full body', 'Full Body Flow — seeded example plan.', 'private', true),
  ('cccccccc-cccc-cccc-cccc-cccccc0c0002', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Core Crusher', 'core', 'Core Crusher — seeded example plan.', 'private', false),
  ('cccccccc-cccc-cccc-cccc-cccccc0c0003', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Cycle Commute', 'cycling', 'Cycle Commute — seeded cardio plan (category defines the activity).', 'private', false)
on conflict (id) do nothing;

-- 4. workout_plan_exercises (cardio plans intentionally have none, matching seed_beginner_plans_for_user)
insert into workout_plan_exercises (plan_id, exercise_id, position, target_sets, target_reps, target_distance_meters, target_duration_seconds)
values
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaa0a0002', '11111111-1111-1111-1111-111111111111', 0, 3, 10, null, null),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaa0a0002', '11111111-1111-1111-1111-111111111102', 1, 3, 10, null, null),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaa0a0002', '11111111-1111-1111-1111-111111111104', 2, 3, 30, null, null),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaa0a0003', '11111111-1111-1111-1111-111111111105', 0, 3, 10, null, null),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaa0a0003', '11111111-1111-1111-1111-111111111106', 1, 3, 10, null, null),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaa0a0003', '11111111-1111-1111-1111-111111111102', 2, 3, 10, null, null),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbb0b0001', '11111111-1111-1111-1111-111111111105', 0, 3, 10, null, null),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbb0b0001', '11111111-1111-1111-1111-111111111106', 1, 3, 10, null, null),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbb0b0001', '11111111-1111-1111-1111-111111111102', 2, 3, 10, null, null),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbb0b0002', '11111111-1111-1111-1111-111111111107', 0, 3, 10, null, null),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbb0b0002', '11111111-1111-1111-1111-111111111103', 1, 3, 10, null, null),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbb0b0003', '11111111-1111-1111-1111-111111111101', 0, 3, 10, null, null),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbb0b0003', '11111111-1111-1111-1111-111111111108', 1, 3, 10, null, null),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbb0b0003', '11111111-1111-1111-1111-111111111109', 2, 3, 10, null, null),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbb0b0003', '11111111-1111-1111-1111-111111111110', 3, 3, 10, null, null),
('cccccccc-cccc-cccc-cccc-cccccc0c0001', '11111111-1111-1111-1111-111111111101', 0, 3, 10, null, null),
('cccccccc-cccc-cccc-cccc-cccccc0c0001', '11111111-1111-1111-1111-111111111102', 1, 3, 10, null, null),
('cccccccc-cccc-cccc-cccc-cccccc0c0001', '11111111-1111-1111-1111-111111111103', 2, 3, 10, null, null),
('cccccccc-cccc-cccc-cccc-cccccc0c0001', '11111111-1111-1111-1111-111111111104', 3, 3, 30, null, null),
('cccccccc-cccc-cccc-cccc-cccccc0c0002', '11111111-1111-1111-1111-111111111104', 0, 3, 30, null, null),
('cccccccc-cccc-cccc-cccc-cccccc0c0002', '11111111-1111-1111-1111-111111111112', 1, 3, 10, null, null),
('cccccccc-cccc-cccc-cccc-cccccc0c0002', '11111111-1111-1111-1111-111111111111', 2, 3, 10, null, null)
on conflict (plan_id, position) do nothing;

-- 5. workout_sessions
insert into workout_sessions (id, owner_id, plan_id, started_at, finished_at, duration_seconds, total_calories, user_weight_kg, photo_url)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaa5a0001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaa0a0001', '2026-07-13T09:00:00+00', '2026-07-13T09:00:00'::timestamptz + make_interval(secs => 1800), 1800, 360.15, 70, 'https://picsum.photos/seed/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaa5a0001/800/600'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaa5a0002', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaa0a0002', '2026-07-12T18:00:00+00', '2026-07-12T18:00:00'::timestamptz + make_interval(secs => 2400), 2400, 318.51, 70, null),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaa5a0003', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaa0a0001', '2026-07-11T07:30:00+00', '2026-07-11T07:30:00'::timestamptz + make_interval(secs => 1500), 1500, 300.13, 70, 'https://picsum.photos/seed/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaa5a0003/800/600'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaa5a0004', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaa0a0003', '2026-07-07T17:00:00+00', '2026-07-07T17:00:00'::timestamptz + make_interval(secs => 1800), 1800, 251.13, 70, null),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaa5a0005', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaa0a0002', '2026-07-02T18:00:00+00', '2026-07-02T18:00:00'::timestamptz + make_interval(secs => 2700), 2700, 358.31, 70, 'https://picsum.photos/seed/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaa5a0005/800/600'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbb5b0006', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbb0b0003', '2026-07-13T18:00:00+00', '2026-07-13T18:00:00'::timestamptz + make_interval(secs => 2400), 2400, 301.36, 82, null),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbb5b0007', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbb0b0001', '2026-07-12T18:00:00+00', '2026-07-12T18:00:00'::timestamptz + make_interval(secs => 2100), 2100, 343.2, 82, 'https://picsum.photos/seed/bbbbbbbb-bbbb-bbbb-bbbb-bbbbbb5b0007/800/600'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbb5b0008', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbb0b0002', '2026-07-10T18:00:00+00', '2026-07-10T18:00:00'::timestamptz + make_interval(secs => 1800), 1800, 279.83, 82, null),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbb5b0009', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbb0b0003', '2026-07-08T17:00:00+00', '2026-07-08T17:00:00'::timestamptz + make_interval(secs => 2400), 2400, 301.36, 82, null),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbb5b0010', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbb0b0001', '2026-07-04T18:00:00+00', '2026-07-04T18:00:00'::timestamptz + make_interval(secs => 2400), 2400, 392.24, 82, 'https://picsum.photos/seed/bbbbbbbb-bbbb-bbbb-bbbb-bbbbbb5b0010/800/600'),
  ('cccccccc-cccc-cccc-cccc-cccccc5c0011', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'cccccccc-cccc-cccc-cccc-cccccc0c0001', '2026-07-13T06:00:00+00', '2026-07-13T06:00:00'::timestamptz + make_interval(secs => 2100), 2100, 223.96, 65, 'https://picsum.photos/seed/cccccccc-cccc-cccc-cccc-cccccc5c0011/800/600'),
  ('cccccccc-cccc-cccc-cccc-cccccc5c0012', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'cccccccc-cccc-cccc-cccc-cccccc0c0002', '2026-07-11T18:00:00+00', '2026-07-11T18:00:00'::timestamptz + make_interval(secs => 1200), 1200, 136.5, 65, null),
  ('cccccccc-cccc-cccc-cccc-cccccc5c0013', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'cccccccc-cccc-cccc-cccc-cccccc0c0003', '2026-07-09T07:00:00+00', '2026-07-09T07:00:00'::timestamptz + make_interval(secs => 1800), 1800, 255.94, 65, null),
  ('cccccccc-cccc-cccc-cccc-cccccc5c0014', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'cccccccc-cccc-cccc-cccc-cccccc0c0001', '2026-07-06T18:00:00+00', '2026-07-06T18:00:00'::timestamptz + make_interval(secs => 2400), 2400, 255.94, 65, 'https://picsum.photos/seed/cccccccc-cccc-cccc-cccc-cccccc5c0014/800/600'),
  ('cccccccc-cccc-cccc-cccc-cccccc5c0015', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'cccccccc-cccc-cccc-cccc-cccccc0c0002', '2026-07-03T18:00:00+00', '2026-07-03T18:00:00'::timestamptz + make_interval(secs => 1500), 1500, 170.62, 65, null)
on conflict (id) do nothing;

-- 6. workout_session_exercises
insert into workout_session_exercises (
  id, session_id, exercise_id, exercise_name_snapshot, exercise_type_snapshot,
  met_value_snapshot, position, duration_seconds, calories_burned,
  distance_meters, avg_pace_per_km_seconds, max_pace_per_km_seconds, avg_speed_kmh
) values
('0e000000-0000-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaa5a0001', '11111111-1111-1111-1111-111111111113', 'Outdoor Run', 'cardio', 9.8, 0, 1800, 360.15, 5000, 360, 330, 10),
('0e000000-0000-0000-0000-000000000002', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaa5a0002', '11111111-1111-1111-1111-111111111111', 'Burpee', 'full body', 8, 0, 800, 130.67, 0, 0, 0, 0),
('0e000000-0000-0000-0000-000000000003', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaa5a0002', '11111111-1111-1111-1111-111111111102', 'Push-Up', 'strength', 8, 1, 800, 130.67, 0, 0, 0, 0),
('0e000000-0000-0000-0000-000000000004', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaa5a0002', '11111111-1111-1111-1111-111111111104', 'Plank Hold', 'core', 3.5, 2, 800, 57.17, 0, 0, 0, 0),
('0e000000-0000-0000-0000-000000000005', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaa5a0003', '11111111-1111-1111-1111-111111111113', 'Outdoor Run', 'cardio', 9.8, 0, 1500, 300.13, 4000, 375, 345, 9.6),
('0e000000-0000-0000-0000-000000000006', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaa5a0004', '11111111-1111-1111-1111-111111111105', 'Bench Press', 'strength', 6, 0, 600, 73.5, 0, 0, 0, 0),
('0e000000-0000-0000-0000-000000000007', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaa5a0004', '11111111-1111-1111-1111-111111111106', 'Overhead Press', 'strength', 6.5, 1, 600, 79.63, 0, 0, 0, 0),
('0e000000-0000-0000-0000-000000000008', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaa5a0004', '11111111-1111-1111-1111-111111111102', 'Push-Up', 'strength', 8, 2, 600, 98, 0, 0, 0, 0),
('0e000000-0000-0000-0000-000000000009', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaa5a0005', '11111111-1111-1111-1111-111111111111', 'Burpee', 'full body', 8, 0, 900, 147, 0, 0, 0, 0),
('0e000000-0000-0000-0000-000000000010', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaa5a0005', '11111111-1111-1111-1111-111111111102', 'Push-Up', 'strength', 8, 1, 900, 147, 0, 0, 0, 0),
('0e000000-0000-0000-0000-000000000011', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaa5a0005', '11111111-1111-1111-1111-111111111104', 'Plank Hold', 'core', 3.5, 2, 900, 64.31, 0, 0, 0, 0),
('0e000000-0000-0000-0000-000000000012', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbb5b0006', '11111111-1111-1111-1111-111111111101', 'Bodyweight Squat', 'strength', 5, 0, 600, 71.75, 0, 0, 0, 0),
('0e000000-0000-0000-0000-000000000013', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbb5b0006', '11111111-1111-1111-1111-111111111108', 'Reverse Lunge', 'strength', 5.5, 1, 600, 78.93, 0, 0, 0, 0),
('0e000000-0000-0000-0000-000000000014', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbb5b0006', '11111111-1111-1111-1111-111111111109', 'Romanian Deadlift', 'strength', 6.5, 2, 600, 93.28, 0, 0, 0, 0),
('0e000000-0000-0000-0000-000000000015', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbb5b0006', '11111111-1111-1111-1111-111111111110', 'Calf Raise', 'strength', 4, 3, 600, 57.4, 0, 0, 0, 0),
('0e000000-0000-0000-0000-000000000016', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbb5b0007', '11111111-1111-1111-1111-111111111105', 'Bench Press', 'strength', 6, 0, 700, 100.45, 0, 0, 0, 0),
('0e000000-0000-0000-0000-000000000017', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbb5b0007', '11111111-1111-1111-1111-111111111106', 'Overhead Press', 'strength', 6.5, 1, 700, 108.82, 0, 0, 0, 0),
('0e000000-0000-0000-0000-000000000018', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbb5b0007', '11111111-1111-1111-1111-111111111102', 'Push-Up', 'strength', 8, 2, 700, 133.93, 0, 0, 0, 0),
('0e000000-0000-0000-0000-000000000019', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbb5b0008', '11111111-1111-1111-1111-111111111107', 'Pull-Up', 'strength', 7, 0, 900, 150.68, 0, 0, 0, 0),
('0e000000-0000-0000-0000-000000000020', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbb5b0008', '11111111-1111-1111-1111-111111111103', 'Bent-Over Row', 'strength', 6, 1, 900, 129.15, 0, 0, 0, 0),
('0e000000-0000-0000-0000-000000000021', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbb5b0009', '11111111-1111-1111-1111-111111111101', 'Bodyweight Squat', 'strength', 5, 0, 600, 71.75, 0, 0, 0, 0),
('0e000000-0000-0000-0000-000000000022', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbb5b0009', '11111111-1111-1111-1111-111111111108', 'Reverse Lunge', 'strength', 5.5, 1, 600, 78.93, 0, 0, 0, 0),
('0e000000-0000-0000-0000-000000000023', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbb5b0009', '11111111-1111-1111-1111-111111111109', 'Romanian Deadlift', 'strength', 6.5, 2, 600, 93.28, 0, 0, 0, 0),
('0e000000-0000-0000-0000-000000000024', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbb5b0009', '11111111-1111-1111-1111-111111111110', 'Calf Raise', 'strength', 4, 3, 600, 57.4, 0, 0, 0, 0),
('0e000000-0000-0000-0000-000000000025', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbb5b0010', '11111111-1111-1111-1111-111111111105', 'Bench Press', 'strength', 6, 0, 800, 114.8, 0, 0, 0, 0),
('0e000000-0000-0000-0000-000000000026', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbb5b0010', '11111111-1111-1111-1111-111111111106', 'Overhead Press', 'strength', 6.5, 1, 800, 124.37, 0, 0, 0, 0),
('0e000000-0000-0000-0000-000000000027', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbb5b0010', '11111111-1111-1111-1111-111111111102', 'Push-Up', 'strength', 8, 2, 800, 153.07, 0, 0, 0, 0),
('0e000000-0000-0000-0000-000000000028', 'cccccccc-cccc-cccc-cccc-cccccc5c0011', '11111111-1111-1111-1111-111111111101', 'Bodyweight Squat', 'strength', 5, 0, 525, 49.77, 0, 0, 0, 0),
('0e000000-0000-0000-0000-000000000029', 'cccccccc-cccc-cccc-cccc-cccccc5c0011', '11111111-1111-1111-1111-111111111102', 'Push-Up', 'strength', 8, 1, 525, 79.63, 0, 0, 0, 0),
('0e000000-0000-0000-0000-000000000030', 'cccccccc-cccc-cccc-cccc-cccccc5c0011', '11111111-1111-1111-1111-111111111103', 'Bent-Over Row', 'strength', 6, 2, 525, 59.72, 0, 0, 0, 0),
('0e000000-0000-0000-0000-000000000031', 'cccccccc-cccc-cccc-cccc-cccccc5c0011', '11111111-1111-1111-1111-111111111104', 'Plank Hold', 'core', 3.5, 3, 525, 34.84, 0, 0, 0, 0),
('0e000000-0000-0000-0000-000000000032', 'cccccccc-cccc-cccc-cccc-cccccc5c0012', '11111111-1111-1111-1111-111111111104', 'Plank Hold', 'core', 3.5, 0, 400, 26.54, 0, 0, 0, 0),
('0e000000-0000-0000-0000-000000000033', 'cccccccc-cccc-cccc-cccc-cccccc5c0012', '11111111-1111-1111-1111-111111111112', 'Kettlebell Swing', 'strength', 6.5, 1, 400, 49.29, 0, 0, 0, 0),
('0e000000-0000-0000-0000-000000000034', 'cccccccc-cccc-cccc-cccc-cccccc5c0012', '11111111-1111-1111-1111-111111111111', 'Burpee', 'full body', 8, 2, 400, 60.67, 0, 0, 0, 0),
('0e000000-0000-0000-0000-000000000035', 'cccccccc-cccc-cccc-cccc-cccccc5c0013', '11111111-1111-1111-1111-111111111114', 'Cycling', 'cardio', 7.5, 0, 1800, 255.94, 12000, 300, 270, 24),
('0e000000-0000-0000-0000-000000000036', 'cccccccc-cccc-cccc-cccc-cccccc5c0014', '11111111-1111-1111-1111-111111111101', 'Bodyweight Squat', 'strength', 5, 0, 600, 56.88, 0, 0, 0, 0),
('0e000000-0000-0000-0000-000000000037', 'cccccccc-cccc-cccc-cccc-cccccc5c0014', '11111111-1111-1111-1111-111111111102', 'Push-Up', 'strength', 8, 1, 600, 91, 0, 0, 0, 0),
('0e000000-0000-0000-0000-000000000038', 'cccccccc-cccc-cccc-cccc-cccccc5c0014', '11111111-1111-1111-1111-111111111103', 'Bent-Over Row', 'strength', 6, 2, 600, 68.25, 0, 0, 0, 0),
('0e000000-0000-0000-0000-000000000039', 'cccccccc-cccc-cccc-cccc-cccccc5c0014', '11111111-1111-1111-1111-111111111104', 'Plank Hold', 'core', 3.5, 3, 600, 39.81, 0, 0, 0, 0),
('0e000000-0000-0000-0000-000000000040', 'cccccccc-cccc-cccc-cccc-cccccc5c0015', '11111111-1111-1111-1111-111111111104', 'Plank Hold', 'core', 3.5, 0, 500, 33.18, 0, 0, 0, 0),
('0e000000-0000-0000-0000-000000000041', 'cccccccc-cccc-cccc-cccc-cccccc5c0015', '11111111-1111-1111-1111-111111111112', 'Kettlebell Swing', 'strength', 6.5, 1, 500, 61.61, 0, 0, 0, 0),
('0e000000-0000-0000-0000-000000000042', 'cccccccc-cccc-cccc-cccc-cccccc5c0015', '11111111-1111-1111-1111-111111111111', 'Burpee', 'full body', 8, 2, 500, 75.83, 0, 0, 0, 0)
on conflict (session_id, position) do nothing;

-- 7. workout_session_sets
insert into workout_session_sets (session_exercise_id, set_order, reps, weight, completed)
values
  ('0e000000-0000-0000-0000-000000000002', 0, 12, 0, true),
  ('0e000000-0000-0000-0000-000000000002', 1, 10, 0, true),
  ('0e000000-0000-0000-0000-000000000002', 2, 8, 0, true),
  ('0e000000-0000-0000-0000-000000000003', 0, 12, 0, true),
  ('0e000000-0000-0000-0000-000000000003', 1, 10, 0, true),
  ('0e000000-0000-0000-0000-000000000003', 2, 8, 0, true),
  ('0e000000-0000-0000-0000-000000000004', 0, 30, 0, true),
  ('0e000000-0000-0000-0000-000000000004', 1, 30, 0, true),
  ('0e000000-0000-0000-0000-000000000004', 2, 30, 0, true),
  ('0e000000-0000-0000-0000-000000000006', 0, 12, 42, true),
  ('0e000000-0000-0000-0000-000000000006', 1, 10, 42, true),
  ('0e000000-0000-0000-0000-000000000006', 2, 8, 42, true),
  ('0e000000-0000-0000-0000-000000000007', 0, 12, 24.5, true),
  ('0e000000-0000-0000-0000-000000000007', 1, 10, 24.5, true),
  ('0e000000-0000-0000-0000-000000000007', 2, 8, 24.5, true),
  ('0e000000-0000-0000-0000-000000000008', 0, 12, 0, true),
  ('0e000000-0000-0000-0000-000000000008', 1, 10, 0, true),
  ('0e000000-0000-0000-0000-000000000008', 2, 8, 0, true),
  ('0e000000-0000-0000-0000-000000000009', 0, 12, 0, true),
  ('0e000000-0000-0000-0000-000000000009', 1, 10, 0, true),
  ('0e000000-0000-0000-0000-000000000009', 2, 8, 0, true),
  ('0e000000-0000-0000-0000-000000000010', 0, 12, 0, true),
  ('0e000000-0000-0000-0000-000000000010', 1, 10, 0, true),
  ('0e000000-0000-0000-0000-000000000010', 2, 8, 0, true),
  ('0e000000-0000-0000-0000-000000000011', 0, 30, 0, true),
  ('0e000000-0000-0000-0000-000000000011', 1, 30, 0, true),
  ('0e000000-0000-0000-0000-000000000011', 2, 30, 0, true),
  ('0e000000-0000-0000-0000-000000000012', 0, 12, 41, true),
  ('0e000000-0000-0000-0000-000000000012', 1, 10, 41, true),
  ('0e000000-0000-0000-0000-000000000012', 2, 8, 41, true),
  ('0e000000-0000-0000-0000-000000000013', 0, 12, 20.5, true),
  ('0e000000-0000-0000-0000-000000000013', 1, 10, 20.5, true),
  ('0e000000-0000-0000-0000-000000000013', 2, 8, 20.5, true),
  ('0e000000-0000-0000-0000-000000000014', 0, 12, 32.8, true),
  ('0e000000-0000-0000-0000-000000000014', 1, 10, 32.8, true),
  ('0e000000-0000-0000-0000-000000000014', 2, 8, 32.8, true),
  ('0e000000-0000-0000-0000-000000000015', 0, 12, 24.6, true),
  ('0e000000-0000-0000-0000-000000000015', 1, 10, 24.6, true),
  ('0e000000-0000-0000-0000-000000000015', 2, 8, 24.6, true),
  ('0e000000-0000-0000-0000-000000000016', 0, 12, 49.2, true),
  ('0e000000-0000-0000-0000-000000000016', 1, 10, 49.2, true),
  ('0e000000-0000-0000-0000-000000000016', 2, 8, 49.2, true),
  ('0e000000-0000-0000-0000-000000000017', 0, 12, 28.7, true),
  ('0e000000-0000-0000-0000-000000000017', 1, 10, 28.7, true),
  ('0e000000-0000-0000-0000-000000000017', 2, 8, 28.7, true),
  ('0e000000-0000-0000-0000-000000000018', 0, 12, 0, true),
  ('0e000000-0000-0000-0000-000000000018', 1, 10, 0, true),
  ('0e000000-0000-0000-0000-000000000018', 2, 8, 0, true),
  ('0e000000-0000-0000-0000-000000000019', 0, 8, 0, true),
  ('0e000000-0000-0000-0000-000000000019', 1, 7, 0, true),
  ('0e000000-0000-0000-0000-000000000019', 2, 6, 0, true),
  ('0e000000-0000-0000-0000-000000000020', 0, 12, 32.8, true),
  ('0e000000-0000-0000-0000-000000000020', 1, 10, 32.8, true),
  ('0e000000-0000-0000-0000-000000000020', 2, 8, 32.8, true),
  ('0e000000-0000-0000-0000-000000000021', 0, 12, 41, true),
  ('0e000000-0000-0000-0000-000000000021', 1, 10, 41, true),
  ('0e000000-0000-0000-0000-000000000021', 2, 8, 41, true),
  ('0e000000-0000-0000-0000-000000000022', 0, 12, 20.5, true),
  ('0e000000-0000-0000-0000-000000000022', 1, 10, 20.5, true),
  ('0e000000-0000-0000-0000-000000000022', 2, 8, 20.5, true),
  ('0e000000-0000-0000-0000-000000000023', 0, 12, 32.8, true),
  ('0e000000-0000-0000-0000-000000000023', 1, 10, 32.8, true),
  ('0e000000-0000-0000-0000-000000000023', 2, 8, 32.8, true),
  ('0e000000-0000-0000-0000-000000000024', 0, 12, 24.6, true),
  ('0e000000-0000-0000-0000-000000000024', 1, 10, 24.6, true),
  ('0e000000-0000-0000-0000-000000000024', 2, 8, 24.6, true),
  ('0e000000-0000-0000-0000-000000000025', 0, 12, 49.2, true),
  ('0e000000-0000-0000-0000-000000000025', 1, 10, 49.2, true),
  ('0e000000-0000-0000-0000-000000000025', 2, 8, 49.2, true),
  ('0e000000-0000-0000-0000-000000000026', 0, 12, 28.7, true),
  ('0e000000-0000-0000-0000-000000000026', 1, 10, 28.7, true),
  ('0e000000-0000-0000-0000-000000000026', 2, 8, 28.7, true),
  ('0e000000-0000-0000-0000-000000000027', 0, 12, 0, true),
  ('0e000000-0000-0000-0000-000000000027', 1, 10, 0, true),
  ('0e000000-0000-0000-0000-000000000027', 2, 8, 0, true),
  ('0e000000-0000-0000-0000-000000000028', 0, 12, 32.5, true),
  ('0e000000-0000-0000-0000-000000000028', 1, 10, 32.5, true),
  ('0e000000-0000-0000-0000-000000000028', 2, 8, 32.5, true),
  ('0e000000-0000-0000-0000-000000000029', 0, 12, 0, true),
  ('0e000000-0000-0000-0000-000000000029', 1, 10, 0, true),
  ('0e000000-0000-0000-0000-000000000029', 2, 8, 0, true),
  ('0e000000-0000-0000-0000-000000000030', 0, 12, 26, true),
  ('0e000000-0000-0000-0000-000000000030', 1, 10, 26, true),
  ('0e000000-0000-0000-0000-000000000030', 2, 8, 26, true),
  ('0e000000-0000-0000-0000-000000000031', 0, 30, 0, true),
  ('0e000000-0000-0000-0000-000000000031', 1, 30, 0, true),
  ('0e000000-0000-0000-0000-000000000031', 2, 30, 0, true),
  ('0e000000-0000-0000-0000-000000000032', 0, 30, 0, true),
  ('0e000000-0000-0000-0000-000000000032', 1, 30, 0, true),
  ('0e000000-0000-0000-0000-000000000032', 2, 30, 0, true),
  ('0e000000-0000-0000-0000-000000000033', 0, 12, 16, true),
  ('0e000000-0000-0000-0000-000000000033', 1, 10, 16, true),
  ('0e000000-0000-0000-0000-000000000033', 2, 8, 16, true),
  ('0e000000-0000-0000-0000-000000000034', 0, 12, 0, true),
  ('0e000000-0000-0000-0000-000000000034', 1, 10, 0, true),
  ('0e000000-0000-0000-0000-000000000034', 2, 8, 0, true),
  ('0e000000-0000-0000-0000-000000000036', 0, 12, 32.5, true),
  ('0e000000-0000-0000-0000-000000000036', 1, 10, 32.5, true),
  ('0e000000-0000-0000-0000-000000000036', 2, 8, 32.5, true),
  ('0e000000-0000-0000-0000-000000000037', 0, 12, 0, true),
  ('0e000000-0000-0000-0000-000000000037', 1, 10, 0, true),
  ('0e000000-0000-0000-0000-000000000037', 2, 8, 0, true),
  ('0e000000-0000-0000-0000-000000000038', 0, 12, 26, true),
  ('0e000000-0000-0000-0000-000000000038', 1, 10, 26, true),
  ('0e000000-0000-0000-0000-000000000038', 2, 8, 26, true),
  ('0e000000-0000-0000-0000-000000000039', 0, 30, 0, true),
  ('0e000000-0000-0000-0000-000000000039', 1, 30, 0, true),
  ('0e000000-0000-0000-0000-000000000039', 2, 30, 0, true),
  ('0e000000-0000-0000-0000-000000000040', 0, 30, 0, true),
  ('0e000000-0000-0000-0000-000000000040', 1, 30, 0, true),
  ('0e000000-0000-0000-0000-000000000040', 2, 30, 0, true),
  ('0e000000-0000-0000-0000-000000000041', 0, 12, 16, true),
  ('0e000000-0000-0000-0000-000000000041', 1, 10, 16, true),
  ('0e000000-0000-0000-0000-000000000041', 2, 8, 16, true),
  ('0e000000-0000-0000-0000-000000000042', 0, 12, 0, true),
  ('0e000000-0000-0000-0000-000000000042', 1, 10, 0, true),
  ('0e000000-0000-0000-0000-000000000042', 2, 8, 0, true)
on conflict (session_exercise_id, set_order) do nothing;

-- 8. workout_schedule
insert into workout_schedule (id, owner_id, plan_id, scheduled_date, status, time_slot)
values
  ('5e000000-0000-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaa0a0001', '2026-07-15', 'scheduled', 'morning'),
  ('5e000000-0000-0000-0000-000000000002', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaa0a0002', '2026-07-17', 'scheduled', 'evening'),
  ('5e000000-0000-0000-0000-000000000003', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaa0a0001', '2026-07-13', 'completed', 'morning'),
  ('5e000000-0000-0000-0000-000000000004', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbb0b0001', '2026-07-14', 'scheduled', 'evening'),
  ('5e000000-0000-0000-0000-000000000005', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbb0b0003', '2026-07-16', 'scheduled', 'evening'),
  ('5e000000-0000-0000-0000-000000000006', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'cccccccc-cccc-cccc-cccc-cccccc0c0001', '2026-07-15', 'scheduled', 'morning'),
  ('5e000000-0000-0000-0000-000000000007', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'cccccccc-cccc-cccc-cccc-cccccc0c0003', '2026-07-18', 'scheduled', 'morning')
on conflict (id) do nothing;

-- 9. friendships (A-B, A-C, B-C accepted; D->A pending so Alex sees a request)
insert into friendships (requester_id, addressee_id, status, created_at, responded_at)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'accepted', now(), '2026-07-02 10:00:00+00'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'accepted', now(), '2026-07-03 10:00:00+00'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'accepted', now(), '2026-07-04 10:00:00+00'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'pending', now(), null)
on conflict (requester_id, addressee_id) do nothing;

-- 9b. Friendships between your real accounts and the 3 workout-having testers
-- (accepted). When a real account logs in, /social shows Alex/Bilal/Casey in
-- the Friends + Ranking tabs and their finished sessions in the Feed tab.
-- One accepted row per pair is enough: get_friends / get_friends_feed treat
-- accepted friendships symmetrically (auth.uid() on either side).
-- Cleanup is automatic: friendships ON DELETE CASCADE from profiles, so
-- deleting the test users (unseed_example_users.sql) removes these rows too.
insert into friendships (requester_id, addressee_id, status, created_at, responded_at)
values
  ('4009846c-9133-4bfa-8108-097449cdb8c6', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'accepted', now(), now()),
  ('4009846c-9133-4bfa-8108-097449cdb8c6', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'accepted', now(), now()),
  ('4009846c-9133-4bfa-8108-097449cdb8c6', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'accepted', now(), now()),
  ('5b0117d6-ffaf-41b7-b14c-88a58460a777', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'accepted', now(), now()),
  ('5b0117d6-ffaf-41b7-b14c-88a58460a777', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'accepted', now(), now()),
  ('5b0117d6-ffaf-41b7-b14c-88a58460a777', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'accepted', now(), now()),
  ('683a6295-2fcc-4859-873d-5cf1aa68ad08', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'accepted', now(), now()),
  ('683a6295-2fcc-4859-873d-5cf1aa68ad08', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'accepted', now(), now()),
  ('683a6295-2fcc-4859-873d-5cf1aa68ad08', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'accepted', now(), now()),
  ('a1fc75bd-d7d4-45ff-aea9-105e2f2e4e40', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'accepted', now(), now()),
  ('a1fc75bd-d7d4-45ff-aea9-105e2f2e4e40', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'accepted', now(), now()),
  ('a1fc75bd-d7d4-45ff-aea9-105e2f2e4e40', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'accepted', now(), now())
on conflict (requester_id, addressee_id) do nothing;

-- 10. refresh last_performed_at on plans to their newest session
update workout_plans p
set last_performed_at = sub.latest
from (
  select plan_id, max(finished_at) as latest
  from workout_sessions
  where plan_id is not null
  group by plan_id
) sub
where p.id = sub.plan_id;

commit;

-- Done. Log in as any of the seeded users and browse the pages.
-- To remove everything, run db/unseed_example_users.sql.

-- =====================================================================
-- DIAGNOSTIC (optional, run in SQL editor AFTER seeding):
-- Highlight any block below and Run to verify the seed landed.
-- =====================================================================

-- Count seeded rows per table (should be: profiles 4, plans 9,
-- plan_exercises 22, sessions 15, session_exercises 42, sets 117,
-- schedule 7, friendships 4):
-- select 'profiles'        t, count(*) from profiles        where id in ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','cccccccc-cccc-cccc-cccc-cccccccccccc','dddddddd-dddd-dddd-dddd-dddddddddddd')
-- union all select 'workout_plans',      count(*) from workout_plans      where owner_id in ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','cccccccc-cccc-cccc-cccc-cccccccccccc')
-- union all select 'workout_sessions',   count(*) from workout_sessions   where owner_id in ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','cccccccc-cccc-cccc-cccc-cccccccccccc')
-- union all select 'workout_session_exercises', count(*) from workout_session_exercises see join workout_sessions s on s.id = see.session_id where s.owner_id in ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','cccccccc-cccc-cccc-cccc-cccccccccccc')
-- union all select 'workout_session_sets', count(*) from workout_session_sets ss join workout_session_exercises se on se.id = ss.session_exercise_id join workout_sessions s on s.id = se.session_id where s.owner_id in ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','cccccccc-cccc-cccc-cccc-cccccccccccc')
-- union all select 'workout_schedule',   count(*) from workout_schedule   where owner_id in ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','cccccccc-cccc-cccc-cccc-cccccccccccc')
-- union all select 'friendships',        count(*) from friendships        where requester_id in ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','cccccccc-cccc-cccc-cccc-cccccccccccc','dddddddd-dddd-dddd-dddd-dddddddddddd') or addressee_id in ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','cccccccc-cccc-cccc-cccc-cccccccccccc','dddddddd-dddd-dddd-dddd-dddddddddddd');

-- Verify approved flag is TRUE for seeded users (false here => feed will be empty):
-- select id, email, approved, is_admin, leaderboard_visible from profiles
--  where id in ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','cccccccc-cccc-cccc-cccc-cccccccccccc','dddddddd-dddd-dddd-dddd-dddddddddddd');

-- Verify accepted friendships (A-B, A-C, B-C should be 'accepted'):
-- select requester_id, addressee_id, status from friendships order by created_at;

-- Verify finished sessions exist with finished_at not null, newest first:
-- select owner_id, finished_at, total_calories, photo_url from workout_sessions
--  where owner_id in ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','cccccccc-cccc-cccc-cccc-cccccccccccc')
--  order by finished_at desc;

-- Simulate the feed as Alex (sets auth.uid() for the current session):
-- set local role 'authenticated';
-- set local request.jwt.claims = '{"sub":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa","role":"authenticated"}'::jsonb;
-- select * from get_friends_feed(15, null, null);
-- reset role;