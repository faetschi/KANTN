import { Injectable, signal, computed } from '@angular/core';
import { Exercise, WorkoutPlan, WorkoutSession, UserStats } from './models';

@Injectable({
  providedIn: 'root'
})
export class WorkoutService {
  private exercises = signal<Exercise[]>([
    { id: '1', name: 'Push Ups', category: 'Strength', image: 'https://picsum.photos/seed/pushups/400/300', description: 'Classic chest and triceps exercise.', defaultSets: 3, defaultReps: 12 },
    { id: '2', name: 'Squats', category: 'Strength', image: 'https://picsum.photos/seed/squats/400/300', description: 'Fundamental lower body exercise.', defaultSets: 3, defaultReps: 15 },
    { id: '3', name: 'Running', category: 'Cardio', image: 'https://picsum.photos/seed/running/400/300', description: 'High intensity cardio.', defaultSets: 1, defaultReps: 1 },
    { id: '4', name: 'Plank', category: 'Strength', image: 'https://picsum.photos/seed/plank/400/300', description: 'Core stability exercise.', defaultSets: 3, defaultReps: 1 },
    { id: '5', name: 'Dumbbell Row', category: 'Strength', image: 'https://picsum.photos/seed/row/400/300', description: 'Back and biceps exercise.', defaultSets: 3, defaultReps: 10 },
    { id: '6', name: 'Lunges', category: 'Strength', image: 'https://picsum.photos/seed/lunges/400/300', description: 'Lower body and balance.', defaultSets: 3, defaultReps: 12 },
  ]);

  private plans = signal<WorkoutPlan[]>([
    {
      id: 'p1',
      name: 'Full Body Starter',
      description: 'A balanced routine for beginners.',
      durationWeeks: 4,
      createdAt: new Date(),
      exercises: [
        { exerciseId: '1', sets: 3, reps: 12 },
        { exerciseId: '2', sets: 3, reps: 15 },
        { exerciseId: '5', sets: 3, reps: 10 }
      ]
    },
    {
      id: 'p2',
      name: 'Cardio Blast',
      description: 'Focus on endurance and heart health.',
      durationWeeks: 2,
      createdAt: new Date(),
      exercises: [
        { exerciseId: '3', sets: 1, reps: 1, duration: 1800 },
        { exerciseId: '4', sets: 3, reps: 1 }
      ]
    }
  ]);

  private sessions = signal<WorkoutSession[]>([]);
  private activePlanId = signal<string | null>('p1');

  // Selectors
  readonly allExercises = computed(() => this.exercises());
  readonly allPlans = computed(() => this.plans());
  readonly activePlan = computed(() => this.plans().find(p => p.id === this.activePlanId()) || null);
  readonly history = computed(() => this.sessions().sort((a, b) => b.startTime.getTime() - a.startTime.getTime()));

  readonly stats = computed<UserStats>(() => {
    const history = this.sessions();
    const totalWorkouts = history.length;
    const totalTimeMinutes = history.reduce((acc, s) => {
      if (s.endTime) {
        return acc + (s.endTime.getTime() - s.startTime.getTime()) / 60000;
      }
      return acc;
    }, 0);
    const totalCalories = history.reduce((acc, s) => acc + s.caloriesBurned, 0);
    
    return {
      totalWorkouts,
      totalTimeMinutes: Math.round(totalTimeMinutes),
      totalCalories,
      weeklyProgress: [65, 40, 80, 20, 90, 50, 70] // Mock weekly progress
    };
  });

  setActivePlan(id: string) {
    this.activePlanId.set(id);
  }

  addPlan(plan: WorkoutPlan) {
    this.plans.update(p => [...p, plan]);
  }

  saveSession(session: WorkoutSession) {
    this.sessions.update(s => [...s, session]);
  }

  getExerciseById(id: string) {
    return this.exercises().find(e => e.id === id);
  }

  getPlanById(id: string) {
    return this.plans().find(p => p.id === id);
  }

  getLastSessionForPlan(planId: string) {
    return this.sessions().filter(s => s.planId === planId).sort((a, b) => b.startTime.getTime() - a.startTime.getTime())[0];
  }
}
