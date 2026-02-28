import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { WorkoutService } from '../../core/services/workout.service';
import { WorkoutSession } from '../../core/models/models';

@Component({
  selector: 'app-history-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule],
  template: `
    <div class="p-6 pb-24 space-y-6">
      <header class="flex items-center gap-3">
        <button routerLink="/history" class="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Workout Details</h1>
          <p class="text-gray-500 text-sm">Session summary and set details</p>
        </div>
      </header>

      @if (session(); as workoutSession) {
        <section class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-2">
          <h2 class="text-lg font-bold text-gray-900">{{ getPlanName(workoutSession.planId) }}</h2>
          <p class="text-sm text-gray-500">{{ workoutSession.date | date:'MMM d, y, h:mm a' }}</p>
          <div class="grid grid-cols-2 gap-3 pt-2">
            <div class="bg-gray-50 rounded-xl p-3">
              <p class="text-[10px] uppercase tracking-wider text-gray-500">Duration</p>
              <p class="text-lg font-semibold text-gray-900">{{ ((workoutSession.duration || 0) / 60) | number:'1.0-0' }} min</p>
            </div>
            <div class="bg-gray-50 rounded-xl p-3">
              <p class="text-[10px] uppercase tracking-wider text-gray-500">Calories</p>
              <p class="text-lg font-semibold text-gray-900">{{ workoutSession.caloriesBurned || 0 }} kcal</p>
            </div>
          </div>

          <div class="pt-2 flex items-center justify-between gap-3">
            <button
              type="button"
              (click)="openPreviousSession()"
              [disabled]="!previousSessionId()"
              class="px-3 py-2 rounded-xl bg-gray-100 text-gray-700 text-sm font-semibold disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              (click)="openNextSession()"
              [disabled]="!nextSessionId()"
              class="px-3 py-2 rounded-xl bg-gray-100 text-gray-700 text-sm font-semibold disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </section>

        <section class="space-y-3">
          @for (exerciseSession of workoutSession.exercises; track $index) {
            <article class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <h3 class="font-semibold text-gray-900 mb-3">{{ getExerciseName(workoutSession, exerciseSession.exerciseId, $index) }}</h3>

              <div class="space-y-2">
                @for (set of exerciseSession.sets; track $index) {
                  <div class="grid grid-cols-[auto_1fr_auto] gap-3 items-center rounded-xl border border-gray-100 px-3 py-2">
                    <span class="text-xs text-gray-500">Set {{ $index + 1 }}</span>
                    <span class="text-sm text-gray-700">{{ set.weight }} kg × {{ set.reps }} reps</span>
                    <span
                      class="px-2 py-1 rounded-full text-[10px] font-semibold"
                      [class.bg-green-100]="set.completed"
                      [class.text-green-700]="set.completed"
                      [class.bg-gray-100]="!set.completed"
                      [class.text-gray-500]="!set.completed"
                    >
                      {{ set.completed ? 'Done' : 'Not done' }}
                    </span>
                  </div>
                }
              </div>
            </article>
          }

          @if (workoutSession.exercises.length === 0) {
            <p class="text-gray-400 text-center py-8">No exercise details saved for this workout.</p>
          }
        </section>
      } @else {
        <section class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center space-y-3">
          <p class="text-gray-500">Workout session not found.</p>
          <a routerLink="/history" class="text-blue-600 font-semibold">Back to History</a>
        </section>
      }
    </div>
  `
})
export class HistoryDetailComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private workoutService = inject(WorkoutService);

  private sessionId = toSignal(
    this.route.paramMap.pipe(map(params => params.get('sessionId') || '')),
    { initialValue: '' }
  );

  session = computed(() => {
    const sessionId = this.sessionId();
    if (!sessionId) return undefined;
    return this.workoutService.sessions().find(item => item.id === sessionId);
  });

  private sortedSessions = computed(() =>
    this.workoutService.sessions()
      .slice()
      .sort((a, b) => b.date.getTime() - a.date.getTime())
  );

  private currentSessionIndex = computed(() => {
    const id = this.sessionId();
    return this.sortedSessions().findIndex(item => item.id === id);
  });

  previousSessionId = computed(() => {
    const index = this.currentSessionIndex();
    if (index < 0) return null;
    const previous = this.sortedSessions()[index + 1];
    return previous?.id || null;
  });

  nextSessionId = computed(() => {
    const index = this.currentSessionIndex();
    if (index <= 0) return null;
    const next = this.sortedSessions()[index - 1];
    return next?.id || null;
  });

  getPlanName(planId: string) {
    return this.workoutService.getPlanById(planId)?.name || 'Workout Session';
  }

  getExerciseName(session: WorkoutSession, exerciseId: string, index: number) {
    const fromLibrary = this.workoutService.getExerciseById(exerciseId)?.name;
    if (fromLibrary) return fromLibrary;

    const fromPlan = this.workoutService
      .getPlanById(session.planId)
      ?.exercises.find(exercise => exercise.id === exerciseId)
      ?.name;
    if (fromPlan) return fromPlan;

    return `Exercise ${index + 1}`;
  }

  openPreviousSession() {
    const targetId = this.previousSessionId();
    if (!targetId) return;
    void this.router.navigate(['/history', targetId]);
  }

  openNextSession() {
    const targetId = this.nextSessionId();
    if (!targetId) return;
    void this.router.navigate(['/history', targetId]);
  }
}
