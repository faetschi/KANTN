import { Injectable, signal, computed, inject, effect } from '@angular/core';
import { AuthService } from './auth.service';
import { CreateExerciseInput, Exercise, InProgressWorkout, WorkoutPlan, WorkoutPlanInvite, WorkoutSession } from '../models/models';
import { MOCK_EXERCISES, MOCK_PLANS, MOCK_SESSIONS } from '../models/mock-data';
import { WorkoutRepository } from '../repositories/workout.repository';
import { buildPersistedSessionPayload } from '../domain/workout-domain';
import { deriveWorkoutPlanType } from '../domain/workout-types';

@Injectable({
  providedIn: 'root'
})
export class WorkoutService {
  private auth = inject(AuthService);
  private repository = inject(WorkoutRepository);

  private exercisesSignal = signal<Exercise[]>(MOCK_EXERCISES);
  private plansSignal = signal<WorkoutPlan[]>(MOCK_PLANS);
  private sessionsSignal = signal<WorkoutSession[]>(MOCK_SESSIONS);
  private planInvitesSignal = signal<WorkoutPlanInvite[]>([]);
  private loadedUserIdSignal = signal<string | null>(null);
  // In-progress workout saved across route changes so users can continue
  private inProgressSignal = signal<InProgressWorkout | null>(null);

  exercises = computed(() => this.exercisesSignal());
  plans = computed(() => this.plansSignal());
  sessions = computed(() => this.sessionsSignal());
  planInvites = computed(() => this.planInvitesSignal());
  loadedUserId = computed(() => this.loadedUserIdSignal());
  
  activePlan = computed(() => this.plansSignal().find(p => p.isActive));

  constructor() {
    effect(() => {
      const currentUser = this.auth.currentUser();
      if (!currentUser) {
        this.loadedUserIdSignal.set(null);
        this.exercisesSignal.set(MOCK_EXERCISES);
        this.plansSignal.set(MOCK_PLANS);
        this.sessionsSignal.set(MOCK_SESSIONS);
        return;
      }

      if (this.loadedUserIdSignal() !== currentUser.id) {
        void this.refresh();
      }
    });
  }

  private getCurrentUserId() {
    return this.auth.currentUser()?.id || null;
  }

  private getUserWeightKg() {
    return this.auth.currentUser()?.weight || 70;
  }

  async refresh() {
    const userId = this.getCurrentUserId();
    if (!userId) {
      this.exercisesSignal.set(MOCK_EXERCISES);
      this.plansSignal.set(MOCK_PLANS);
      this.sessionsSignal.set(MOCK_SESSIONS);
      this.planInvitesSignal.set([]);
      this.loadedUserIdSignal.set(userId);
      return;
    }

    try {
      await this.repository.ensureFirstRunSeed(userId);

      const data = await this.repository.loadDashboardData(userId);
      if (!data) {
        console.warn('Supabase client missing while authenticated; disabling persisted workout data view.');
        this.exercisesSignal.set([]);
        this.plansSignal.set([]);
        this.sessionsSignal.set([]);
        this.planInvitesSignal.set([]);
        this.loadedUserIdSignal.set(userId);
        return;
      }

      this.exercisesSignal.set(data.exercises);
      this.plansSignal.set(data.plans);
      this.sessionsSignal.set(data.sessions);
      this.planInvitesSignal.set(data.planInvites || []);
      this.loadedUserIdSignal.set(userId);
    } catch (error) {
      console.error('Failed to refresh workout data from Supabase', error);
    }
  }

  getPlanById(id: string) {
    return this.plansSignal().find(p => p.id === id);
  }

  /**
   * Apply an optimistic local active toggle for UI responsiveness.
   * Pass `planId` to activate that plan locally, or `null` to clear active.
   */
  setActiveLocally(planId: string | null) {
    const before = this.plansSignal().map(p => ({ id: p.id, isActive: p.isActive }));
    console.debug('[WorkoutService] setActiveLocally before: ' + JSON.stringify(before));
    this.plansSignal.update(plans => plans.map(p => ({ ...p, isActive: (planId ? p.id === planId : false) })));
    const after = this.plansSignal().map(p => ({ id: p.id, isActive: p.isActive }));
    console.debug('[WorkoutService] setActiveLocally after: ' + JSON.stringify(after));
  }

