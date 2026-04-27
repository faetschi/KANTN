## KANTN Prioritized Implementation Plan

Date: 2026-04-24
Source: Consolidated from open items in todo.md

### Implementation Progress
- [x] 2026-04-24: Fixed share-flow reliability path and shared-plan activation blocker. `created_by` for share writes is now sourced from live Supabase auth user, and recipients can activate shared plans through a persisted shared-plan active fallback.
- [x] 2026-04-24: Fixed Create Custom Exercise stuck `Creating...` state by hardening create flow with guarded loading reset across validation/API/exception paths and added profile-style success/error toast feedback (`Saved.` / failure).
- [x] 2026-04-24: Implemented owner-only custom exercise management in Custom Exercises: users can edit their own custom exercises and delete owned private custom exercises from a dedicated management list.
- [x] 2026-04-24: Added clearer custom exercise field guidance for Exercise type and MET value (labels, default hints, and helper descriptions).
- [x] 2026-04-24: Implemented continue-workout recovery for plan and freestyle sessions with persisted active-workout context plus draft restoration (sets, timer, current exercise) after navigation away from /workout.
- [x] 2026-04-27: Made freestyle workout top controls sticky in /workout so "Add Exercise" remains visible while scrolling, matching the persistent-navigation pattern used by workout bottom actions.

### Goal
Deliver a production-safe baseline first, then remove user blockers, then ship the highest-value new product features.

### Prioritization Rules
- P0: Production risk, security, data integrity, or broken core flows.
- P1: High-frequency UX blockers in daily workout usage.
- P2: Core product expansion needed for planning and discoverability.
- P3: Strategic features and scale/quality hardening.

## Phase Roadmap

### Phase 1 (P0) Production Blocking and Trust (1-2 weeks)

Scope
- Fix workout plan share bug (`403 Forbidden`) and ensure recipients can see and set shared plans active.
- Add invite/access control layer for shared workout plans.
- Complete staging go-live verification and rollback rehearsal from GO_LIVE_RUNBOOK.md.
- Validate anon key cannot read cross-user profile data.
- Run SQL migration tests against clean DB and existing DB.
- Validate storage/image permissions for admin exercise images.
- Document production deploy steps and release checklist updates.

Quality gates
- Smoke coverage green for profile save, create plan, finish workout, share plan.
- End-to-end validation complete for profile edit, plan creation, workout completion, history, weekly/monthly stats.

Definition of done
- Share and permission flows pass for two real users.
- Security negative tests documented and repeatable.
- Staging signoff evidence captured for every go-live checklist item.

### Phase 2 (P1) Core Workout UX and Ownership (1-2 weeks)

Scope
- Allow users to delete own custom plans and own custom exercises (never default/shared).
- Add custom exercise management/edit for owner-created exercises.
- Fix Create Custom Exercise stuck Creating state.
- Add clear field helper text in custom exercise form (defaults and semantics).
- Add success/error feedback for custom exercise create/save.
- Add Continue Workout recovery when user leaves active workout/freestyle.
- Center freestyle Save-as-plan modal so footer cannot overlap it.
- Add in-workout exercise list quick-open from bottom indicator (for plan and freestyle).
- Make freestyle Add exercise top navigation sticky.
- Add confirmation/undo pattern for destructive actions (delete/revoke/unshare).

Definition of done
- No known stuck-state UX issues in workout/custom exercise flows.
- Session continuity survives route changes without losing progress.
- Destructive actions are clearly confirmed and reversible where possible.

### Phase 3 (P2) Data Model Expansion and Calendar (2-3 weeks)

