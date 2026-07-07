# Resolutions for Bugs

## Admin Page: Empty Data on First Load & Double-Click Required for Actions

**Symptoms:**
1. When navigating to the `/admin` page, the user list was empty on the first load.
2. Clicking "Approve", "Decline", or "Revoke" required two clicks to actually update the UI.

**Root Causes:**
1. **Supabase Auth Race Condition (Empty Data):** The Angular component initialized and fired Supabase queries before the Supabase client had fully hydrated its auth session from local storage. Because the auth headers were missing or stale, Supabase's Row Level Security (RLS) policies silently rejected the queries, returning 0 rows.
2. **Angular Zone.js Context Loss (Double-Click Bug):** Supabase uses native `fetch` and `Promise`s under the hood. When `await`ing these calls, the execution context sometimes fell outside of Angular's `Zone.js` (the system Angular uses to know when to update the UI). When the data finally loaded or an action finished, Angular didn't know it needed to re-render the screen. The second click triggered a DOM event, which forced Angular to run change detection and update the UI.

**Resolutions:**
1. **Session Warmup & Retry Loop:** Implemented `getReadyClient()` and `withRetry()` in `AdminService`. This ensures the Supabase session is fully loaded and forces a `refreshSession()` if the token is stale before executing queries.
2. **Manual Change Detection:** Injected `ChangeDetectorRef` (`cdr`) into `AdminComponent` and manually called `this.cdr.detectChanges()` immediately after fetching data or completing mutations. This forces the UI to update instantly, eliminating the need to double-click.
3. **TypeScript Fix:** Updated the `withRetry` generic signature to accept `PromiseLike<T>` instead of `Promise<T>` because Supabase's `PostgrestFilterBuilder` is a "thenable" and lacks `.catch()` and `.finally()`.

# Known Bugs

- [x] When starting a Freestyle Workout, the popup after selecting exercises does not go away (no "Start" button or doesnt work) for both strenght or cardio after exercise selected — Resolved: strength shows a "Start Workout" button that closes the picker; cardio auto-starts and closes on selection. Covered by `freestyle-workout.spec.ts` (strength button click + cardio auto-start).
- [x] KEINE Schwarze Buttons -> Primary color für alle buttons (blau) so all use primary color — Resolved: all action buttons use the primary blue (`bg-blue-600`); login buttons switched from indigo to blue. Remaining dark elements are modal backdrops and intentional dark cards/segmented toggles, not action buttons.