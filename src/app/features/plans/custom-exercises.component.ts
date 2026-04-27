import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { WorkoutService } from '../../core/services/workout.service';
import { AuthService } from '../../core/services/auth.service';
import { Exercise } from '../../core/models/models';
import { NotificationService } from '../../core/services/notification.service';

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
            <h3 class="text-sm font-semibold text-gray-900">{{ editingExerciseId ? 'Edit Custom Exercise' : 'Create Custom Exercise' }}</h3>
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
                <label class="block text-xs font-medium text-gray-600 mb-1">Exercise type</label>
                <input
                  type="text"
                  [(ngModel)]="customExercise.exerciseType"
                  placeholder="general (default)"
                  class="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500"
                >
                <p class="mt-1 text-[11px] text-gray-500">Use values like strength, cardio, or mobility.</p>
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-600 mb-1">MET value</label>
                <input
                  type="number"
                  [(ngModel)]="customExercise.metValue"
                  placeholder="5 (default)"
                  class="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500"
                >
                <p class="mt-1 text-[11px] text-gray-500">Higher MET means higher estimated calorie burn.</p>
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
              (click)="editingExerciseId ? saveCustomExercise() : createCustomExercise()"
              [disabled]="creatingExercise || savingExercise"
              class="bg-blue-600 text-white text-sm font-semibold px-3 py-2 rounded-xl disabled:opacity-50"
            >
              {{ creatingExercise ? 'Creating…' : savingExercise ? 'Saving…' : editingExerciseId ? 'Save Changes' : 'Add Custom Exercise' }}
            </button>
            @if (editingExerciseId) {
              <button
                type="button"
                (click)="cancelEdit()"
                class="bg-gray-200 text-gray-700 text-sm font-semibold px-3 py-2 rounded-xl"
              >
                Cancel
              </button>
            }
            @if (customExerciseMessage) {
              <span class="text-xs text-gray-500">{{ customExerciseMessage }}</span>
            }
          </div>
        </section>

        @if (myCustomExercises().length > 0) {
        <section class="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
          <h3 class="text-sm font-semibold text-gray-900">Manage My Custom Exercises</h3>
          <div class="space-y-2">
            @for (exercise of myCustomExercises(); track exercise.id) {
              <div class="flex items-center justify-between bg-white border border-gray-200 rounded-xl p-3">
                <div class="min-w-0">
                  <p class="text-sm font-medium text-gray-900 truncate">{{ exercise.name }}</p>
                  @if (exercise.muscleGroup) {
                    <p class="text-xs text-gray-500 truncate">{{ exercise.muscleGroup }}</p>
                  }
                </div>
                <div class="flex items-center gap-2">
                  <button
                    type="button"
                    (click)="startEdit(exercise)"
                    class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600"
                    aria-label="Edit custom exercise"
                  >
                    <mat-icon class="text-base">edit</mat-icon>
                  </button>
                  <button
                    type="button"
                    (click)="deleteExercise(exercise)"
                    [disabled]="deletingExerciseId === exercise.id"
                    class="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 disabled:opacity-50"
                    aria-label="Delete custom exercise"
                  >
                    <mat-icon class="text-base">{{ deletingExerciseId === exercise.id ? 'hourglass_top' : 'delete' }}</mat-icon>
                  </button>
                </div>
              </div>
            }
          </div>
        </section>
        }

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
      </div>

    </div>
  `,
})
export class CustomExercisesComponent {
  workoutService = inject(WorkoutService);
  authService = inject(AuthService);
  notifications = inject(NotificationService);

  creatingExercise = false;
  savingExercise = false;
  sharingExercise = false;
  unsharingExercise = false;
  imageUploading = false;
  customExerciseMessage = '';
  shareMessage = '';
  imageUploadMessage = '';
  showSharePanel = false;
  shareExerciseId = '';
  shareEmail = '';
  editingExerciseId: string | null = null;
  deletingExerciseId: string | null = null;
  private customExerciseMessageTimer: ReturnType<typeof setTimeout> | null = null;
  customExercise = {
    name: '',
    description: '',
    muscleGroup: '',
    imageUrl: '',
    exerciseType: 'general',
    metValue: 5,
  };
  myCustomExercises = signal<Exercise[]>([]);

  constructor() {
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
    this.creatingExercise = false;
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
      const validationMessage = 'Please enter a name for your custom exercise.';
      this.setCustomExerciseMessage(validationMessage);
      this.notifications.error(validationMessage);
      return;
    }

    this.creatingExercise = true;
    this.clearCustomExerciseMessage();
    try {
      const created = await this.workoutService.createExercise(payload);
      if (!created) {
        const failureMessage = 'Failed to create custom exercise.';
        this.setCustomExerciseMessage(failureMessage);
        this.notifications.error(failureMessage);
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
      this.clearCustomExerciseMessage();
      this.notifications.success('Saved.');
      this.syncMyCustomExercises();
    } catch {
      const errorMessage = 'Failed to create custom exercise.';
      this.setCustomExerciseMessage(errorMessage);
      this.notifications.error(errorMessage);
    } finally {
      this.creatingExercise = false;
    }
  }

  startEdit(exercise: Exercise) {
    this.editingExerciseId = exercise.id;
    this.customExercise = {
      name: exercise.name,
      description: exercise.description || '',
      muscleGroup: exercise.muscleGroup || '',
      imageUrl: exercise.imageUrl || '',
      exerciseType: exercise.exerciseType || 'general',
      metValue: exercise.metValue || 5,
    };
    this.clearCustomExerciseMessage();
  }

  cancelEdit() {
    this.editingExerciseId = null;
    this.customExercise = {
      name: '',
      description: '',
      muscleGroup: '',
      imageUrl: '',
      exerciseType: 'general',
      metValue: 5,
    };
    this.clearCustomExerciseMessage();
  }

  async saveCustomExercise() {
    if (!this.editingExerciseId) return;

    const payload = {
      name: this.customExercise.name.trim(),
      description: this.customExercise.description.trim() || undefined,
      muscleGroup: this.customExercise.muscleGroup.trim() || undefined,
      imageUrl: this.customExercise.imageUrl.trim() || undefined,
      exerciseType: this.customExercise.exerciseType.trim() || 'general',
      metValue: Number(this.customExercise.metValue) || 5,
    };

    if (!payload.name) {
      const validationMessage = 'Please enter a name for your custom exercise.';
      this.setCustomExerciseMessage(validationMessage);
      this.notifications.error(validationMessage);
      return;
    }

    this.savingExercise = true;
    this.clearCustomExerciseMessage();

    try {
      const updated = await this.workoutService.updateExercise(this.editingExerciseId, payload);
      if (!updated) {
        const failureMessage = 'Failed to save custom exercise.';
        this.setCustomExerciseMessage(failureMessage);
        this.notifications.error(failureMessage);
        return;
      }

      this.cancelEdit();
      this.clearCustomExerciseMessage();
      this.notifications.success('Saved.');
      this.syncMyCustomExercises();
    } catch {
      const failureMessage = 'Failed to save custom exercise.';
      this.setCustomExerciseMessage(failureMessage);
      this.notifications.error(failureMessage);
    } finally {
      this.savingExercise = false;
    }
  }

  async deleteExercise(exercise: Exercise) {
    const confirmed = typeof window !== 'undefined'
      ? window.confirm(`Delete custom exercise \"${exercise.name}\"?`)
      : true;
    if (!confirmed) return;

    this.deletingExerciseId = exercise.id;
    this.clearCustomExerciseMessage();

    try {
      const ok = await this.workoutService.deleteExercise(exercise.id);
      if (!ok) {
        const failureMessage = 'Failed to delete custom exercise.';
        this.setCustomExerciseMessage(failureMessage);
        this.notifications.error(failureMessage);
        return;
      }

      if (this.editingExerciseId === exercise.id) {
        this.cancelEdit();
      }

      this.clearCustomExerciseMessage();
      this.notifications.success('Deleted.');
      this.syncMyCustomExercises();
    } catch {
      const failureMessage = 'Failed to delete custom exercise.';
      this.setCustomExerciseMessage(failureMessage);
      this.notifications.error(failureMessage);
    } finally {
      this.deletingExerciseId = null;
    }
  }

  private setCustomExerciseMessage(message: string) {
    this.customExerciseMessage = message;
    if (this.customExerciseMessageTimer) {
      clearTimeout(this.customExerciseMessageTimer);
      this.customExerciseMessageTimer = null;
    }
    this.customExerciseMessageTimer = setTimeout(() => {
      this.customExerciseMessage = '';
      this.customExerciseMessageTimer = null;
    }, this.notifications.config.maxDurationMs);
  }

  private clearCustomExerciseMessage() {
    this.customExerciseMessage = '';
    if (this.customExerciseMessageTimer) {
      clearTimeout(this.customExerciseMessageTimer);
      this.customExerciseMessageTimer = null;
    }
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
}
