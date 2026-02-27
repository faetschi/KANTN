# PWA Audit TODO

## High priority (required for reliable Add to Home Screen)
- Update manifest metadata to be app-specific: set "name" and "short_name" to "KANTN"" app name.
- Add "theme_color" and "background_color" to manifest for proper splash screen and install UI.
- Set "start_url" and "scope" to "/" (avoid relative "./" for consistent install behavior).
- Add iOS-specific tags in index.html: apple-touch-icon (180x180) and apple-mobile-web-app-capable.
- Ensure a 180x180 icon exists in public/icons and is referenced by apple-touch-icon.

## Medium priority (polish + stability)
- Add "id" in manifest (e.g., "/") to keep install identity stable across updates.
- Add a 512x512 maskable icon (already present) and confirm all icon files exist and are optimized.
- Consider adding "display_override": ["window-controls-overlay", "standalone"] only if you plan to support it.
- Verify service worker is enabled only in production and confirm ngsw-config is correct for SSR.

## Low priority (nice to have)
- Add app shortcuts in manifest ("shortcuts") for key screens.
- Add a descriptive "description" in manifest.
- Add a custom offline page and include it in ngsw-config assetGroups.

## Notes from current repo
- Manifest exists at public/manifest.webmanifest and is linked in src/index.html.
- Service worker config exists at ngsw-config.json and is wired in production build.
- Current manifest uses name/short_name "app" and lacks theme/background colors.
- iOS-specific meta tags and apple-touch-icon link are missing in index.html.

## Supabase Backend & Core Data Persistence Plan

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
