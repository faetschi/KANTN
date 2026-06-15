import { Component, inject, computed, signal, afterNextRender, viewChild, ElementRef } from '@angular/core';
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

interface ButtonSpark {
  style: Record<string, string>;
  behind: boolean;
}

const BUTTON_SPARKS: ButtonSpark[] = [];

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, PeriodToggleComponent],
  template: `
    <div class="p-6 space-y-6">
      <!-- Header -->
      <header class="flex justify-between items-center">
        <div class="flex items-center gap-3">
          <svg viewBox="0 0 100 100" class="w-8 h-8 shrink-0 drop-shadow-sm">
            <defs>
              <linearGradient id="homeLogoGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#6366f1"/>
                <stop offset="100%" stop-color="#8b5cf6"/>
              </linearGradient>
            </defs>
            <rect width="100" height="100" rx="20" fill="url(#homeLogoGrad)"/>
            <g fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round">
              <rect x="6" y="28" width="12" height="44" rx="3" fill="#fff" stroke="none"/>
              <rect x="14" y="22" width="8" height="56" rx="3" fill="#fff" stroke="none"/>
              <rect x="82" y="28" width="12" height="44" rx="3" fill="#fff" stroke="none"/>
              <rect x="78" y="22" width="8" height="56" rx="3" fill="#fff" stroke="none"/>
              <line x1="20" y1="50" x2="80" y2="50"/>
            </g>
          </svg>
          <div>
            <h1 class="text-2xl font-bold text-gray-900">Today</h1>
            <p class="text-gray-500 text-sm">{{ today | date:'EEEE, d MMMM' }}</p>
          </div>
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
        </div>

        @if (todayWorkout(); as workout) {
          <div class="bg-gradient-to-br from-blue-700 to-indigo-800 text-white p-6 rounded-3xl shadow-lg shadow-indigo-900/30 relative overflow-hidden">
            <!-- Apple-minimal decorative rings -->
            <div class="absolute -top-8 -right-8 w-40 h-40 border border-white/15 rounded-full"></div>
            <div class="absolute top-10 -right-3 w-24 h-24 border border-white/5 rounded-full"></div>
            <div class="absolute -bottom-16 -left-16 w-56 h-56 border border-white/5 rounded-full"></div>
            <div class="absolute bottom-6 left-8 w-2 h-2 bg-white/20 rounded-full"></div>
            <div class="absolute top-1/2 right-12 w-1.5 h-1.5 bg-white/15 rounded-full"></div>
            <!-- Blur depth -->
            <div class="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl"></div>
            <div class="absolute bottom-0 left-0 w-32 h-32 bg-blue-400/10 rounded-full -mb-16 -ml-16 blur-2xl"></div>
            <div class="relative z-10">
              <div class="flex justify-between items-start mb-5">
                <div>
                  <h3 class="text-xl font-bold mb-1">{{ workout.planName }}</h3>
                  <div class="flex items-center gap-2">
                    <span class="inline-flex items-center rounded-full bg-white/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white border border-white/10">
                      <span class="mr-1" aria-hidden="true">{{ scheduledTypeEmoji(workout) }}</span>
                      {{ scheduledTypeLabel(workout) }}
                    </span>
                    <p class="text-blue-200 text-sm">{{ workout.planExercises.length }} Exercises</p>
                  </div>
                </div>
                <div class="bg-white/10 p-2.5 rounded-full backdrop-blur-sm">
                  <mat-icon class="text-white">fitness_center</mat-icon>
                </div>
              </div>
              <div class="relative">
                <!-- Fire-like glow aura around the button -->
                <div class="absolute inset-0 bg-gradient-to-b from-orange-400/15 via-amber-400/10 to-orange-400/15 blur-xl rounded-xl"></div>
                <div class="absolute -inset-2.5 bg-gradient-to-r from-orange-400/10 via-amber-300/15 to-yellow-400/10 blur-2xl rounded-full"></div>
                @for (spark of buttonSparks; track $index) {
                  <div class="absolute rounded-full" [class.-z-10]="spark.behind" [ngStyle]="spark.style"></div>
                }
                <button [routerLink]="['/workout', workout.planId]" [queryParams]="{scheduleId: workout.id}"
                        class="relative w-full bg-white text-blue-600 px-5 py-3 rounded-xl font-semibold text-sm shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150">
                  Start Workout
                </button>
              </div>
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
      <div class="max-w-[350px] mx-auto bg-gradient-to-br from-gray-700 via-gray-800 to-gray-900 text-white p-3 rounded-2xl shadow-lg shadow-gray-200 border border-gray-600/50 relative overflow-hidden">
        <div class="absolute top-0 right-0 w-16 h-16 bg-blue-400/10 rounded-full -mr-6 -mt-6 blur-2xl"></div>
        <div class="relative z-10 flex items-start justify-between gap-2">
          <div>
            <p class="font-semibold text-xs">Freestyle</p>
            <p class="text-[11px] text-gray-300 mt-0.5 leading-tight">Free workout mode without a selected plan.</p>
            <div class="mt-2">
              <button [routerLink]="['/workout', 'freestyle']" class="inline-flex items-center justify-center rounded-lg bg-white text-gray-900 px-2.5 py-1 text-[11px] font-semibold shadow-sm whitespace-nowrap active:scale-95 transition-transform">
                Start Freestyle
              </button>
            </div>
          </div>
          <div class="bg-white/15 p-1.5 rounded-lg backdrop-blur-sm">
            <mat-icon class="text-white text-[16px]" style="font-size:16px;width:16px;height:16px;">fitness_center</mat-icon>
          </div>
        </div>
      </div>

      <!-- Recent Activity -->
      <section #recentActivity
        [class.opacity-0]="!recentActivityVisible()"
        [class.opacity-100]="recentActivityVisible()"
        class="transition-opacity duration-150">
        <div class="flex justify-between items-end mb-4">
          <h2 class="text-lg font-bold text-gray-900">Recent Activity</h2>
          <a routerLink="/history" class="text-blue-600 text-sm font-medium">View History</a>
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

  buttonSparks = BUTTON_SPARKS;

  recentActivityVisible = signal(false);
  private recentActivityEl = viewChild<ElementRef>('recentActivity');

  constructor() {
    afterNextRender(() => {
      const el = this.recentActivityEl();
      if (!el) return;

      if (window.innerWidth >= 768) {
        this.recentActivityVisible.set(true);
        return;
      }

      const observer = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) {
          this.recentActivityVisible.set(true);
          observer.disconnect();
        }
      }, { threshold: 0.05 });

      observer.observe(el.nativeElement);
    });
  }

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
