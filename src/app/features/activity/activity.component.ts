import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ActivityService } from '../../core/services/activity.service';
import { StatsService } from '../../core/services/stats.service';
import { getWeekStart, formatPeriodLabel, buildContributionGrid, computePlanStreak, countUniqueDays } from '../../core/domain/activity-utils';
import { generateInitialsAvatar } from '../../core/domain/avatar-utils';
import { WeeklyViewComponent } from './weekly-view.component';
import { YearlyViewComponent } from './yearly-view.component';
import { MonthlyViewComponent } from './monthly-view.component';
import { FabButtonComponent } from '../../shared/components/fab-button.component';
import { PeriodToggleComponent } from '../../shared/components/period-toggle.component';

@Component({
  selector: 'app-activity',
  standalone: true,
  imports: [CommonModule, MatIconModule, RouterLink, WeeklyViewComponent, YearlyViewComponent, MonthlyViewComponent, FabButtonComponent, PeriodToggleComponent],
  styles: `
    @keyframes fadeSlideIn {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .view-container.fade-in {
      animation: fadeSlideIn 0.25s ease-out;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(4px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `,
  template: `
    <div class="p-6 pb-28 space-y-6">
      <header class="flex justify-between items-center">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Activity</h1>
          <p class="text-gray-500 text-sm">Keep your streak alive</p>
        </div>
        <div class="flex items-center gap-3">
          <button (click)="logout()" class="text-xs font-semibold text-red-500">Log Out</button>
          <a [routerLink]="['/profile']" class="w-10 h-10 rounded-full bg-gray-200 overflow-hidden border-2 border-white shadow-sm cursor-pointer block">
            <img [src]="user()?.avatarUrl || generateInitialsAvatar(user()?.name || 'User')" (error)="onAvatarError($event)" alt="Profile" class="w-full h-full object-cover">
          </a>
        </div>
      </header>

      <!-- Period Metrics (synced with /home) -->
      <section class="grid grid-cols-2 gap-3">
        <div class="flex items-center justify-between col-span-2">
          <app-period-toggle
            [options]="periodOptions"
            [value]="viewMode()"
            (valueChange)="onViewModeChange($event)"
          />
        </div>
          @for (card of visibleStatsCards(); track statsVersion()) {
            <div class="bg-white p-4 rounded-2xl shadow-sm border border-gray-100" style="animation: fadeIn 0.1s ease-in forwards">
              <div class="flex items-center space-x-2 mb-2" [style.color]="card.color">
                <mat-icon class="text-sm">{{ card.icon }}</mat-icon>
                <span class="text-xs font-semibold uppercase tracking-wider">{{ card.label }}</span>
              </div>
              <p class="text-2xl font-bold text-gray-900">{{ card.value }}</p>
              <p class="text-xs text-gray-400">This {{ periodWord() }}</p>
            </div>
          }
      </section>

      <div class="flex items-center justify-center gap-3">
        <button (click)="previousPeriod()" class="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
          <mat-icon class="text-lg">chevron_left</mat-icon>
        </button>
        <span class="font-bold text-gray-900 text-sm">{{ periodLabel() }}</span>
        <button (click)="nextPeriod()" class="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
          <mat-icon class="text-lg">chevron_right</mat-icon>
        </button>
      </div>

      <div class="view-container pt-2" [class.fade-in]="animateView">
        @switch (viewMode()) {
          @case ('weekly') {
            <app-weekly-view
              [plans]="activityService.plans()"
              [weekData]="weeklyViewData()"
              (cellClick)="onCellClick($event)"
              (cellLongPress)="onCellLongPress($event)"
            />
          }
          @case ('monthly') {
            <app-monthly-view
              [plans]="activityService.plans()"
              [monthData]="monthlyViewData()"
              (cellClick)="onCellClick($event)"
            />
          }
          @case ('yearly') {
            <app-yearly-view
              [plans]="activityService.plans()"
              [yearData]="yearlyViewData()"
            />
          }
        }
      </div>
    </div>

    <!-- FAB -->
    <app-fab-button (fabClick)="goToCreatePlan()" />

    <!-- Long-press Modal -->
    @if (modalData(); as m) {
      <div
        class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 animate-backdrop"
        (click)="closeModal()"
      >
        <div
          class="bg-white w-full max-w-sm rounded-2xl p-5 shadow-lg border border-gray-100 animate-scale-in"
          (click)="$event.stopPropagation()"
        >
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-base font-semibold text-gray-900">{{ m.planName }}</h3>
            <button type="button" (click)="closeModal()" class="text-gray-400 hover:text-gray-600">
              <mat-icon class="text-base">close</mat-icon>
            </button>
          </div>
          <p class="text-sm text-gray-500 mb-3">{{ m.date | date:'fullDate' }}</p>
          @if (m.sessions.length > 0) {
            <div class="space-y-2">
              @for (s of m.sessions; track s.id) {
                <div class="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <span class="text-sm font-semibold text-gray-700">{{ s.exercises.length }} exercises</span>
                  <span class="text-xs text-gray-400">{{ s.duration ? (s.duration / 60 | number:'1.0-0') + ' min' : '' }}</span>
                </div>
              }
            </div>
            <button
              (click)="navigateToHistory(m.date)"
              class="mt-4 w-full py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold"
            >
              View Details
            </button>
          } @else {
            <p class="text-sm text-gray-400">No sessions logged this day.</p>
          }
        </div>
      </div>
    }
  `,
})
export class ActivityComponent {
  authService = inject(AuthService);
  activityService = inject(ActivityService);
  statsService = inject(StatsService);
  router = inject(Router);
  user = this.authService.currentUser;
  generateInitialsAvatar = generateInitialsAvatar;

