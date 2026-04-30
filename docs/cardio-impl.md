## Plan: Cardio Feature (Running & Cycling)

TL;DR - Add a cardio workout mode (running/cycling) that coexists with current strength workouts. Cardio sessions support both plan-driven targets and freestyle runs/rides, show a live map + geolocation, track elapsed time/distance/pace, and persist cardio-specific metrics (distance, duration, avg/max pace, optional route). Implement backend schema changes, domain persistence, UI updates in the workout flow, map integration, and admin/plan creation support.

**Steps**
1. Discovery: confirm mapping + geolocation libraries and privacy constraints. *depends on #2*
2. Schema & Domain: add cardio fields to persisted model and DB (e.g., `workout_session_exercises` cardio snapshots + optional `route_geojson`). Create a migration path. *blocks backend work in #3 and #4*
3. Repository RPCs & Server: extend `create_workout_session_tx` or add a companion RPC to accept cardio exercise JSON (distance, duration, pace, optional route). Ensure RLS policies allow inserts by owner. *depends on #2*
4. WorkoutService: add cardio-specific state (GPS enabled, route buffer, distance calculator), and adapt `buildPersistedSessionPayload` to include cardio metrics.
5. Workout UI: in [src/app/features/workout/workout.component.ts](src/app/features/workout/workout.component.ts), add:
   - Cardio mode UI when plan/category/exercise_type === 'cardio' or when user starts a Cardio plan.
   - Map component region (map tile choice, simple overview, start/stop tracking controls).
   - Live metrics panel: elapsed time, distance, current pace, avg pace, max pace, cadence placeholder.
   - Option to configure target distance/time in plan-create for cardio plans.
6. Geolocation & Mapping:
   - Use browser Geolocation API with permission prompt; sample at configurable interval (e.g., 1s–5s).
   - Use lightweight map renderer (Leaflet with OpenStreetMap tiles) or an already-approved lib.
   - Compute distance via Haversine on successive coords; smooth with small-window filtering; store interim route in memory and optionally persist compressed route on finish.
7. Plan Create/Edit: add cardio target fields and UX to [src/app/features/plans/plan-create.component.ts](src/app/features/plans/plan-create.component.ts) to allow preconfiguring distance/time goal.
8. Freestyle Cardio: support `/workout/freestyle` with `freestyleMode` but show cardio controls when user adds a cardio exercise or picks a cardio freestyle template.
9. Admin + Seeds: add a few default cardio exercises/plans to [db/init_supabase.sql](db/init_supabase.sql) (e.g., Outdoor Run, Cycling Ride) and admin CRUD in [src/app/features/admin/admin-workouts.component.ts](src/app/features/admin/admin-workouts.component.ts).
10. Tests & QA: add unit tests for distance/pace calculation, integration test for session persistence, and manual test scripts (simulated GPS traces) for mapping and route persistence.
11. Rollout: phased release behind feature flag; migration script for existing DBs; monitoring for geolocation permission failures and battery issues.

**Relevant files**
- `src/app/features/workout/workout.component.ts` — workout UI and in-progress persistence
- `src/app/core/domain/workout-domain.ts` — session payload builder and calorie logic
- `src/app/core/repositories/workout.repository.ts` — persistence + RPC calls
- `src/app/core/models/models.ts` — add cardio session types/fields
- `src/app/features/plans/plan-create.component.ts` — cardio plan targets in UI
- `src/app/features/admin/admin-workouts.component.ts` — admin CRUD for default cardio plans
- `db/init_supabase.sql` — DB migration: add target_distance/target_duration, route_geojson, cardio snapshots
- `src/app/core/services/workout.service.ts` — new cardio state + refresh/persist logic
- `src/app/core/services/supabase.service.ts` — client usage for RPCs

**Verification**
1. Unit: distance calc, pace calc, route encoding/decoding functions.
2. Integration: simulate GPS trace to verify live distance, pace, and route on map.
3. End-to-end: Start cardio plan (preconfigured target), run simulated route, finish, verify `workout_sessions`/`workout_session_exercises` carry cardio metrics and optional route stored in DB.
4. RLS: validate an authenticated user can persist cardio sessions and cannot write others' data.
5. Manual UX: test permission grant/deny flows, background/foreground resilience, and battery/interval tuning.

**Decisions & Assumptions**
- Store full raw GPS traces only if user opts in; default: persist only summary metrics (distance, duration, avg/max pace) and optionally compressed route (GeoJSON) behind opt-in.
- Use browser Geolocation API + Leaflet/OpenStreetMap to avoid vendor API keys by default.
- Cardio calorie calc uses MET when appropriate; allow augmenting with distance-to-calorie heuristics later.
- Freestyle cardio uses same flow as plan cardio but without preconfigured targets.

**Further Considerations**
1. Privacy: clearly surface data collection and route sharing; provide controls to delete route data.
2. Battery & Sampling: use adaptive sampling (lower frequency when standing still) and warn users about battery usage.
3. Offline: support queuing session summary and route until network available.
4. Map tiles & attribution: choose OSM tiles with required attribution, or allow configured map provider env var.
5. Metrics export: consider GPX/TCX export in future for user downloads.

**Estimated Effort**
- Discovery + design: 1–2 days
- Backend schema + RPCs + migration: 1 day
- Frontend map + live tracking + UI: 3–5 days
- Tests + QA + staging verification: 1–2 days
Total: ~6–10 developer days depending on map complexity and route persistence scope.
