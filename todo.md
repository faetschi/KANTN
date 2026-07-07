## Backend & Persistence TODO (Supabase)

Use this file as an implementation tracker.

Audit status last updated: 2026-07-07.

### Social

- [ ] Adjust /social page so that:
	- [ ] the user has a infinite scroll, but after X workouts (customizable for admins) it stops a bit and loads the next batch via easy-in animation (which allows for inifinte scrolling with good performance and UX)
	- [ ] bei Friends/Ranking dass der User nur die Personen sieht, die er davor auch geaddet hat (derzeit global, which is wrong)
	- [ ] on the /social page there should be load animations (easy-in fades/animations) similiar/consistent with the other pages which have animations, and at toggle of feed/friends/ranking


- [ ] Fix vercel preview branch deployments, after login always redirects to https://kantn-faetschi.vercel.app/home even though we are on other preview deployment, e.g. https://kantn-git-development-faetschis-projects.vercel.app/login (but should redirect after login to https://kantn-git-development-faetschis-projects.vercel.app/home)


- [ ] Complete go-live verification run in staging + define rollback steps for DB/policy changes.

- [ ] Currently Calories and Tome per week/month is tracked. also interesting would be total weight lifted or distance (meters /kilometers) run/cycled per week/month. Maybe Calorie calculation could be based on Time, Bodyweight/Height, Weighrlifted or distance run etc.
Reduced Cognitive Load: Wie verhinderst du, dass der User während des Trainings zu viel tippen muss? Lösung: Signaltöne
- [ ] For specific Cardio exercises, add GPS capability (e.g. Running/Cycling, mit abgespielten Signalton (konfigurierbar) bei bestimmer (konfigurierbarer) Distanz, z.B. alle 5km)
- [ ] New Button in Footer Menu for Social / Gamification & Leaderboard: mit status aller anderen "Freunde" User (User has to be added as friend first), where the user can see, wer der Freunde wann welches Workout gemacht hat + User können Bild zum Workout hochladen, dass man dann sieht. Streak (Feuer Emoji) kann gesammelt werden, für aufeinanderfolgende Workouts ohne unterbrechung von Tagen + Insgesamtes Workout/Statistik Leaderboard über alle User (für Firma die diese App einsetzt, um extrem Sportliche User zu "belohnen")



## Feature Ideas (Backlog)

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




### Post-MVP / Remaining TODO

### 2) Supabase DB Security (RLS + Auth Data Handling)
- [ ] Validate anon key cannot read cross-user profile data.

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