  /**
   * Mark a plan as started locally (optimistic UI). This sets `lastPerformed`
   * to the provided start time so the UI reflects the workout as started.
   */
  markPlanStartedLocally(planId: string, startedAt: Date) {
    this.plansSignal.update(plans => plans.map(p => p.id === planId ? ({ ...p, lastPerformed: startedAt }) : p));
  }

  /**
   * Mark a plan as completed locally (optimistic UI). This sets `lastPerformed`
   * to the provided finish time so the UI reflects completion immediately.
   */
  markPlanCompletedLocally(planId: string, finishedAt: Date) {
    this.plansSignal.update(plans => plans.map(p => p.id === planId ? ({ ...p, lastPerformed: finishedAt }) : p));
  }

  getExerciseById(id: string) {
    return this.exercisesSignal().find(e => e.id === id);
  }

  async setActivePlan(planId: string) {
    const userId = this.getCurrentUserId();
    if (!userId) return false;

    const targetPlan = this.plansSignal().find(p => p.id === planId);
    if (!targetPlan) return false;

    const isOwnedTarget = targetPlan.ownerId === userId;

    if (isOwnedTarget && targetPlan.isActive) {
      return true;
    }

    const previousActive = this.plansSignal().find(p => p.isActive && p.ownerId === userId)?.id || null;

    if (!isOwnedTarget) {
      // Shared/public plans cannot be directly updated due to RLS.
      // Create a user-owned copy and activate that copy instead.
      try {
        const clonedPlanId = await this.repository.createPlan(userId, {
          ...targetPlan,
          id: '',
          isActive: true,
          visibility: 'private',
          ownerId: userId,
        });

        if (!clonedPlanId) return false;

        await this.refresh();
        return this.plansSignal().some(p => p.id === clonedPlanId && p.isActive && p.ownerId === userId);
      } catch (err) {
        console.error('[WorkoutService] setActivePlan clone+activate error', err);
        return false;
      }
    }

    // Optimistic local update
    console.debug('[WorkoutService] setActivePlan optimistic start: ' + planId + ' previousActive=' + previousActive);
    this.setActiveLocally(planId);

    try {
      const success = await this.repository.setActivePlan(userId, planId);
      if (!success) {
        // revert optimistic change
        console.debug('[WorkoutService] setActivePlan repository failed, reverting to ' + previousActive);
        this.setActiveLocally(previousActive);
        return false;
      }
      // Re-sync from backend to keep local state canonical.
      await this.refresh();
      const confirmed = this.plansSignal().some(p => p.id === planId && p.isActive);
      if (!confirmed) {
        console.debug('[WorkoutService] setActivePlan not confirmed after refresh for ' + planId);
      }
      console.debug('[WorkoutService] setActivePlan repository success for ' + planId);
      return confirmed;
    } catch (err) {
      console.error('[WorkoutService] setActivePlan error', err);
      this.setActiveLocally(previousActive);
      return false;
    }
  }

  async addSession(session: WorkoutSession) {
    const userId = this.getCurrentUserId();
    if (!userId) return false;

    const payload = buildPersistedSessionPayload(
      session,
      exerciseId => this.getExerciseById(exerciseId),
      this.getUserWeightKg()
    );

    const success = await this.repository.insertSession(userId, payload);
    if (!success) return false;

    await this.refresh();
    return true;
  }

  async createPlan(plan: WorkoutPlan) {
    const userId = this.getCurrentUserId();
    if (!userId) return null;

    const planId = await this.repository.createPlan(userId, plan);
    if (!planId) return null;

    await this.refresh();
    return planId;
  }

