# Implementation Plan: Social / Gamification

Feature: Friends menu · Streaks 🔥 · Workout photos · Leaderboard
Created: 2026-07-06 · Based on exploration of layout, DB patterns, storage, stats RPCs

## Goal & Scope

A new **Social** footer tab with three areas:
1. **Feed** – recent workouts from friends (+ optional photo, plan, calories, duration, "X hrs ago", streak).
2. **Friends** – add friends by `@username`, accept/decline incoming requests, friends list, remove friend.
3. **Leaderboard** – all approved users ranked by total calories/workouts, with streak, own rank highlighted.

Cross-cutting: **Streak** (consecutive workout days) for yourself, friends, and the leaderboard.
**Workout photos** are uploaded on the History detail page and appear in the friends' feed.

## Architecture Decisions (from exploration)

- **RLS**: `workout_sessions`/`profiles` are owner-only readable. Cross-user data (feed, leaderboard, other profiles) therefore goes through **`SECURITY DEFINER` RPCs gated by `is_approved()`** — mirroring `get_my_stats` / `get_public_profile_by_username`.
- **DB file**: [db/init_supabase.sql](../db/init_supabase.sql) is append-only & idempotent ([rules](../db/how-to-edit-SQL.md)). All new objects are **appended at the end** (`create table if not exists`, `add column if not exists`, `create or replace function`).
- **@username resolution**: the existing `get_public_profile_by_username` RPC returns the `id` — reused for "add friend" (avoids the email/RLS problem).
- **Storage**: new public bucket `workout-photos` following the `avatars` pattern (folder = `auth.uid()`).

---

## Phase 1 — Database (append to init_supabase.sql)

### 1.1 Table `friendships`
```
id uuid pk, requester_id uuid→profiles, addressee_id uuid→profiles,
status text ('pending'|'accepted'|'declined') default 'pending',
created_at, responded_at, unique(requester_id, addressee_id)
```
+ Index on (addressee_id, status). Enable RLS; select policy: own rows (requester/addressee) or admin. Mutations go through RPCs.

### 1.2 Photo column + storage
- `alter table workout_sessions add column if not exists photo_url text`
- Bucket `workout-photos` (public) + policies: select public; insert/update/delete only own folder + `is_approved()`.

### 1.3 Streak helper
- `compute_current_streak(p_user uuid) returns int` (plpgsql, security definer): anchor = today (if worked out today) else yesterday; counts backwards over consecutive days with ≥1 `finished_at` session.

### 1.4 RPCs (all security definer, `is_approved()`-gated)
| RPC | Purpose |
|-----|---------|
| `send_friend_request(p_addressee uuid) → text` | Status: `sent`/`already_friends`/`already_pending`/`accepted_incoming`/`self`/`not_found`; reactivates `declined`; auto-accepts an existing reverse request |
| `respond_friend_request(p_request_id uuid, p_accept bool) → bool` | addressee only, sets accepted/declined |
| `remove_friend(p_friend uuid) → bool` | deletes the relationship in both directions |
| `get_friends() → table` | friend profiles + streak + total_workouts + total_calories |
| `get_friend_requests() → table` | incoming pending requests + requester profile |
| `get_friends_activity(p_limit int) → table` | sessions from (me + friends): user, plan_name, kcal, duration, finished_at, photo_url, streak |
| `get_leaderboard(p_limit int) → table` | all approved users: total_workouts, total_calories, streak, is_me |
| `get_my_streak() → int` | own streak (wrapper) |

+ `grant execute` on all functions, `grant select,insert,update,delete on friendships` to `authenticated`.

---

## Phase 2 — Angular Core

### 2.1 `models.ts`
Add `WorkoutSession.photoUrl?: string`.

### 2.2 `workout.repository.ts` + `workout.service.ts`
- Extend session mapping with `photoUrl: row.photo_url` (select already uses `*`).
- `uploadWorkoutPhoto(file)` (bucket `workout-photos`, same pattern as `uploadExerciseImage`).
- `setSessionPhoto(sessionId, url)` → direct `update` (RLS allows owner).

### 2.3 New `SocialService` (`core/services/social.service.ts`)
- Signals: `friends`, `friendRequests`, `activity`, `leaderboard`, `myStreak`.
- Methods: `refreshAll()`, `sendRequest(username)`, `respondRequest(id, accept)`, `removeFriend(id)`, `loadActivity()`, `loadLeaderboard()`.
- Interfaces `Friend`, `FriendRequest`, `FriendActivity`, `LeaderboardEntry` (defined here).
- RPC calls via `SupabaseService.getClient().rpc(...)`.

---

## Phase 3 — UI

### 3.1 `features/social/social.component.ts`
- Header: own **streak** large with 🔥 + "X days".
- Tabs: **Feed / Friends / Leaderboard** (signal `activeTab`).
- **Feed**: cards with avatar (link `/profile/@username`), name, plan, kcal/duration, photo (if present), time (existing `time-ago`), streak chip.
- **Friends**: `@username` input + "Add" (feedback via NotificationService), incoming requests with Accept/Decline, friends list with streak & "Remove".
- **Leaderboard**: ranked list (🥇🥈🥉), kcal + workouts + streak, own row highlighted.
- Reuse: `UserAvatarBadgeComponent`, `time-ago`, `generateInitialsAvatar`.

### 3.2 Workout photo (History detail)
- In [history-detail.component.ts](../src/app/features/history/history-detail.component.ts) add a photo section: show existing photo, file-upload button "Add/Replace photo" → `uploadWorkoutPhoto` + `setSessionPhoto` + `workoutService.refresh()`.

---

## Phase 4 — Routing & Navigation

- Route `social` in [app.routes.ts](../src/app/app.routes.ts) (lazy, `ApprovedGuard`).
- Footer in [layout.component.ts](../src/app/layout/layout.component.ts): 4th tab **Social** (icon `groups`), badge dot when there are open friend requests.

---

## Phase 5 — Verification

- `npm run build` (production build must be green).
- Unit test: port `compute_current_streak` logic to TS, OR a service test with a mocked client for the `sendRequest` feedback paths.
- Manual (after running the SQL in Supabase): send/accept a request, upload a photo, check feed & leaderboard.

---

## Open Points / Assumptions

- **The SQL must be run manually in Supabase** (the app does not auto-migrate). The append is prod-safe.
- Streak calculation uses UTC calendar days (session timezone) — sufficient for MVP.
- Workout photos initially only via History detail (not the completion flow), to avoid changing the existing session transaction/RPC.
- Photo upload reuses the image optimization from `image-upload-domain`.

