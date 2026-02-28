import { Component, OnInit, OnDestroy, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../core/services/admin.service';
import { SupabaseService } from '../../core/services/supabase.service';
import { WorkoutService } from '../../core/services/workout.service';
import { Exercise } from '../../core/models/models';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-6 space-y-8">
      <section>
        <h2 class="text-2xl font-bold mb-4">Pending Registrations</h2>
        <div *ngIf="pending.length; else none">
          <ul>
            <li *ngFor="let u of pending" class="mb-3">
              <div class="flex items-center justify-between">
                <div>
                  <div class="font-medium">{{ u.display_name || u.email }}</div>
                  <div class="text-sm text-gray-500">{{ u.email }}</div>
                </div>
                <div class="space-x-2">
                  <button [disabled]="actionBusy" (click)="approve(u.id)" class="px-3 py-1 rounded bg-green-600 text-white disabled:opacity-50">Approve</button>
                  <button [disabled]="actionBusy" (click)="decline(u.id)" class="px-3 py-1 rounded bg-red-600 text-white disabled:opacity-50">Decline</button>
                </div>
              </div>
            </li>
          </ul>
        </div>
        <ng-template #none>
          <div class="text-gray-600">No pending users.</div>
        </ng-template>
      </section>

      <section>
        <h2 class="text-2xl font-bold mb-4">All Users</h2>
        <div class="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
          <div class="grid grid-cols-5 gap-2 p-3 text-xs font-semibold uppercase tracking-wider text-gray-400 border-b border-gray-100">
            <div class="col-span-2">User</div>
            <div>Status</div>
            <div>Admin</div>
            <div class="text-right">Actions</div>
          </div>
          <div *ngIf="allUsersLoading" class="p-3 text-sm text-gray-500">Loading All Users...</div>
          <div *ngIf="!allUsersLoading && allUsersLoadTimedOut" class="p-3 text-sm text-red-600">couldnt load All Users</div>

          <ng-container *ngIf="!allUsersLoading && !allUsersLoadTimedOut">
            <div *ngIf="!users.length" class="p-3 text-sm text-gray-500">No users found.</div>

            <div *ngFor="let u of users" class="grid grid-cols-5 gap-2 p-3 items-center border-b border-gray-50">
              <div class="col-span-2">
                <div class="font-medium text-gray-900">{{ u.display_name || u.email }}</div>
                <div class="text-xs text-gray-500">{{ u.email }}</div>
              </div>
              <div>
                <span class="text-xs font-semibold" [class.text-green-600]="u.approved" [class.text-orange-500]="!u.approved">
                  {{ u.approved ? 'Approved' : 'Pending' }}
                </span>
              </div>
              <div>
                <span class="text-xs font-semibold" [class.text-blue-600]="u.is_admin" [class.text-gray-400]="!u.is_admin">
                  {{ u.is_admin ? 'Admin' : 'User' }}
                </span>
              </div>
              <div class="flex justify-end gap-2">
                <button *ngIf="u.approved" [disabled]="actionBusy" (click)="revoke(u.id)" class="px-2 py-1 text-xs rounded bg-gray-200 text-gray-700 disabled:opacity-50">Revoke</button>
              </div>
            </div>
          </ng-container>
        </div>
      </section>

      <section>
        <h2 class="text-2xl font-bold mb-4">Default Exercises</h2>
        <div class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input [(ngModel)]="exerciseForm.name" placeholder="Exercise name" class="border border-gray-200 rounded-xl px-3 py-2" />
            <input [(ngModel)]="exerciseForm.muscleGroup" placeholder="Muscle group" class="border border-gray-200 rounded-xl px-3 py-2" />
            <input [(ngModel)]="exerciseForm.exerciseType" placeholder="Exercise type" class="border border-gray-200 rounded-xl px-3 py-2" />
            <input [(ngModel)]="exerciseForm.metValue" type="number" placeholder="MET value" class="border border-gray-200 rounded-xl px-3 py-2" />
          </div>
          <textarea [(ngModel)]="exerciseForm.description" rows="2" placeholder="Description" class="w-full border border-gray-200 rounded-xl px-3 py-2"></textarea>
          <div class="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-center">
            <input [(ngModel)]="exerciseForm.imageUrl" placeholder="Image URL" class="border border-gray-200 rounded-xl px-3 py-2" />
            <div class="flex items-center gap-2">
              <input #exerciseFileInput type="file" accept="image/*" (change)="onExerciseImageSelected($event)" class="hidden" />
              <button type="button" (click)="exerciseFileInput.click()" class="px-3 py-2 rounded-xl bg-gray-200 text-gray-800 text-sm">Upload</button>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button (click)="saveDefaultExercise()" [disabled]="exerciseBusy" class="px-4 py-2 rounded-xl bg-blue-600 text-white disabled:opacity-50">
              {{ selectedExerciseId ? 'Update Exercise' : 'Create Default Exercise' }}
            </button>
            <button *ngIf="selectedExerciseId" (click)="resetExerciseForm()" class="px-4 py-2 rounded-xl bg-gray-200 text-gray-800">Cancel</button>
            <span class="text-sm text-gray-500" *ngIf="exerciseMessage">{{ exerciseMessage }}</span>
          </div>
        </div>

        <div class="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 mt-4">
          <div class="grid grid-cols-6 gap-2 p-3 text-xs font-semibold uppercase tracking-wider text-gray-400 border-b border-gray-100">
            <div class="col-span-2">Exercise</div>
            <div>Type</div>
            <div>Visibility</div>
            <div>MET</div>
            <div class="text-right">Actions</div>
          </div>

          <div *ngIf="exercisesLoading" class="p-3 text-sm text-gray-500">Loading exercises...</div>
          <div *ngIf="!exercisesLoading && !defaultExercises.length" class="p-3 text-sm text-gray-500">No default exercises yet.</div>

          <div *ngFor="let ex of defaultExercises" class="grid grid-cols-6 gap-2 p-3 items-center border-b border-gray-50">
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
        </div>
      </section>
    </div>
  `
})
export class AdminComponent implements OnInit, OnDestroy {
  pending: any[] = [];
  users: any[] = [];

  allUsersLoading = true;
  allUsersLoadTimedOut = false;

  private destroyRequested = false;
  private retryTimer: any = null;
  private secondPassTimer: any = null;
  private retryStartedAt = 0;
  private retryTimedOutShown = false;
  private authStateSub: any = null;
  private attemptCount = 0;
  private secondPassTriggered = false;
  actionBusy = false;
  workoutService = inject(WorkoutService);

  defaultExercises: Exercise[] = [];
  exercisesLoading = true;
  exerciseBusy = false;
  exerciseMessage = '';
  selectedExerciseId: string | null = null;
  exerciseForm = {
    name: '',
    description: '',
    imageUrl: '',
    muscleGroup: '',
    exerciseType: 'general',
    metValue: 5,
  };

  private cdr = inject(ChangeDetectorRef);

  constructor(private admin: AdminService, private supabase: SupabaseService) {}

  async ngOnInit() {
    void this.loadPendingUsers();
    await this.loadDefaultExercises();

    const client = this.supabase.getClient();
    if (client) {
      const listener = client.auth.onAuthStateChange((_event, session) => {
        console.debug('[AdminComponent] auth state changed', { hasSession: !!session });
        void this.tryInstantAllUsersLoad();
      });
      this.authStateSub = (listener as any)?.data?.subscription ?? null;
    }

    // Pragmatic fallback: mimic a second Admin click once after initial render
    // (the manual action that users report always makes data appear).
    this.secondPassTimer = setTimeout(() => {
      void this.runSecondPassIfNeeded();
    }, 1200);

    void this.loadAllUsersWithRetry();
  }

  private async loadDefaultExercises() {
    this.exercisesLoading = true;
    await this.workoutService.refresh();
    this.defaultExercises = this.workoutService.exercises().filter(ex => ex.visibility === 'default');
    this.exercisesLoading = false;
    this.cdr.detectChanges();
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

    this.exerciseBusy = true;
    this.exerciseMessage = 'Uploading image...';
    const url = await this.workoutService.uploadExerciseImage(file);
    this.exerciseBusy = false;

    if (!url) {
      this.exerciseMessage = 'Image upload failed.';
      this.cdr.detectChanges();
      return;
    }

    this.exerciseForm.imageUrl = url;
    this.exerciseMessage = 'Image uploaded.';
    this.cdr.detectChanges();
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
    this.cdr.detectChanges();
  }

  ngOnDestroy(): void {
    this.destroyRequested = true;
    if (this.retryTimer) clearTimeout(this.retryTimer);
    if (this.secondPassTimer) clearTimeout(this.secondPassTimer);
    if (this.authStateSub?.unsubscribe) this.authStateSub.unsubscribe();
  }

  private async runSecondPassIfNeeded() {
    if (this.destroyRequested || this.secondPassTriggered) return;
    if (this.users.length > 0) return;

    this.secondPassTriggered = true;
    console.debug('[AdminComponent] running automatic second-pass load');

    await this.loadPendingUsers();
    const loaded = await this.loadAllUsersOnce();
    if (loaded) {
      this.allUsersLoading = false;
      this.allUsersLoadTimedOut = false;
      this.cdr.detectChanges();
    }
  }

  private async loadPendingUsers() {
    const res: any = await this.admin.getPendingUsers();
    this.pending = res?.data || [];
    this.cdr.detectChanges();
  }

  private async loadPendingUsersSafe() {
    try {
      await this.loadPendingUsers();
    } catch {
      // keep retry loop alive
    }
  }

  private async loadAllUsersOnce(): Promise<boolean> {
    try {
      const client = this.supabase.getClient();
      if (!client) {
        console.debug('[AdminComponent] loadAllUsersOnce: no supabase client yet');
        return false;
      }

      const timeoutAfter = <T>(promise: Promise<T>, ms: number): Promise<T> =>
        new Promise<T>((resolve, reject) => {
          const timer = setTimeout(() => reject(new Error('timeout')), ms);
          promise
            .then((result) => {
              clearTimeout(timer);
              resolve(result);
            })
            .catch((error) => {
              clearTimeout(timer);
              reject(error);
            });
        });

      const all = await timeoutAfter(this.admin.getAllUsers(), 3000);
      if ((all as any)?.error) {
        console.debug('[AdminComponent] loadAllUsersOnce: getAllUsers error', (all as any).error);
        return false;
      }

      if (!Array.isArray((all as any)?.data)) {
        console.debug('[AdminComponent] loadAllUsersOnce: getAllUsers data not array');
        return false;
      }

      const rows = (all as any).data as any[];
      this.users = rows;
      this.cdr.detectChanges();
      if (rows.length === 0) {
        console.debug('[AdminComponent] loadAllUsersOnce: empty rows, will retry');
        // Force a session refresh in case the client hasn't fully initialized its auth headers
        try {
          const client = this.supabase.getClient();
          if (client) await client.auth.refreshSession();
        } catch {
          // ignore
        }
        return false;
      }
      console.debug('[AdminComponent] loadAllUsersOnce: success', { count: rows.length });
      return true;
    } catch (error) {
      if ((error as any)?.message === 'timeout') {
        console.debug('[AdminComponent] loadAllUsersOnce: timed out');
      } else {
        console.debug('[AdminComponent] loadAllUsersOnce: unexpected error', error);
      }
      return false;
    }
  }

  private async tryInstantAllUsersLoad() {
    if (this.destroyRequested) return;
    const loaded = await this.loadAllUsersOnce();
    if (loaded) {
      this.allUsersLoading = false;
      this.allUsersLoadTimedOut = false;
      this.cdr.detectChanges();
    }
  }

  private async loadAllUsersWithRetry() {
    this.allUsersLoading = true;
    this.allUsersLoadTimedOut = false;
    this.retryTimedOutShown = false;
    this.retryStartedAt = Date.now();
    this.attemptCount = 0;

    const timeoutMs = 30000;
    const retryDelayMs = 500;

    while (!this.destroyRequested) {
      this.attemptCount += 1;
      
      await this.loadPendingUsersSafe();

      const loaded = await this.loadAllUsersOnce();
      if (loaded) {
        this.allUsersLoading = false;
        this.allUsersLoadTimedOut = false;
        this.cdr.detectChanges();
        return;
      }

      const elapsed = Date.now() - this.retryStartedAt;
      if (elapsed >= timeoutMs && !this.retryTimedOutShown) {
        this.retryTimedOutShown = true;
        this.allUsersLoading = false;
        this.allUsersLoadTimedOut = true;
        this.cdr.detectChanges();
      }

      await new Promise<void>((resolve) => {
        this.retryTimer = setTimeout(resolve, retryDelayMs);
      });
    }
  }

  async approve(id: string) {
    this.actionBusy = true;
    this.cdr.detectChanges();
    try {
      const res = await this.admin.approveUser(id);
      if (!(res as any)?.error) {
        this.pending = this.pending.filter((u: any) => u.id !== id);
      }
      await this.loadPendingUsersSafe();
      await this.loadAllUsersOnce();
    } finally {
      this.actionBusy = false;
      this.cdr.detectChanges();
    }
  }

  async decline(id: string) {
    this.actionBusy = true;
    this.cdr.detectChanges();
    try {
      const res = await this.admin.declineUser(id);
      if (!(res as any)?.error) {
        this.pending = this.pending.filter((u: any) => u.id !== id);
      }
      await this.loadPendingUsersSafe();
      await this.loadAllUsersOnce();
    } finally {
      this.actionBusy = false;
      this.cdr.detectChanges();
    }
  }

  async revoke(id: string) {
    this.actionBusy = true;
    this.cdr.detectChanges();
    try {
      await this.admin.revokeUser(id);
      await this.loadPendingUsersSafe();
      await this.loadAllUsersOnce();
    } finally {
      this.actionBusy = false;
      this.cdr.detectChanges();
    }
  }
}
