import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { WorkoutService } from '../../core/services/workout.service';
import { Exercise, WorkoutPlan } from '../../core/models/models';
import { SearchBarComponent } from '../../shared/components/search-bar.component';

@Component({
  selector: 'app-admin-workouts',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, SearchBarComponent],
  template: `
    <div class="p-6 space-y-6">
      <header class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-gray-900">Default Workout Plans</h1>
        <a routerLink="/admin" class="px-3 py-2 rounded-xl bg-gray-200 text-gray-800 text-sm">Back</a>
      </header>

      <section class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-4">
        <h2 class="text-lg font-semibold text-gray-900">Create / Edit Default Plan</h2>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div class="md:col-span-2">
            <div class="block text-xs font-semibold text-gray-500 mb-1">Plan Name</div>
            <input [(ngModel)]="planForm.name" placeholder="Beginner Full Body" class="w-full border border-gray-200 rounded-xl px-3 py-2" />
          </div>
          <div>
            <div class="block text-xs font-semibold text-gray-500 mb-1">Category</div>
            <select [(ngModel)]="planForm.category" class="w-full border border-gray-200 rounded-xl px-3 py-2">
              <option value="">Select Category</option>
              <option value="upper body">Upper Body</option>
              <option value="lower body">Lower Body</option>
              <option value="core">Core</option>
              <option value="cardio">Cardio</option>
              <option value="mobility">Mobility</option>
            </select>
          </div>
        </div>

        <div>
          <div class="block text-xs font-semibold text-gray-500 mb-1">Description</div>
          <textarea [(ngModel)]="planForm.description" rows="2" placeholder="Short plan description" class="w-full border border-gray-200 rounded-xl px-3 py-2"></textarea>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-center">
          <app-search-bar
            [value]="exerciseQuery"
            (valueChange)="exerciseQuery = $event"
            placeholder="Search default exercises"
          />
          <button type="button" (click)="resetPlanForm()" class="px-3 py-2 rounded-xl bg-gray-100 text-gray-700 text-sm">Reset</button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          @for (exercise of filteredDefaultExercises(); track exercise.id) {
            <button
              type="button"
              (click)="toggleExercise(exercise)"
              class="flex items-center gap-3 p-3 rounded-xl border border-gray-200 text-left"
              [class.border-blue-500]="isSelected(exercise)"
              [class.bg-blue-50]="isSelected(exercise)"
            >
              <img [src]="exercise.imageUrl" [alt]="exercise.name" class="w-10 h-10 rounded-lg object-cover" />
              <div class="flex-1 min-w-0">
                <div class="font-medium text-gray-900 truncate">{{ exercise.name }}</div>
                <div class="text-xs text-gray-500 truncate">{{ exercise.muscleGroup || 'General' }}</div>
              </div>
              <div class="text-[10px] font-semibold uppercase tracking-wide text-gray-500">{{ exercise.exerciseType || 'strength' }}</div>
            </button>
          }
        </div>

        <div class="flex items-center gap-2">
          <button (click)="saveDefaultPlan()" [disabled]="planBusy" class="px-4 py-2 rounded-xl bg-blue-600 text-white disabled:opacity-50">
            {{ selectedPlanId ? 'Update Plan' : 'Create Default Plan' }}
          </button>
          <button *ngIf="selectedPlanId" (click)="resetPlanForm()" class="px-4 py-2 rounded-xl bg-gray-200 text-gray-800">Cancel</button>
          <span *ngIf="planMessage" class="text-sm text-gray-500">{{ planMessage }}</span>
        </div>
      </section>

      <section class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-4">
        <app-search-bar
          [value]="planQuery"
          (valueChange)="planQuery = $event"
          placeholder="Search default plans"
        />

        <div class="grid grid-cols-6 gap-2 p-2 text-xs font-semibold uppercase tracking-wider text-gray-400 border-b border-gray-100">
          <div class="col-span-2">Plan</div>
          <div>Category</div>
          <div>Exercises</div>
          <div>Updated</div>
          <div class="text-right">Actions</div>
        </div>

        <div *ngIf="plansLoading" class="p-2 text-sm text-gray-500">Loading default plans...</div>
        <div *ngIf="!plansLoading && !filteredDefaultPlans().length" class="p-2 text-sm text-gray-500">No default plans found.</div>

        <ng-container *ngFor="let plan of filteredDefaultPlans()">
          <div class="grid grid-cols-6 gap-2 p-2 items-center border-b border-gray-50">
            <div class="col-span-2 min-w-0">
              <div class="font-medium text-gray-900 truncate">{{ plan.name }}</div>
              <div class="text-xs text-gray-500 truncate">{{ plan.description || '-' }}</div>
            </div>
            <div class="text-sm text-gray-700">{{ plan.category || '-' }}</div>
            <div class="text-sm text-gray-700">{{ plan.exercises.length }}</div>
            <div class="text-xs text-gray-500">{{ plan.lastPerformed ? (plan.lastPerformed | date:'MMM d') : '-' }}</div>
            <div class="flex justify-end gap-2">
              <button (click)="editPlan(plan)" class="px-2 py-1 text-xs rounded bg-gray-200 text-gray-700">Edit</button>
              <button (click)="deletePlan(plan)" class="px-2 py-1 text-xs rounded bg-red-100 text-red-600">Delete</button>
            </div>
          </div>
        </ng-container>
      </section>
    </div>
  `,
})
export class AdminWorkoutsComponent {
  workoutService = inject(WorkoutService);

