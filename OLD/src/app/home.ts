import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { WorkoutService } from './workout.service';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-home',
  imports: [CommonModule, RouterLink, ButtonModule],
  template: `
    <div class="p-6 space-y-8">
      <!-- Header -->
      <header class="flex justify-between items-center">
        <div>
          <h2 class="text-apple-gray text-sm font-medium uppercase tracking-wider">Monday, Feb 23</h2>
          <h1 class="text-3xl font-bold text-slate-900">Hello, Alex!</h1>
        </div>
        <div class="w-12 h-12 rounded-full bg-slate-200 overflow-hidden border-2 border-white shadow-sm">
          <img src="https://picsum.photos/seed/user/100/100" alt="User Profile" />
        </div>
      </header>

      <!-- Stats Grid -->
      <section class="grid grid-cols-2 gap-4">
        <div class="ios-card bg-gradient-to-br from-orange-500 to-red-500 !text-white border-none">
          <div class="flex items-center gap-2 mb-2 opacity-80">
            <i class="pi pi-bolt"></i>
            <span class="text-xs font-semibold uppercase tracking-wide">Calories</span>
          </div>
          <div class="text-2xl font-bold">{{ stats().totalCalories }}</div>
          <div class="text-[10px] opacity-80">kcal burned</div>
        </div>
        <div class="ios-card bg-gradient-to-br from-blue-500 to-indigo-600 !text-white border-none">
          <div class="flex items-center gap-2 mb-2 opacity-80">
            <i class="pi pi-clock"></i>
            <span class="text-xs font-semibold uppercase tracking-wide">Time</span>
          </div>
          <div class="text-2xl font-bold">{{ stats().totalTimeMinutes }}</div>
          <div class="text-[10px] opacity-80">minutes active</div>
        </div>
      </section>

      <!-- Weekly Progress -->
      <section class="ios-card">
        <h3 class="text-lg font-bold mb-4">Weekly Activity</h3>
        <div class="h-32 flex items-end justify-between gap-2 px-2">
          @for (progress of stats().weeklyProgress; track $index) {
            <div class="flex-1 flex flex-col items-center gap-2">
              <div 
                class="w-full bg-apple-blue/10 rounded-full relative overflow-hidden h-24"
              >
                <div 
                  class="absolute bottom-0 left-0 right-0 bg-apple-blue rounded-full transition-all duration-1000"
                  [style.height.%]="progress"
                ></div>
              </div>
              <span class="text-[10px] text-apple-gray font-medium">{{ ['M', 'T', 'W', 'T', 'F', 'S', 'S'][$index] }}</span>
            </div>
          }
        </div>
      </section>

      <!-- Active Plan -->
      @if (activePlan(); as plan) {
        <section class="space-y-4">
          <div class="flex justify-between items-end">
            <h3 class="text-xl font-bold">Active Plan</h3>
            <a routerLink="/plans" class="text-apple-blue text-sm font-semibold">View All</a>
          </div>
          <div class="ios-card relative overflow-hidden group">
            <div class="absolute top-0 right-0 p-4">
              <span class="bg-apple-blue/10 text-apple-blue text-[10px] font-bold px-2 py-1 rounded-full uppercase">Current</span>
            </div>
            <h4 class="text-xl font-bold mb-1">{{ plan.name }}</h4>
            <p class="text-apple-gray text-sm mb-4">{{ plan.description }}</p>
            
            <div class="flex items-center gap-4 mb-6">
              <div class="flex -space-x-2">
                @for (ex of plan.exercises.slice(0, 3); track ex.exerciseId) {
                  <div class="w-8 h-8 rounded-full border-2 border-white overflow-hidden bg-slate-100">
                    <img [src]="getExercise(ex.exerciseId)?.image" [alt]="getExercise(ex.exerciseId)?.name" class="w-full h-full object-cover" />
                  </div>
                }
              </div>
              <span class="text-xs text-apple-gray font-medium">{{ plan.exercises.length }} exercises</span>
            </div>

            <button 
              [routerLink]="['/workout', plan.id]"
              class="w-full ios-button-primary flex items-center justify-center gap-2"
            >
              <i class="pi pi-play-circle text-xl"></i>
              Start Workout
            </button>
          </div>
        </section>
      }

      <!-- Recent History -->
      <section class="space-y-4">
        <h3 class="text-xl font-bold">Recent Workouts</h3>
        <div class="space-y-3">
          @for (session of history().slice(0, 3); track session.id) {
            <div class="ios-card flex items-center justify-between !p-3">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-apple-blue">
                  <i class="pi pi-calendar"></i>
                </div>
                <div>
                  <div class="font-bold text-sm">{{ getPlan(session.planId)?.name }}</div>
                  <div class="text-[10px] text-apple-gray">{{ session.startTime | date:'MMM d, h:mm a' }}</div>
                </div>
              </div>
              <div class="text-right">
                <div class="font-bold text-sm text-apple-blue">{{ session.caloriesBurned }} kcal</div>
                <div class="text-[10px] text-apple-gray">Completed</div>
              </div>
            </div>
          } @empty {
            <div class="text-center py-8 text-apple-gray">
              <i class="pi pi-inbox text-4xl mb-2"></i>
              <p>No workouts yet. Let's get started!</p>
            </div>
          }
        </div>
      </section>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home {
  private workoutService = inject(WorkoutService);
  
  stats = this.workoutService.stats;
  activePlan = this.workoutService.activePlan;
  history = this.workoutService.history;

  getExercise(id: string) {
    return this.workoutService.getExerciseById(id);
  }

  getPlan(id: string) {
    return this.workoutService.getPlanById(id);
  }
}
