import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { WorkoutService } from '../../core/services/workout.service';

@Component({
  selector: 'app-plans',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule],
  template: `
    <div class="p-6 pb-24 space-y-6">
      <header class="flex justify-between items-center">
        <h1 class="text-2xl font-bold text-gray-900">Workout Plans</h1>
        <button routerLink="/plans/create" class="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
          <mat-icon>add</mat-icon>
        </button>
      </header>

      <div class="space-y-4">
        @for (plan of plans(); track plan.id) {
          <div class="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 transition-all active:scale-[0.98]" 
               [class.ring-2]="plan.isActive" 
               [class.ring-blue-500]="plan.isActive"
               [class.ring-offset-2]="plan.isActive">
            <div class="flex justify-between items-start mb-3">
              <div>
                <h3 class="text-lg font-bold text-gray-900">{{ plan.name }}</h3>
                <p class="text-gray-500 text-sm line-clamp-2">{{ plan.description }}</p>
              </div>
              @if (plan.isActive) {
                <span class="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide">Active</span>
              }
            </div>

            <div class="flex -space-x-2 overflow-hidden mb-4 py-1">
              @for (exercise of plan.exercises.slice(0, 4); track exercise.id) {
                <img [src]="exercise.imageUrl" class="inline-block h-8 w-8 rounded-full ring-2 ring-white object-cover" [alt]="exercise.name">
              }
              @if (plan.exercises.length > 4) {
                <div class="h-8 w-8 rounded-full bg-gray-100 ring-2 ring-white flex items-center justify-center text-[10px] font-bold text-gray-500">
                  +{{ plan.exercises.length - 4 }}
                </div>
              }
            </div>

            <div class="flex gap-3">
              <button [routerLink]="['/workout', plan.id]" class="flex-1 bg-gray-900 text-white py-3 rounded-xl font-semibold text-sm shadow-md active:bg-gray-800">
                Start
              </button>
              @if (!plan.isActive) {
                <button (click)="activatePlan(plan.id)" class="px-4 py-3 bg-blue-50 text-blue-600 rounded-xl font-semibold text-sm">
                  Activate
                </button>
              }
            </div>
          </div>
        }
      </div>
    </div>
  `
})
export class PlansComponent {
  workoutService = inject(WorkoutService);
  plans = this.workoutService.plans;

  activatePlan(id: string) {
    this.workoutService.setActivePlan(id);
  }
}
