import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { WorkoutService } from '../../core/services/workout.service';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  template: `
    <div class="p-6 pb-24 space-y-6">
      <header>
        <h1 class="text-2xl font-bold text-gray-900">Workout History</h1>
        <p class="text-gray-500 text-sm">All your completed workouts</p>
      </header>

      <section class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <label for="month-filter" class="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Month</label>
        <select
          id="month-filter"
          [(ngModel)]="selectedMonth"
          class="w-full bg-gray-50 border-none rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All months</option>
          @for (option of monthOptions(); track option.value) {
            <option [value]="option.value">{{ option.label }}</option>
          }
        </select>
      </section>

      <section class="space-y-4">
        @if (inProgress(); as current) {
          <article class="bg-yellow-50 rounded-2xl shadow-sm border border-yellow-100 overflow-hidden">
            <button type="button" (click)="resumeInProgress()" class="w-full p-4 flex items-center justify-between text-left">
              <div class="flex items-center space-x-4">
                <div class="w-12 h-12 rounded-xl bg-yellow-100 text-yellow-700 flex items-center justify-center">
                  <mat-icon>pause</mat-icon>
                </div>
                <div>
                  <h3 class="font-semibold text-gray-900">Paused: {{ getPlanName(current.planId) }}</h3>
                  <p class="text-xs text-gray-500">
                    Paused at {{ (current.elapsedTime || 0) | number:'1.0-0' }}s • 
                    {{ current.startTime | date:'MMM d, y, h:mm a' }}
                  </p>
                </div>
              </div>
              <div class="text-right flex items-center gap-3">
                <button class="px-3 py-1.5 rounded-lg bg-white text-blue-600 font-semibold">Resume</button>
                <mat-icon class="text-gray-400">chevron_right</mat-icon>
              </div>
            </button>
          </article>
        }

        @for (session of filteredSessions(); track session.id) {
          <article class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <button
              type="button"
              (click)="openSession(session.id)"
              class="w-full p-4 flex items-center justify-between text-left"
            >
              <div class="flex items-center space-x-4">
                <div class="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <mat-icon>history</mat-icon>
                </div>
                <div>
                  <h3 class="font-semibold text-gray-900">{{ getPlanName(session.planId) }}</h3>
                  <p class="text-xs text-gray-500">{{ session.date | date:'MMM d, y, h:mm a' }}</p>
                  <p class="text-xs text-gray-400">{{ ((session.duration || 0) / 60) | number:'1.0-0' }} min</p>
                </div>
              </div>
              <div class="text-right flex items-center gap-3">
                <div>
                  <p class="font-bold text-gray-900">{{ session.caloriesBurned || 0 }}</p>
                  <p class="text-[10px] text-gray-400 uppercase">Kcal</p>
                </div>
                <mat-icon class="text-gray-400">chevron_right</mat-icon>
              </div>
            </button>
          </article>
        }

        @if (filteredSessions().length === 0) {
          <p class="text-gray-400 text-center py-8">No workouts found for selected month.</p>
        }
      </section>
    </div>
  `
})
export class HistoryComponent {
  private workoutService = inject(WorkoutService);
  private router = inject(Router);

  selectedMonth = 'all';

  inProgress = computed(() => this.workoutService.inProgress());

  private sortedSessions = computed(() =>
    [...this.workoutService.sessions()].sort((a, b) => b.date.getTime() - a.date.getTime())
  );

  monthOptions = computed(() => {
    const seen = new Set<string>();
    const options: { value: string; label: string }[] = [];

    for (const session of this.sortedSessions()) {
      const value = this.toMonthKey(session.date);
      if (!seen.has(value)) {
        seen.add(value);
        options.push({ value, label: this.toMonthLabel(session.date) });
      }
    }

    return options;
  });

  filteredSessions = computed(() => {
    const selected = this.selectedMonth;
    if (selected === 'all') return this.sortedSessions();
    return this.sortedSessions().filter(session => this.toMonthKey(session.date) === selected);
  });

  // planId als optionalen Typ akzeptieren, um TS-Fehler zu vermeiden
  getPlanName(planId: string | null | undefined) {
    if (!planId) return 'Workout Session';
    return this.workoutService.getPlanById(planId)?.name || 'Workout Session';
  }

  openSession(sessionId: string) {
    void this.router.navigate(['/history', sessionId]);
  }

  resumeInProgress() {
    const p = this.inProgress();
    if (!p) return;
    void this.router.navigate(['/workout', p.planId || 'freestyle']);
  }

  private toMonthKey(date: Date) {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    return `${year}-${month}`;
  }

  private toMonthLabel(date: Date) {
    return new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' }).format(date);
  }
}