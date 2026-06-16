import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ActivityService } from '../../core/services/activity.service';
import { getWeekStart, formatPeriodLabel } from '../../core/domain/activity-utils';
import { generateInitialsAvatar } from '../../core/domain/avatar-utils';
import { WeeklyViewComponent } from './weekly-view.component';
import { YearlyViewComponent } from './yearly-view.component';
import { FabButtonComponent } from '../../shared/components/fab-button.component';

@Component({
  selector: 'app-activity',
  standalone: true,
  imports: [CommonModule, MatIconModule, RouterLink, WeeklyViewComponent, YearlyViewComponent, FabButtonComponent],
  styles: `
    @keyframes fadeSlideIn {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .view-container.fade-in {
      animation: fadeSlideIn 0.25s ease-out;
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

      <!-- Stats Summary -->
      <div class="grid grid-cols-3 gap-3 stagger">
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 flex flex-col gap-2">
          <div class="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <mat-icon class="text-lg">done_all</mat-icon>
          </div>
          <div>
            <p class="text-xl font-bold text-gray-900 leading-none">{{ activityService.totalContributions() }}</p>
            <p class="text-[11px] text-gray-400 mt-1">Total Workouts</p>
          </div>
        </div>
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 flex flex-col gap-2">
          <div class="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <mat-icon class="text-lg">fitness_center</mat-icon>
          </div>
          <div>
            <p class="text-xl font-bold text-blue-600 leading-none">{{ activityService.strengthSessionCount() }}</p>
            <p class="text-[11px] text-gray-400 mt-1">Strength</p>
          </div>
        </div>
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 flex flex-col gap-2">
          <div class="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
            <mat-icon class="text-lg">directions_run</mat-icon>
          </div>
          <div>
            <p class="text-xl font-bold text-orange-600 leading-none">{{ activityService.cardioSessionCount() }}</p>
            <p class="text-[11px] text-gray-400 mt-1">Cardio</p>
          </div>
        </div>
      </div>

      <div class="flex items-center gap-2 bg-gray-100 rounded-xl p-1 w-fit">
        <button
          (click)="onViewModeChange('weekly')"
          class="px-4 py-1.5 rounded-lg text-sm font-semibold transition-all"
          [class.bg-white]="viewMode() === 'weekly'"
          [class.text-gray-900]="viewMode() === 'weekly'"
          [class.shadow-sm]="viewMode() === 'weekly'"
          [class.text-gray-500]="viewMode() !== 'weekly'"
        >Weekly</button>
        <button
          (click)="onViewModeChange('yearly')"
          class="px-4 py-1.5 rounded-lg text-sm font-semibold transition-all"
          [class.bg-white]="viewMode() === 'yearly'"
          [class.text-gray-900]="viewMode() === 'yearly'"
          [class.shadow-sm]="viewMode() === 'yearly'"
          [class.text-gray-500]="viewMode() !== 'yearly'"
        >Yearly</button>
      </div>

      <div class="flex items-center justify-center gap-3">
        <button (click)="previousPeriod()" class="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
          <mat-icon class="text-lg">chevron_left</mat-icon>
        </button>
        <span class="font-bold text-gray-900 text-sm">{{ periodLabel() }}</span>
        <button (click)="nextPeriod()" class="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
          <mat-icon class="text-lg">chevron_right</mat-icon>
        </button>
      </div>

      <div class="flex justify-center">
        <span class="inline-flex items-center gap-1.5 text-[11px] font-medium text-gray-400 bg-gray-100 rounded-full px-3 py-1">
          <mat-icon class="text-[13px]" style="font-size:13px;width:13px;height:13px;">touch_app</mat-icon>
          Tap to log · Long-press for detail
        </span>
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
          @case ('yearly') {
            <app-yearly-view
              [plans]="activityService.plans()"
              [yearData]="activityService.yearlyData()"
              (cellClick)="onCellClick($event)"
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
                  <div class="flex items-center gap-2">
                    <mat-icon class="text-sm text-gray-400">fitness_center</mat-icon>
                    <span class="text-sm font-medium text-gray-700">{{ s.exercises.length }} exercises</span>
                  </div>
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
  router = inject(Router);
  user = this.authService.currentUser;
  generateInitialsAvatar = generateInitialsAvatar;

  viewMode = signal<'weekly' | 'yearly'>('weekly');
  periodAnchor = signal(new Date());
  animateView = false;
  modalData = signal<{
    date: string;
    planId: string;
    planName: string;
    sessions: import('../../core/models/models').WorkoutSession[];
  } | null>(null);

  periodStart = computed(() => {
    if (this.viewMode() === 'yearly') {
      return new Date(this.periodAnchor().getFullYear(), 0, 1);
    }
    return getWeekStart(this.periodAnchor());
  });

  periodLabel = computed(() => formatPeriodLabel(this.periodStart(), this.viewMode()));

  weeklyViewData = computed(() => {
    const weekStart = this.periodStart();
    return this.activityService.buildWeeklyData(weekStart);
  });

  previousPeriod() {
    const d = this.periodAnchor();
    if (this.viewMode() === 'yearly') {
      this.periodAnchor.set(new Date(d.getFullYear() - 1, 0, 1));
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
    } else {
      const newDate = new Date(d);
      newDate.setDate(newDate.getDate() + 7);
      this.periodAnchor.set(newDate);
    }
  }

  onViewModeChange(mode: 'weekly' | 'yearly') {
    this.viewMode.set(mode);
    this.animateView = true;
    setTimeout(() => this.animateView = false, 300);
  }

  onCellClick(event: { planId: string; date: Date }) {
    // Tap to log: start the workout flow for this plan
    this.router.navigate(['/workout', event.planId]);
  }

  onCellLongPress(event: { planId: string; date: Date }) {
    const dateStr = event.date.toISOString().slice(0, 10);
    const plan = this.activityService.getPlanById(event.planId);
    const sessions = this.activityService.sessions().filter(s => {
      const d = new Date(s.date);
      return d.toISOString().slice(0, 10) === dateStr && s.planId === event.planId;
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
