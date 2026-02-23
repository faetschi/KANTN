import { Injectable, signal, computed } from '@angular/core';
import { Exercise, WorkoutPlan, WorkoutSession } from '../models/models';
import { MOCK_EXERCISES, MOCK_PLANS, MOCK_SESSIONS } from '../models/mock-data';

@Injectable({
  providedIn: 'root'
})
export class WorkoutService {
  private exercisesSignal = signal<Exercise[]>(MOCK_EXERCISES);
  private plansSignal = signal<WorkoutPlan[]>(MOCK_PLANS);
  private sessionsSignal = signal<WorkoutSession[]>(MOCK_SESSIONS);

  exercises = computed(() => this.exercisesSignal());
  plans = computed(() => this.plansSignal());
  sessions = computed(() => this.sessionsSignal());
  
  activePlan = computed(() => this.plansSignal().find(p => p.isActive));

  constructor() {}

  getPlanById(id: string) {
    return this.plansSignal().find(p => p.id === id);
  }

  getExerciseById(id: string) {
    return this.exercisesSignal().find(e => e.id === id);
  }

  setActivePlan(planId: string) {
    this.plansSignal.update(plans => 
      plans.map(p => ({ ...p, isActive: p.id === planId }))
    );
  }

  addSession(session: WorkoutSession) {
    this.sessionsSignal.update(sessions => [session, ...sessions]);
    
    // Update last performed date on plan
    this.plansSignal.update(plans => 
      plans.map(p => 
        p.id === session.planId 
          ? { ...p, lastPerformed: session.date } 
          : p
      )
    );
  }

  createPlan(plan: WorkoutPlan) {
    this.plansSignal.update(plans => [...plans, plan]);
  }

  getLastSessionForPlan(planId: string): WorkoutSession | undefined {
    return this.sessionsSignal()
      .filter(s => s.planId === planId)
      .sort((a, b) => b.date.getTime() - a.date.getTime())[0];
  }
}
