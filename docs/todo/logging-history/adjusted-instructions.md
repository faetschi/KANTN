# Adjusted Integration Plan: Logging / Activity History

This document translates the reverse-engineered "Loggd.life" screenshots into a concrete integration plan for the KANTN project.

## 1. Architecture Overview

### Target Feature: Activity Page (accessible from Profile)

The screenshots show **Practices** as a core screen. In KANTN, the equivalent is **workout plans / completed sessions**. Instead of building a separate "practices" system, we map:

| Loggd Concept | KANTN Equivalent |
|---|---|---|
| Practice (e.g. "Post on Threads") | Workout Plan (e.g. "Beginner Full Body A") |
| Practice log entry (daily check/count) | Completed WorkoutSession |
| Week view of practice cards | Weekly per-plan activity grid |
| Yearly heatmap view | Long-term contribution grids per plan |
| Profile activity heatmap | Aggregate activity heatmap (all plans combined) |
| Streak | Computed from consecutive days with completed sessions |

### Route & Navigation Strategy

`/activity` is a secondary page — **not** in the bottom nav. Users reach it by tapping the activity heatmap on their profile.

The existing `/calendar` stays as-is for scheduling workouts. Calendar and Activity share the same data source (`WorkoutService.sessions()` + `scheduledWorkouts`) so historical data always matches.

The existing `/history` page also remains for detailed session drill-down.

**Navigation flow:**
- Profile activity heatmap tap → `/activity`
- Activity page day/session tap → `/history/:sessionId`
- `/history` stays in bottom nav for direct access

**Route structure:**

```
/activity              → ActivityComponent (standalone, lazy)
/history               → HistoryComponent (unchanged)
/history/:sessionId    → HistoryDetailComponent (unchanged)
/profile               → Enhanced ProfileComponent (streak + activity heatmap)
/calendar              → CalendarComponent (unchanged, data feeds into activity)
```

## 2. Shared / Reusable Components to Create

All in `src/app/shared/components/` or a new `src/app/features/activity/` feature folder.

### A. `ContributionGridComponent`

A pure presentational component that renders a GitHub-style grid of activity squares.

**Props (Inputs):**
- `data: ContributionDay[]` — array of `{ date: Date; count: number; intensity: 0 | 1 | 2 | 3 | 4 }`
- `colorScheme: 'blue' | 'green' | 'purple' | 'orange' | 'pink'` — maps to Tailwind color palette
- `compact: boolean` — `false` for full yearly view, `true` for profile preview

**Template structure:**
```
<div class="contribution-grid">
  <div class="month-labels">Jan Feb Mar ...</div>
  <div class="grid gap-[2px]" style="grid-template-columns: repeat(53, 1fr)">
    @for (day of data; track day.date) {
      <div class="aspect-square rounded-sm"
           [style.background-color]="intensityColor(day.intensity, colorScheme)">
      </div>
    }
  </div>
</div>
```

**Color mapping utility** (in shared domain file `src/app/core/domain/activity-utils.ts`):
```typescript
const ACTIVITY_COLORS = {
  blue: ['#ebf5ff', '#b3d9ff', '#4da6ff', '#0066cc', '#003b80'],
  green: ['#ebf5eb', '#b3d9b3', '#4da64d', '#006600', '#003b00'],
  purple: ['#f3ebff', '#d4b3ff', '#8c4dff', '#5900cc', '#330080'],
  orange: ['#fff5eb', '#ffd4b3', '#ff8c4d', '#cc5900', '#803300'],
  pink: ['#fff0f5', '#ffb3d9', '#ff4da6', '#cc0066', '#800040'],
};
```

### B. `PracticeCardComponent`

A card showing a single workout plan's weekly or yearly activity.

**Props:**
- `plan: WorkoutPlan`
- `viewMode: 'weekly' | 'yearly'`
- `weeklyData: { dayLabel: string; value: string | number; isActive: boolean }[]`
- `yearlyData: ContributionDay[]`
- `colorScheme: string`
- `streak: number`
- `totalActiveDays: number`

