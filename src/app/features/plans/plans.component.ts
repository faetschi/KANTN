import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { WorkoutService } from '../../core/services/workout.service';
import { AuthService } from '../../core/services/auth.service';
import { SearchBarComponent } from '../../shared/components/search-bar.component';
import { WorkoutPlan } from '../../core/models/models';
import { getWorkoutPlanType, getWorkoutTypeVisual, workoutTypeBadgeStyle } from '../../core/domain/workout-types';

@Component({
  selector: 'app-plans',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, FormsModule, SearchBarComponent],
  template: `
    <div class="p-6 pb-24 space-y-6">
      <header class="flex justify-between items-center">
        <h1 class="text-2xl font-bold text-gray-900">Workout Plans</h1>
        <div class="flex items-center gap-2">
          <button
            type="button"
            (click)="showSharePanel = !showSharePanel"
            class="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600"
            aria-label="Share plan"
          >
            <mat-icon>share</mat-icon>
          </button>
          <button routerLink="/plans/create" class="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600" aria-label="Create plan">
            <mat-icon>add</mat-icon>
          </button>
        </div>
      </header>

      @if (showSharePanel) {
      <section class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3">
        <div class="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto_auto] gap-3">
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
            [disabled]="sharingPlan || unsharingPlan"
            class="bg-blue-600 text-white text-sm font-semibold px-3 py-2 rounded-xl disabled:opacity-50"
          >
            {{ sharingPlan ? 'Sharing…' : 'Share' }}
          </button>
          <button
            type="button"
            (click)="unsharePlan()"
            [disabled]="sharingPlan || unsharingPlan"
            class="bg-gray-200 text-gray-700 text-sm font-semibold px-3 py-2 rounded-xl disabled:opacity-50"
          >
            {{ unsharingPlan ? 'Revoking…' : 'Unshare' }}
          </button>
        </div>
        @if (shareMessage) {
          <span class="text-xs text-gray-500">{{ shareMessage }}</span>
        }
      </section>
      }

      @if (pendingInvites().length) {
        <section class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3">
          <h2 class="text-sm font-semibold text-gray-900">Pending plan invites</h2>
          <div class="space-y-3">
            @for (invite of pendingInvites(); track invite.id) {
              <div class="flex flex-col gap-2 rounded-xl border border-gray-100 bg-gray-50 p-3">
                <div>
                  <p class="text-sm font-semibold text-gray-900">{{ invite.planName }}</p>
                  <p class="text-xs text-gray-500 line-clamp-2">{{ invite.planDescription || 'Shared workout plan' }}</p>
                  @if (invite.sharedByEmail || invite.sharedByName) {
                    <p class="text-[11px] text-gray-400">Shared by {{ invite.sharedByName || invite.sharedByEmail }}</p>
                  }
                </div>
                <div class="flex gap-2">
                  <button
                    type="button"
                    (click)="respondToInvite(invite.id, true)"
                    [disabled]="respondingInviteId === invite.id"
                    class="flex-1 bg-gray-900 text-white text-xs font-semibold px-3 py-2 rounded-xl disabled:opacity-50"
                  >
                    {{ respondingInviteId === invite.id ? 'Accepting…' : 'Accept' }}
                  </button>
                  <button
                    type="button"
                    (click)="respondToInvite(invite.id, false)"
                    [disabled]="respondingInviteId === invite.id"
                    class="flex-1 bg-white text-gray-600 text-xs font-semibold px-3 py-2 rounded-xl border border-gray-200 disabled:opacity-50"
                  >
                    {{ respondingInviteId === invite.id ? 'Declining…' : 'Decline' }}
                  </button>
                </div>
              </div>
            }
          </div>
          @if (inviteMessage) {
            <span class="text-xs text-gray-500">{{ inviteMessage }}</span>
          }
        </section>
      }

      @if (activationMessage) {
        <span class="text-xs text-red-500">{{ activationMessage }}</span>
      }

      <app-search-bar
        class="block mb-5"
        [value]="planSearchQuery()"
        (valueChange)="planSearchQuery.set($event)"
        placeholder="Search workout plans"
      />

      <div class="space-y-4">
        @for (plan of filteredPlans(); track plan.id) {
          <div class="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 transition-all active:scale-[0.98]" 
               [class.ring-2]="plan.isActive" 
               [class.ring-blue-500]="plan.isActive"
               [class.ring-offset-2]="plan.isActive">
            <div class="flex justify-between items-start mb-3">
              <div>
                <h3 class="text-lg font-bold text-gray-900">{{ plan.name }}</h3>
                @if (plan.category) {
                  <span class="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-blue-600 mb-1">
                    {{ plan.category }}
                  </span>
                }
                <span
                  class="ml-1 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide mb-1"
                  [ngStyle]="typeBadgeStyle(plan)"
                >
                  {{ typeLabel(plan) }}
                </span>
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
                <button (click)="confirmDeletePlan(plan.id)" [disabled]="plan.isActive" [title]="plan.isActive ? 'Deactivate the plan before deleting it' : ''" class="px-4 py-3 bg-red-50 text-red-600 rounded-xl font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed">
                  Delete
                </button>
              }
              @if (!plan.isActive) {
                <button (click)="activatePlan(plan.id)" [disabled]="activatingPlanId && activatingPlanId !== plan.id" class="px-4 py-3 bg-blue-50 text-blue-600 rounded-xl font-semibold text-sm">
                  {{ activatingPlanId === plan.id ? 'Activating…' : 'Activate' }}
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
  planInvites = this.workoutService.planInvites;
  sharePlanId = '';
  shareEmail = '';
  showSharePanel = false;
  planSearchQuery = signal('');
  sharingPlan = false;
  unsharingPlan = false;
  shareMessage = '';
  inviteMessage = '';
  activationMessage = '';
  activatingPlanId = '';
  respondingInviteId = '';

  myOwnedPlans() {
    const currentUserId = this.authService.currentUser()?.id;
    return this.plans().filter(plan => !!currentUserId && plan.ownerId === currentUserId);
  }

  isOwnedPlan(planId: string) {
    const currentUserId = this.authService.currentUser()?.id;
    if (!currentUserId) return false;
    return this.plans().some(plan => plan.id === planId && plan.ownerId === currentUserId);
  }

  filteredPlans = computed(() => {
    const query = this.planSearchQuery().trim().toLowerCase();
    const allPlans = this.plans();
    const sorted = [...allPlans].sort((a, b) => Number(!!b.isActive) - Number(!!a.isActive));
    if (!query) return sorted;

    return sorted.filter(plan => {
      const haystack = [plan.name, plan.description || '', plan.category || '', getWorkoutPlanType(plan)].join(' ').toLowerCase();
      return haystack.includes(query);
    });
  });

  typeLabel(plan: WorkoutPlan) {
    return getWorkoutTypeVisual(getWorkoutPlanType(plan)).label;
  }

  typeBadgeStyle(plan: WorkoutPlan) {
    return workoutTypeBadgeStyle(getWorkoutPlanType(plan));
  }

  pendingInvites = computed(() => this.planInvites().filter(invite => invite.status === 'pending'));

  async activatePlan(id: string) {
    this.activationMessage = '';
    this.activatingPlanId = id;

    const currentUserId = this.authService.currentUser()?.id;
    const currentActive = this.plans().find(p => p.isActive && !!currentUserId && p.ownerId === currentUserId);
    const previousActiveId = currentActive?.id;

    // Delegate optimistic local update to the service
    console.debug('[PlansComponent] activatePlan start id=' + id + ' previousActiveId=' + previousActiveId);

    let ok = false;
    try {
      ok = await this.workoutService.setActivePlan(id);
    } catch {
      ok = false;
    }

    this.activatingPlanId = '';

    // Log current plans snapshot after activation attempt
    console.debug('[PlansComponent] activatePlan result=' + ok + ' currentPlans=' + JSON.stringify(this.plans().map(p => ({ id: p.id, isActive: p.isActive }))));

    if (!ok) {
      // Revert optimistic change via service
      console.debug('[PlansComponent] activatePlan revert to previousActiveId=', previousActiveId);
      this.workoutService.setActiveLocally(previousActiveId || null);
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

  async unsharePlan() {
    const planId = this.sharePlanId;
    const email = this.shareEmail.trim();

    if (!planId) {
      this.shareMessage = 'Please select a plan to unshare.';
      return;
    }

    if (!email) {
      this.shareMessage = 'Please enter an email address.';
      return;
    }

    this.unsharingPlan = true;
    this.shareMessage = '';

    const targetUserId = await this.workoutService.resolveUserIdByEmail(email);
    if (!targetUserId) {
      this.unsharingPlan = false;
      this.shareMessage = 'User not found for that email.';
      return;
    }

    const ok = await this.workoutService.unsharePlan(planId, targetUserId);
    this.unsharingPlan = false;
    this.shareMessage = ok ? 'Plan unshared successfully.' : 'Failed to unshare plan.';
    if (ok) {
      this.shareEmail = '';
    }
  }

  async respondToInvite(shareId: string, accept: boolean) {
    this.inviteMessage = '';
    this.respondingInviteId = shareId;

    const ok = await this.workoutService.respondToPlanInvite(shareId, accept);
    this.respondingInviteId = '';

    if (!ok) {
      this.inviteMessage = accept ? 'Failed to accept invite.' : 'Failed to decline invite.';
    }
  }

  async confirmDeletePlan(id: string) {
    if (!confirm('Delete this plan? This cannot be undone.')) return;
    const ok = await this.workoutService.deletePlan(id);
    if (!ok) {
      this.activationMessage = 'Failed to delete plan.';
    }
  }
}
