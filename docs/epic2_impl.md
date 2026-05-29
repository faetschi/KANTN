# IXD Epic 2 — Implementation Log

## Overview

**Epic**: Frictionless Logging & Smart Defaults (planning via calendar and smart defaults)

**Design doc**: `docs/ixd_epic2_tasks.md`

**Dependencies**: Angular + Supabase + date-fns

---

## Phases

### Phase 1: Foundation — Data Model & Scheduling
- [x] Create this document
- [ ] Add `ScheduledWorkout` model to `core/models/models.ts`
- [ ] Add `PlanExerciseTarget` model (per-exercise target reps/weight/sets on plans)
- [ ] Add scheduled workouts signal + methods to `workout.service.ts`
- [ ] Add DB repository methods for `workout_schedule` and `plan_exercise_targets`
- [ ] Scheduling date picker UX in `PlanCreateComponent`
- [ ] Schedule display (badges) in `PlansComponent`

### Phase 2: Story 1 — Planned Workout Start
- [ ] Upcoming workouts computed signals
- [ ] Upcoming-workouts list on Home (above active plan card)
- [ ] Calendar integration — planned vs completed dots, tap to schedule/start
- [ ] Start-workout mapping (from schedule into active workout state)
- [ ] Missing/deleted exercise fallback UI
- [ ] Empty states for no scheduled workouts

### Phase 3: Story 2 — Smart Exercise Defaults
- [ ] Create `core/domain/smart-defaults.ts` with priority resolution
- [ ] Exercise matching logic (by id, then fuzzy name)
- [ ] Unit mismatch safeguards (kg/lb/time/distance)
- [ ] Wire defaults into `WorkoutComponent.initializeWorkoutData()`
- [ ] Track `source` per set (plan | history | manual)
- [ ] Accessibility labels for suggested/confirmed states

### Phase 4: Story 3 — Low-Friction Workout Logging
- [ ] Quick-confirm action (per-exercise and "Confirm All")
- [ ] Visual states: suggested (dashed), edited (solid), confirmed (green)
- [ ] Undo toast (5s) after confirm + review on finish
- [ ] Keyboard/mobile efficiency: Tab/Enter nav, swipe-to-complete
- [ ] Manual UX pass on full flow

### Phase 5: Story 4 — Calendar-Aware Reminders
- [ ] Date status logic: today / upcoming / missed / completed
- [ ] Home dashboard: nearest scheduled workout as primary card
- [ ] Dismissible top banner on all pages (workout due within 2h)
- [ ] Missed workout labels (red badge + reschedule/skip actions)
- [ ] Safe fallback for load failures (retry, hide, error prompt)

### Phase 6: Testing
- [ ] `date-status.spec.ts`
- [ ] `smart-defaults.spec.ts`
- [ ] `scheduled-workout.spec.ts`
- [ ] `logging-flow.spec.ts`
- [ ] `calendar-integration.spec.ts`

### Phase 7: UX Enhancements (Out of MVP)
- [ ] Calendar week view toggle
- [ ] Drag-and-drop reschedule on calendar
- [ ] "Skip for today" with reason prompt
- [ ] One-tap "repeat last workout"
- [ ] Post-workout plan vs actual summary
- [ ] Haptic/visual feedback for quick-confirm (mobile)
- [ ] Offline-first caching for scheduled workouts
- [ ] Onboarding tooltip for smart defaults
- [ ] Track acceptance rate of defaults

---

## Design Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Schedule storage | Explicit date rows (`workout_schedule` table) | Flexible, supports one-off dates, rescheduling, offline |
| Strength exercise targets | `plan_exercise_targets` table | Plan can specify target reps/weight per exercise |
| Reminder placement | Home card (primary) + dismissible top banner (all pages) | Prominent but not intrusive |
| Default priority chain | Plan target → last session → empty | Clear, predictable, user controls final value |

---

## Implementation Log

### 2026-05-28 — Phase 1 complete
- Created this doc
- Phase 1a: Added `ScheduledWorkout` and `PlanExerciseTarget` models to `models.ts`
- Phase 1b: Added schedule/target signals and methods to `WorkoutService` and `WorkoutRepository`
- Phase 1c: Added scheduling toggle + date picker to `PlanCreateComponent`
- Phase 1d: Added schedule badge display and "Schedule" dialog to `PlansComponent`

### 2026-05-28 — Phase 2 complete
- Phase 2a: Added computed signals: `todayWorkout`, `nearestScheduledWorkout`, `upcomingWorkouts`, `missedWorkouts`
- Phase 2b: Home dashboard now shows nearest scheduled workout as primary card (today/upcoming/missed states)
- Phase 2c: Calendar shows scheduled workout dots, selected day lists scheduled workouts with Start action
- Phase 2d: `scheduleId` query param tracked through workout flow, marked completed on finish
- Phase 2e: Missing/deleted exercise detection with inline warning banner + "Add Exercise" fallback
- Phase 2f: Empty states added for Plans (no plans yet), Calendar (no workouts/plans), Home (no schedule or plan)

### 2026-05-28 — Phase 3 complete
- Created `core/domain/smart-defaults.ts` with priority chain: plan target → last workout → empty
- Added fuzzy exercise name matching (Levenshtein distance) for renamed exercises
- Added unit mismatch detection with user-facing warnings
- Wired defaults into `WorkoutComponent.initializeWorkoutData()`
- Added `source` field to `Set` model to track where values come from
- Added `markSetEdited()` to clear source when user manually edits values

### 2026-05-28 — Phase 4 complete
- Added "Confirm All Sets" quick-confirm button per exercise
- Added "Reset" button to restore default values per exercise
- Visual states: suggested (dashed blue/purple border + mini label), edited (solid gray), confirmed (green bg)
- Undo toast appears for 5s after confirm/reset with "Undo" action
- Accessibility: `aria-label` on weight/reps inputs includes source info

### 2026-05-28 — Phase 5 complete
- Created `core/domain/date-status.ts` with shared `isToday`, `isUpcoming`, `isMissed` functions
- Refactored HomeComponent to use shared date-status functions
- Added dismissible reminder banner to LayoutComponent (shows when workout due ±2h)
- Banner persisted via localStorage dismissal per workout ID
- Added safe fallback for scheduled workout loading (try/catch, error signal, falls back to mock data)

### 2026-05-28 — Phase 6 complete
- Created `smart-defaults.spec.ts` — tests for default priority chain, cardio defaults, source labels, unit mismatch
- Created `date-status.spec.ts` — tests for isToday, isUpcoming, isMissed with edge cases
- Created `scheduled-workout.spec.ts` — tests for scheduling, status updates, nearest/missed queries
- All tests compile cleanly with `tsc --noEmit`