**Weekly card layout:**
```
<div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
  <div class="flex justify-between items-center mb-3">
    <div class="flex items-center gap-2">
      <div class="w-8 h-8 rounded-lg" [style.background]="planColor"></div>
      <span class="font-semibold text-gray-900">{{ plan.name }}</span>
    </div>
    <div class="flex items-center gap-1 text-orange-500">
      <mat-icon class="text-sm">local_fire_department</mat-icon>
      <span class="font-bold text-sm">{{ streak }}</span>
    </div>
  </div>
  <div class="grid grid-cols-7 gap-1.5">
    @for (day of weeklyData; track $index) {
      <div class="flex flex-col items-center gap-1">
        <span class="text-[10px] font-bold text-gray-400 uppercase">{{ day.dayLabel }}</span>
        <div class="w-full aspect-square rounded-lg flex items-center justify-center text-xs font-bold"
             [class]="day.isActive ? 'text-white' : 'text-gray-300 border border-gray-200'"
             [style.background]="day.isActive ? intensityColor : 'transparent'">
          {{ day.value }}
        </div>
      </div>
    }
  </div>
</div>
```

### C. `SegmentedControlComponent`

Reusable pill-shaped toggle (Weekly / Yearly).

```typescript
// Inputs: options: string[], selected: string
// Outputs: selectedChange: string
```

### D. Shared Types (`src/app/core/models/activity-models.ts`)

```typescript
/** A single day in a contribution grid — GitHub-style heatmap cell */
export interface ContributionDay {
  date: Date;
  count: number;
  /** 0 = no activity, 1-4 = increasing intensity */
  intensity: 0 | 1 | 2 | 3 | 4;
}

/** A day cell in the weekly practice card grid */
export interface WeekDayEntry {
  dayLabel: string;       // 'MO', 'TU', 'WE', etc.
  value: string | number; // count, duration, or checkmark
  isActive: boolean;
}

/** Per-plan aggregated weekly data */
export interface PlanWeekData {
  planId: string;
  days: WeekDayEntry[];
  streak: number;
  totalActiveDays: number;
}

/** Per-plan aggregated yearly heatmap data */
export interface PlanYearData {
  planId: string;
  contributions: ContributionDay[];
  streak: number;
  totalActiveDays: number;
}
```

### E. `StreakBadgeComponent`

Small pill showing streak count with fire icon. Used on practice cards and profile.

## 3. Activity Feature (`/activity` route)

### New Feature Folder: `src/app/features/activity/`

- `activity.component.ts` — main container, view mode switcher, date pagination
- `weekly-view.component.ts` — scrollable list of PracticeCards in weekly mode
- `yearly-view.component.ts` — scrollable list of PracticeCards in yearly/heatmap mode

### Template Sketch for `activity.component.ts`:

```
<div class="p-6 pb-24 space-y-6">
  <!-- Header with segmented control -->
  <header class="flex justify-between items-center">
    <h1 class="text-2xl font-bold text-gray-900">Activity</h1>
    <button (click)="logout()" class="text-xs font-semibold text-red-500">Log Out</button>
  </header>

  <!-- Segmented Control: Weekly / Yearly -->
  <div class="flex items-center gap-2 bg-gray-100 rounded-xl p-1 w-fit">
    <button (click)="viewMode.set('weekly')" class="px-4 py-1.5 rounded-lg text-sm font-semibold transition-all" [ngClass]="viewMode() === 'weekly' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'">Weekly</button>
    <button (click)="viewMode.set('yearly')" class="px-4 py-1.5 rounded-lg text-sm font-semibold transition-all" [ngClass]="viewMode() === 'yearly' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'">Yearly</button>
  </div>

  <!-- Date Pagination -->
  <div class="flex items-center justify-center gap-3">
    <button (click)="previousPeriod()">←</button>
    <span class="font-bold text-gray-900">{{ periodLabel() }}</span>
    <button (click)="nextPeriod()">→</button>
  </div>

  <!-- Helper text -->
  <p class="text-xs text-gray-400 text-center">Tap to log · Long-press for detail</p>

  <!-- Content based on view mode -->
  @switch (viewMode()) {
    @case ('weekly') { <app-weekly-view [plans]="plans()" [weekStart]="periodStart()" /> }
    @case ('yearly') { <app-yearly-view [plans]="plans()" /> }
  }
</div>

<!-- Floating Action Button -->
<button class="fixed bottom-24 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg
               flex items-center justify-center z-40 active:scale-90 transition-transform">
  <mat-icon>add</mat-icon>
</button>
```

