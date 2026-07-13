-- =====================================================================
-- db/unseed_example_users.sql
-- Removes all rows created by db/seed_example_users.sql.
-- Every seeded table chains back to profiles/auth.users with ON DELETE
-- CASCADE, so deleting these auth.users rows wipes plans, sessions, sets,
-- friendships, schedule entries and profile rows at once.
-- Does NOT touch real users or the default exercises.
-- =====================================================================

delete from auth.users
where id in (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  'dddddddd-dddd-dddd-dddd-dddddddddddd'
);

-- Optional: also clear any uploaded workout photos / avatars from storage
-- (the seed uses remote placeholder URLs, so there is nothing to delete here).
