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
            <input
              type="text"
              [(ngModel)]="customExercise.imageUrl"
              placeholder="Image URL (optional)"
              class="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500"
            >
            <div class="grid grid-cols-2 gap-3">
              <input
                type="text"
                [(ngModel)]="customExercise.exerciseType"
                placeholder="Exercise type"
                class="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500"
              >
              <input
                type="number"
                [(ngModel)]="customExercise.metValue"
                placeholder="MET"
                class="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500"
              >
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
              {{ creatingExercise ? 'Creating…' : 'Add Custom Exercise' }}
            </button>
            @if (customExerciseMessage) {
              <span class="text-xs text-gray-500">{{ customExerciseMessage }}</span>
            }
          </div>
        </section>

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

  creatingExercise = false;
  sharingExercise = false;
  unsharingExercise = false;
  customExerciseMessage = '';
  shareMessage = '';
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
    const created = await this.workoutService.createExercise(payload);
    this.creatingExercise = false;

    if (!created) {
      this.customExerciseMessage = 'Failed to create custom exercise.';
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