### Data Derivation (in `activity-utils.ts` or inline):

**Weekly view data per plan:**
```
For each WorkoutPlan:
  - Filter sessions where session.planId === plan.id
  - For each day of the week (Mon-Sun), find matching sessions
  - Map to: { dayLabel: 'MO', value: count/duration/checkmark, isActive: boolean }
  - Determine display mode: count, duration, or checkbox based on plan type
```

**Yearly heatmap data per plan:**
```
For each WorkoutPlan:
  - Generate ContributionDay[] for the last 365 days
  - For each day, count sessions for this plan
  - Map count to intensity level (0-4)
  - Group by month for column labels
```

**Aggregate profile heatmap:**
```
- Same as yearly, but count ALL sessions (regardless of planId)
- Used on the profile page
```

## 4. Profile Enhancements

Add to `ProfileComponent`:

### A. Streak Badge (inserted after avatar card)

A single streak pill below the user name/bio:

```html
<div class="flex justify-center mt-2">
  <div class="flex items-center gap-1 px-3 py-1 rounded-full bg-orange-50 text-orange-700">
    <mat-icon class="text-sm">local_fire_department</mat-icon>
    <span class="font-bold text-sm">{{ currentStreak() }} day streak</span>
  </div>
</div>
```

### B. Activity Contribution Grid (inserted before Overview, clickable to /activity)

The entire grid card should be clickable via `(click)="goToActivity()"` using `router.navigate(['/activity'])`.

```html
<section>
  <div class="flex items-center justify-between mb-3">
    <h3 class="text-lg font-bold text-gray-900">Activity</h3>
    <span class="text-xs text-gray-400">{{ totalContributions() }} contributions</span>
  </div>
  <div (click)="goToActivity()" class="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 cursor-pointer active:bg-gray-50 transition-colors">
    <app-contribution-grid
      [data]="yearlyActivityData()"
      colorScheme="blue"
      [compact]="true"
    />
    <p class="text-xs text-gray-400 mt-2">{{ totalActiveDays() }} active days</p>
  </div>
</section>
```

### C. Practices Sub-Section (inserted before Overview or after)

```html
<section>
  <div class="flex items-center justify-between mb-3">
    <h3 class="text-lg font-bold text-gray-900">Practices</h3>
    <span class="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{{ plans().length }}</span>
  </div>
  <div class="space-y-3">
    @for (plan of plans(); track plan.id) {
      <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div class="flex justify-between items-center mb-2">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-lg" [style.background]="planColor(plan)"></div>
            <span class="font-semibold text-sm">{{ plan.name }}</span>
          </div>
          <div class="flex items-center gap-2 text-xs text-gray-500">
            <span>🔥 {{ planStreak(plan) }}</span>
            <span>✓ {{ planTotalDays(plan) }}d</span>
          </div>
        </div>
        <!-- Mini dot dashboard (last 30 days) -->
        <div class="flex gap-[3px]">
          @for (day of last30Days(plan); track $index) {
            <div class="w-2 h-2 rounded-sm"
                 [style.background]="day ? 'var(--plan-color)' : '#e5e7eb'">
            </div>
          }
        </div>
      </div>
    }
  </div>
</section>
```

## 5. Interaction Model

### Tap on Weekly Day Cell
- Navigates to `/history?date=YYYY-MM-DD` showing all sessions logged that day (uses existing history page with a date filter). If only one session exists, go directly to `/history/:sessionId`.

### Tap on Yearly Grid Cell
- Same as above — navigates to history filtered by that date.

