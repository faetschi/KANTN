import { Injectable, signal, computed, inject, effect } from '@angular/core';
import { AuthService } from './auth.service';
import { CreateExerciseInput, Exercise, WorkoutPlan, WorkoutSession } from '../models/models';
import { MOCK_EXERCISES, MOCK_PLANS, MOCK_SESSIONS } from '../models/mock-data';
import { WorkoutRepository } from '../repositories/workout.repository';
import { buildPersistedSessionPayload } from '../domain/workout-domain';

@Injectable({
  providedIn: 'root'
})
export class WorkoutService {
  private auth = inject(AuthService);
  private repository = inject(WorkoutRepository);
  private readonly sharedActivePlanStoragePrefix = 'kantn.shared-active-plan:';
  private readonly activeWorkoutStoragePrefix = 'kantn.active-workout:';
  private readonly activeWorkoutDraftStoragePrefix = 'kantn.active-workout-draft:';

  private exercisesSignal = signal<Exercise[]>(MOCK_EXERCISES);
  private plansSignal = signal<WorkoutPlan[]>(MOCK_PLANS);
  private sessionsSignal = signal<WorkoutSession[]>(MOCK_SESSIONS);
  private loadedUserIdSignal = signal<string | null>(null);
  private activeWorkoutSignal = signal<string | null>(null);

  exercises = computed(() => this.exercisesSignal());
  plans = computed(() => this.plansSignal());
  sessions = computed(() => this.sessionsSignal());
  loadedUserId = computed(() => this.loadedUserIdSignal());
  activeWorkoutId = computed(() => this.activeWorkoutSignal());
  
  activePlan = computed(() => this.plansSignal().find(p => p.isActive));

  constructor() {
    effect(() => {
      const currentUser = this.auth.currentUser();
      if (!currentUser) {
        this.loadedUserIdSignal.set(null);
        this.exercisesSignal.set(MOCK_EXERCISES);
        this.plansSignal.set(MOCK_PLANS);
        this.sessionsSignal.set(MOCK_SESSIONS);
        this.activeWorkoutSignal.set(null);
        return;
      }

      if (this.loadedUserIdSignal() !== currentUser.id) {
        this.activeWorkoutSignal.set(this.readActiveWorkout(currentUser.id));
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

  private getSharedActivePlanStorageKey(userId: string) {
    return `${this.sharedActivePlanStoragePrefix}${userId}`;
  }

  private getActiveWorkoutStorageKey(userId: string) {
    return `${this.activeWorkoutStoragePrefix}${userId}`;
  }

  private getActiveWorkoutDraftStorageKey(userId: string) {
    return `${this.activeWorkoutDraftStoragePrefix}${userId}`;
  }

  private readSharedActivePlanPreference(userId: string): string | null {
    try {
      return localStorage.getItem(this.getSharedActivePlanStorageKey(userId));
    } catch {
      return null;
    }
  }

  private writeSharedActivePlanPreference(userId: string, planId: string | null) {
    try {
      const key = this.getSharedActivePlanStorageKey(userId);
      if (!planId) {
        localStorage.removeItem(key);
        return;
      }
      localStorage.setItem(key, planId);
    } catch {
      // Ignore storage issues and keep runtime-only state.
    }
  }

  private readActiveWorkout(userId: string): string | null {
    try {
      return localStorage.getItem(this.getActiveWorkoutStorageKey(userId));
    } catch {
      return null;
    }
  }

  private writeActiveWorkout(userId: string, workoutId: string | null) {
    try {
      const key = this.getActiveWorkoutStorageKey(userId);
      if (!workoutId) {
        localStorage.removeItem(key);
        return;
      }
      localStorage.setItem(key, workoutId);
    } catch {
      // Ignore storage issues and keep runtime-only state.
    }
  }

  setActiveWorkout(workoutId: string | null) {
    const userId = this.getCurrentUserId();
    if (!userId) return;

    this.writeActiveWorkout(userId, workoutId);
    this.activeWorkoutSignal.set(workoutId);
  }

  clearActiveWorkout() {
    this.setActiveWorkout(null);
  }

  saveActiveWorkoutDraft(payload: string) {
    const userId = this.getCurrentUserId();
    if (!userId) return;

    try {
      localStorage.setItem(this.getActiveWorkoutDraftStorageKey(userId), payload);
    } catch {
      // Ignore storage issues and keep runtime-only state.
    }
  }

  readActiveWorkoutDraft() {
    const userId = this.getCurrentUserId();
    if (!userId) return null;

    try {
      return localStorage.getItem(this.getActiveWorkoutDraftStorageKey(userId));
    } catch {
      return null;
    }
  }

  clearActiveWorkoutDraft() {
    const userId = this.getCurrentUserId();
    if (!userId) return;

    try {
      localStorage.removeItem(this.getActiveWorkoutDraftStorageKey(userId));
    } catch {
      // Ignore storage issues and keep runtime-only state.
    }
  }

  private applySharedActivePlanPreference(userId: string, plans: WorkoutPlan[]): WorkoutPlan[] {
    const preferredPlanId = this.readSharedActivePlanPreference(userId);
    if (!preferredPlanId) return plans;

    const preferredPlan = plans.find(plan => plan.id === preferredPlanId);
    if (!preferredPlan || preferredPlan.ownerId === userId) {
      this.writeSharedActivePlanPreference(userId, null);
      return plans;
    }

    return plans.map(plan => ({
      ...plan,
      isActive: plan.id === preferredPlanId,
    }));
  }

  private setLocalActivePlan(planId: string) {
    this.plansSignal.update(plans => plans.map(plan => ({
      ...plan,
      isActive: plan.id === planId,
    })));
  }

  async refresh() {
    const userId = this.getCurrentUserId();
    if (!userId) {
      this.exercisesSignal.set(MOCK_EXERCISES);
      this.plansSignal.set(MOCK_PLANS);
      this.sessionsSignal.set(MOCK_SESSIONS);
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
        this.loadedUserIdSignal.set(userId);
        return;
      }

      this.exercisesSignal.set(data.exercises);
      this.plansSignal.set(this.applySharedActivePlanPreference(userId, data.plans));
      this.sessionsSignal.set(data.sessions);
      this.loadedUserIdSignal.set(userId);
    } catch (error) {
      console.error('Failed to refresh workout data from Supabase', error);
    }
  }

  getPlanById(id: string) {
    return this.plansSignal().find(p => p.id === id);
  }

  getExerciseById(id: string) {
    return this.exercisesSignal().find(e => e.id === id);
  }

  async setActivePlan(planId: string) {
    const userId = this.getCurrentUserId();
    if (!userId) return false;

    const success = await this.repository.setActivePlan(userId, planId);
    if (!success) {
      const plan = this.plansSignal().find(p => p.id === planId);
      if (!plan || plan.ownerId === userId) return false;

      this.writeSharedActivePlanPreference(userId, planId);
      this.setLocalActivePlan(planId);
      return true;
    }

    this.writeSharedActivePlanPreference(userId, null);

    await this.refresh();
    return true;
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

  async updatePlan(planId: string, updates: Pick<WorkoutPlan, 'name' | 'description' | 'exercises'>) {
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
    return mapped;
  }

  async deleteExercise(exerciseId: string) {
    const userId = this.getCurrentUserId();
    if (!userId) return false;

    const success = await this.repository.deleteExercise(userId, exerciseId);
    if (!success) return false;

    this.exercisesSignal.update(exercises => exercises.filter(ex => ex.id !== exerciseId));
    return true;
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

    const success = await this.repository.sharePlan(userId, planId, sharedWithUserId);
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
}