Scope
- Add workout plan category (single category per plan).
- Add exercise type metadata (`strength`, `mobility`, `cardio`) to user/admin create/edit.
- Ensure admins can fully manage default exercises (add/remove/update).
- Add profile stats period toggle (weekly/monthly) with richer aggregation support.
- Add additional metrics tracking (weight lifted, distance for cardio) where applicable.
- Add calorie calculation transparency in UI (formula entry point, detailed breakdown, factors).
- Add Calendar page in footer with monthly overview and planned/completed markers.
- Add top cards for planned/completed month totals and category breakdown drill-in.
- Derive and persist workout-plan overall type from dominant exercise type.
- Apply consistent type-color mapping across exercises, plans, and calendar markers.

Definition of done
- Schema and UI support categories/type/metrics without breaking existing plans.
- Calendar renders accurate status and type color semantics.
- Stats period switch and heavier queries meet acceptable performance.

### Phase 4 (P3) Reliability, Security Depth, and Scale (2-4 weeks)

Scope
- Add policy regression tests for RLS and storage enforcement.
- Add repository tests for persistence flows and sharing permissions.
- Add integration tests for auth/profile lifecycle.
- Add E2E tests for create plan, finish workout, share, history.
- Add fixture-based deterministic test data.
- Add idempotency keys/retry strategy for critical writes.
- Add soft delete/archive strategy for plans/exercises.
- Add optimistic concurrency checks (`updated_at` guard).
- Add scheduled integrity checks for orphaned rows.
- Add pagination for history/session detail queries.
- Add query/index review with `EXPLAIN ANALYZE`; add stat views as needed.
- Add incremental loading and stale-while-revalidate refresh for dashboard data.
- Add centralized error monitoring and structured action logging.
- Add health-check dashboard for Supabase connectivity and write failures.
- Add secure file validation for uploads (mime, size, extension allow-list).
- Add rate limiting/abuse protection for share-by-email flow.
- Add audit log table for admin actions.
- Add admin backup/export workflow for user/workout/exercise data.

Definition of done
- Reliability and security regressions are detectable in CI.
- Data consistency protections exist for all critical write paths.
- Operational visibility exists for production incidents.

### Phase 5 (P4) Future Product Differentiators (Later)

Scope
- GPS distance cues for cardio exercises (configurable milestone tones).
- Social/friends activity feed, workout photos, streaks, leaderboard.
- Challenge mode between friends (time-boxed competitive workouts).
- Per-exercise PR/progression history and previous-session prefill hints.
- Offline workout capture with deferred sync and conflict resolution UX.

Definition of done
- Features can be enabled without weakening core reliability from earlier phases.

## Coverage Matrix (Important Open todo.md items)

Covered in this plan
- Share flow bug and share activation: Phase 1
- Go-live staging verification and rollback readiness: Phase 1
- RLS/anon access validation: Phase 1
- Migration/storage validation and release docs: Phase 1
- Custom plan/exercise delete + edit/manage: Phase 2
- Create custom exercise UX fixes: Phase 2
- Active workout continue and freestyle modal/layout issues: Phase 2
- In-workout navigation improvements (exercise list, sticky controls): Phase 2
- Workout category and exercise type model: Phase 3
- Calendar feature with category/type visualization: Phase 3
- Weekly/monthly stats toggle and richer analytics: Phase 3
- Extended quality, security, observability, data reliability tasks: Phase 4
- Social/GPS/challenges and advanced progression ideas: Phase 5

## Suggested Sprint Sequence

Sprint A
- Complete Phase 1.

Sprint B
- Complete Phase 2.

Sprint C-D
- Complete Phase 3.

Sprint E-F
- Complete Phase 4.

Later
- Execute Phase 5 selectively based on product strategy.

## Dependency Notes

- Do not start calendar type-color logic before category/type schema changes are complete.
- Do not expand social/challenges before share permissions and abuse controls are hardened.
- Prioritize deterministic fixtures before broad E2E expansion if tests are flaky.

## Governance Notes

- todo.md remains the canonical checklist.
- IMPLEMENTATION_PLAN.md remains prioritization and execution sequencing.
- Every Phase 1 and Phase 2 item should receive an owner and target milestone.