  async updatePlan(planId: string, updates: Pick<WorkoutPlan, 'name' | 'description' | 'exercises' | 'category'>) {
    const userId = this.getCurrentUserId();
    if (!userId) return false;

    const success = await this.repository.updatePlan(userId, planId, updates);
    if (!success) return false;

    await this.refresh();
    return true;
  }

  async createExercise(input: CreateExerciseInput) {
    const userId = this.getCurrentUserId();
    if (!userId) return null;

    const mapped = await this.repository.createExercise(userId, input);
    if (!mapped) return null;

    this.exercisesSignal.update(exercises => [mapped, ...exercises]);
    return mapped;
  }

  async updateExercise(exerciseId: string, updates: Partial<CreateExerciseInput>) {
    const mapped = await this.repository.updateExercise(exerciseId, updates);
    if (!mapped) return null;

    this.exercisesSignal.update(exercises => exercises.map(ex => ex.id === mapped.id ? mapped : ex));
    this.plansSignal.update(plans => plans.map(plan => {
      const exercises = plan.exercises.map(exercise => exercise.id === mapped.id ? mapped : exercise);
      return { ...plan, exercises, workoutPlanType: deriveWorkoutPlanType(exercises) };
    }));
    return mapped;
  }

  async shareExercise(exerciseId: string, sharedWithUserId: string) {
    const userId = this.getCurrentUserId();
    if (!userId) return false;

    return this.repository.shareExercise(userId, exerciseId, sharedWithUserId);
  }

  async unshareExercise(exerciseId: string, sharedWithUserId: string) {
    const userId = this.getCurrentUserId();
    if (!userId) return false;

    const success = await this.repository.unshareExercise(userId, exerciseId, sharedWithUserId);
    if (!success) return false;

    await this.refresh();
    return true;
  }

  async sharePlan(planId: string, sharedWithUserId: string) {
    const userId = this.getCurrentUserId();
    if (!userId) return false;

    const shareBy = this.auth.currentUser();

    const success = await this.repository.sharePlan(userId, planId, sharedWithUserId, {
      name: shareBy?.name,
      email: shareBy?.email,
    });
    if (!success) return false;

    await this.refresh();
    return true;
  }

  async respondToPlanInvite(shareId: string, accept: boolean) {
    const userId = this.getCurrentUserId();
    if (!userId) return false;

    const success = await this.repository.respondToPlanShare(shareId, accept);
    if (!success) return false;

    await this.refresh();
    return true;
  }

  async unsharePlan(planId: string, sharedWithUserId: string) {
    const userId = this.getCurrentUserId();
    if (!userId) return false;

    const success = await this.repository.unsharePlan(userId, planId, sharedWithUserId);
    if (!success) return false;

    await this.refresh();
    return true;
  }

  async deleteExercise(exerciseId: string) {
    const userId = this.getCurrentUserId();
    if (!userId) return false;

    const success = await this.repository.deleteExercise(userId, exerciseId);
    if (!success) return false;

    await this.refresh();
    return true;
  }

  async deletePlan(planId: string) {
    const userId = this.getCurrentUserId();
    if (!userId) return false;

    const success = await this.repository.deletePlan(userId, planId);
    if (!success) return false;

    await this.refresh();
    return true;
  }

  async resolveUserIdByEmail(email: string) {
    return this.repository.resolveUserIdByEmail(email);
  }

  async uploadExerciseImage(file: File) {
    const userId = this.getCurrentUserId();
    if (!userId) return null;

    return this.repository.uploadExerciseImage(userId, file);
  }

  getLastSessionForPlan(planId: string): WorkoutSession | undefined {
    return this.sessionsSignal()
      .filter(s => s.planId === planId)
      .sort((a, b) => b.date.getTime() - a.date.getTime())[0];
  }

  setInProgress(payload: InProgressWorkout) {
    this.inProgressSignal.set(payload);
  }

  clearInProgress() {
    this.inProgressSignal.set(null);
  }

  inProgress(): InProgressWorkout | null {
    return this.inProgressSignal();
  }

  hasInProgressForPlan(planId: string) {
    const p = this.inProgressSignal();
    if (!p) return false;
    return p.planId === planId;
  }
}
