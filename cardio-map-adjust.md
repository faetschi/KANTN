# Cardio Map Adjustments

## Completed

### 1. `workout.component.ts` — template changes

- **Exercise name + "Info" button**: Removed from cardio layout section
- **"Enter Distance" button**: Wrapped with `@if (!currentCardioData()?.gpsEnabled)` — only visible when GPS OFF
- **Map visibility**: GPS ON → shows `app-cardio-map`; GPS OFF → shows placeholder "Enable GPS to view your route"
- **Pause button**: Moved from header to timer box (w-12 h-12, gray when running / yellow when paused)
- **Modals z-index**: All modals (exit, manual distance, freestyle save) changed from `z-50` to `z-[70]`

### 2. `cardio-map.component.ts` — always follow, remove toggle

- Removed `followEnabled` signal, `toggleFollow()` method, and follow-toggle button
- `updateRoute()` always calls `map.setView()` when position is present
- Added `isolate` (Tailwind) to map container to contain Leaflet's high internal z-indices
- Map embedded inline in template (replaces exercise image for cardio)

### 3. `cardio-tests.spec.ts` — updated tests

- Tests updated to set `gpsEnabled: true` and verify map renders / placeholder shows when GPS OFF
- Follow-toggle button tests removed
- "Waiting for GPS" message test preserved (direct `CardioMapComponent` test)

## What stays the same

- Auto-GPS enable on `initCardioExercise()` — already implemented
- Haversine distance auto-tracking via GPS — already implemented
- Polyline route tracing from start to current position — already implemented
- Timer and metrics display — already implemented
- GPS ON/OFF toggle button in metrics section — stays unchanged

## Completed

### 5. Map route tracking every 5 seconds + post-workout map snapshot

**Implemented**:
- **5-second interval tracking**: Replaced `watchPosition` with `setInterval(5000)` + `getCurrentPosition()` for consistent 5-second sampling. Immediate first position call on start. GPS pauses when workout is paused.
- **Post-workout snapshot**: `CardioMapComponent.captureSnapshot()` uses `html2canvas` to capture the map container as a JPEG data URL. Bounds are fit to the polyline route before capture.
- **Snapshot in session data**: `mapSnapshotUrl` field added to `ExerciseSession`, `PersistedSessionExercise`, and `CardioExerciseData`. Captured during `finishWorkout()` before GPS is stopped (while the map component is still alive).
- **Display in history**: `history-detail.component.ts` shows the map snapshot image for cardio exercises when `mapSnapshotUrl` is present.
- **Tests**: 5 new tests covering snapshot capture (null when no map, null when no polyline, snapshot URL passed through session, geolocation unavailable, immediate getCurrentPosition call). **68/68 tests pass**.

**Files changed**:
| File | Change |
|---|---|
| `src/app/core/models/models.ts` | Added `mapSnapshotUrl` to `ExerciseSession` and `CardioExerciseData` |
| `src/app/core/domain/workout-domain.ts` | Added `mapSnapshotUrl` to `PersistedSessionExercise` |
| `src/app/features/workout/cardio-map.component.ts` | Added `captureSnapshot()` method using html2canvas |
| `src/app/features/workout/workout.component.ts` | Replaced `watchPosition` with `setInterval(5000)` + `getCurrentPosition()`; added `@ViewChild(CardioMapComponent)` and snapshot capture in `finishWorkout()` |
| `src/app/features/history/history-detail.component.ts` | Added map snapshot image display for cardio exercises |
| `src/app/cardio-tests.spec.ts` | Added 5 new tests for snapshot and interval tracking |
| `package.json` | Added `html2canvas` dependency |

**Known limitations**:
- Snapshot is stored as a data URL (not persisted to Supabase). Display in history only works if the session was just finished in the same browser session. Future work: upload to Supabase storage and persist the URL.
- Snapshot is captured only for the current exercise at finish time. Past cardio exercises in the same session don't get snapshots.
- Snapshot tiles may not render with `useCORS: true` if CDN tiles lack proper CORS headers (falls back gracefully to `allowTaint: true`).
