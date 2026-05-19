# BEFORE executing init_supabase.sql in database:

All app tables are dropped at execution (at the start of the script), so no corrupted data.

**Important:** This script does NOT drop `auth.users`. The `delete from auth.users;` line (line 7) is commented out by default.

**Note:** The `profiles` table is preserved across executions, keeping user approval (`approved`) and admin (`is_admin`) flags intact.

**Dropped tables (all data lost):**
- `workout_session_sets`
- `workout_session_exercises`
- `workout_sessions`
- `workout_plan_exercises`
- `workout_plan_shares`
- `workout_plans`
- `exercise_shares`
- `exercises`

All functions, triggers, indexes, and storage policies are also dropped and recreated.