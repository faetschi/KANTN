## Backend & Persistence TODO (Supabase)

Use this file as an implementation tracker.

Audit status last updated: 2026-02-28.

### Already Implemented (Documentation)

- [x] BUG: sharing a workout plan by selecting a email and pressing "Share" does not work correctly at the moment, error message: chunk-AHUI2ROU.js:43  POST https://nhudzopadrydydiojhxn.supabase.co/rest/v1/workout_plan_shares?on_conflict=plan_id%2Cshared_with_user_id 403 (Forbidden). After a workout plan is shared, the other user should see the shared workout plan and it should be available for the other user. Also, the shared workout plan should include a visual indication that its from user xy (profile pic and short reference). Also: A shared workout plan CORRECTLY cant be edited by the other user (correct), but the other user cant set it to active, if he got it shared from 
another user (bug, fix this)
  - Resolved: share targets are now resolved via @username (SECURITY DEFINER RPC) instead of the RLS-blocked email lookup; accepted shared plans show a "Shared by {name}" badge with avatar; recipients can activate a shared plan (owned clone is created + activated).

- [x] Pressing the "share" button on the /plans page should make a pop up appear where the whole sharing dialogue happens.

- [x] During activate freestyle workout on the /workout/freestyle page, the button "Hide exercise picker" AND "Add exercise" should be sticky (currently only Hide exercise picker). Whne the "Add exercise" button is pressed, it should auto scroll the page all the way up so the user sees the exercises to add next correctly (and doesnt have to scroll up himself). WHen the exercises are shown, it should only show top 8, and user should use search bar to show other exercises.
  - Resolved: sticky top controls + scroll-to-top on open were already in place; picker now previews the top 8 exercises with a "search to find more" hint.

- 1. [x] It should be possible to visit other users profile pages, currenlty only via direct url: /profile currently only shows the logged in users profile, but users should be able to visit other peoples profiles via /profile/@username (in the future, other users will be seen in upcoming features, so this is important to be done before those features are implemented). you can use the profiles table username for this.
- 2. [x] The Workout-Plan sharing feature should work by selecting/defining a other users username (@username), not by E-Mail. DUring the "Share" dialogue, if the defined user does not exist the user should receive feedback in this dialogue. (Also applied to custom-exercise sharing.)

- [x] Make workout persistence transactional (session + exercises + sets all succeed or all fail).
- [x] Add DB-level auth/profile bootstrap (`auth.users` -> `public.profiles` trigger/upsert).
- [x] Implement revoke/unshare flow for shared plans/exercises.
- [x] Add minimum automated smoke coverage for critical flows (profile save, create plan, finish workout, share plan).
- [x] Implement default exercises/plans first-run seed load (idempotent).
- [ ] Complete go-live verification run in staging + define rollback steps for DB/policy changes.
- [x] Require upload-only image handling for all image fields (`imageUrl`) used by workout plans and exercises (including admin default exercises): allow custom image upload, use uploaded image references only, and persist paths/URLs correctly in DB. Also make custom profile picture upload possible, this should overwrite the avatar url (make this avatar url not visible to the user in profile page, just upload profile picture button)
- [x] In workout session tracking, mark the full exercise set row green when a set is completed (clear visual completion state).
- [x] Simplify “Create a New Plan” page scope to plan creation + selecting available exercises only.
- [x] Move “Create Custom Exercise” and “Share My Custom Exercise” out of “Create a New Plan” into a dedicated subpage reachable from plan flow or exercises area.
- [x] Reduce “Share My Plan” footprint on Workout Plans page by replacing large action UI with a top-bar share icon next to the `+` action.
- [x] Apply the same compact share-icon pattern to exercise sharing actions.
- [x] Add a List of Default exercises and 2 Beginner Workout Plans to the database at initialization, including Workout picture etc. Those Exercises + WorkoutPlans can be looked up for users as template, so its important to include them at init. Default Exercises that wxist at start should include: WeightLifting (Squats, Bench Press, ...), Cardio (Running, Cycling, ...)
- [ ] Currently Calories and Tome per week/month is tracked. also interesting would be total weight lifted or distance (meters /kilometers) run/cycled per week/month. Maybe Calorie calculation could be based on Time, Bodyweight/Height, Weighrlifted or distance run etc.
Reduced Cognitive Load: Wie verhinderst du, dass der User während des Trainings zu viel tippen muss? Lösung: Signaltöne
- [ ] For specific Cardio exercises, add GPS capability (e.g. Running/Cycling, mit abgespielten Signalton (konfigurierbar) bei bestimmer (konfigurierbarer) Distanz, z.B. alle 5km)
- [ ] New Button in Footer Menu for Social / Gamification & Leaderboard: mit status aller anderen "Freunde" User (User has to be added as friend first), where the user can see, wer der Freunde wann welches Workout gemacht hat + User können Bild zum Workout hochladen, dass man dann sieht. Streak (Feuer Emoji) kann gesammelt werden, für aufeinanderfolgende Workouts ohne unterbrechung von Tagen + Insgesamtes Workout/Statistik Leaderboard über alle User (für Firma die diese App einsetzt, um extrem Sportliche User zu "belohnen")
- [x] When user is not approved, "Completing signin...." is shown, but intended is "Pending Approval"




### Post-MVP / Remaining TODO

