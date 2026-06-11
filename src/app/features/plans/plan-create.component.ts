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
import { getWorkoutTypeEmoji, getWorkoutTypeVisual, workoutTypeBadgeStyle, getWorkoutPlanTypeWithFallback } from '../../core/domain/workout-types';

@Component({
  selector: 'app-plan-create',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatSnackBarModule, FormsModule, RouterLink, SearchBarComponent],
  template: `
    <div class="min-h-screen flex flex-col bg-white">
      <div class="flex-1 p-6 space-y-6 plan-form-content">
        <header class="flex items-center gap-3">
          <button routerLink="/plans" class="text-gray-600">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <h1 class="text-2xl font-bold text-gray-900">{{ isEditMode ? 'Edit Plan' : 'Create New Plan' }}</h1>
        </header>
        <section class="static bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-center justify-between">
          <div>
            <h3 class="text-sm font-semibold text-gray-900">Need Custom Exercises?</h3>
            <p class="text-xs text-gray-500">Create and share them in the dedicated exercises page.</p>
          </div>
          <button routerLink="/plans/exercises" type="button" class="bg-blue-600 text-white text-sm font-semibold px-3 py-2 rounded-xl">
            Manage
          </button>
        </section>

        <div>
          <div class="block text-sm font-medium text-gray-700 mb-2">Plan Name</div>
          <input type="text" [(ngModel)]="name" placeholder="e.g., Summer Shred" class="w-full bg-gray-50 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500">
        </div>

        <div>
          <div class="block text-sm font-medium text-gray-700 mb-2">Plan Type</div>
          <div class="flex gap-3">
            <button type="button"
                    (click)="setPlanType('strength')"
                    class="flex-1 py-3 rounded-xl font-semibold text-sm border-2 transition-all"
                    [class.border-red-500]="workoutPlanType() === 'strength'"
                    [class.bg-red-50]="workoutPlanType() === 'strength'"
                    [class.border-gray-200]="workoutPlanType() !== 'strength'"
                    [class.bg-white]="workoutPlanType() !== 'strength'">
              <span class="mr-1">💪</span> Strength
            </button>
            <button type="button"
                    (click)="setPlanType('cardio')"
                    class="flex-1 py-3 rounded-xl font-semibold text-sm border-2 transition-all"
                    [class.border-green-500]="workoutPlanType() === 'cardio'"
                    [class.bg-green-50]="workoutPlanType() === 'cardio'"
                    [class.border-gray-200]="workoutPlanType() !== 'cardio'"
                    [class.bg-white]="workoutPlanType() !== 'cardio'">
              <span class="mr-1">🏃</span> Cardio
            </button>
          </div>
        </div>

        @if (workoutPlanType()) {
          <div>
            <div class="flex items-center justify-between gap-2 mb-2">
              <span
                class="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                [ngStyle]="planTypeBadgeStyle()"
              >
                <span class="mr-1" aria-hidden="true">{{ planTypeEmoji() }}</span>
                {{ planTypeLabel() }}
              </span>
              @if (category) {
                <span class="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-blue-600">
                  {{ category }}
                </span>
              }
            </div>
            <div class="block text-sm font-medium text-gray-700 mb-2">
              {{ workoutPlanType() === 'cardio' ? 'Activity' : 'Category' }}
            </div>
            <div class="flex items-center gap-3">
              <select
                [(ngModel)]="category"
                class="flex-1 bg-gray-50 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500"
              >
                <option value="" disabled>
                  {{ workoutPlanType() === 'cardio' ? 'Select Activity (Required)' : 'Select Category (Optional)' }}
                </option>
                @if (workoutPlanType() === 'cardio') {
                  @for (option of cardioCategories; track option.value) {
                    <option [value]="option.value">{{ option.label }}</option>
                  }
                } @else {
                  @for (option of strengthCategories; track option.value) {
                    <option [value]="option.value">{{ option.label }}</option>
                  }
                }
              </select>
            </div>
          </div>

          @if (workoutPlanType() === 'cardio') {
            <div class="bg-orange-50 border border-orange-200 rounded-xl p-4 space-y-3">
              <h3 class="text-sm font-semibold text-orange-900">Cardio Target (Optional)</h3>
              <p class="text-xs text-orange-600">Cardio plans have no exercises — the activity category above defines the workout.</p>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <span class="block text-xs text-orange-700 mb-1">Target Distance (km)</span>
                  <input type="number" [(ngModel)]="cardioTargetDistance"
                         placeholder="e.g., 5" step="0.1" min="0"
                         class="w-full bg-white border border-orange-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500">
                </div>
                <div>
                  <span class="block text-xs text-orange-700 mb-1">Target Duration (min)</span>
                  <input type="number" [(ngModel)]="cardioTargetDuration"
                         placeholder="e.g., 30" min="0"
                         class="w-full bg-white border border-orange-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500">
                </div>
              </div>
            </div>
          }

          <div class="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-sm font-semibold text-blue-900">Schedule (Optional)</h3>
                <p class="text-xs text-blue-700">Pick a date to schedule this workout.</p>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" [(ngModel)]="scheduleEnabled" class="sr-only peer">
                <div class="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:bg-blue-600 peer-focus:ring-2 peer-focus:ring-blue-300 transition-colors after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"></div>
              </label>
            </div>
            @if (scheduleEnabled) {
              <div class="grid grid-cols-1 gap-3">
                <div>
                  <span class="block text-xs text-blue-700 mb-1">Date</span>
                  <input type="date" [(ngModel)]="scheduleDate"
                         [min]="minScheduleDate"
                         class="w-full bg-white border border-blue-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500">
                </div>
              </div>
            }
          </div>

          @if (workoutPlanType() === 'strength') {
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
                      <div class="mt-1 flex items-center justify-center gap-2">
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
          }
        } @else {
          <div class="rounded-xl bg-gray-50 border border-gray-200 p-8 text-center">
            <p class="text-gray-500 text-sm">Select a plan type above to configure your workout plan.</p>
          </div>
        }
      </div>

      <div class="px-6 pb-6 pt-3 safe-area-pb plan-action-bar">
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
    .plan-action-bar {
      position: fixed;
      bottom: calc(5rem + env(safe-area-inset-bottom, 0px));
      left: 0;
      right: 0;
      background: transparent;
      z-index: 20;
    }
    .plan-form-content {
      padding-bottom: calc(6rem + env(safe-area-inset-bottom, 0px));
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
  cardioTargetDistance: number | null = null;
  cardioTargetDuration: number | null = null;

  workoutPlanType = signal<'strength' | 'cardio' | ''>('');

  scheduleEnabled = false;
  scheduleDate = '';
  minScheduleDate = new Date().toISOString().split('T')[0];

  strengthCategories = [
    { value: 'upper body', label: 'Upper Body' },
    { value: 'lower body', label: 'Lower Body' },
    { value: 'core', label: 'Core' },
    { value: 'full body', label: 'Full Body' },
    { value: 'mobility', label: 'Mobility' },
  ];
  cardioCategories = [
    { value: 'running', label: 'Running' },
    { value: 'cycling', label: 'Cycling' },
    { value: 'swimming', label: 'Swimming' },
    { value: 'hiking', label: 'Hiking' },
  ];

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

    const planType = getWorkoutPlanTypeWithFallback(plan);
    if (planType === 'cardio' || planType === 'strength') {
      this.workoutPlanType.set(planType);
    }
  }

  setPlanType(type: 'strength' | 'cardio') {
    if (this.isEditMode && this.workoutPlanType() === type) return;
    this.workoutPlanType.set(type);
    this.selectedExercises.set([]);
    this.category = '';
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

  filteredAvailableExercises() {
    const exercises = this.availableExercises().filter(ex => ex.exerciseType === 'strength');
    const query = this.exerciseSearchQuery.trim().toLowerCase();
    if (!query) return exercises;

    return exercises.filter(exercise => {
      const haystack = [exercise.name, exercise.muscleGroup || '', exercise.exerciseType || ''].join(' ').toLowerCase();
      return haystack.includes(query);
    });
  }

  planTypeLabel() {
    return getWorkoutTypeVisual(this.workoutPlanType()).label;
  }

  planTypeBadgeStyle() {
    return workoutTypeBadgeStyle(this.workoutPlanType());
  }

  planTypeEmoji() {
    return getWorkoutTypeEmoji(this.workoutPlanType()) || '';
  }

  isValid() {
    if (!this.name.trim()) return false;
    if (!this.workoutPlanType()) return false;
    if (this.workoutPlanType() === 'cardio') {
      return !!this.category;
    }
    return this.selectedExercises().length > 0;
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
    const planType = this.workoutPlanType() || undefined;

    if (this.isEditMode && this.editingPlanId) {
      const ok = await this.workoutService.updatePlan(this.editingPlanId, {
        name: trimmedName,
        category: planCategory,
        description: trimmedDescription,
        exercises: this.selectedExercises(),
        workoutPlanType: planType,
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
      workoutPlanType: planType,
      exercises: this.selectedExercises(),
      isActive: false
    };

    const cardioTargets = this.workoutPlanType() === 'cardio' ? {
      targetDistanceMeters: this.cardioTargetDistance ? this.cardioTargetDistance * 1000 : null,
      targetDurationSeconds: this.cardioTargetDuration ? this.cardioTargetDuration * 60 : null,
    } : undefined;

    const persistedPlanId = await this.workoutService.createPlan(newPlan, cardioTargets);
    if (!persistedPlanId) {
      this.planSaveMessage = 'Failed to save plan. Please try again.';
      return;
    }

    this.planSaveMessage = '';

    // Schedule the plan if a date was selected
    if (this.scheduleEnabled && this.scheduleDate) {
      const scheduleOk = await this.workoutService.schedulePlan(persistedPlanId, new Date(this.scheduleDate));
      if (!scheduleOk) {
        this.planSaveMessage = 'Plan saved but could not be scheduled.';
        return;
      }
    }

    this.snackBar.open('Plan created successfully.', 'Close', { duration: 3000 });
    this.cardioTargetDistance = null;
    this.cardioTargetDuration = null;
    this.scheduleEnabled = false;
    this.scheduleDate = '';
    this.router.navigate(['/plans']);
  }
}
