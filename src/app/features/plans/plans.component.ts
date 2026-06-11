import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { WorkoutService } from '../../core/services/workout.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { SearchBarComponent } from '../../shared/components/search-bar.component';
import { FabButtonComponent } from '../../shared/components/fab-button.component';
import { WorkoutPlan } from '../../core/models/models';
import { getWorkoutPlanType, getWorkoutTypeVisual, workoutTypeBadgeStyle, getWorkoutTypeEmoji } from '../../core/domain/workout-types';

@Component({
  selector: 'app-plans',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, FormsModule, SearchBarComponent, FabButtonComponent],
  template: `
    <div class="p-6 pb-24 space-y-6">
      <header class="flex justify-between items-center">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Workout Plans</h1>
          <p class="text-gray-500 text-sm">Create your perfect workout</p>
        </div>
        <div class="flex items-center gap-2">
          <button
            type="button"
            (click)="showSharePanel.set(true); shareMessage = ''"
            class="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600"
            aria-label="Share plan"
          >
            <mat-icon>share</mat-icon>
          </button>
        </div>
      </header>

      @if (showSharePanel()) {
      <div class="fixed inset-0 z-[70] bg-black/40 flex items-center justify-center p-4" (click)="closeSharePanel()">
        <div class="w-full max-w-md bg-white rounded-2xl p-5 shadow-xl border border-gray-100 space-y-4" (click)="$event.stopPropagation()">
          <div class="flex items-center justify-between">
            <h3 class="text-base font-bold text-gray-900">Share Plan</h3>
            <button type="button" (click)="closeSharePanel()" class="text-gray-400">
              <mat-icon>close</mat-icon>
            </button>
          </div>
          <div class="grid grid-cols-1 gap-3">
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
            <div class="flex items-center gap-3">
              <button
                type="button"
                (click)="sharePlan()"
                [disabled]="sharingPlan || unsharingPlan"
                class="flex-1 bg-blue-600 text-white text-sm font-semibold px-3 py-2 rounded-xl disabled:opacity-50"
              >
                {{ sharingPlan ? 'Sharing\u2026' : 'Share' }}
              </button>
              <button
                type="button"
                (click)="unsharePlan()"
                [disabled]="sharingPlan || unsharingPlan"
                class="flex-1 bg-gray-200 text-gray-700 text-sm font-semibold px-3 py-2 rounded-xl disabled:opacity-50"
              >
                {{ unsharingPlan ? 'Revoking\u2026' : 'Unshare' }}
              </button>
            </div>
          </div>
          @if (shareMessage) {
            <span class="text-xs text-gray-500">{{ shareMessage }}</span>
          }
        </div>
      </div>
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

      <app-search-bar
        class="block mb-5"
        [value]="planSearchQuery()"
        (valueChange)="planSearchQuery.set($event)"
        placeholder="Search workout plans"
      />

      @if (filteredPlans().length === 0) {
        <div class="bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl p-10 text-center">
          <mat-icon class="text-4xl text-gray-300 mb-3">fitness_center</mat-icon>
          <p class="text-gray-500 font-semibold mb-1">No workout plans yet</p>
          <p class="text-gray-400 text-sm mb-5">Create your first plan to get started.</p>
          <button routerLink="/plans/create" class="bg-blue-600 text-white font-semibold px-5 py-2.5 rounded-xl text-sm shadow-md">
            Create Plan
          </button>
        </div>
      }

      <div class="space-y-4">
        @for (plan of filteredPlans(); track plan.id) {
          <div class="relative bg-white rounded-2xl p-5 shadow-sm border border-gray-100 transition-all active:scale-[0.98]" 
               [class.ring-2]="plan.isActive" 
               [class.ring-blue-500]="plan.isActive"
               [class.ring-offset-2]="plan.isActive">
            <div class="flex justify-between items-start mb-3">
              <div>
                <h3 class="text-lg font-bold text-gray-900">{{ plan.name }}</h3>
                <div class="mt-1.5 flex flex-wrap items-center gap-2">
                  <span
                    class="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                    [ngStyle]="typeBadgeStyle(plan)"
                  >
                    <span class="mr-1" aria-hidden="true">{{ typeEmoji(plan) }}</span>
                    {{ typeLabel(plan) }}
                  </span>
                  @if (plan.category) {
                    <span class="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-blue-600">
                      {{ plan.category }}
                    </span>
                  }
                  <span class="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                    @if (plan.lastPerformed) {
                      Last: {{ plan.lastPerformed | date:'MMM d' }}
                    } @else {
                      Not started yet
                    }
                  </span>
                  @if (nextScheduledDate(plan.id); as sched) {
                    <span class="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-blue-700">
                      <mat-icon class="text-[12px] mr-0.5" style="font-size:12px;width:12px;height:12px;">calendar_today</mat-icon>
                      {{ sched | date:'MMM d' }}
                    </span>
                  }
                </div>
                <p class="mt-2 text-gray-500 text-sm line-clamp-2">{{ plan.description }}</p>
              </div>
              @if (plan.isActive) {
                @if (isOwnedPlan(plan.id)) {
                  <button (click)="deactivateActivePlan()" class="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide cursor-pointer hover:bg-blue-200 transition-colors">Active</button>
                } @else {
                  <span class="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide">Active</span>
                }
              } @else {
                <button (click)="activatePlan(plan.id)" [disabled]="activatingPlanId() !== ''" class="bg-gray-100 text-gray-500 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide cursor-pointer hover:bg-gray-200 transition-colors">{{ activatingPlanId() === plan.id ? 'Activating…' : 'Activate' }}</button>
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

            @if (isOwnedPlan(plan.id)) {
              <button (click)="confirmDeletePlan(plan.id); $event.stopPropagation()"
                      [disabled]="plan.isActive"
                      [title]="plan.isActive ? 'Deactivate the plan before deleting it' : ''"
                      class="absolute -top-1 -right-1 w-5 h-5 bg-gray-300 text-gray-500 rounded-full flex items-center justify-center hover:bg-gray-400 hover:text-gray-700 transition-colors z-10 text-xs leading-none font-bold disabled:opacity-40 disabled:cursor-not-allowed">
                ✕
              </button>
            }

            <div class="flex gap-3">
              <button [routerLink]="['/workout', plan.id]" class="flex-1 bg-gray-900 text-white py-3 rounded-xl font-semibold text-sm shadow-md active:bg-gray-800">
                Start
              </button>
              <button (click)="openScheduleDialog(plan.id)" class="px-4 py-3 bg-blue-50 text-blue-600 rounded-xl font-semibold text-sm">
                <mat-icon class="text-[16px] align-middle" style="font-size:16px;width:16px;height:16px;">calendar_today</mat-icon>
                <span class="hidden sm:inline">Schedule</span>
              </button>
              @if (isOwnedPlan(plan.id)) {
                <button [routerLink]="['/plans/edit', plan.id]" class="px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold text-sm">
                  <mat-icon class="text-[16px] align-middle" style="font-size:16px;width:16px;height:16px;">edit</mat-icon>
                  <span class="hidden sm:inline">Edit</span>
                </button>
              }
            </div>
          </div>
        }
      </div>
    </div>

    <!-- FAB -->
    <app-fab-button (fabClick)="goToCreatePlan()" />

      @if (showScheduleDialog()) {
        <div class="fixed inset-0 z-[70] bg-black/40 flex items-center justify-center p-4">
          <div class="w-full max-w-sm bg-white rounded-2xl p-5 shadow-xl border border-gray-100 space-y-4">
            <div class="flex items-center justify-between">
              <h3 class="text-base font-bold text-gray-900">Schedule Workout</h3>
              <button type="button" (click)="closeScheduleDialog()" class="text-gray-400">
                <mat-icon>close</mat-icon>
              </button>
            </div>
            <p class="text-sm text-gray-500">Pick a date for this workout.</p>
            <input type="date" [(ngModel)]="scheduleDateInput" [min]="minScheduleDate"
                   class="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500">
            <div class="flex items-center justify-end gap-2">
              <button type="button" (click)="closeScheduleDialog()" class="px-3 py-2 rounded-lg text-sm font-semibold text-gray-600 bg-gray-100">Cancel</button>
              <button type="button" (click)="confirmSchedule()" class="px-3 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600">Schedule</button>
            </div>
          </div>
        </div>
      }
  `
})
export class PlansComponent {
  workoutService = inject(WorkoutService);
  authService = inject(AuthService);
  notifications = inject(NotificationService);
  router = inject(Router);
  