  planForm = {
    name: '',
    description: '',
    category: '' as WorkoutPlan['category'] | '',
  };
  selectedPlanId: string | null = null;
  planBusy = false;
  planMessage = '';
  planQuery = '';
  exerciseQuery = '';
  selectedExercises = signal<Exercise[]>([]);
  plansLoading = true;

  constructor() {
    void this.loadDefaultPlans();
  }

  defaultPlans = computed(() => this.workoutService.plans().filter(plan => plan.visibility === 'public'));
  defaultExercises = computed(() => this.workoutService.exercises().filter(exercise => exercise.visibility === 'default'));

  filteredDefaultPlans() {
    const query = this.planQuery.trim().toLowerCase();
    const plans = this.defaultPlans();
    if (!query) return plans;

    return plans.filter(plan => {
      const haystack = [plan.name, plan.description || '', plan.category || ''].join(' ').toLowerCase();
      return haystack.includes(query);
    });
  }

  filteredDefaultExercises() {
    const query = this.exerciseQuery.trim().toLowerCase();
    const exercises = this.defaultExercises();
    if (!query) return exercises;

    return exercises.filter(exercise => {
      const haystack = [exercise.name, exercise.muscleGroup || '', exercise.exerciseType || ''].join(' ').toLowerCase();
      return haystack.includes(query);
    });
  }

  isSelected(exercise: Exercise) {
    return this.selectedExercises().some(item => item.id === exercise.id);
  }

  toggleExercise(exercise: Exercise) {
    this.selectedExercises.update(list => {
      if (list.some(item => item.id === exercise.id)) {
        return list.filter(item => item.id !== exercise.id);
      }
      return [...list, exercise];
    });
  }

  editPlan(plan: WorkoutPlan) {
    this.selectedPlanId = plan.id;
    this.planForm = {
      name: plan.name,
      description: plan.description || '',
      category: plan.category || '',
    };
    this.selectedExercises.set([...plan.exercises]);
    this.planMessage = '';
  }

  async deletePlan(plan: WorkoutPlan) {
    if (!confirm(`Delete "${plan.name}"? This cannot be undone.`)) return;

    this.planBusy = true;
    this.planMessage = 'Deleting...';
    try {
      const ok = await this.workoutService.deletePlan(plan.id);
      this.planMessage = ok ? 'Plan deleted.' : 'Failed to delete plan.';
      if (ok) {
        await this.workoutService.refresh();
        this.resetPlanForm();
      }
    } finally {
      this.planBusy = false;
    }
  }

  resetPlanForm() {
    this.selectedPlanId = null;
    this.planForm = {
      name: '',
      description: '',
      category: '',
    };
    this.selectedExercises.set([]);
    this.planMessage = '';
  }

  private async loadDefaultPlans() {
    this.plansLoading = true;
    await this.workoutService.refresh();
    this.plansLoading = false;
  }

  async saveDefaultPlan() {
    const trimmedName = this.planForm.name.trim();
    if (!trimmedName) {
      this.planMessage = 'Plan name is required.';
      return;
    }

    if (!this.selectedExercises().length) {
      this.planMessage = 'Select at least one exercise.';
      return;
    }

    this.planBusy = true;
    this.planMessage = '';

    const payload = {
      name: trimmedName,
      description: this.planForm.description.trim(),
      category: (this.planForm.category || undefined) as WorkoutPlan['category'] | undefined,
      exercises: this.selectedExercises(),
    };

    try {
      if (this.selectedPlanId) {
        const ok = await this.workoutService.updatePlan(this.selectedPlanId, payload);
        this.planMessage = ok ? 'Plan updated.' : 'Failed to update plan.';
      } else {
        const created = await this.workoutService.createPlan({
          id: '',
          name: payload.name,
          description: payload.description,
          category: payload.category,
          exercises: payload.exercises,
          isActive: false,
          visibility: 'public',
        });
        this.planMessage = created ? 'Default plan created.' : 'Failed to create plan.';
      }

      if (!this.planMessage.toLowerCase().includes('failed')) {
        await this.workoutService.refresh();
        this.resetPlanForm();
      }
    } finally {
      this.planBusy = false;
    }
  }
}