### Long-Press on Weekly Day Cell
- Opens a small popover/modal showing the session details for that day+plan combo without navigating away. Use the existing notification/modal pattern (`fixed inset-0 bg-black/40 z-50`).

### Tap on Practice Card Header
- Navigates to the plan detail or shows a small expanded view of recent activity.

### FAB Tap
- Opens a quick-log modal or navigates to the freestyle workout start (TBD based on what makes sense for quick logging).

### Plan Color Assignment
Plans need a deterministic color so the same plan always shows the same accent. Use a hash of the plan ID to pick from a fixed palette:

```typescript
const PLAN_COLORS = ['blue', 'purple', 'green', 'orange', 'pink', 'teal', 'indigo', 'amber'];

function planColor(planId: string): string {
  let hash = 0;
  for (let i = 0; i < planId.length; i++) {
    hash = ((hash << 5) - hash) + planId.charCodeAt(i);
    hash |= 0;
  }
  return PLAN_COLORS[Math.abs(hash) % PLAN_COLORS.length];
}
```

## 6. Layout Changes

### Bottom Navigation (unchanged)

Keep the existing 3-item bottom nav (Home / Plans / Calendar). `/activity` is a secondary page reachable from the profile — no bottom nav entry needed.

### Floating Action Button (FAB)

Not present in current layout. Add to `ActivityComponent` only (scoped to that feature), positioned at `bottom-24 right-6`.

## 7. New Domain Service: `ActivityService`

Create `src/app/core/services/activity.service.ts` as a singleton that provides computed activity data.

**Responsibilities:**
- Compute weekly activity per plan from `WorkoutService.sessions()`
- Compute yearly contribution grid data per plan
- Compute aggregate heatmap data for profile
- Compute streaks (current streak per plan and overall)

**Signals:**
```typescript
plans: Signal<WorkoutPlan[]>                           // from WorkoutService
weeklyData: Signal<PlanWeekData[]>                     // per-plan weekly grid data
yearlyData: Signal<PlanYearData[]>                     // per-plan yearly heatmap data
aggregateYearlyActivity: Signal<ContributionDay[]>     // all plans combined (profile)
planStreaks: Signal<Map<string, number>>               // per-plan current streak
overallStreak: Signal<number>                          // highest consecutive day streak
totalContributions: Signal<number>                     // sum of all logged sessions
totalActiveDays: Signal<number>                        // unique days with any session
```

**Streak calculation:**
```
- Walk backwards from today
- Count consecutive days with at least one completed session
- Reset on days with no activity
```

This can all be pure computed signals derived from `WorkoutService.sessions()` — no backend changes needed initially.

## 8. Empty States

| Scenario | Treatment |
|---|---|
| User has no workout plans yet | Show a friendly message: "No practices yet. Create a workout plan to start tracking." + link to `/plans/create` |
| User has plans but no sessions this week | Cards render with all grey wireframe boxes, streak shows 0. Helper text: "Complete a workout to start your streak." |
| User has plans but no sessions in the entire history | Yearly heatmap shows all grey. Summary: "0 contributions and 0 active days." |
| Profile has no data | Same empty states for heatmap + practices section, streak pill hidden |

## 9. Database Changes (Optional / Phase 2)

The current schema supports everything via `workout_sessions`. For persisting streak data across devices, optionally add to `profiles`:

```sql
alter table profiles
  add column if not exists current_streak integer not null default 0,
  add column if not exists longest_streak integer not null default 0;
```

These can be updated via a Supabase database function or Edge Function on session insert. Phase 1 computes streaks client-side from existing `workout_sessions`.

## 10. Implementation Order

### Phase 1: Foundation (Critical — do first)

| Step | Item | Depends On |
|------|------|------------|
| 1 | **Activity types** — create `src/app/core/models/activity-models.ts` with `ContributionDay`, `WeekDayEntry`, `PlanWeekData`, `PlanYearData` | Nothing |
| 2 | **Activity domain utilities** — create `src/app/core/domain/activity-utils.ts` with streak calculator, intensity mapper, contribution grid builders, plan color hasher | Step 1 |
| 3 | **Activity route** — register `/activity` lazy route in `app.routes.ts` | Nothing |
| 4 | **ActivityService** — create `src/app/core/services/activity.service.ts` with computed signals (weekly, yearly, streaks) wrapping `WorkoutService.sessions()` | Steps 1, 2 |
| 5 | **ContributionGridComponent** — presentational, `@Input()` for data/colorScheme/compact, renders month labels + grid of colored squares | Step 1 |

