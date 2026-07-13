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
import { TimeSlot, WorkoutPlan } from '../../core/models/models';
import { TimeSlotPickerComponent, TimeSlotItem } from '../../shared/components/time-slot-picker.component';
import { getWorkoutPlanType, getWorkoutTypeVisual, workoutTypeBadgeStyle, getWorkoutTypeEmoji } from '../../core/domain/workout-types';
import { generateInitialsAvatar } from '../../core/domain/avatar-utils';

@Component({
  selector: 'app-plans',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, FormsModule, SearchBarComponent, FabButtonComponent, TimeSlotPickerComponent],
  template: `
    <div class="p-6 pb-24 space-y-6">
      <header class="flex justify-between items-center">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Workout Plans</h1>
          <p class="text-gray-500 text-sm">Create your perfect workout</p>
        </div>
        <div class="flex items-center gap-3">
          <button (click)="logout()" class="text-xs font-semibold text-red-500">Log Out</button>
          <a [routerLink]="['/profile']" class="w-10 h-10 rounded-full bg-gray-200 overflow-hidden border-2 border-white shadow-sm cursor-pointer block">
            <img [src]="user()?.avatarUrl || generateInitialsAvatar(user()?.name || 'User')" (error)="onAvatarError($event)" alt="Profile" class="w-full h-full object-cover">
          </a>
        </div>
      </header>

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
                    class="flex-1 bg-blue-600 text-white text-xs font-semibold px-3 py-2 rounded-xl disabled:opacity-50"
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
        @for (plan of filteredPlans(); track plan.id; let i = $index) {
          <div class="fade-in relative bg-white rounded-2xl p-5 shadow-sm border border-gray-100 transition-all active:scale-[0.98]" [style.animation-delay]="i * 0.06 + 's'"
               [class.ring-2]="plan.isActive"
               [class.ring-blue-500]="plan.isActive"
               [class.ring-offset-2]="plan.isActive">
            <!-- Header: Name + Avatars + Activate/Active -->
            <div class="flex justify-between items-start gap-3 mb-3">
              <div class="min-w-0 flex-1">
                <h3 class="text-lg font-bold text-gray-900 truncate">{{ plan.name }}</h3>
                @if (sharedByName(plan); as sharer) {
                  <span class="mt-1 inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-600">
                    <img [src]="sharedByAvatar(plan)" class="h-4 w-4 rounded-full object-cover" [alt]="sharer">
                    Shared by {{ sharer }}
                  </span>
                }
              </div>
              <div class="flex items-center gap-2 flex-shrink-0">
                <!-- Exercise avatars -->
                <div class="flex -space-x-2 overflow-hidden">
                  @for (exercise of plan.exercises.slice(0, 3); track exercise.id) {
                    <img [src]="exercise.imageUrl" class="inline-block h-7 w-7 rounded-full ring-2 ring-white object-cover" [alt]="exercise.name">
                  }
                  @if (plan.exercises.length > 3) {
                    <div class="h-7 w-7 rounded-full bg-gray-100 ring-2 ring-white flex items-center justify-center text-[9px] font-bold text-gray-500">
                      +{{ plan.exercises.length - 3 }}
                    </div>
                  }
                </div>
                <!-- Active/Activate badge -->
                @if (plan.isActive) {
                  @if (isOwnedPlan(plan.id)) {
                    <button (click)="deactivateActivePlan()" class="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide cursor-pointer hover:bg-blue-200 transition-colors whitespace-nowrap">Active</button>
                  } @else {
                    <span class="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide whitespace-nowrap">Active</span>
                  }
                } @else {
                  <button (click)="activatePlan(plan.id)" [disabled]="activatingPlanId() !== ''" class="bg-gray-100 text-gray-500 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide cursor-pointer hover:bg-gray-200 transition-colors whitespace-nowrap">{{ activatingPlanId() === plan.id ? 'Activating…' : 'Activate' }}</button>
                }
              </div>
            </div>

            <!-- Badges: Type + Category -->
            <div class="flex flex-wrap items-center gap-2 mb-2">
              <span
                class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide"
                [ngStyle]="typeBadgeStyle(plan)"
              >
                <span class="mr-1" aria-hidden="true">{{ typeEmoji(plan) }}</span>
                {{ typeLabel(plan) }}
              </span>
              @if (plan.category) {
                <span class="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-blue-600">
                  {{ plan.category }}
                </span>
              }
            </div>

            <!-- Description -->
            @if (plan.description) {
              <p class="text-gray-500 text-sm line-clamp-2 mb-3">{{ plan.description }}</p>
            }

            <!-- Delete button (hidden for active plans) -->
            @if (isOwnedPlan(plan.id) && !plan.isActive) {
              <button (click)="confirmDeletePlan(plan.id); $event.stopPropagation()"
                      class="absolute -top-1 -right-1 w-5 h-5 bg-gray-300 text-gray-500 rounded-full flex items-center justify-center hover:bg-gray-400 hover:text-gray-700 transition-colors z-10 text-xs leading-none font-bold">
                ✕
              </button>
            }

            <!-- Actions: Start, Schedule (with date), Edit -->
            <div class="flex gap-3">
              <button [routerLink]="['/workout', plan.id]" class="flex-1 bg-blue-600 text-white py-3 rounded-xl font-semibold text-sm shadow-md active:bg-blue-700">
                Start
              </button>
              <button (click)="openScheduleDialog(plan.id)" class="px-4 py-3 bg-blue-50 text-blue-600 rounded-xl font-semibold text-sm flex items-center gap-1.5 whitespace-nowrap">
                <mat-icon class="text-[16px] align-middle" style="font-size:16px;width:16px;height:16px;">calendar_today</mat-icon>
                @if (nextScheduledDate(plan.id); as sched) {
                  <span>{{ sched | date:'MMM d' }}</span>
                } @else {
                  <span>Schedule</span>
                }
              </button>
              @if (isOwnedPlan(plan.id)) {
                <button [routerLink]="['/plans/edit', plan.id]" class="px-3 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold text-sm">
                  <mat-icon class="text-[16px] align-middle" style="font-size:16px;width:16px;height:16px;">edit</mat-icon>
                  <span class="hidden sm:inline ml-1">Edit</span>
                </button>
              }
            </div>

            <!-- Footer: Last performed / Not started (subdued) -->
            <div class="mt-2.5 flex items-center gap-1.5">
              @if (plan.lastPerformed) {
                <span class="text-[11px] text-gray-400">Last performed {{ plan.lastPerformed | date:'MMM d, yyyy' }}</span>
              } @else {
                <span class="text-[11px] text-gray-400">Not started yet</span>
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
          <div class="fade-in w-full max-w-sm bg-white rounded-2xl p-5 shadow-xl border border-gray-100 space-y-4">
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

      @if (showTimeSlotPicker()) {
        <app-time-slot-picker
          [workouts]="timeSlotItems()"
          (saved)="onTimeSlotsSaved($event)"
          (cancelled)="showTimeSlotPicker.set(false)"
        />
      }
  `,
  styles: [`
    .fade-in { animation: fadeIn 0.5s ease-out backwards; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class PlansComponent {
  workoutService = inject(WorkoutService);
  authService = inject(AuthService);
  notifications = inject(NotificationService);
  router = inject(Router);
  
  plans = this.workoutService.plans;
  planInvites = this.workoutService.planInvites;
  planSearchQuery = signal('');
  inviteMessage = '';
  activatingPlanId = signal('');
  respondingInviteId = '';

  user = this.authService.currentUser;
  generateInitialsAvatar = generateInitialsAvatar;

  onAvatarError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.src = generateInitialsAvatar(this.user()?.name || 'User');
  }

  logout() {
    this.authService.logout();
  }

  // ── Schedule state ──
  showScheduleDialog = signal(false);
  schedulePlanId = signal('');
  scheduleDateInput = '';
  minScheduleDate = new Date().toISOString().split('T')[0];

  // ── Time-slot assignment state ──
  showTimeSlotPicker = signal(false);
  timeSlotItems = signal<TimeSlotItem[]>([]);
  private pendingSchedulePlanId = '';
  private pendingScheduleDate = '';

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

    const date = new Date(this.scheduleDateInput);
    const existing = this.workoutService.getScheduledWorkoutsForDate(date);

    if (existing.length === 0) {
      const ok = await this.workoutService.schedulePlan(planId, date);
      if (ok) {
        this.notifications.success('Workout scheduled.');
      } else {
        this.notifications.error('Failed to schedule workout.');
      }
      this.closeScheduleDialog();
      return;
    }

    // Conflict — show time-slot picker
    const plan = this.workoutService.getPlanById(planId);
    this.pendingSchedulePlanId = planId;
    this.pendingScheduleDate = this.scheduleDateInput;
    this.timeSlotItems.set([
      ...existing.map(sw => ({ id: sw.id, planName: sw.planName, timeSlot: sw.timeSlot ?? null })),
      { id: null, planName: plan?.name || 'New Workout', timeSlot: null },
    ]);
    this.showTimeSlotPicker.set(true);
    this.closeScheduleDialog();
  }

  async onTimeSlotsSaved(items: TimeSlotItem[]) {
    this.showTimeSlotPicker.set(false);

    const newItem = items.find(i => i.id === null);
    const existingItems = items.filter(i => i.id !== null);

    if (newItem?.timeSlot) {
      const ok = await this.workoutService.schedulePlan(this.pendingSchedulePlanId, new Date(this.pendingScheduleDate), newItem.timeSlot);
      if (!ok) {
        this.notifications.error('Failed to schedule workout.');
        return;
      }
    }

    for (const item of existingItems) {
      if (item.id && item.timeSlot) {
        await this.workoutService.updateTimeSlot(item.id, item.timeSlot as TimeSlot);
      }
    }

    this.notifications.success('Workouts scheduled.');
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

  /** Accepted share invite for a plan (used to label plans shared with the current user). */
  private acceptedInviteForPlan(planId: string) {
    return this.planInvites().find(invite => invite.planId === planId && invite.status === 'accepted');
  }

  /** Name of the user who shared this plan with the current user, or null when not a shared plan. */
  sharedByName(plan: WorkoutPlan): string | null {
    if (this.isOwnedPlan(plan.id)) return null;
    const invite = this.acceptedInviteForPlan(plan.id);
    return invite?.sharedByName || invite?.sharedByEmail || null;
  }

  /** Initials avatar for the sharing user, shown next to the shared-by label. */
  sharedByAvatar(plan: WorkoutPlan): string {
    const name = this.sharedByName(plan) || 'User';
    return generateInitialsAvatar(name);
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
    setTimeout(() => this.router.navigate(['/plans/create']), 150);
  }
}