  plans = this.workoutService.plans;
  planInvites = this.workoutService.planInvites;
  sharePlanId = '';
  shareEmail = '';
  showSharePanel = signal(false);
  planSearchQuery = signal('');
  sharingPlan = false;
  unsharingPlan = false;
  shareMessage = '';
  inviteMessage = '';
  activatingPlanId = signal('');
  respondingInviteId = '';

  // ── Schedule state ──
  showScheduleDialog = signal(false);
  schedulePlanId = signal('');
  scheduleDateInput = '';
  minScheduleDate = new Date().toISOString().split('T')[0];

  nextScheduledDate(planId: string): Date | null {
    const now = new Date();
    const matches = this.workoutService.scheduledWorkouts()
      .filter(sw => sw.planId === planId && sw.status === 'scheduled')
      .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());
    return matches.length > 0 ? matches[0].scheduledDate : null;
  }

  openScheduleDialog(planId: string) {
    this.schedulePlanId.set(planId);
    this.scheduleDateInput = new Date().toISOString().split('T')[0];
    this.showScheduleDialog.set(true);
  }

  closeScheduleDialog() {
    this.showScheduleDialog.set(false);
    this.schedulePlanId.set('');
    this.scheduleDateInput = '';
  }

  async confirmSchedule() {
    const planId = this.schedulePlanId();
    if (!planId || !this.scheduleDateInput) return;
    const ok = await this.workoutService.schedulePlan(planId, new Date(this.scheduleDateInput));
    if (ok) {
      this.notifications.success('Workout scheduled.');
    } else {
      this.notifications.error('Failed to schedule workout.');
    }
    this.closeScheduleDialog();
  }

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

  typeEmoji(plan: WorkoutPlan) {
    return getWorkoutTypeEmoji(getWorkoutPlanType(plan)) || '';
  }

  pendingInvites = computed(() => this.planInvites().filter(invite => invite.status === 'pending'));

  async activatePlan(id: string) {
    this.activatingPlanId.set(id);

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

    this.activatingPlanId.set('');

    // Log current plans snapshot after activation attempt
    console.debug('[PlansComponent] activatePlan result=' + ok + ' currentPlans=' + JSON.stringify(this.plans().map(p => ({ id: p.id, isActive: p.isActive }))));

    if (!ok) {
      // Revert optimistic change via service
      console.debug('[PlansComponent] activatePlan revert to previousActiveId=', previousActiveId);
      this.workoutService.setActiveLocally(previousActiveId || null);
      this.notifications.error('Failed to activate plan.');
      return;
    }

    this.notifications.success('Plan activated.', 1000);
  }

  async deactivateActivePlan() {
    const ok = await this.workoutService.clearActivePlan();
    if (!ok) {
      this.notifications.error('Failed to deactivate plan.');
    }
  }

  closeSharePanel() {
    this.showSharePanel.set(false);
    this.shareMessage = '';
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
    if (ok) {
      this.shareEmail = '';
      this.closeSharePanel();
    } else {
      this.shareMessage = 'Failed to share plan.';
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
    if (ok) {
      this.shareEmail = '';
      this.closeSharePanel();
    } else {
      this.shareMessage = 'Failed to unshare plan.';
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
      this.notifications.error('Failed to delete plan.');
    }
  }

  goToCreatePlan() {
    this.router.navigate(['/plans/create']);
  }
}
