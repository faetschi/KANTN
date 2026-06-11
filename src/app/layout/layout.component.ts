import { Component, inject, signal, computed, DestroyRef } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NotificationOutletComponent } from '../shared/components/notification-outlet.component';
import { WorkoutService } from '../core/services/workout.service';
import { ScheduledWorkout } from '../core/models/models';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, MatIconModule, NotificationOutletComponent],
  template: `
    <div class="flex flex-col min-h-screen bg-gray-50 text-gray-900 font-sans">
      <!-- Scheduled workout reminder banner -->
      @if (showReminderBanner() && reminderWorkout(); as reminder) {
        <div class="bg-blue-600 text-white px-4 py-3 flex items-center justify-between gap-3 text-sm shadow-md z-50">
          <div class="flex items-center gap-2 min-w-0">
            <mat-icon class="text-white shrink-0" style="font-size:18px;width:18px;height:18px;">notifications_active</mat-icon>
            <span class="truncate font-medium">{{ reminder.planName }} is due soon</span>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <a [routerLink]="['/workout', reminder.planId]" [queryParams]="{scheduleId: reminder.id}"
               class="bg-white text-blue-700 px-3 py-1.5 rounded-xl font-semibold text-xs whitespace-nowrap">
              Start
            </a>
            <button (click)="dismissReminder()" class="text-blue-200 hover:text-white" aria-label="Dismiss reminder">
              <mat-icon style="font-size:18px;width:18px;height:18px;">close</mat-icon>
            </button>
          </div>
        </div>
      }

      <main [class.pb-20]="currentRoute() !== '/pending'" class="flex-1">
        <router-outlet></router-outlet>
      </main>

      <app-notification-outlet />

      @if (currentRoute() !== '/pending') {
      <div class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-pb">
        <nav class="px-8 pt-3 pb-3 flex justify-around items-center">
          <a routerLink="/home" routerLinkActive="text-blue-600 active" [routerLinkActiveOptions]="{exact: true}" class="flex flex-col items-center text-gray-400 transition-colors duration-200">
            <mat-icon class="mb-1 text-current">home</mat-icon>
            <span class="text-[10px] font-medium">Home</span>
          </a>
          <a routerLink="/plans" routerLinkActive="text-blue-600 active" class="flex flex-col items-center text-gray-400 transition-colors duration-200">
            <mat-icon class="mb-1 text-current">fitness_center</mat-icon>
            <span class="text-[10px] font-medium">Plans</span>
          </a>
          <a routerLink="/calendar" routerLinkActive="text-blue-600 active" class="flex flex-col items-center text-gray-400 transition-colors duration-200">
            <mat-icon class="mb-1 text-current">calendar_month</mat-icon>
            <span class="text-[10px] font-medium">Calendar</span>
          </a>
        </nav>
      </div>
      }
    </div>
  `,
  styles: [
    `a mat-icon { color: inherit; }
     a.active mat-icon, a.text-blue-600 mat-icon { color: #2563eb; }    `
  ],
})
export class LayoutComponent {
  private workoutService = inject(WorkoutService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private dismissedKey = 'opencode_reminder_dismissed';

  protected currentRoute = signal('');

  showReminder = signal(true);

  constructor() {
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(e => {
      this.currentRoute.set(e.urlAfterRedirects);
    });
  }

  reminderWorkout = computed<ScheduledWorkout | null>(() => {
    const nearest = this.workoutService.nearestScheduledWorkout();
    if (!nearest) return null;

    const now = Date.now();
    const schedTime = new Date(nearest.scheduledDate).getTime();
    const diffMs = schedTime - now;

    // Show if within 2 hours before or 1 hour after the scheduled time
    if (diffMs > 2 * 60 * 60 * 1000 || diffMs < -1 * 60 * 60 * 1000) {
      return null;
    }

    // Check dismissed state
    const dismissed = this.getDismissed(nearest.id);
    if (dismissed) return null;

    return nearest;
  });

  showReminderBanner = computed(() => this.showReminder() && !!this.reminderWorkout());

  dismissReminder() {
    const workout = this.reminderWorkout();
    if (workout) {
      this.setDismissed(workout.id);
    }
    this.showReminder.set(false);
  }

  private getDismissed(id: string): boolean {
    try {
      const stored = localStorage.getItem(this.dismissedKey);
      if (!stored) return false;
      const ids: string[] = JSON.parse(stored);
      return ids.includes(id);
    } catch {
      return false;
    }
  }

  private setDismissed(id: string) {
    try {
      const stored = localStorage.getItem(this.dismissedKey);
      const ids: string[] = stored ? JSON.parse(stored) : [];
      if (!ids.includes(id)) {
        ids.push(id);
        localStorage.setItem(this.dismissedKey, JSON.stringify(ids));
      }
    } catch {
      // ignore
    }
  }
}