### Phase 2: Activity Page (High priority)

| Step | Item | Depends On |
|------|------|------------|
| 6 | **PracticeCardComponent** — weekly card with 7-day grid, streak badge, color-coded plan icon | Steps 1, 4 |
| 7 | **Weekly view** — `weekly-view.component.ts` renders scrollable list of PracticeCards with date pagination | Step 6 |
| 8 | **Yearly view** — `yearly-view.component.ts` renders PracticeCards with ContributionGridComponent for each plan | Steps 5, 6 |
| 9 | **ActivityComponent** — container with segmented control (Weekly/Yearly), date pagination, helper text, swaps between weekly/yearly views | Steps 7, 8 |

### Phase 3: Profile Integration (Important)

| Step | Item | Depends On |
|------|------|------------|
| 10 | **Profile streak badge** — streak pill below avatar using `ActivityService.overallStreak` | Step 4 |
| 11 | **Profile activity heatmap** — compact ContributionGridComponent, clickable → navigates to `/activity` | Step 5 |
| 12 | **Profile practices sub-section** — per-plan mini dot dashboard (last 30 days) + streak + total days | Step 4 |

### Phase 4: Polish (Deferrable)

| Step | Item | Depends On |
|------|------|------------|
| 13 | **FAB** — floating action button on ActivityComponent | Step 9 |
| 14 | **Long-press modal** — popover for day+plan session details | Step 9 |
| 15 | **Animations** — transitions between weekly/yearly views, loading states | Steps 9, 11 |

## 11. Style Tokens Map

| Loggd Token | KANTN Tailwind Equivalent |
|---|---|
| Card background (`#121620` approx) | `bg-white` (light mode) / future: `dark:bg-gray-900` |
| Card elevation | `shadow-sm border border-gray-100` |
| Accent blue | `bg-blue-500 text-blue-500 border-blue-500` |
| Accent purple | `bg-purple-500 text-purple-500 border-purple-500` |
| Accent green | `bg-green-500 text-green-500 border-green-500` |
| Accent orange | `bg-orange-500 text-orange-500 border-orange-500` |
| Accent pink | `bg-pink-500 text-pink-500 border-pink-500` |
| Segmented control bg | `bg-gray-100 rounded-xl p-1` |
| Segmented control active | `bg-white text-gray-900 shadow-sm` |
| Pill badge | `rounded-full px-3 py-1 text-sm font-semibold` |
| FAB | `w-14 h-14 rounded-full bg-blue-600 text-white shadow-lg` |
| Gray wireframe (inactive) | `border border-gray-200 text-gray-300` |
| Bottom bar | `bg-white border-t border-gray-200` |

## 12. Key Design Decisions

1. **No new "practice" table** — workout plans ARE practices. Each plan's sessions ARE log entries.
2. **Client-side computation first** — derivations from `WorkoutService.sessions()` via Signals. Backend batch processing later if performance requires it.
3. **Light mode only** — KANTN uses light mode. Dark mode can be added later with Tailwind `dark:` variants.
4. **Inter font** — already configured, matches San Francisco clean look.
5. **Material Icons** — already configured, use for all iconography (no custom SVGs needed initially).
6. **No third-party chart library** — the contribution grid is simple colored divs; Chart.js is only for future analytics charts.
7. **Yearly grid horizontal scroll** — the 53-column grid will overflow on mobile. Wrap in a container with `overflow-x-auto no-scrollbar` and a minimum width.
8. **Performance memoization** — `yearlyActivityByPlan` loops over 365 days × N plans. Use `computed` with a stable key (plan count + session count) so Angular only recalculates when data actually changes. Avoid computing heatmaps for plans with zero sessions.
