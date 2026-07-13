import { Injectable, computed, inject } from '@angular/core';
import { WorkoutService } from './workout.service';
import { WorkoutPlan } from '../models/models';
import { ContributionDay, PlanWeekData, PlanYearData } from '../models/activity-models';
import {
  computeOverallStreak,
  computePlanStreak,
  countUniqueDays,
  buildContributionGrid,
  buildMonthContributionGrid,
  buildWeekData,
  getWeekStart,
} from '../domain/activity-utils';

@Injectable({
  providedIn: 'root'
})
export class ActivityService {
  private workoutService = inject(WorkoutService);

  plans = computed(() => this.workoutService.plans());
  sessions = computed(() => this.workoutService.sessions());
  planIds = computed(() => this.plans().map(p => p.id));

  overallStreak = computed(() => computeOverallStreak(this.sessions()));

  planStreaks = computed<Map<string, number>>(() => {
    const map = new Map<string, number>();
    const sessions = this.sessions();
    for (const planId of this.planIds()) {
      map.set(planId, computePlanStreak(sessions, planId));
    }
    return map;
  });

  totalContributions = computed(() => this.sessions().length);

  totalActiveDays = computed(() => countUniqueDays(this.sessions()));

  strengthSessionCount = computed(() => {
    const plans = this.plans();
    const strengthCategories = new Set(['upper body', 'lower body', 'core', 'mobility', 'full body']);
    const strengthPlanIds = new Set(plans.filter(p => p.category && strengthCategories.has(p.category)).map(p => p.id));
    return this.sessions().filter(s => strengthPlanIds.has(s.planId)).length;
  });

  cardioSessionCount = computed(() => {
    const plans = this.plans();
    const cardioCategories = new Set(['running', 'cycling', 'swimming', 'hiking']);
    const cardioPlanIds = new Set(plans.filter(p => p.category && cardioCategories.has(p.category)).map(p => p.id));
    return this.sessions().filter(s => cardioPlanIds.has(s.planId)).length;
  });

  activeDaysByPlan = computed<Map<string, number>>(() => {
    const map = new Map<string, number>();
    const sessions = this.sessions();
    for (const planId of this.planIds()) {
      map.set(planId, countUniqueDays(sessions, planId));
    }
    return map;
  });

  aggregateYearlyActivity = computed<ContributionDay[]>(() => {
    return buildContributionGrid(this.sessions(), 365);
  });

  yearlyData = computed<PlanYearData[]>(() => {
    const sessions = this.sessions();
    return this.plans()
      .filter(p => sessions.some(s => s.planId === p.id))
      .map(plan => ({
        planId: plan.id,
        contributions: buildContributionGrid(sessions, 365, plan.id),
        streak: computePlanStreak(sessions, plan.id),
        totalActiveDays: countUniqueDays(sessions, plan.id),
      }));
  });

  weeklyData = computed<PlanWeekData[]>(() => {
    const sessions = this.sessions();
    const weekStart = getWeekStart();
    return this.plans()
      .filter(p => sessions.some(s => s.planId === p.id))
      .map(plan => {
        const days = buildWeekData(sessions, weekStart, plan);
        return {
          planId: plan.id,
          days,
          streak: computePlanStreak(sessions, plan.id),
          totalActiveDays: countUniqueDays(sessions, plan.id),
        };
      });
  });

  buildWeeklyData(weekStart: Date): PlanWeekData[] {
    const sessions = this.sessions();
    return this.plans()
      .filter(p => sessions.some(s => s.planId === p.id))
      .map(plan => {
        const days = buildWeekData(sessions, weekStart, plan);
        return {
          planId: plan.id,
          days,
          streak: computePlanStreak(sessions, plan.id),
          totalActiveDays: countUniqueDays(sessions, plan.id),
        };
      });
  }

  buildMonthlyData(monthStart: Date): PlanYearData[] {
    const sessions = this.sessions();
    return this.plans()
      .filter(p => sessions.some(s => s.planId === p.id))
      .map(plan => ({
        planId: plan.id,
        contributions: buildMonthContributionGrid(sessions, monthStart, plan.id),
        streak: computePlanStreak(sessions, plan.id),
        totalActiveDays: countUniqueDays(sessions, plan.id),
      }));
  }

  getPlanById(id: string): WorkoutPlan | undefined {
    return this.workoutService.getPlanById(id);
  }
}
