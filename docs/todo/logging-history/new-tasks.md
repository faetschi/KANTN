# Activity / Logging History Implementation Tasks

## Phase 1: Foundation

- [x] 1.1 Create `src/app/core/models/activity-models.ts` — `ContributionDay`, `WeekDayEntry`, `PlanWeekData`, `PlanYearData`
- [x] 1.2 Create `src/app/core/domain/activity-utils.ts` — streak calculator, intensity mapper, contribution grid builder, plan color hasher
- [x] 1.3 Register `/activity` lazy route in `app.routes.ts`
- [x] 1.4 Create `src/app/core/services/activity.service.ts` — computed signals wrapping `WorkoutService.sessions()`
- [x] 1.5 Create `ContributionGridComponent` — presentational grid component

## Phase 2: Activity Page

- [x] 2.6 Create `PracticeCardComponent` — weekly card with 7-day grid + streak
- [x] 2.7 Create `WeeklyViewComponent` — scrollable list of PracticeCards
- [x] 2.8 Create `YearlyViewComponent` — PracticeCards with ContributionGridComponent per plan
- [x] 2.9 Create `ActivityComponent` — container with Weekly/Yearly segmented control, date pagination

## Phase 3: Profile Integration

- [x] 3.10 Profile streak badge — streak pill below avatar
- [x] 3.11 Profile activity heatmap — compact ContributionGridComponent, clickable
- [x] 3.12 Profile practices sub-section — per-plan mini dot dashboard

## Phase 4: Polish

- [x] 4.13 FAB on activity page
- [x] 4.14 Long-press modal for day details
- [x] 4.15 Animations/transitions
