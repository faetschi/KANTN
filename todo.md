## Supabase Backend & Core Data Persistence Plan

### Implementation Status (Checklist)
- [x] Create feature/backend branch for backend persistence work.
- [x] Implement full Supabase schema in `db/init_supabase.sql` (profiles, exercises, plans, sessions, shares, set details).
- [x] Add RLS + helper SQL functions (`is_admin`, calories formula, stats function) and indexes.
- [x] Add Supabase storage bucket/policies for admin-managed exercise images.
- [x] Refactor workout persistence service to use Supabase as source of truth with fallback handling.
- [x] Persist workout plan creation per user (including plan-exercise relations).
- [x] Persist finished workouts with session, exercise, set, duration, and calories data.
- [x] Implement calories/minutes tracking logic based on duration + MET values.
- [x] Add admin default exercise management backend integration (create/update + image upload).
- [x] Add user custom exercise creation (private by default) in app flow.
- [x] Implement exercise sharing backend flow (share custom exercises with other users by email lookup).
- [x] Implement workout plan sharing UX and backend wiring.
- [x] Harden persistence flows so successful actions are only treated as completed when Supabase save succeeds (deployment-safe behavior).
- [x] Add richer statistics queries/views for weekly/monthly analytics optimization, but keep same design in profile (monthly overview) and home page (calories and minutes)
- [x] Structure backend in modular targets (repositories, domain, application services)
- [x] Add user workout history with month filtering and full workout detail page (including set-level reps/weight) plus previous/next session navigation.
- [ ] Add automated tests around workout persistence and sharing behavior.
- [ ] Default exercises and default workout plans Creation should be in sub menu in admin menus for admins. Also, at first app initialization default exercise + default workout plan data should be loaded from a predefined file into database to be available.

### Phase 1 — Database foundation (init_supabase.sql)
- Extend schema with user-scoped tables for workout plans, exercises, completed workouts/sessions, and workout statistics.
- Add support for ownership and future sharing (owner_id + share metadata / mapping tables).
- Add relational tables for workout plan exercises and completed workout exercise/set details.
- Add indexes for user/timestamp lookups used in Home (weekly) and Profile (monthly) statistics.
- Add/adjust RLS policies so users can only read/write their own data, plus controlled access to shared/public entities.
- Keep SQL idempotent for safe re-runs in dev.

### Phase 2 — Profile persistence
- Ensure profile edits are persisted in `profiles` and refreshed in app state after save.
- Verify profile fields (name/avatar/fun fact/height/weight/age) remain synchronized with Supabase.

### Phase 3 — Workout plans persistence
- Persist created workout plans per user in Supabase.
- Persist plan-to-exercise assignments in relational form.
- Support plan visibility for future sharing (private/shared/public-ready model).
- Load plans from Supabase on app start/auth state change instead of mock-only data.

### Phase 4 — Exercises persistence
- Introduce exercise storage model with:
	- Global default exercises.
	- User-created private exercises.
	- Shareable exercises for other users.
- Load available exercises from Supabase and support creation of user exercises.
- Add admin exercise management capabilities:
	- Admins can upload and manage exercise images (stored in Supabase storage + referenced in database records).
	- Admins can edit default exercise content (e.g., image, name, description, metadata).
	- All users can select from the admin-managed default exercise list/table.
- Enforce exercise visibility model:
	- Admin-managed default exercises are visible to all users.
	- User-created custom exercises are private by default.
	- User-created exercises become visible to other users only when explicitly shared.

### Phase 5 — Completed workouts + recent activity
- Persist completed workouts with all necessary metadata (user, plan, timestamps, duration, calories).
- Persist per-exercise and per-set workout result data for historical display and progression.
- Drive Recent Activity from persisted completed workout records.

### Phase 6 — Calories / minutes tracking + calculation logic
- Track minutes from workout timer (start → finish) and persist duration per completed workout.
- Implement calorie calculation based on exercise type and workout duration.
- Persist computed calories and aggregate weekly/monthly stats from database-backed sessions.

### Phase 7 — App integration + migration away from mocks
- Refactor core services to read/write Supabase as source of truth.
- Keep mock fallback only when Supabase is unavailable (dev-safe behavior).
- Validate key flows: profile edit, create plan, finish workout, recent activity, weekly/monthly stats.

### Backlog (more to come)
- Plan sharing UX and invite/access control workflow.
- Exercise sharing UX and permissions management.
- Database functions/views for pre-aggregated performance/statistics queries.

## Supabase DB Security

3. Best Practices for Your "User" Table
Since you mentioned saving user data when they register, you are likely using a Trigger to copy data from auth.users into a public.profiles table. This is the standard way to do it. To keep it secure:

Use Row-Level Security (RLS): This is the most important step. Without RLS, anyone with your "anon" key could potentially read your entire profiles table.

Only Sync What You Need: Don't store Google access tokens in your public tables unless you specifically need to call Google APIs (like Google Drive) later. For a standard login, just store the id, email, and full_name.

Link by ID: Always use the id (UUID) from Supabase Auth as the Primary Key for your public profile table.

Security Tip: Ensure your public.profiles table has a policy that only allows a user to see their own data: