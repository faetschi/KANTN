import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkoutService } from './workout.service';
import { RouterLink } from '@angular/router';
import { WorkoutSession } from './models';

@Component({
  selector: 'app-history',
  imports: [CommonModule, RouterLink],
  template: `
    <div class="p-6 space-y-8">
      <header>
        <h1 class="text-3xl font-bold text-slate-900">Activity History</h1>
        <p class="text-apple-gray">Track your progress over time</p>
      </header>

      <!-- Summary Cards -->
      <section class="grid grid-cols-2 gap-4">
        <div class="ios-card bg-white">
          <div class="text-apple-gray text-[10px] font-bold uppercase mb-1">Total Workouts</div>
          <div class="text-2xl font-bold text-apple-blue">{{ stats().totalWorkouts }}</div>
        </div>
        <div class="ios-card bg-white">
          <div class="text-apple-gray text-[10px] font-bold uppercase mb-1">Total Time</div>
          <div class="text-2xl font-bold text-indigo-600">{{ stats().totalTimeMinutes }}m</div>
        </div>
      </section>

      <!-- History List -->
      <section class="space-y-4">
        <div class="flex justify-between items-center">
          <h3 class="text-xl font-bold">Past Sessions</h3>
          <button class="text-apple-blue text-sm font-semibold">Filter</button>
        </div>

        <div class="space-y-4">
          @for (session of history(); track session.id) {
            <div class="ios-card space-y-4">
              <div class="flex justify-between items-start">
                <div>
                  <h4 class="font-bold text-lg">{{ getPlan(session.planId)?.name }}</h4>
                  <p class="text-xs text-apple-gray">{{ session.startTime | date:'EEEE, MMMM d' }}</p>
                </div>
                <div class="bg-emerald-100 text-emerald-600 text-[10px] font-bold px-2 py-1 rounded-full uppercase">
                  Completed
                </div>
              </div>

              <div class="grid grid-cols-3 gap-2 py-3 border-y border-slate-100">
                <div class="text-center">
                  <div class="text-[10px] text-apple-gray uppercase font-bold">Duration</div>
                  <div class="font-bold">{{ getDuration(session) }}m</div>
                </div>
                <div class="text-center">
                  <div class="text-[10px] text-apple-gray uppercase font-bold">Calories</div>
                  <div class="font-bold">{{ session.caloriesBurned }}</div>
                </div>
                <div class="text-center">
                  <div class="text-[10px] text-apple-gray uppercase font-bold">Exercises</div>
                  <div class="font-bold">{{ session.results.length }}</div>
                </div>
              </div>

              <div class="space-y-2">
                @for (res of session.results.slice(0, 2); track res.exerciseId) {
                  <div class="flex justify-between text-xs">
                    <span class="text-slate-700">{{ getExercise(res.exerciseId)?.name }}</span>
                    <span class="text-apple-gray font-medium">
                      {{ res.sets.length }} sets • {{ res.sets[0].reps }} reps
                    </span>
                  </div>
                }
                @if (session.results.length > 2) {
                  <div class="text-[10px] text-apple-blue font-bold">+ {{ session.results.length - 2 }} more exercises</div>
                }
              </div>
            </div>
          } @empty {
            <div class="text-center py-20 bg-white rounded-3xl border border-slate-200">
              <div class="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <i class="pi pi-history text-2xl text-slate-300"></i>
              </div>
              <h4 class="font-bold text-slate-900">No History Yet</h4>
              <p class="text-sm text-apple-gray px-12 mt-1">Your completed workouts will appear here.</p>
              <button routerLink="/home" class="mt-6 text-apple-blue font-bold text-sm">Start your first workout</button>
            </div>
          }
        </div>
      </section>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class History {
  private workoutService = inject(WorkoutService);
  
  history = this.workoutService.history;
  stats = this.workoutService.stats;

  getPlan(id: string) {
    return this.workoutService.getPlanById(id);
  }

  getExercise(id: string) {
    return this.workoutService.getExerciseById(id);
  }

  getDuration(session: WorkoutSession) {
    if (!session.endTime) return 0;
    return Math.round((session.endTime.getTime() - session.startTime.getTime()) / 60000);
  }
}
