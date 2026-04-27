import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { WorkoutService } from '../../core/services/workout.service';
import { AuthService } from '../../core/services/auth.service';
import { Exercise } from '../../core/models/models';

@Component({
  selector: 'app-custom-exercises',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatIconModule],
  template: `
    <div class="h-screen flex flex-col bg-white">
      <header class="px-6 py-4 flex items-center justify-between border-b border-gray-100">
        <div class="flex items-center">
        <button routerLink="/plans/create" class="mr-4 text-gray-600">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h1 class="text-xl font-bold text-gray-900">Custom Exercises</h1>
        </div>
        <button
          type="button"
          (click)="showSharePanel = !showSharePanel"
          class="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600"
          aria-label="Share custom exercise"
        >
          <mat-icon>share</mat-icon>
        </button>
      </header>

      <div class="flex-1 overflow-y-auto p-6 space-y-6">
        <section class="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-semibold text-gray-900">Create Custom Exercise</h3>
            <span class="text-xs text-gray-500">Private to you by default</span>
          </div>

          <div class="grid grid-cols-1 gap-3">
            <input
              type="text"
              [(ngModel)]="customExercise.name"
              placeholder="Exercise name"
              class="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500"
            >
            <input
              type="text"
              [(ngModel)]="customExercise.muscleGroup"
              placeholder="Muscle group (optional)"
              class="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500"
            >
            <div class="flex items-center gap-3">
              <input #customExerciseImageInput type="file" accept="image/*" (change)="onCustomExerciseImageSelected($event)" class="hidden" />
              <button type="button" (click)="customExerciseImageInput.click()" class="bg-gray-200 text-gray-800 text-sm font-semibold px-3 py-2 rounded-xl">
                {{ imageUploading ? 'Uploading...' : 'Upload Image' }}
              </button>
              <span class="text-xs text-gray-500" *ngIf="imageUploadMessage">{{ imageUploadMessage }}</span>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <input
                  type="text"
                  [(ngModel)]="customExercise.exerciseType"
                  placeholder="Exercise type"
                  aria-describedby="exercise-type-help"
                  class="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500"
                >
                <div id="exercise-type-help" class="text-xs text-gray-500 mt-1">Type helps categorize exercises (e.g. strength, cardio, mobility). Default: "general".</div>
              </div>
              <div>
                <input
                  type="number"
                  [(ngModel)]="customExercise.metValue"
                  placeholder="MET"
                  aria-describedby="met-help"
                  class="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500"
                >
                <div id="met-help" class="text-xs text-gray-500 mt-1">MET is metabolic equivalent used to estimate calories burned (default: 5).</div>
              </div>
            </div>
            <textarea
              rows="2"
              [(ngModel)]="customExercise.description"
              placeholder="Description (optional)"
              class="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500"
            ></textarea>
          </div>

          <div class="flex items-center gap-3">
            <button
              type="button"
              (click)="createCustomExercise()"
              [disabled]="creatingExercise"
              class="bg-blue-600 text-white text-sm font-semibold px-3 py-2 rounded-xl disabled:opacity-50"
            >
                {{ creatingExercise ? (selectedExerciseId ? 'Saving…' : 'Creating…') : (selectedExerciseId ? 'Save Changes' : 'Add Custom Exercise') }}
            </button>
              <button *ngIf="selectedExerciseId" type="button" (click)="cancelEdit()" class="bg-gray-200 text-gray-700 text-sm font-semibold px-3 py-2 rounded-xl">Cancel</button>
            @if (customExerciseMessage) {
              <span class="text-xs text-gray-500">{{ customExerciseMessage }}</span>
            }
          </div>
        </section>

        <div
          *ngIf="toastMessage"
          class="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 text-white text-sm px-4 py-2 rounded-xl shadow-lg"
          [class.bg-green-600]="toastType === 'success'"
          [class.bg-red-600]="toastType === 'error'"
        >
          {{ toastMessage }}
        </div>

        @if (showSharePanel) {
        <section class="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
          <div class="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto_auto] gap-3">
            <select [(ngModel)]="shareExerciseId" class="bg-white border border-gray-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500">
              <option [ngValue]="''">Select your custom exercise</option>
              @for (exercise of myCustomExercises(); track exercise.id) {
                <option [ngValue]="exercise.id">{{ exercise.name }}</option>
              }
            </select>
            <input
              type="email"
              [(ngModel)]="shareEmail"
              placeholder="user@example.com"
              class="bg-white border border-gray-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500"
            >
            <button
              type="button"
              (click)="shareCustomExercise()"
              [disabled]="sharingExercise || unsharingExercise"
              class="bg-blue-600 text-white text-sm font-semibold px-3 py-2 rounded-xl disabled:opacity-50"
            >
              {{ sharingExercise ? 'Sharing…' : 'Share' }}
            </button>
            <button
              type="button"
              (click)="unshareCustomExercise()"
              [disabled]="sharingExercise || unsharingExercise"
              class="bg-gray-200 text-gray-700 text-sm font-semibold px-3 py-2 rounded-xl disabled:opacity-50"
            >
              {{ unsharingExercise ? 'Revoking…' : 'Unshare' }}
            </button>
          </div>

          @if (shareMessage) {
            <span class="text-xs text-gray-500">{{ shareMessage }}</span>
          }
        </section>
        }

        <section class="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <h3 class="text-sm font-semibold mb-3">Your Custom Exercises</h3>
          <div class="space-y-2">
            @for (exercise of myCustomExercises(); track exercise.id) {
              <div class="flex items-center justify-between p-2 rounded-lg border">
                <div>
                  <div class="font-medium text-gray-900">{{ exercise.name }}</div>
                  <div class="text-xs text-gray-500">{{ exercise.muscleGroup }}</div>
                </div>
                <div class="flex items-center gap-2">
                  <button (click)="editCustomExercise(exercise)" class="text-sm text-gray-700">Edit</button>
                  <button (click)="shareExerciseId = exercise.id; showSharePanel = true" class="text-sm text-blue-600">Share</button>
                  <button (click)="deleteCustomExercise(exercise.id)" class="text-sm text-red-600">Delete</button>
                </div>
              </div>
            }
          </div>
        </section>
      </div>
    </div>
  `,
})
export class CustomExercisesComponent {
  workoutService = inject(WorkoutService);
  authService = inject(AuthService);