  viewMode = signal<'weekly' | 'monthly' | 'yearly'>('weekly');
  periodAnchor = signal(new Date());
  animateView = false;
  statsVersion = signal(0);

  visibleStatsCards = computed(() => {
    const s = this.currentStats();
    return [
      { color: '#3b82f6', icon: 'timer', label: 'Minutes', value: Math.round(s.duration / 60) },
      { color: '#f97316', icon: 'local_fire_department', label: 'Calories', value: s.calories },
      { color: '#ef4444', icon: 'fitness_center', label: 'Volume', value: `${Math.round(s.volumeKg)} kg` },
      { color: '#22c55e', icon: 'route', label: 'Distance', value: `${(s.distanceMeters / 1000).toFixed(2)} km` },
      { color: '#10b981', icon: 'done_all', label: 'Workouts', value: s.count },
    ];
  });
  periodOptions = [
    { label: 'Week', value: 'weekly' },
    { label: 'Month', value: 'monthly' },
    { label: 'Year', value: 'yearly' },
  ];
  modalData = signal<{
    date: string;
    planId: string;
    planName: string;
    sessions: import('../../core/models/models').WorkoutSession[];
  } | null>(null);

  periodStart = computed(() => {
    const anchor = this.periodAnchor();
    if (this.viewMode() === 'yearly') {
      return new Date(anchor.getFullYear(), 0, 1);
    }
    if (this.viewMode() === 'monthly') {
      return new Date(anchor.getFullYear(), anchor.getMonth(), 1);
    }
    return getWeekStart(anchor);
  });

  periodLabel = computed(() => formatPeriodLabel(this.periodStart(), this.viewMode()));

  periodWord = computed(() => {
    if (this.viewMode() === 'weekly') return 'week';
    if (this.viewMode() === 'monthly') return 'month';
    return 'year';
  });

  weeklyViewData = computed(() => {
    const weekStart = this.periodStart();
    return this.activityService.buildWeeklyData(weekStart);
  });

  monthlyViewData = computed(() => {
    const monthStart = this.periodStart();
    return this.activityService.buildMonthlyData(monthStart);
  });

  yearlyViewData = computed(() => {
    const year = this.periodAnchor().getFullYear();
    const now = new Date();
    const endDate = (year === now.getFullYear()) ? now : new Date(year, 11, 31);
    const sessions = this.activityService.sessions();
    return this.activityService.plans()
      .filter(p => sessions.some(s => s.planId === p.id))
      .map(plan => ({
        planId: plan.id,
        contributions: buildContributionGrid(sessions, 365, plan.id, endDate),
        streak: computePlanStreak(sessions, plan.id),
        totalActiveDays: countUniqueDays(sessions, plan.id),
      }));
  });

  previousPeriod() {
    const d = this.periodAnchor();
    if (this.viewMode() === 'yearly') {
      this.periodAnchor.set(new Date(d.getFullYear() - 1, 0, 1));
    } else if (this.viewMode() === 'monthly') {
      this.periodAnchor.set(new Date(d.getFullYear(), d.getMonth() - 1, 1));
    } else {
      const newDate = new Date(d);
      newDate.setDate(newDate.getDate() - 7);
      this.periodAnchor.set(newDate);
    }
  }

  nextPeriod() {
    const d = this.periodAnchor();
    if (this.viewMode() === 'yearly') {
      this.periodAnchor.set(new Date(d.getFullYear() + 1, 0, 1));
    } else if (this.viewMode() === 'monthly') {
      this.periodAnchor.set(new Date(d.getFullYear(), d.getMonth() + 1, 1));
    } else {
      const newDate = new Date(d);
      newDate.setDate(newDate.getDate() + 7);
      this.periodAnchor.set(newDate);
    }
  }

  onViewModeChange(mode: string) {
    if (mode !== 'weekly' && mode !== 'monthly' && mode !== 'yearly') return;
    this.viewMode.set(mode);
    this.periodAnchor.set(new Date());
    this.animateView = true;
    this.statsVersion.update(v => v + 1);
    setTimeout(() => this.animateView = false, 300);
  }

  currentStats() {
    if (this.viewMode() === 'weekly') return this.statsService.weeklyStats();
    if (this.viewMode() === 'monthly') return this.statsService.monthlyStats();
    return this.statsService.yearlyStats();
  }

  private formatLocalDate(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  onCellClick(event: { planId: string; date: Date }) {
    this.onCellLongPress(event);
  }

  onCellLongPress(event: { planId: string; date: Date }) {
    const dateStr = this.formatLocalDate(event.date);
    const plan = this.activityService.getPlanById(event.planId);
    const sessions = this.activityService.sessions().filter(s => {
      const d = new Date(s.date);
      return this.formatLocalDate(d) === dateStr && s.planId === event.planId;
    });
    this.modalData.set({
      date: dateStr,
      planId: event.planId,
      planName: plan?.name || 'Unknown Plan',
      sessions,
    });
  }

  closeModal() {
    this.modalData.set(null);
  }

  navigateToHistory(dateStr: string) {
    this.closeModal();
    this.router.navigate(['/history'], { queryParams: { date: dateStr } });
  }

  goToCreatePlan() {
    this.router.navigate(['/plans/create']);
  }

  onAvatarError(event: Event) {
    const img = event.target as HTMLImageElement;
    if (img) {
      img.src = generateInitialsAvatar(this.user()?.name || 'User');
    }
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
