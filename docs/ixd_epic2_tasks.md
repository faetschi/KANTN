# IXD Epic 2 Tasks

Frictionless Logging & Smart Defaults (planning via calendar and smart defaults).

## Story 1: Planned Workout Start

### Acceptance Criteria
- Planned workouts are visible in a simple upcoming-workouts view.
- A planned workout can be started directly.
- Starting a planned workout opens the existing workout flow with prefilled exercises.

### Implementation Tasks
- [ ] Add or reuse a planned-workouts data source.
- [ ] Build a simple upcoming-workouts list or calendar entry point.
- [ ] Ensure planned workouts are ordered by date and localized for timezone.
- [ ] Add a "start workout" action for planned workouts.
- [ ] Map planned workout exercises into the active workout state.
- [ ] Handle missing or deleted plan exercises (fallback to manual flow).
- [ ] Add empty-state UI when no planned workouts exist.
- [ ] Add tests for starting a workout from a plan.

## Story 2: Smart Exercise Defaults

### Acceptance Criteria
- Planned target values are used first when available.
- If no plan value exists, the app can suggest values from the user's latest matching workout.
- Users can edit all suggested values before saving.

### Implementation Tasks
- [ ] Define priority order for defaults: plan value, last workout value, empty value.
- [ ] Add service logic for resolving default sets, reps, weight, duration, or distance.
- [ ] Define exercise matching rules for "last workout" lookup (id vs name).
- [ ] Add safeguards for unit mismatches (kg/lb, time, distance) with clear fallback.
- [ ] Show suggested values in the workout UI.
- [ ] Make edited values override suggestions for the current session.
- [ ] Ensure suggested/confirmed states are accessible (not color-only).
- [ ] Add unit tests for default priority rules.

## Story 3: Low-Friction Workout Logging

### Acceptance Criteria
- Users can confirm a prefilled set quickly.
- Users can adjust only the fields that changed.
- The UI clearly distinguishes suggested values from confirmed values.

### Implementation Tasks
- [ ] Add a quick-confirm action for prefilled workout entries.
- [ ] Keep manual editing available for every logged value.
- [ ] Add visual state for suggested, edited, and confirmed values.
- [ ] Add an undo or edit-after-confirm path for quick-confirm actions.
- [ ] Preserve confirmed values reliably when navigating between exercises.
- [ ] Ensure keyboard and mobile interactions stay efficient.
- [ ] Run a short manual UX pass on the logging flow.

## Story 4: Calendar-Aware Reminders

### Acceptance Criteria
- The app shows today's planned workout prominently.
- Missed or upcoming workouts are clearly labeled.
- Reminder behavior works without requiring external calendar integration in the first version.

### Implementation Tasks
- [ ] Add date status logic for today, upcoming, and missed workouts.
- [ ] Surface today's workout on the main workout or dashboard screen.
- [ ] Add simple labels for planned workout status.
- [ ] Add a safe fallback when planned workouts fail to load.
- [ ] Add a lightweight in-app reminder surface (banner/card) without external integration.
- [ ] Add tests for date status logic.

## Quality Enhancements (Out of MVP)

These items improve usability and confidence but are not required for the first release.

- [ ] Add a calendar week view for planned workouts (beyond list view).
- [ ] Support drag-and-drop rescheduling of planned workouts.
- [ ] Add a "skip for today" action with a gentle reason prompt.
- [ ] Provide a one-tap "repeat last workout" option when no plan exists.
- [ ] Show a quick summary of plan targets vs logged results after workout completion.
- [ ] Allow per-exercise default preferences (e.g., preferred rep ranges or units).
- [ ] Add a brief onboarding tip for smart defaults on first use.
- [ ] Add haptic/visual feedback for quick-confirm actions (mobile).
- [ ] Add offline-first behavior for planned workouts and defaults.
- [ ] Track user acceptance of defaults to refine future suggestions.