### 2) Supabase DB Security (RLS + Auth Data Handling)
- [x] Enable RLS on all user data tables.
- [x] Add policies so users can read/write only their own rows.
- [x] Add policies for controlled access to shared plans/exercises.
- [x] Restrict admin-only operations (default data management) to admins.
- [x] Add trigger/function to sync `auth.users` to `public.profiles`.
- [x] Store only required auth profile fields (`id`, `email`, `full_name`, optional avatar).
- [x] Do not store Google access tokens in public tables.
- [x] Verify `public.profiles` policy only allows owner access to profile row.
- [ ] Validate anon key cannot read cross-user profile data.

### 10) Admin Menu + Default Seed Data
- [ ] Add admin submenu entries for:
	- [x] default exercises creation/management (Moved to dedicated `/admin/exercises` page with field labels and reusable search.)
	- [x] default workout plans creation/management
- [x] Add predefined seed file(s) for default exercises/plans.
- [x] Implement first app initialization flow to load seed data into DB.
- [x] Ensure seed import is idempotent (safe to rerun without duplicates).

### 11) Automated Tests
- [ ] Add tests for workout persistence flows.
- [ ] Add tests for sharing permissions and access rules.
- [ ] Add tests for calories/minutes persistence and stats aggregation.
- [ ] Add tests for profile persistence and RLS-sensitive operations.

### 12) Validation / Go-Live Checklist
- [ ] Validate end-to-end flows:
	- [ ] profile edit
	- [ ] create plan
	- [ ] complete workout
	- [ ] view recent activity
	- [ ] view weekly/monthly statistics
- [ ] Validate storage/image permissions for admin exercise images.
- [ ] Run SQL migration on clean DB and existing DB.
- [ ] Document production deployment steps.

## Future Feature Ideas (Backlog)

- [ ] Challenge other Users (only if added to Friends) for a specific Exercise (e.g. "I challenge you for a better time at running 5km / or more weight at Bench Press"), then if both users accept the challenge both do the Exercise in the next 48 Hours and see whos better.



### A) Start Workout Without Predefined Plan
- [ ] Allow users to start a workout by selecting exercises on the fly.
- [ ] Allow adding next exercise dynamically during an active workout.
- [ ] Save completed ad-hoc workout to history.
- [ ] Offer “save this workout as plan” at the end of session.
- [ ] Distinguish clearly between workout templates (plans) and completed workouts (sessions).

### B) Per-Exercise Personal Records
- [ ] Save last performance per user/exercise (sets, reps, weight).
- [ ] Prefill next workout inputs with previous values (shown as editable hint).
- [ ] Persist per-exercise progression history for drill-down in history page.
- [ ] Show “last week / previous session” comparison in exercise detail context.

### C) Calorie Calculation Transparency
- [ ] Add UI entry point to explain calorie formula.
- [ ] Show detailed calorie breakdown in statistics/details view.
- [ ] Clarify which inputs affect calories (duration, MET, body profile data if used).

### D) Security & Access Hardening (Best Practice)
- [ ] Add DB trigger/function to auto-create or upsert `public.profiles` row from `auth.users`.
- [ ] Add policy regression tests to verify no cross-user data read/write is possible.
- [ ] Add explicit “share expiration” support (optional expiry date on shares).
- [ ] Add audit log table for admin actions (approve/revoke users, default exercise changes, share revoke).
- [ ] Add secure file validation on image upload (mime type + max file size + extension allow-list).
- [ ] Add rate limiting and abuse protection for share-by-email endpoint/flow.

### E) Data Reliability & Consistency (Best Practice)
- [ ] Wrap workout session + session exercise + set inserts in a transactional DB function (all-or-nothing writes).
- [ ] Add retry with idempotency keys for critical writes (session save, plan create, share create).
- [ ] Add soft-delete/archive strategy for plans and exercises to preserve historical references.
- [ ] Add optimistic concurrency control for editable entities (`updated_at` version check).
- [ ] Add scheduled integrity checks for orphaned/invalid relational rows.

### F) Performance & Scalability (Best Practice)
- [ ] Add keyset/cursor pagination for history and session detail queries.
- [ ] Add materialized/stat views for heavy weekly/monthly aggregations if data volume grows.
- [ ] Add index review task with `EXPLAIN ANALYZE` for top 5 hottest queries.
- [ ] Add incremental loading strategy for dashboard data instead of loading everything at once.
- [ ] Add background refresh strategy (stale-while-revalidate) for plans/exercises/sessions.

### G) Product Quality & UX Improvements
- [ ] Add “undo” or confirmation flows for destructive actions (delete/revoke/unshare).
- [ ] Add offline capture mode for workout sessions with deferred sync when online.
- [ ] Add conflict resolution UI when local pending changes differ from remote data.
- [ ] Add empty-state guidance and recovery actions for failed sync/save operations.
- [ ] Add accessibility pass (keyboard navigation, labels, color contrast, screen-reader text).

### H) Observability & Operations
- [ ] Add centralized error monitoring (client + server) with correlation IDs.
- [ ] Add structured logging for key user actions (session save, share, profile update).
- [ ] Add health-check dashboard for Supabase connectivity and failed write rate.
- [ ] Add release checklist with rollback steps for DB migrations and policy changes.

### I) Test Strategy Expansion
- [ ] Add repository-level tests for all Supabase read/write operations.
- [ ] Add integration tests for auth + profile lifecycle (register/login/pending/approved).
- [ ] Add end-to-end tests for main user journeys (create plan, finish workout, share, history).
- [ ] Add security-focused tests for RLS and storage policy enforcement.
- [ ] Add fixture-based seed test data to run deterministic local CI checks.
