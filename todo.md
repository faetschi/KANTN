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
- [x] Harden persistence flows so successful actions are only treated as completed when Supabase save succeeds (deployment-safe behavior). (Write paths now fail-fast for nested relations and dependent visibility updates.)
- [ ] Add richer statistics queries/views for weekly/monthly analytics optimization, while keeping existing Profile (default monthly, also be able to switch between weekly/monthly) and Home (calories/minutes) design. Users should be able to choose in Profile if they want weekly or monthly statistics.
- [x] Structure backend in modular targets (repositories, domain, application services).
- [x] Add user workout history with month filtering and full workout detail page (including set-level reps/weight) plus previous/next session navigation.

### MVP Must-Haves (Before Production)
- [x] Make workout persistence transactional (session + exercises + sets all succeed or all fail).
- [x] Add DB-level auth/profile bootstrap (`auth.users` -> `public.profiles` trigger/upsert).
- [x] Implement revoke/unshare flow for shared plans/exercises.
- [x] Add minimum automated smoke coverage for critical flows (profile save, create plan, finish workout, share plan).
- [x] Implement default exercises/plans first-run seed load (idempotent).
- [ ] Complete go-live verification run in staging + define rollback steps for DB/policy changes. (Rollback + checklist documented in `GO_LIVE_RUNBOOK.md`; staging execution pending.)
- [x] Require upload-only image handling for all image fields (`imageUrl`) used by workout plans and exercises (including admin default exercises): allow custom image upload, use uploaded image references only, and persist paths/URLs correctly in DB. Also make custom profile picture upload possible, this should overwrite the avatar url (make this avatar url not visible to the user in profile page, just upload profile picture button)
- [x] In workout session tracking, mark the full exercise set row green when a set is completed (clear visual completion state).
- [x] Simplify “Create a New Plan” page scope to plan creation + selecting available exercises only.
- [x] Move “Create Custom Exercise” and “Share My Custom Exercise” out of “Create a New Plan” into a dedicated subpage reachable from plan flow or exercises area.
- [x] Reduce “Share My Plan” footprint on Workout Plans page by replacing large action UI with a top-bar share icon next to the `+` action.
- [x] Apply the same compact share-icon pattern to exercise sharing actions.
- [x] Add a List of Default exercises and 2 Beginner Workout Plans to the database at initialization, including Workout picture etc. Those Exercises + WorkoutPlans can be looked up for users as template, so its important to include them at init.
- [x] In the admin page, there should be a sub page for admins to configure exercise & workouts, e.g. "Default Exercises" management should be in a sub-page, not directly in /admin. Also the edit for Default Exercises should be more intuative and easier for admins to use, also add universal search here that can search exercises. This searchbar should be implemented in a general way, as this searchbar component will be reused in user Exercise selection, workout plan search, etc.
- [x] Admins should be able to Approve / Decline Users after they registered in the Admin Page, currently only "Approve" works correcly, but "Decline" doesnt work correctly (gives error that user cant be found or similiar). Error Message: chunk-AHUI2ROU.js:43  DELETE https://nhudzopadrydydiojhxn.supabase.co/rest/v1/profiles?id=eq.9e80d0fa-c494-4306-a407-765d64b006e4&select=id 406 (Not Acceptable)
- [x] When selecting Exercises, there should be a Search bar to search Exercises. While typing in the search bar, relevant results should already show, e.g. user types "Benc" and it should show "Bench Press" already.
- [x] Users should be able to start a on the fly workout "Freestyle", where the workout is started and they choose exercises during the workout on the fly without the need for a predefined workout plan to be selected. This Freestyle option should always be available by default. After a "Freestyle" workout is finished, the user should be asked whether the exercise of this freestyle workout should be saved to a new Workout plan, with yes/no. If no, then dont create a Workoutplan out of this freestyle workout. If user selects yes, create a new user personal workout plan with the exercises and same sequence he just did in this freestyle workout. On homepage, user can directly start Active Plan, but also in this active plan component there should be the option to "Start Freestyle", which starts a freestyle workout where exercise can be chosen on the fly.
- [x] Bug I found: on the /plans workout plan page, when workout plan changes active to another workout plan (e.g. workout plan A active, then workout plan b Activiate is pressed), the currently active workout plan should always be the first one / on top.
- [x] In the workout plan page /plans, add a search bar for workout plans, similiar to search bar in Select Exercises page
- [x] On profile page, make "Edit Profile" more intuative, by making "edit" symbol next to name, height, weight, age. Also when profile picture is pressed, a new photo should be able to be uploaded for use.
- [x] On /workout page, when workout is active, there currently is the Option to "+ Add Set", but no way to remove a Set (maybe with small X) to remove a set, e.g. when a user accidently adds a set, it can be removed again.
- [x] On profile page, when Profile Picture is uploaded via "Upload" button, the button changes to "Uploading...", but it should stay as "Upload", the note next to it updates to "Uploading..." but is stuck forever, it should change to "Uploaded!" after it has been succesfully uploaded.Currently it is stuck in Uploading... even though picture has been uploaded already: pressing Save works corerctly and uses the uploaded picture, its just not visually noticable when the upload is done for the user.
- [x] On all pages, but particularly /workout, the header and the bottom action bar (to switch exercises & finish) should ALWAYS be in front / visible / ankered, and shouldnt be hidden while scrolling by any other elements.
- [x] After finishing a freestyle workout, the user gets asked if he wants to save the freestyle workout as a new workout plan. When this occurs, the question pop up should happen WITHIN the app, not by the browser. If no is selected, the just finished workout should not be called "Unknown Plan", but "Freestyle".
- [ ] Users should be able to delete custom Workoutplans and custom Exercises, if they no longer want to use them. Default Exercises and Default Workoutplans can never be deleted by users, only adjusted/mangaged by admins.
- [ ] Admins: There should be a "Backup" option to backup all current workout/exercises data from the database from all users, incase of database problem or similiar to backup existing data at a specific date, so it can be imported again in the future if any data ends up missing.
- [ ] In "Create Custom Exercise", it should provide more description for the user what each field is, e.g. ExerciseName and Muscle Group (optional) is already there, but nothign for the other 2 fields (whats the default "general" or "5"?), so he can reliably create a correct exercise.
- [ ] In "Create Custom Exercise", after pressing "Create" it is stuck in "Creating..." endless loop and no feedback. Implement "Saved" pop up similiar to how it is handled in profile page when editing/saving metadata.
- [ ] Users can create "Custom" exercises, but they cant manage their custom exercises anywhere. After a user created a personal custom exercise, it should be able to be managed or edited. Users can only edit their own custom exercises, NOT default ones or shared ones.
- [ ] When a user starts a workout, and is currently inside the active workout but then switches pages (e.g. accidently goes back to home page), he should be able to go back into the active workout in the home page (the active plan card already has something like this "Not started yet". This could change when a workout is currently active in the background and the user accidently switched pages, the user could return with a button in this active plan card, the button in the card could be switched out with a new Continue button (instead of "Start Workout" button a "Continue" button could appear). Similiarly behaviour in Freestyle Mode.
- [x] In Freestyle Mode, the pop up "Save as workout plan?" looks good, but it should be centered of the page (is currently on the bottom and HIDDEN by the footer which is on top of it). Make the pop up appear in the middle of the page and be fully visible.
- [ ] During a workout, the user should be able to press a button or the e.g. "1/3" in the bottom action bar to reveal the list of all exercises in the current workout plan. Similiar in freestyle mode it should show the current list of exercises in the freestyle workout.
- [x] During a workout, the user should be able to press a button or the e.g. "1/3" in the bottom action bar to reveal the list of all exercises in the current workout plan. Similiar in freestyle mode it should show the current list of exercises in the freestyle workout.
- [ ] BUG: sharing a workout plan by selecting a email and pressing "Share" does not work correctly at the moment, error message: chunk-AHUI2ROU.js:43  POST https://nhudzopadrydydiojhxn.supabase.co/rest/v1/workout_plan_shares?on_conflict=plan_id%2Cshared_with_user_id 403 (Forbidden). After a workout plan is shared, the other user should see the shared workout plan and it should be available for the other user. Also, the shared workout plan should include a visual indication that its from user xy (profile pic and short reference). Also: A shared workout plan CORRECTLY cant be edited by the other user (correct), but the other user cant set it to active, if he got it shared from 
another user (bug, fix this)
- [ ] For each Workout Plan there should be a distinct Category (e.g. upper body, lower body, core, cardio, mobility): this needs to be implemented for Workouts, each Workout Plan can only have one Category at once.
- [ ] Each Exercise should have: Exercise Name, muscle_group (optional, e.g. legs, chest, back, core, arms, shoulders), Image (optional), exercise_type (strength, mobility, cardio). Those should be adjustable by users when creating "Custom Exercise" and Admins adjusting "Default Exercises". 
- [ ] Admins should be able to manage/add/remove exercises from "Default Exercises" that are available to all users
- [ ] In footer, there should be a new button leading to a new page "Calendar". This page shows the a Calendar, which shows all previous Workouts, future planned workouts and workouts on the current date marked on the date in the calendar. The calendar always shows a monthly overview of the current month the user is in. On top, before the calendar, show total Workouts Planned this Month and already completed workouts this month (e.g. 0/20 Workouts completed this month, 20 Workouts planned this month, this should look similiar to calories and minutes card in the home page). When total workouts this month is clicked, a detailed view should open up, showing the completed/planned workouts (e.g. 2/5 completed) for each workout category (e.g. there is upper body, lower body, core, cardio).
- [ ] Each workout plan should have a overall exercise_type, depending if most of the exercises in the workout plan have a distinct type, e.g. 3 out of 5 exercises in the workout plan have the exercise_type = strength, then the workout plan should also have this workoutplan_type. There should be distinct colors for each exercise_type and workoutplan_type (e.g. red for strength). When a workout is marked in the Calendar page inside the calendar, it should use this color - for this make sure the colors are consistent for Exercise Type, Workoutplan Type and in Calendar.
- [ ] In active workout page /workout, during freestyle mode the "Add exercise" top navigation should be fixed / sticky similiar to the bottom action bar navigation is correctly already.

- [ ] Make workout persistence transactional (session + exercises + sets all succeed or all fail).
- [ ] Add DB-level auth/profile bootstrap (`auth.users` -> `public.profiles` trigger/upsert).
- [ ] Implement revoke/unshare flow for shared plans/exercises.
- [ ] Add minimum automated smoke coverage for critical flows (profile save, create plan, finish workout, share plan).
- [ ] Implement default exercises/plans first-run seed load (idempotent).
- [ ] Complete go-live verification run in staging + define rollback steps for DB/policy changes.
- [ ] Require upload-only image handling for all image fields (`imageUrl`) used by workout plans and exercises (including admin default exercises): allow custom image upload, use uploaded image references only, and persist paths/URLs correctly in DB. Also make custom profile picture upload possible, this should overwrite the avatar url (make this avatar url not visible to the user in profile page, just upload profile picture button)
- [ ] In workout session tracking, mark the full exercise set row green when a set is completed (clear visual completion state).
- [ ] Simplify “Create a New Plan” page scope to plan creation + selecting available exercises only.
- [ ] Move “Create Custom Exercise” and “Share My Custom Exercise” out of “Create a New Plan” into a dedicated subpage reachable from plan flow or exercises area.
- [ ] Reduce “Share My Plan” footprint on Workout Plans page by replacing large action UI with a top-bar share icon next to the `+` action.
- [ ] Apply the same compact share-icon pattern to exercise sharing actions.
- [ ] Add a List of Default exercises and 2 Beginner Workout Plans to the database at initialization, including Workout picture etc. Those Exercises + WorkoutPlans can be looked up for users as template, so its important to include them at init. Default Exercises that wxist at start should include: WeightLifting (Squats, Bench Press, ...), Cardio (Running, Cycling, ...)
- [ ] Currently Calories and Tome per week/month is tracked. also interesting would be total weight lifted or distance (meters /kilometers) run/cycled per week/month. Maybe Calorie calculation could be based on Time, Bodyweight/Height, Weighrlifted or distance run etc.
Reduced Cognitive Load: Wie verhinderst du, dass der User während des Trainings zu viel tippen muss? Lösung: Signaltöne
- [ ] For specific Cardio exercises, add GPS capability (e.g. Running/Cycling, mit abgespielten Signalton (konfigurierbar) bei bestimmer (konfigurierbarer) Distanz, z.B. alle 5km)
- [ ] New Button in Footer Menu for Social / Gamification & Leaderboard: mit status aller anderen "Freunde" User (User has to be added as friend first), where the user can see, wer der Freunde wann welches Workout gemacht hat + User können Bild zum Workout hochladen, dass man dann sieht. Streak (Feuer Emoji) kann gesammelt werden, für aufeinanderfolgende Workouts ohne unterbrechung von Tagen + Insgesamtes Workout/Statistik Leaderboard über alle User (für Firma die diese App einsetzt, um extrem Sportliche User zu "belohnen")




### Post-MVP / Remaining TODO

### 0) Project Setup
- [x] Create and switch to feature branch for backend persistence work.
- [x] Define rollout strategy (dev first, staging validation, production deploy).
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
- [x] Add trigger/function to sync `auth.users` to `public.profiles`.
- [x] Store only required auth profile fields (`id`, `email`, `full_name`, optional avatar).
- [x] Do not store Google access tokens in public tables.
- [x] Verify `public.profiles` policy only allows owner access to profile row.
- [ ] Validate anon key cannot read cross-user profile data.

### 3) Profile Persistence
- [x] Persist profile edits to `profiles`.
- [x] Refresh client-side profile state after save.
- [x] Keep fields synchronized: name, avatar, fun fact, height, weight, age.
- [x] Handle profile upsert for first login. (DB-level auth trigger/upsert flow implemented in SQL.)

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
- [x] Enforce upload-based custom images for exercise and plan visuals (no manual/external image URL entry); persist uploaded storage path/public URL in DB and always render from saved DB value.

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
- [x] Implement revoke access flow for shared plans/exercises.

### 9) Service/Architecture Refactor
- [x] Refactor services to use Supabase as source of truth.
- [x] Keep modular architecture boundaries:
	- [x] repositories
	- [x] domain
	- [x] application services
- [x] Ensure actions are marked successful only after confirmed Supabase write success. (Nested plan relation writes and share visibility updates now fail-fast.)
- [x] Keep fallback behavior only when Supabase is unavailable.

### 10) Admin Menu + Default Seed Data
- [ ] Add admin submenu entries for:
	- [x] default exercises creation/management (Moved to dedicated `/admin/exercises` page with field labels and reusable search.)
	- [ ] default workout plans creation/management
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
