import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { WorkoutService } from '../../core/services/workout.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-plans',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, FormsModule],
  template: `
    <div class="p-6 pb-24 space-y-6">
      <header class="flex justify-between items-center">
        <h1 class="text-2xl font-bold text-gray-900">Workout Plans</h1>
        <button routerLink="/plans/create" class="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
          <mat-icon>add</mat-icon>
        </button>
      </header>

      <section class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-semibold text-gray-900">Share My Plan</h3>
          <span class="text-xs text-gray-500">Share with a user by email</span>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3">
          <select [(ngModel)]="sharePlanId" class="bg-gray-50 border-none rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500">
            <option [ngValue]="''">Select your plan</option>
            @for (plan of myOwnedPlans(); track plan.id) {
              <option [ngValue]="plan.id">{{ plan.name }}</option>
            }
          </select>
          <input
            type="email"
            [(ngModel)]="shareEmail"
            placeholder="user@example.com"
            class="bg-gray-50 border-none rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500"
          >
          <button
            type="button"
            (click)="sharePlan()"
            [disabled]="sharingPlan"
            class="bg-blue-600 text-white text-sm font-semibold px-3 py-2 rounded-xl disabled:opacity-50"
          >
            {{ sharingPlan ? 'Sharing…' : 'Share' }}
          </button>
        </div>
        <span class="text-xs text-gray-500" *ngIf="shareMessage">{{ shareMessage }}</span>
        <span class="text-xs text-red-500" *ngIf="activationMessage">{{ activationMessage }}</span>
      </section>

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
              @if (isOwnedPlan(plan.id)) {
                <button [routerLink]="['/plans/edit', plan.id]" class="px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold text-sm">
                  Edit
                </button>
              }
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
  authService = inject(AuthService);
  plans = this.workoutService.plans;
  sharePlanId = '';
  shareEmail = '';
  sharingPlan = false;
  shareMessage = '';
  activationMessage = '';

  myOwnedPlans() {
    const currentUserId = this.authService.currentUser()?.id;
    return this.plans().filter(plan => !!currentUserId && plan.ownerId === currentUserId);
  }

  isOwnedPlan(planId: string) {
    const currentUserId = this.authService.currentUser()?.id;
    if (!currentUserId) return false;
    return this.plans().some(plan => plan.id === planId && plan.ownerId === currentUserId);
  }

  async activatePlan(id: string) {
    this.activationMessage = '';
    const ok = await this.workoutService.setActivePlan(id);
    if (!ok) {
      this.activationMessage = 'Failed to activate plan.';
    }
  }

  async sharePlan() {
    const planId = this.sharePlanId;
    const email = this.shareEmail.trim();

    if (!planId) {
      this.shareMessage = 'Please select a plan to share.';
      return;
    }

    if (!email) {
      this.shareMessage = 'Please enter an email address.';
      return;
    }

    this.sharingPlan = true;
    this.shareMessage = '';

    const targetUserId = await this.workoutService.resolveUserIdByEmail(email);
    if (!targetUserId) {
      this.sharingPlan = false;
      this.shareMessage = 'User not found for that email.';
      return;
    }

    const currentUserId = this.authService.currentUser()?.id;
    if (currentUserId && targetUserId === currentUserId) {
      this.sharingPlan = false;
      this.shareMessage = 'You cannot share a plan with yourself.';
      return;
    }

    const ok = await this.workoutService.sharePlan(planId, targetUserId);
    this.sharingPlan = false;
    this.shareMessage = ok ? 'Plan shared successfully.' : 'Failed to share plan.';
    if (ok) {
      this.shareEmail = '';
    }
  }
}
