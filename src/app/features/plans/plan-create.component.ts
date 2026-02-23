import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { WorkoutService } from '../../core/services/workout.service';
import { Exercise, WorkoutPlan } from '../../core/models/models';

@Component({
  selector: 'app-plan-create',
  standalone: true,
  imports: [CommonModule, MatIconModule, FormsModule, RouterLink],
  template: `
    <div class="h-screen flex flex-col bg-white">
      <header class="px-6 py-4 flex items-center border-b border-gray-100">
        <button routerLink="/plans" class="mr-4 text-gray-600">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h1 class="text-xl font-bold text-gray-900">Create New Plan</h1>
      </header>

      <div class="flex-1 overflow-y-auto p-6 space-y-6">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Plan Name</label>
          <input type="text" [(ngModel)]="name" placeholder="e.g., Summer Shred" class="w-full bg-gray-50 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500">
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <textarea [(ngModel)]="description" rows="3" placeholder="Brief description..." class="w-full bg-gray-50 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500"></textarea>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Select Exercises</label>
          <div class="space-y-3">
            @for (exercise of availableExercises(); track exercise.id) {
              <div (click)="toggleExercise(exercise)" 
                   class="flex items-center p-3 rounded-xl border transition-all cursor-pointer"
                   [class.border-blue-500]="isSelected(exercise)"
                   [class.bg-blue-50]="isSelected(exercise)"
                   [class.border-gray-200]="!isSelected(exercise)">
                <img [src]="exercise.imageUrl" class="w-12 h-12 rounded-lg object-cover mr-4">
                <div class="flex-1">
                  <h4 class="font-semibold text-gray-900">{{ exercise.name }}</h4>
                  <p class="text-xs text-gray-500">{{ exercise.muscleGroup }}</p>
                </div>
                <div class="w-6 h-6 rounded-full border-2 flex items-center justify-center"
                     [class.border-blue-500]="isSelected(exercise)"
                     [class.bg-blue-500]="isSelected(exercise)"
                     [class.border-gray-300]="!isSelected(exercise)">
                  @if (isSelected(exercise)) {
                    <mat-icon class="text-white text-sm">check</mat-icon>
                  }
                </div>
              </div>
            }
          </div>
        </div>
      </div>

      <div class="p-6 border-t border-gray-100 safe-area-pb">
        <button (click)="createPlan()" 
                [disabled]="!isValid()"
                class="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-200 disabled:opacity-50 disabled:shadow-none">
          Create Plan
        </button>
      </div>
    </div>
  `,
  styles: [`
    .safe-area-pb {
      padding-bottom: env(safe-area-inset-bottom, 20px);
    }
  `]
})
export class PlanCreateComponent {
  router = inject(Router);
  workoutService = inject(WorkoutService);

  name = '';
  description = '';
  selectedExercises = signal<Exercise[]>([]);
  availableExercises = this.workoutService.exercises;

  isSelected(exercise: Exercise) {
    return this.selectedExercises().some(e => e.id === exercise.id);
  }

  toggleExercise(exercise: Exercise) {
    this.selectedExercises.update(exercises => {
      if (exercises.some(e => e.id === exercise.id)) {
        return exercises.filter(e => e.id !== exercise.id);
      } else {
        return [...exercises, exercise];
      }
    });
  }

  isValid() {
    return this.name.trim().length > 0 && this.selectedExercises().length > 0;
  }

  createPlan() {
    if (!this.isValid()) return;

    const newPlan: WorkoutPlan = {
      id: Math.random().toString(36).substr(2, 9),
      name: this.name,
      description: this.description,
      exercises: this.selectedExercises(),
      isActive: false
    };

    this.workoutService.createPlan(newPlan);
    this.router.navigate(['/plans']);
  }
}
