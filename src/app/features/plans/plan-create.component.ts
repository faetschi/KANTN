import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { WorkoutService } from '../../core/services/workout.service';
import { Exercise, WorkoutPlan } from '../../core/models/models';
import { AuthService } from '../../core/services/auth.service';

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
          <div class="block text-sm font-medium text-gray-700 mb-2">Plan Name</div>
          <input type="text" [(ngModel)]="name" placeholder="e.g., Summer Shred" class="w-full bg-gray-50 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500">
        </div>

        <div>
          <div class="block text-sm font-medium text-gray-700 mb-2">Description</div>
          <textarea [(ngModel)]="description" rows="3" placeholder="Brief description..." class="w-full bg-gray-50 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500"></textarea>
        </div>

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

        <section class="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-semibold text-gray-900">Share My Custom Exercise</h3>
            <span class="text-xs text-gray-500">Share with a user by email</span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3">
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
              [disabled]="sharingExercise"
              class="bg-blue-600 text-white text-sm font-semibold px-3 py-2 rounded-xl disabled:opacity-50"
            >
              {{ sharingExercise ? 'Sharing…' : 'Share' }}
            </button>
          </div>

          @if (shareMessage) {
            <span class="text-xs text-gray-500">{{ shareMessage }}</span>
          }
        </section>

        <div>
          <div class="block text-sm font-medium text-gray-700 mb-2">Select Exercises</div>
          <div class="space-y-3">
            @for (exercise of availableExercises(); track exercise.id) {
              <button type="button" (click)="toggleExercise(exercise)" 
                   class="w-full flex items-center p-3 rounded-xl border transition-all cursor-pointer"
                   [class.border-blue-500]="isSelected(exercise)"
                   [class.bg-blue-50]="isSelected(exercise)"
                   [class.border-gray-200]="!isSelected(exercise)">
                <img [src]="exercise.imageUrl" [alt]="exercise.name" class="w-12 h-12 rounded-lg object-cover mr-4">
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
              </button>
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
  workoutService = inject(WorkoutService);
  authService = inject(AuthService);

  name = '';
  description = '';
  creatingExercise = false;
  sharingExercise = false;
  customExerciseMessage = '';
  planSaveMessage = '';
  shareMessage = '';
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
  selectedExercises = signal<Exercise[]>([]);
  availableExercises = this.workoutService.exercises;
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

    this.selectedExercises.update(exercises => [...exercises, created]);
    this.customExercise = {
      name: '',
      description: '',
      muscleGroup: '',
      imageUrl: '',
      exerciseType: 'general',
      metValue: 5,
    };
    this.customExerciseMessage = 'Custom exercise created and selected.';
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

  async createPlan() {
    if (!this.isValid()) return;

    const newPlan: WorkoutPlan = {
      id: Math.random().toString(36).substr(2, 9),
      name: this.name,
      description: this.description,
      exercises: this.selectedExercises(),
      isActive: false
    };

    const persistedPlanId = await this.workoutService.createPlan(newPlan);
    if (!persistedPlanId) {
      this.planSaveMessage = 'Failed to save plan. Please try again.';
      return;
    }

    this.planSaveMessage = '';
    this.router.navigate(['/plans']);
  }
}
