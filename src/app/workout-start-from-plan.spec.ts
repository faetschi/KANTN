import { describe, it, expect, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { convertToParamMap, ActivatedRoute, Router } from '@angular/router';
import { WorkoutComponent } from './features/workout/workout.component';
import { WorkoutService } from './core/services/workout.service';
import { Exercise, PlanExerciseTarget } from './core/models/models';

/**
 * Epic 2 / Story 1: "start a workout from my plan". Covers that opening the
 * workout screen for a plan id maps the plan's exercises into the active
 * workout state and prefills them with smart defaults (plan target → last
 * workout → empty).
 */
describe('Start workout from a plan', () => {
  const bench: Exercise = {
    id: 'bench', name: 'Bench Press', imageUrl: '', description: '',
    muscleGroup: 'Chest', exerciseType: 'strength', metValue: 5,
  };
  const squat: Exercise = {
    id: 'squat', name: 'Squat', imageUrl: '', description: '',
    muscleGroup: 'Legs', exerciseType: 'strength', metValue: 5,
  };

  function makePlan() {
    return {
      id: 'plan-1', name: 'Push Day', category: 'strength', visibility: 'default' as const,
      exercises: [bench, squat], createdBy: 'user-1', createdAt: new Date().toISOString(),
      isActive: true,
    };
  }

  async function setup(planTargets: PlanExerciseTarget[], lastSession: unknown = undefined) {
    const plan = makePlan();
    const navigate = vi.fn();
    const markPlanStartedLocally = vi.fn();

    await TestBed.configureTestingModule({
      imports: [WorkoutComponent],
      providers: [
        {
          provide: WorkoutService,
          useValue: {
            getPlanById: vi.fn().mockReturnValue(plan),
            getLastSessionForPlan: vi.fn().mockReturnValue(lastSession),
            getPlanExerciseTargets: vi.fn().mockReturnValue(planTargets),
            getExerciseById: vi.fn((id: string) => [bench, squat].find(e => e.id === id)),
            inProgress: vi.fn().mockReturnValue(null),
            setInProgress: vi.fn(),
            clearInProgress: vi.fn(),
            markPlanStartedLocally,
            markPlanCompletedLocally: vi.fn(),
          },
        },
        { provide: Router, useValue: { navigate } },
        {
          provide: ActivatedRoute,
          useValue: { paramMap: of(convertToParamMap({ planId: 'plan-1' })) },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(WorkoutComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    return { component, navigate, markPlanStartedLocally };
  }

  it('opens the plan (not freestyle) and maps every plan exercise into the workout state', async () => {
    const { component, markPlanStartedLocally } = await setup([]);

    expect(component.planId()).toBe('plan-1');
    expect(component.freestyleMode()).toBe(false);

    const data = component.workoutData();
    expect(data.has('bench')).toBe(true);
    expect(data.has('squat')).toBe(true);
    // Each exercise starts with the standard three working sets.
    expect(data.get('bench')?.length).toBe(3);

    // Starting the plan marks it as started so the UI reflects it.
    expect(markPlanStartedLocally).toHaveBeenCalledWith('plan-1', expect.anything());
  });

  it('prefills sets from the plan target when one exists (source = plan_target)', async () => {
    const targets: PlanExerciseTarget[] = [
      { id: 't1', planId: 'plan-1', exerciseId: 'bench', targetReps: 8, targetWeight: 60 },
    ];
    const { component } = await setup(targets);

    const benchSets = component.workoutData().get('bench');
    expect(benchSets?.[0].reps).toBe(8);
    expect(benchSets?.[0].weight).toBe(60);
    expect(benchSets?.[0].source).toBe('plan_target');

    // No target for squat and no last session → empty defaults.
    const squatSets = component.workoutData().get('squat');
    expect(squatSets?.[0].reps).toBe(0);
    expect(squatSets?.[0].source).toBe('empty');
  });

  it('falls back to last-workout values when there is no plan target', async () => {
    const lastSession = {
      id: 's1', planId: 'plan-1', date: new Date(), createdAt: new Date(),
      exercises: [
        { exerciseId: 'bench', sets: [{ reps: 10, weight: 50, completed: true }] },
      ],
    };
    const { component } = await setup([], lastSession);

    const benchSets = component.workoutData().get('bench');
    expect(benchSets?.[0].reps).toBe(10);
    expect(benchSets?.[0].weight).toBe(50);
    expect(benchSets?.[0].source).toBe('last_workout');
  });
});
