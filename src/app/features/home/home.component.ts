import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterLink } from '@angular/router';
import { PeriodToggleComponent } from '../../shared/components/period-toggle.component';
import { AuthService } from '../../core/services/auth.service';
import { WorkoutService } from '../../core/services/workout.service';
import { StatsService } from '../../core/services/stats.service';
import { ScheduledWorkout, WorkoutSession } from '../../core/models/models';
import { getScheduledWorkoutType, getWorkoutPlanType, getWorkoutTypeVisual, workoutTypeBadgeStyle, workoutTypeIconStyle, getWorkoutTypeEmoji } from '../../core/domain/workout-types';
import { generateInitialsAvatar } from '../../core/domain/avatar-utils';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, PeriodToggleComponent],
  template: `
    <div class="p-6 space-y-6">
      <!-- Header -->
      <header class="flex justify-between items-center">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Today</h1>
          <p class="text-gray-500 text-sm">{{ today | date:'EEEE, d MMMM' }}</p>
        </div>
        <div class="flex items-center gap-3">
          <button (click)="logout()" class="text-xs font-semibold text-red-500">Log Out</button>
          <a [routerLink]="['/profile']" class="w-10 h-10 rounded-full bg-gray-200 overflow-hidden border-2 border-white shadow-sm cursor-pointer block">
            <img [src]="user()?.avatarUrl || generateInitialsAvatar(user()?.name || 'User')" (error)="onAvatarError($event)" alt="Profile" class="w-full h-full object-cover">
          </a>
        </div>
      </header>

      <section class="grid grid-cols-2 gap-4">
        <div class="flex items-center justify-between col-span-2">
          <app-period-toggle [value]="showPeriod" (valueChange)="onPeriodChange($event)" />
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

      <!-- Today's Scheduled Workout -->
      <section>
        <div class="flex justify-between items-end mb-4">
          <h2 class="text-lg font-bold text-gray-900">Today's Workout</h2>
          <a routerLink="/calendar" class="text-blue-600 text-sm font-medium">Calendar</a>
        </div>

        @if (todayWorkout(); as workout) {
          <div class="bg-gradient-to-br from-blue-700 to-blue-900 text-white p-6 rounded-3xl shadow-xl shadow-blue-900/20 relative overflow-hidden">
            <div class="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
            <div class="relative z-10">
              <div class="flex justify-between items-start mb-4">
                <div>
                  <h3 class="text-xl font-bold mb-1">{{ workout.planName }}</h3>
                  <div class="flex items-center gap-2">
                    <span
                      class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                      [ngStyle]="scheduledTypeBadgeStyle(workout)"
                    >
                      <span class="mr-1" aria-hidden="true">{{ scheduledTypeEmoji(workout) }}</span>
                      {{ scheduledTypeLabel(workout) }}
                    </span>
                    <p class="text-blue-300 text-sm">{{ workout.planExercises.length }} Exercises</p>
                  </div>
                </div>
                <div class="bg-white/10 p-2 rounded-xl backdrop-blur-sm">
                  <mat-icon class="text-white">fitness_center</mat-icon>
                </div>
              </div>
              <button [routerLink]="['/workout', workout.planId]" [queryParams]="{scheduleId: workout.id}"
                      class="w-full bg-white text-slate-800 px-5 py-3 rounded-xl font-bold text-sm shadow-lg active:scale-95 transition-transform">
                Start Workout
              </button>
            </div>
          </div>
        } @else {
          <div class="bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl p-8 text-center">
            <mat-icon class="text-gray-300 text-4xl mb-2" style="font-size:40px;width:40px;height:40px;">calendar_today</mat-icon>
            <p class="text-gray-500 mb-2">No workout scheduled for today</p>
            <a routerLink="/calendar" class="text-blue-600 font-semibold text-sm">Schedule a workout</a>
          </div>
        }
      </section>

      <!-- Freestyle -->
      <div class="bg-gradient-to-br from-gray-700 via-gray-800 to-gray-900 text-white p-4 rounded-2xl shadow-lg shadow-gray-200 border border-gray-600/50 relative overflow-hidden">
        <div class="absolute top-0 right-0 w-24 h-24 bg-blue-400/10 rounded-full -mr-8 -mt-8 blur-2xl"></div>
        <div class="relative z-10 flex items-start justify-between gap-3">
          <div>
            <p class="font-semibold text-sm">Freestyle</p>
            <p class="text-xs text-gray-300 mt-1">Free workout mode without a selected plan.</p>
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

      <!-- Recent Activity -->
      <section>
        <div class="flex justify-between items-end mb-4">
          <h2 class="text-lg font-bold text-gray-900">Recent Activity</h2>
          <a routerLink="/history" class="text-blue-600 text-sm font-medium">View All</a>
        </div>
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
  generateInitialsAvatar = generateInitialsAvatar;

  showPeriod: 'week' | 'month' = 'week';

  onPeriodChange(value: string) {
    if (value === 'week' || value === 'month') {
      this.showPeriod = value;
    }
  }

  currentStats() {
    return this.showPeriod === 'week' ? this.statsService.weeklyStats() : this.statsService.monthlyStats();
  }

  user = this.authService.currentUser;
  todayWorkout = this.workoutService.todayWorkout;
  today = new Date();

  onAvatarError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.src = generateInitialsAvatar(this.user()?.name || 'User');
  }

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
      createdAt: new Date(),
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

  scheduledTypeLabel(sw: ScheduledWorkout) {
    return getWorkoutTypeVisual(getScheduledWorkoutType(sw)).label;
  }

  scheduledTypeBadgeStyle(sw: ScheduledWorkout) {
    return workoutTypeBadgeStyle(getScheduledWorkoutType(sw));
  }

  scheduledTypeEmoji(sw: ScheduledWorkout) {
    return getWorkoutTypeEmoji(getScheduledWorkoutType(sw)) || '';
  }

  sessionIconStyle(session: WorkoutSession) {
    return workoutTypeIconStyle(getWorkoutPlanType(this.workoutService.getPlanById(session.planId)));
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
