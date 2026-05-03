import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/services/auth.service';
import { WorkoutService } from '../../core/services/workout.service';
import { StatsService } from '../../core/services/stats.service';
import { WorkoutPlan, WorkoutSession } from '../../core/models/models';
import { getWorkoutPlanType, getWorkoutTypeVisual, workoutTypeBadgeStyle, workoutTypeIconStyle } from '../../core/domain/workout-types';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule],
  template: `
    <div class="p-6 space-y-8">
      <!-- Header -->
      <header class="flex justify-between items-center">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Today</h1>
          <p class="text-gray-500 text-sm">{{ today | date:'EEEE, d MMMM' }}</p>
        </div>
        <div class="flex items-center gap-3">
          <button (click)="logout()" class="text-xs font-semibold text-red-500">Log Out</button>
          <div class="w-10 h-10 rounded-full bg-gray-200 overflow-hidden border-2 border-white shadow-sm">
            <img [src]="user()?.avatarUrl" alt="Profile" class="w-full h-full object-cover">
          </div>
        </div>
      </header>

      <!-- Weekly/Monthly Stats Toggle -->
      <section class="grid grid-cols-2 gap-4">
        <div class="flex items-center justify-between col-span-2">
          <div class="flex items-center gap-2">
            <div class="text-sm text-gray-600">Show:</div>
            <button (click)="showPeriod='week'" [class.font-semibold]="showPeriod==='week'" class="px-3 py-1 rounded-full bg-gray-100">Week</button>
            <button (click)="showPeriod='month'" [class.font-semibold]="showPeriod==='month'" class="px-3 py-1 rounded-full bg-gray-100">Month</button>
          </div>
          <a routerLink="/calendar" class="text-blue-600 text-xs font-semibold flex items-center gap-1">
            <mat-icon class="text-xs">calendar_month</mat-icon>
            Calendar
          </a>
        </div>

        <div class="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <div class="flex items-center space-x-2 mb-2 text-orange-500">
            <mat-icon class="text-sm">local_fire_department</mat-icon>
            <span class="text-xs font-semibold uppercase tracking-wider">Calories</span>
          </div>
          <p class="text-2xl font-bold text-gray-900">{{ currentStats().calories }}</p>
          <p class="text-xs text-gray-400">This {{ showPeriod === 'week' ? 'week' : 'month' }}</p>
        </div>
        <div class="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <div class="flex items-center space-x-2 mb-2 text-blue-500">
            <mat-icon class="text-sm">timer</mat-icon>
            <span class="text-xs font-semibold uppercase tracking-wider">Minutes</span>
          </div>
          <p class="text-2xl font-bold text-gray-900">{{ (currentStats().duration / 60) | number:'1.0-0' }}</p>
          <p class="text-xs text-gray-400">This {{ showPeriod === 'week' ? 'week' : 'month' }}</p>
        </div>
      </section>

      <!-- Active Plan -->
      <section>
        <div class="flex justify-between items-end mb-4">
          <h2 class="text-lg font-bold text-gray-900">Active Plan</h2>
          <a routerLink="/plans" class="text-blue-600 text-sm font-medium">Change</a>
        </div>

        @if (activePlan(); as plan) {
          <div class="bg-gray-900 text-white p-6 rounded-3xl shadow-xl shadow-gray-200 relative overflow-hidden group">
            <div class="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-2xl"></div>
            
            <div class="relative z-10">
              <div class="flex justify-between items-start mb-6">
                <div>
                  <h3 class="text-xl font-bold mb-1">{{ plan.name }}</h3>
                  <div class="flex items-center gap-2 mb-1">
                    @if (plan.category) {
                      <span class="inline-flex items-center rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-white backdrop-blur-sm">
                        {{ plan.category }}
                      </span>
                    }
                    <span
                      class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                      [ngStyle]="typeBadgeStyle(plan)"
                    >
                      {{ typeLabel(plan) }}
                    </span>
                    <p class="text-gray-400 text-sm">{{ plan.exercises.length }} Exercises</p>
                  </div>
                </div>
                <div class="bg-white/10 p-2 rounded-xl backdrop-blur-sm">
                  <mat-icon class="text-white">fitness_center</mat-icon>
                </div>
              </div>

              <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div class="inline-flex w-fit items-center rounded-full bg-white/10 px-3 py-1.5 text-sm text-gray-200 backdrop-blur-sm whitespace-nowrap">
                  @if (plan.lastPerformed) {
                    Last: {{ plan.lastPerformed | date:'MMM d' }}
                  } @else {
                    Not started yet
                  }
                </div>
                <div class="w-full sm:w-auto">
                  <button [routerLink]="['/workout', plan.id]" class="w-full bg-white text-gray-900 px-5 py-2.5 rounded-xl font-semibold text-sm shadow-lg active:scale-95 transition-transform flex items-center justify-center whitespace-nowrap">
                    {{ workoutService.hasInProgressForPlan(plan.id) ? 'Continue' : 'Start Workout' }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        } @else {
          <div class="bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl p-8 text-center">
            <p class="text-gray-500 mb-4">No active plan selected</p>
            <div class="flex items-center justify-center">
              <a routerLink="/plans" class="text-blue-600 font-semibold">Browse Plans</a>
            </div>
          </div>
        }

        <div
          class="mt-4 w-full text-left bg-gray-800 text-white p-4 rounded-2xl shadow-lg shadow-gray-200 border border-gray-700/70 relative overflow-hidden"
        >
          <div class="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-8 -mt-8 blur-2xl"></div>
          <div class="relative z-10 flex items-start justify-between gap-3">
            <div>
              <p class="font-semibold text-sm">Freestyle</p>
              <p class="text-xs text-gray-200 mt-1">Free workout mode without a selected plan.</p>
              <div class="mt-3">
                <button [routerLink]="['/workout', 'freestyle']" class="inline-flex items-center justify-center rounded-lg bg-white text-gray-900 px-3 py-1.5 text-xs font-semibold shadow-sm whitespace-nowrap active:scale-95 transition-transform">
                  Start Freestyle Workout
                </button>
              </div>
            </div>
            <div class="bg-white/15 p-2 rounded-lg backdrop-blur-sm">
              <mat-icon class="text-white text-[20px]">fitness_center</mat-icon>
            </div>
          </div>
        </div>
      </section>

      <!-- Recent Activity -->
      <section>
        <h2 class="text-lg font-bold text-gray-900 mb-4">Recent Activity</h2>
        <div class="space-y-4">
          @for (session of recentSessions(); track session.id) {
            <div class="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
              <div class="flex items-center space-x-4">
                @if (session.id === 'in-progress') {
                  <div class="w-12 h-12 rounded-xl bg-yellow-50 text-yellow-700 flex items-center justify-center">
                    <mat-icon>pause</mat-icon>
                  </div>
                } @else {
                  <div class="w-12 h-12 rounded-xl flex items-center justify-center" [ngStyle]="sessionIconStyle(session)">
                    <mat-icon>check_circle</mat-icon>
                  </div>
                }
                <div>
                  <h4 class="font-semibold text-gray-900">{{ getPlanName(session.planId) }}</h4>
                  <p class="text-xs text-gray-500">{{ session.date | date:'MMM d, h:mm a' }} • {{ (session.duration || 0) / 60 | number:'1.0-0' }} min</p>
                </div>
              </div>
              @if (session.id === 'in-progress') {
                <div class="text-right">
                  <button (click)="resumeInProgress()" class="px-3 py-1.5 rounded-lg bg-white text-blue-600 font-semibold">Resume</button>
                </div>
              } @else {
                <div class="text-right">
                  <p class="font-bold text-gray-900">{{ session.caloriesBurned }}</p>
                  <p class="text-[10px] text-gray-400 uppercase">Kcal</p>
                </div>
              }
            </div>
          }
          @if (recentSessions().length === 0) {
            <p class="text-gray-400 text-center py-4">No recent activity</p>
          }
        </div>
      </section>
    </div>
  `
})
export class HomeComponent {
  authService = inject(AuthService);
  workoutService = inject(WorkoutService);
  statsService = inject(StatsService);
  router = inject(Router);

