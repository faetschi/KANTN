import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { WorkoutService } from '../../core/services/workout.service';
import { Exercise, WorkoutPlan } from '../../core/models/models';
import { AuthService } from '../../core/services/auth.service';
import { SearchBarComponent } from '../../shared/components/search-bar.component';
import { getWorkoutTypeVisual, workoutTypeBadgeStyle } from '../../core/domain/workout-types';

@Component({
  selector: 'app-plan-create',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatSnackBarModule, FormsModule, RouterLink, SearchBarComponent],
  template: `
    <div class="h-screen flex flex-col bg-white">
      <header class="px-6 py-4 flex items-center border-b border-gray-100">
        <button routerLink="/plans" class="mr-4 text-gray-600">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h1 class="text-xl font-bold text-gray-900">{{ isEditMode ? 'Edit Plan' : 'Create New Plan' }}</h1>
      </header>

      <div class="flex-1 overflow-y-auto p-6 space-y-6">
        <div>
          <div class="block text-sm font-medium text-gray-700 mb-2">Plan Name</div>
          <input type="text" [(ngModel)]="name" placeholder="e.g., Summer Shred" class="w-full bg-gray-50 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500">
        </div>

        <div>
          <div class="block text-sm font-medium text-gray-700 mb-2">Category</div>
          <select [(ngModel)]="category" class="w-full bg-gray-50 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500">
            <option value="">Select Category (Optional)</option>
            <option value="upper body">Upper Body</option>
            <option value="lower body">Lower Body</option>
            <option value="core">Core</option>
            <option value="cardio">Cardio</option>
            <option value="mobility">Mobility</option>
          </select>
        </div>

        <div>
          <div class="block text-sm font-medium text-gray-700 mb-2">Description</div>
          <textarea [(ngModel)]="description" rows="3" placeholder="Brief description..." class="w-full bg-gray-50 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500"></textarea>
        </div>

        <section class="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-center justify-between">
          <div>
            <h3 class="text-sm font-semibold text-gray-900">Need Custom Exercises?</h3>
            <p class="text-xs text-gray-500">Create and share them in the dedicated exercises page.</p>
          </div>
          <button routerLink="/plans/exercises" type="button" class="bg-blue-600 text-white text-sm font-semibold px-3 py-2 rounded-xl">
            Manage
          </button>
        </section>

        <div>
          <div class="block text-sm font-medium text-gray-700 mb-2">Select Exercises</div>
          <app-search-bar
            [value]="exerciseSearchQuery"
            (valueChange)="exerciseSearchQuery = $event"
            placeholder="Search exercises"
          />
          <div class="mt-5 space-y-3">
            @for (exercise of filteredAvailableExercises(); track exercise.id) {
              <button type="button" (click)="toggleExercise(exercise)" 
                   class="w-full flex items-center p-3 rounded-xl border transition-all cursor-pointer"
                   [class.border-blue-500]="isSelected(exercise)"
                   [class.bg-blue-50]="isSelected(exercise)"
                   [class.border-gray-200]="!isSelected(exercise)">
                <img [src]="exercise.imageUrl" [alt]="exercise.name" class="w-12 h-12 rounded-lg object-cover mr-4">
                <div class="flex-1">
                  <h4 class="font-semibold text-gray-900">{{ exercise.name }}</h4>
                  <div class="mt-1 flex items-center gap-2">
                    <p class="text-xs text-gray-500">{{ exercise.muscleGroup }}</p>
                    <span
                      class="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                      [ngStyle]="typeBadgeStyle(exercise.exerciseType)"
                    >
                      {{ typeLabel(exercise.exerciseType) }}
                    </span>
                  </div>
                </div>
                <div class="w-6 h-6 rounded-full border-2 flex items-center justify-center"
                     [class.border-blue-500]="isSelected(exercise)"
                     [class.bg-blue-500]="isSelected(exercise)"
                     [class.border-gray-300]="!isSelected(exercise)">
                  @if (isSelected(exercise)) {
                    <mat-icon class="text-white text-sm">check</mat-icon>
                  }
                </div>
              </button>
            }
          </div>
        </div>
      </div>

      <div class="p-6 border-t border-gray-100 safe-area-pb">
        <button (click)="createPlan()" 
                [disabled]="!isValid()"
                class="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-200 disabled:opacity-50 disabled:shadow-none">
          {{ isEditMode ? 'Save Changes' : 'Create Plan' }}
        </button>
        @if (planSaveMessage) {
          <p class="text-xs text-red-500 mt-2">{{ planSaveMessage }}</p>
        }
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
  route = inject(ActivatedRoute);
  snackBar = inject(MatSnackBar);
  workoutService = inject(WorkoutService);
  authService = inject(AuthService);

  name = '';
  category: WorkoutPlan['category'] | '' = '';
  description = '';
  isEditMode = false;
  editingPlanId: string | null = null;
  planSaveMessage = '';
  exerciseSearchQuery = '';
  selectedExercises = signal<Exercise[]>([]);
  availableExercises = this.workoutService.exercises;

  constructor() {
    this.initializeEditMode();
  }

  private initializeEditMode() {
    const planId = this.route.snapshot.paramMap.get('planId');
    if (!planId) return;

    const plan = this.workoutService.getPlanById(planId);
    const currentUserId = this.authService.currentUser()?.id;
    if (!plan || !currentUserId || plan.ownerId !== currentUserId) {
      this.planSaveMessage = 'Plan not found or you do not have permission to edit it.';
      return;
    }

    this.isEditMode = true;
    this.editingPlanId = planId;
    this.name = plan.name;
    this.category = plan.category || '';
    this.description = plan.description;
    this.selectedExercises.set([...plan.exercises]);
  }

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

  filteredAvailableExercises() {
    const exercises = this.availableExercises();
    const query = this.exerciseSearchQuery.trim().toLowerCase();
    if (!query) return exercises;

    return exercises.filter(exercise => {
      const haystack = [exercise.name, exercise.muscleGroup || '', exercise.exerciseType || ''].join(' ').toLowerCase();
      return haystack.includes(query);
    });
  }

  typeLabel(type?: string) {
    return getWorkoutTypeVisual(type).label;
  }

  typeBadgeStyle(type?: string) {
    return workoutTypeBadgeStyle(type);
  }

  async createPlan() {
    if (!this.isValid()) return;

    const trimmedName = this.name.trim();
    const trimmedDescription = this.description.trim();
    const planCategory = this.category || undefined;

    if (this.isEditMode && this.editingPlanId) {
      const ok = await this.workoutService.updatePlan(this.editingPlanId, {
        name: trimmedName,
        category: planCategory,
        description: trimmedDescription,
        exercises: this.selectedExercises(),
      });

      if (!ok) {
        this.planSaveMessage = 'Failed to update plan. Please try again.';
        return;
      }

      this.planSaveMessage = '';
      this.snackBar.open('Plan updated successfully.', 'Close', { duration: 3000 });
      this.router.navigate(['/plans']);
      return;
    }

    const newPlan: WorkoutPlan = {
      id: Math.random().toString(36).substr(2, 9),
      name: trimmedName,
      description: trimmedDescription,
      category: planCategory,
      exercises: this.selectedExercises(),
      isActive: false
    };

    const persistedPlanId = await this.workoutService.createPlan(newPlan);
    if (!persistedPlanId) {
      this.planSaveMessage = 'Failed to save plan. Please try again.';
      return;
    }

    this.planSaveMessage = '';
    this.snackBar.open('Plan created successfully.', 'Close', { duration: 3000 });
    this.router.navigate(['/plans']);
  }
}
