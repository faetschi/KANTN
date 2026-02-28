import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { WorkoutService } from '../../core/services/workout.service';
import { Exercise } from '../../core/models/models';
import { SearchBarComponent } from '../../shared/components/search-bar.component';

@Component({
  selector: 'app-admin-exercises',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, SearchBarComponent],
  template: `
    <div class="p-6 space-y-6">
      <header class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-gray-900">Default Exercises</h1>
        <a routerLink="/admin" class="px-3 py-2 rounded-xl bg-gray-200 text-gray-800 text-sm">Back</a>
      </header>

      <section class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-4">
        <h2 class="text-lg font-semibold text-gray-900">Create / Edit Exercise</h2>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <div class="block text-xs font-semibold text-gray-500 mb-1">Name</div>
            <input [(ngModel)]="exerciseForm.name" placeholder="Bench Press" class="w-full border border-gray-200 rounded-xl px-3 py-2" />
          </div>
          <div>
            <div class="block text-xs font-semibold text-gray-500 mb-1">Muscle Group</div>
            <input [(ngModel)]="exerciseForm.muscleGroup" placeholder="Chest" class="w-full border border-gray-200 rounded-xl px-3 py-2" />
          </div>
          <div>
            <div class="block text-xs font-semibold text-gray-500 mb-1">Exercise Type</div>
            <input [(ngModel)]="exerciseForm.exerciseType" placeholder="strength" class="w-full border border-gray-200 rounded-xl px-3 py-2" />
          </div>
          <div>
            <div class="block text-xs font-semibold text-gray-500 mb-1">MET Value</div>
            <input [(ngModel)]="exerciseForm.metValue" type="number" placeholder="5" class="w-full border border-gray-200 rounded-xl px-3 py-2" />
          </div>
        </div>

        <div>
          <div class="block text-xs font-semibold text-gray-500 mb-1">Description</div>
          <textarea [(ngModel)]="exerciseForm.description" rows="2" placeholder="Short exercise description" class="w-full border border-gray-200 rounded-xl px-3 py-2"></textarea>
        </div>

        <div class="flex items-center gap-2">
          <input #exerciseFileInput type="file" accept="image/*" (change)="onExerciseImageSelected($event)" class="hidden" />
          <button type="button" [disabled]="imageUploading" (click)="exerciseFileInput.click()" class="px-3 py-2 rounded-xl bg-gray-200 text-gray-800 text-sm disabled:opacity-60">
            {{ imageUploading ? 'Uploading...' : 'Upload Image' }}
          </button>
          @if (exerciseMessage) {
            <span class="text-sm text-gray-500">{{ exerciseMessage }}</span>
          }
        </div>

        <div class="flex items-center gap-2">
          <button (click)="saveDefaultExercise()" [disabled]="exerciseBusy || imageUploading" class="px-4 py-2 rounded-xl bg-blue-600 text-white disabled:opacity-50">
            {{ selectedExerciseId ? 'Update Exercise' : 'Create Default Exercise' }}
          </button>
          @if (selectedExerciseId) {
            <button (click)="resetExerciseForm()" class="px-4 py-2 rounded-xl bg-gray-200 text-gray-800">Cancel</button>
          }
        </div>
      </section>

      <section class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-4">
        <app-search-bar
          [value]="searchQuery"
          (valueChange)="searchQuery = $event"
          placeholder="Search exercises by name, type, or muscle"
        />

        <div class="grid grid-cols-6 gap-2 p-2 text-xs font-semibold uppercase tracking-wider text-gray-400 border-b border-gray-100">
          <div class="col-span-2">Exercise</div>
          <div>Type</div>
          <div>Visibility</div>
          <div>MET</div>
          <div class="text-right">Actions</div>
        </div>

        @if (exercisesLoading) {
          <div class="p-2 text-sm text-gray-500">Loading exercises...</div>
        }

        @if (!exercisesLoading && !filteredDefaultExercises().length) {
          <div class="p-2 text-sm text-gray-500">No matching default exercises.</div>
        }

        @for (ex of filteredDefaultExercises(); track ex.id) {
          <div class="grid grid-cols-6 gap-2 p-2 items-center border-b border-gray-50">
            <div class="col-span-2 min-w-0">
              <div class="font-medium text-gray-900 truncate">{{ ex.name }}</div>
              <div class="text-xs text-gray-500 truncate">{{ ex.muscleGroup || '-' }}</div>
            </div>
            <div class="text-sm text-gray-700">{{ ex.exerciseType || 'general' }}</div>
            <div class="text-sm text-gray-700">{{ ex.visibility || 'default' }}</div>
            <div class="text-sm text-gray-700">{{ ex.metValue || 5 }}</div>
            <div class="flex justify-end">
              <button (click)="editExercise(ex)" class="px-2 py-1 text-xs rounded bg-gray-200 text-gray-700">Edit</button>
            </div>
          </div>
        }
      </section>
    </div>
  `,
})
export class AdminExercisesComponent {
  workoutService = inject(WorkoutService);

