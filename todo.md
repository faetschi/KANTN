## Backend & Persistence TODO (Supabase)

Use this file as an implementation tracker.

Audit status last updated: 2026-02-28.

### Already Implemented (Documentation)
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
- [ ] Harden persistence flows so successful actions are only treated as completed when Supabase save succeeds (deployment-safe behavior). (Partial: core save checks exist, but nested session child writes are not fully fail-fast.)
- [ ] Add richer statistics queries/views for weekly/monthly analytics optimization, while keeping existing Profile (monthly) and Home (calories/minutes) design.
- [x] Structure backend in modular targets (repositories, domain, application services).
- [x] Add user workout history with month filtering and full workout detail page (including set-level reps/weight) plus previous/next session navigation.

### MVP Must-Haves (Before Production)
- [ ] Make workout persistence transactional (session + exercises + sets all succeed or all fail).
- [ ] Add DB-level auth/profile bootstrap (`auth.users` -> `public.profiles` trigger/upsert).
- [ ] Implement revoke/unshare flow for shared plans/exercises.
- [ ] Add minimum automated smoke coverage for critical flows (profile save, create plan, finish workout, share plan).
- [ ] Implement default exercises/plans first-run seed load (idempotent).
- [ ] Complete go-live verification run in staging + define rollback steps for DB/policy changes.
- [ ] Require upload-only image handling for all image fields (`imageUrl`) used by workout plans and exercises (including admin default exercises): allow custom image upload, use uploaded image references only, and persist paths/URLs correctly in DB.
- [ ] In workout session tracking, mark the full exercise set row green when a set is completed (clear visual completion state).
- [ ] Simplify “Create a New Plan” page scope to plan creation + selecting available exercises only.
- [ ] Move “Create Custom Exercise” and “Share My Custom Exercise” out of “Create a New Plan” into a dedicated subpage reachable from plan flow or exercises area.
- [ ] Reduce “Share My Plan” footprint on Workout Plans page by replacing large action UI with a top-bar share icon next to the `+` action.
- [ ] Apply the same compact share-icon pattern to exercise sharing actions.

### Post-MVP / Remaining TODO

### 0) Project Setup
- [x] Create and switch to feature branch for backend persistence work.
- [ ] Define rollout strategy (dev first, staging validation, production deploy).
- [x] Add implementation notes in `DEVELOPMENT.md` for local Supabase setup.

### 1) Database Foundation (`db/init_supabase.sql`)
- [x] Create/extend core tables:
	- [x] `profiles` (linked to `auth.users.id` as PK/FK)
	- [x] `exercises` (default + custom + visibility metadata)
	- [x] `workout_plans`
	- [x] `workout_plan_exercises`
	- [x] `workout_sessions`
	- [x] `workout_session_exercises`
	- [x] `workout_session_sets`
	- [x] sharing tables for plans/exercises
- [x] Add all required constraints and foreign keys.
- [x] Add indexes for common lookups (user + date, user + month, plan/session joins).
- [x] Add helper SQL functions:
	- [x] `is_admin` helper (implemented as `is_admin()`)
	- [x] calories calculation helper
	- [x] stats aggregation helper(s)
- [x] Keep SQL idempotent for safe re-runs in development.

### 2) Supabase DB Security (RLS + Auth Data Handling)
- [x] Enable RLS on all user data tables.
- [x] Add policies so users can read/write only their own rows.
- [x] Add policies for controlled access to shared plans/exercises.
- [x] Restrict admin-only operations (default data management) to admins.
- [ ] Add trigger/function to sync `auth.users` to `public.profiles`.
- [x] Store only required auth profile fields (`id`, `email`, `full_name`, optional avatar).
- [x] Do not store Google access tokens in public tables.
- [x] Verify `public.profiles` policy only allows owner access to profile row.
- [ ] Validate anon key cannot read cross-user profile data.

### 3) Profile Persistence
- [x] Persist profile edits to `profiles`.
- [x] Refresh client-side profile state after save.
- [x] Keep fields synchronized: name, avatar, fun fact, height, weight, age.
- [ ] Handle profile upsert for first login. (Current flow inserts on register; no DB-level auth trigger/upsert flow.)

### 4) Workout Plans Persistence
- [x] Persist user-created plans in Supabase.
- [x] Persist plan-to-exercise relations.
- [x] Support visibility model (private/shared/public-ready).
- [x] Load plans from Supabase on app initialization/auth change.
- [x] Remove mock-only dependency for plans (keep fallback only for outage/dev-safe mode).

### 5) Exercises Persistence + Admin Management
- [x] Implement exercise model supporting:
	- [x] global default exercises
	- [x] user private custom exercises
	- [x] explicitly shared custom exercises
- [x] Load available exercises from Supabase.
- [x] Support user custom exercise creation (private by default).
- [x] Add exercise sharing flow (share custom exercise with user by email lookup).
- [x] Add admin management for default exercises:
	- [x] create/edit default exercise records
	- [x] upload/manage images in Supabase Storage
	- [x] link image paths/URLs in exercise records
- [ ] Enforce upload-based custom images for exercise and plan visuals (no manual/external image URL entry); persist uploaded storage path/public URL in DB and always render from saved DB value.

### 6) Completed Workouts + History
- [x] Persist completed workout session metadata (plan, timestamps, duration, calories, owner).
- [x] Persist per-exercise workout results.
- [x] Persist per-set details (set number, reps, weight, etc.).
- [x] Drive Recent Activity from persisted sessions.
- [x] Implement history month filtering.
- [x] Implement workout detail page with set-level data.
- [x] Add previous/next workout session navigation in detail view.

### 7) Minutes + Calories Tracking
- [x] Track workout duration from timer start to finish.
- [x] Calculate calories from duration + MET/exercise data.
- [x] Persist minutes and calories per session.
- [x] Aggregate weekly stats for Home page.
- [x] Aggregate monthly stats for Profile page.
- [x] Keep existing Home/Profile design while changing only data source.

### 8) Sharing Workflows
- [x] Implement workout plan sharing UX + backend wiring.
- [ ] Add invite/access control for shared workout plans. (Basic email-based share exists; invite workflow not implemented.)
- [x] Ensure unshared private plans are never visible to other users.
- [ ] Implement revoke access flow for shared plans/exercises.

### 9) Service/Architecture Refactor
- [x] Refactor services to use Supabase as source of truth.
- [x] Keep modular architecture boundaries:
	- [x] repositories
	- [x] domain
	- [x] application services
- [ ] Ensure actions are marked successful only after confirmed Supabase write success. (Partial: top-level writes checked; nested insert failure handling still incomplete.)
- [x] Keep fallback behavior only when Supabase is unavailable.

### 10) Admin Menu + Default Seed Data
- [ ] Add admin submenu entries for:
	- [ ] default exercises creation/management (Default exercises admin section exists, but no dedicated submenu)
	- [ ] default workout plans creation/management
- [ ] Add predefined seed file(s) for default exercises/plans.
- [ ] Implement first app initialization flow to load seed data into DB.
- [ ] Ensure seed import is idempotent (safe to rerun without duplicates).

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