  creatingExercise = false;
  sharingExercise = false;
  unsharingExercise = false;
  imageUploading = false;
  customExerciseMessage = '';
  shareMessage = '';
  imageUploadMessage = '';
  showSharePanel = false;
  shareExerciseId = '';
  shareEmail = '';
  customExercise = {
    name: '',
    description: '',
    muscleGroup: '',
    imageUrl: '',
    exerciseType: 'general',
    metValue: 5,
  };
  myCustomExercises = signal<Exercise[]>([]);
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';
  private toastTimeoutId: ReturnType<typeof setTimeout> | null = null;
  selectedExerciseId: string | null = null;

  constructor() {
    this.syncMyCustomExercises();
  }

  async deleteCustomExercise(id: string) {
    if (!confirm('Delete this custom exercise? This will remove it from your plans.')) return;
    const ok = await this.workoutService.deleteExercise(id);
    if (!ok) {
      this.customExerciseMessage = 'Failed to delete exercise.';
      return;
    }

    await this.workoutService.refresh();
    this.syncMyCustomExercises();
  }

  private syncMyCustomExercises() {
    const currentUserId = this.authService.currentUser()?.id;
    const mine = this.workoutService.exercises().filter(exercise =>
      exercise.visibility !== 'default' &&
      !!currentUserId &&
      exercise.createdBy === currentUserId
    );
    this.myCustomExercises.set(mine);
  }

  async onCustomExerciseImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input?.files?.[0];
    if (!file) return;
    input.value = '';