  showPeriod: 'week' | 'month' = 'week';

  currentStats() {
    return this.showPeriod === 'week' ? this.statsService.weeklyStats() : this.statsService.monthlyStats();
  }

  user = this.authService.currentUser;
  activePlan = this.workoutService.activePlan;
  today = new Date();

  inProgress = computed(() => this.workoutService.inProgress());

  recentSessions = computed(() => {
    const sessions = this.workoutService.sessions()
      .slice()
      .sort((a, b) => b.date.getTime() - a.date.getTime());

    const inP = this.inProgress();
    if (!inP) return sessions.slice(0, 5);

    const pseudoSession = {
      id: 'in-progress',
      planId: inP.planId,
      date: inP.startTime ? new Date(inP.startTime) : new Date(),
      duration: inP.elapsedTime || 0,
      caloriesBurned: 0
    } as WorkoutSession;

    const combined = [pseudoSession, ...sessions];
    combined.sort((a, b) => b.date.getTime() - a.date.getTime());
    return combined.slice(0, 5);
  });

  resumeInProgress() {
    const p = this.inProgress();
    if (!p) return;
    void this.router.navigate(['/workout', p.planId || 'freestyle']);
  }

  getPlanName(planId: string) {
    if (!planId) return 'Freestyle';
    return this.workoutService.getPlanById(planId)?.name || 'Unknown Plan';
  }

  typeLabel(plan: WorkoutPlan) {
    return getWorkoutTypeVisual(getWorkoutPlanType(plan)).label;
  }

  typeBadgeStyle(plan: WorkoutPlan) {
    return workoutTypeBadgeStyle(getWorkoutPlanType(plan));
  }

  sessionIconStyle(session: WorkoutSession) {
    return workoutTypeIconStyle(getWorkoutPlanType(this.workoutService.getPlanById(session.planId)));
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