  defaultExercises: Exercise[] = [];
  exercisesLoading = true;
  exerciseBusy = false;
  imageUploading = false;
  exerciseMessage = '';
  selectedExerciseId: string | null = null;
  searchQuery = '';
  exerciseForm = {
    name: '',
    description: '',
    imageUrl: '',
    muscleGroup: '',
    exerciseType: 'general',
    metValue: 5,
  };

  constructor() {
    void this.loadDefaultExercises();
  }

  filteredDefaultExercises() {
    const query = this.searchQuery.trim().toLowerCase();
    if (!query) return this.defaultExercises;

    return this.defaultExercises.filter(ex => {
      const haystack = [ex.name, ex.muscleGroup || '', ex.exerciseType || ''].join(' ').toLowerCase();
      return haystack.includes(query);
    });
  }

  private async loadDefaultExercises() {
    this.exercisesLoading = true;
    await this.workoutService.refresh();
    this.defaultExercises = this.workoutService.exercises().filter(ex => ex.visibility === 'default');
    this.exercisesLoading = false;
  }

  editExercise(exercise: Exercise) {
    this.selectedExerciseId = exercise.id;
    this.exerciseForm = {
      name: exercise.name || '',
      description: exercise.description || '',
      imageUrl: exercise.imageUrl || '',
      muscleGroup: exercise.muscleGroup || '',
      exerciseType: exercise.exerciseType || 'general',
      metValue: exercise.metValue || 5,
    };
    this.exerciseMessage = '';
  }

  resetExerciseForm() {
    this.selectedExerciseId = null;
    this.exerciseForm = {
      name: '',
      description: '',
      imageUrl: '',
      muscleGroup: '',
      exerciseType: 'general',
      metValue: 5,
    };
    this.exerciseMessage = '';
  }

  async onExerciseImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input?.files?.[0];
    if (!file) return;
    input.value = '';

    this.imageUploading = true;
    this.exerciseMessage = 'Uploading image...';
    try {
      const url = await this.workoutService.uploadExerciseImage(file);
      if (!url) {
        this.exerciseMessage = 'Image upload failed.';
        return;
      }

      this.exerciseForm.imageUrl = url;
      this.exerciseMessage = 'Image uploaded.';
    } catch {
      this.exerciseMessage = 'Image upload failed.';
    } finally {
      this.imageUploading = false;
    }
  }

  async saveDefaultExercise() {
    const name = this.exerciseForm.name.trim();
    if (!name) {
      this.exerciseMessage = 'Name is required.';
      return;
    }

    this.exerciseBusy = true;
    this.exerciseMessage = '';

    const payload = {
      name,
      description: this.exerciseForm.description.trim() || undefined,
      imageUrl: this.exerciseForm.imageUrl.trim() || undefined,
      muscleGroup: this.exerciseForm.muscleGroup.trim() || undefined,
      exerciseType: this.exerciseForm.exerciseType.trim() || 'general',
      metValue: Number(this.exerciseForm.metValue) || 5,
      visibility: 'default' as const,
    };

    if (this.selectedExerciseId) {
      const updated = await this.workoutService.updateExercise(this.selectedExerciseId, payload);
      this.exerciseBusy = false;
      this.exerciseMessage = updated ? 'Exercise updated.' : 'Failed to update exercise.';
    } else {
      const created = await this.workoutService.createExercise(payload);
      this.exerciseBusy = false;
      this.exerciseMessage = created ? 'Default exercise created.' : 'Failed to create exercise.';
    }

    await this.loadDefaultExercises();
    if (!this.exerciseMessage.toLowerCase().includes('failed')) {
      this.resetExerciseForm();
    }
  }
}