    this.imageUploading = true;
    this.imageUploadMessage = 'Uploading image...';
    try {
      const url = await this.workoutService.uploadExerciseImage(file);
      if (!url) {
        this.imageUploadMessage = 'Image upload failed.';
        return;
      }

      this.customExercise.imageUrl = url;
      this.imageUploadMessage = 'Image uploaded.';
    } catch {
      this.imageUploadMessage = 'Image upload failed.';
    } finally {
      this.imageUploading = false;
    }
  }

  async createCustomExercise() {
    const payload = {
      name: this.customExercise.name.trim(),
      description: this.customExercise.description.trim() || undefined,
      muscleGroup: this.customExercise.muscleGroup.trim() || undefined,
      imageUrl: this.customExercise.imageUrl.trim() || undefined,
      exerciseType: this.customExercise.exerciseType.trim() || 'general',
      metValue: Number(this.customExercise.metValue) || 5,
      visibility: 'private' as const,
    };

    if (!payload.name) {
      this.customExerciseMessage = 'Please enter a name for your custom exercise.';
      return;
    }

    this.creatingExercise = true;
    this.customExerciseMessage = '';
    let created = null;
    try {
      if (this.selectedExerciseId) {
        const updated = await this.workoutService.updateExercise(this.selectedExerciseId, payload);
        created = updated;
      } else {
        created = await this.workoutService.createExercise(payload);
      }
    } catch (err) {
      console.error('createCustomExercise error', err);
      this.customExerciseMessage = 'Failed to create custom exercise.';
    } finally {
      this.creatingExercise = false;
    }

    if (!created) {
      this.showToast('Failed to save custom exercise.', 'error');
      return;
    }

    this.customExercise = {
      name: '',
      description: '',
      muscleGroup: '',
      imageUrl: '',
      exerciseType: 'general',
      metValue: 5,
    };
    this.customExerciseMessage = 'Custom exercise created.';
    this.syncMyCustomExercises();
    // If we updated, show updated message
    if (this.selectedExerciseId) {
      this.showToast('Custom exercise updated.', 'success');
    } else {
      this.showToast('Custom exercise saved.', 'success');
    }
    this.selectedExerciseId = null;
  }

  private showToast(text: string, type: 'success' | 'error' = 'success') {
    this.toastMessage = text;
    this.toastType = type;
    if (this.toastTimeoutId) {
      clearTimeout(this.toastTimeoutId);
    }
    this.toastTimeoutId = setTimeout(() => {
      this.toastMessage = '';
      this.toastTimeoutId = null;
    }, 3000);
  }

  async shareCustomExercise() {
    const exerciseId = this.shareExerciseId;
    const email = this.shareEmail.trim();
    if (!exerciseId) {
      this.shareMessage = 'Please select an exercise to share.';
      return;
    }
    if (!email) {
      this.shareMessage = 'Please enter an email address.';
      return;
    }

    this.sharingExercise = true;
    this.shareMessage = '';

    const targetUserId = await this.workoutService.resolveUserIdByEmail(email);
    if (!targetUserId) {
      this.sharingExercise = false;
      this.shareMessage = 'User not found for that email.';
      return;
    }

    const currentUserId = this.authService.currentUser()?.id;
    if (currentUserId && targetUserId === currentUserId) {
      this.sharingExercise = false;
      this.shareMessage = 'You cannot share an exercise with yourself.';
      return;
    }

    const ok = await this.workoutService.shareExercise(exerciseId, targetUserId);
    this.sharingExercise = false;
    this.shareMessage = ok ? 'Exercise shared successfully.' : 'Failed to share exercise.';
    if (ok) {
      this.shareEmail = '';
      await this.workoutService.refresh();
      this.syncMyCustomExercises();
    }
  }

  async unshareCustomExercise() {
    const exerciseId = this.shareExerciseId;
    const email = this.shareEmail.trim();
    if (!exerciseId) {
      this.shareMessage = 'Please select an exercise to unshare.';
      return;
    }
    if (!email) {
      this.shareMessage = 'Please enter an email address.';
      return;
    }

    this.unsharingExercise = true;
    this.shareMessage = '';

    const targetUserId = await this.workoutService.resolveUserIdByEmail(email);
    if (!targetUserId) {
      this.unsharingExercise = false;
      this.shareMessage = 'User not found for that email.';
      return;
    }

    const ok = await this.workoutService.unshareExercise(exerciseId, targetUserId);
    this.unsharingExercise = false;
    this.shareMessage = ok ? 'Exercise unshared successfully.' : 'Failed to unshare exercise.';
    if (ok) {
      this.shareEmail = '';
      await this.workoutService.refresh();
      this.syncMyCustomExercises();
    }
  }

  editCustomExercise(ex: Exercise) {
    this.selectedExerciseId = ex.id;
    this.customExercise = {
      name: ex.name || '',
      description: ex.description || '',
      muscleGroup: ex.muscleGroup || '',
      imageUrl: ex.imageUrl || '',
      exerciseType: ex.exerciseType || 'general',
      metValue: ex.metValue ?? 5,
    };
    this.customExerciseMessage = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelEdit() {
    this.selectedExerciseId = null;
    this.customExercise = {
      name: '',
      description: '',
      muscleGroup: '',
      imageUrl: '',
      exerciseType: 'general',
      metValue: 5,
    };
    this.customExerciseMessage = '';
  }
}
