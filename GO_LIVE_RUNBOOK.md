# Go-Live Verification & Rollback Runbook

## Scope
This runbook defines the staged rollout path for backend persistence and Supabase policy/SQL changes.

## Rollout Strategy
1. Apply SQL changes in dev.
2. Validate core flows end-to-end in dev.
3. Apply the same SQL to staging.
4. Execute the staging verification checklist below.
5. Deploy app changes to production.
6. Apply SQL changes to production in a controlled window.
7. Re-run post-deploy smoke checks in production.

## Staging Verification Checklist

### Prechecks
- Confirm staging `SUPABASE_URL` and `SUPABASE_ANON_KEY` point to staging project.
- Confirm latest SQL from `db/init_supabase.sql` is applied.
- Confirm storage buckets exist: `exercise-images`, `avatars`.
- Confirm at least two test users exist:
  - User A (regular)
  - User B (regular)
  - Optional Admin user

### Functional smoke checks
1. **Profile save + avatar upload**
   - Log in as User A.
   - Upload a profile picture.
   - Save profile.
   - Reload app and confirm picture persists.
2. **Create plan**
   - Create a new plan with selected exercises.
   - Confirm plan appears in plans list after refresh.
3. **Finish workout (transactional persistence)**
   - Start workout on a plan.
   - Complete at least one set and finish workout.
   - Confirm session appears in history with set details.
4. **Share/unshare plan**
   - Share plan from User A to User B.
   - Log in as User B and confirm access.
   - Unshare from User A and confirm access is removed.
5. **Share/unshare custom exercise**
   - Create custom exercise with uploaded image.
   - Share to User B, verify visibility.
   - Unshare and verify visibility is removed.
6. **First-run seed**
   - For a fresh user, verify default exercises and 2 beginner plans are seeded once.
   - Re-login and confirm no duplicates.

### Security checks
- Attempt cross-user profile access with anon/authenticated client and verify denied by RLS.
- Confirm non-admin users can upload images but cannot mutate other users' avatar objects.
- Confirm shared resources are inaccessible once unshared.

## Rollback Steps (DB + Policy Changes)

### Trigger conditions
- Elevated 4xx/5xx or failed writes on profile/plan/session/share flows.
- Broken RLS behavior (cross-user leakage or false denials).
- Storage upload failures due to policy regressions.

### Immediate containment
1. Disable new frontend rollout (pause or redeploy previous frontend build).
2. Stop applying further SQL changes.
3. Notify stakeholders with incident start time and affected scope.

### Database rollback options
1. Re-run last known good SQL baseline for policies/functions.
2. Specifically revert:
   - `create_workout_session_tx`
   - `seed_beginner_plans_for_user`
   - profile sync trigger/function
   - storage policies (`exercise-images`, `avatars`)
3. If needed, restore staging/production from latest safe DB backup snapshot.

### App rollback
1. Re-deploy previous stable app version.
2. Verify auth + profile + plans + workout history flows.

### Post-rollback verification
- Re-run the same staging smoke checks from this document.
- Confirm no cross-user access.
- Confirm profile and workout persistence are healthy.

## Evidence to capture
- SQL execution logs/timestamps.
- Before/after policy definitions.
- Screenshots for each smoke check.
- Error logs and affected user IDs (redacted where required).
- Final sign-off note with date/time and approver.
