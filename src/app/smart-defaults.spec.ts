import { resolveDefault, resolveCardioDefaults, sourceLabel, getUnitMismatchMessage } from './core/domain/smart-defaults';
import { PlanExerciseTarget, WorkoutSession, ExerciseSession } from './core/models/models';

describe('resolveDefault', () => {
  const planTargets: PlanExerciseTarget[] = [
    { id: 't1', planId: 'p1', exerciseId: 'ex1', targetReps: 10, targetWeight: 60 },
    { id: 't2', planId: 'p1', exerciseId: 'ex2', targetReps: 12, targetWeight: 80 },
  ];

  const lastSession: WorkoutSession = {
    id: 's1',
    planId: 'p1',
    date: new Date(Date.now() - 86400000),
    startTime: new Date(Date.now() - 86400000 - 3600000),
    endTime: new Date(Date.now() - 86400000),
    duration: 3600,
    exercises: [
      {
        exerciseId: 'ex1',
        sets: [
          { reps: 8, weight: 55, completed: true },
          { reps: 8, weight: 55, completed: true },
        ],
      },
      {
        exerciseId: 'ex3',
        sets: [
          { reps: 15, weight: 30, completed: true },
        ],
      },
    ],
  };

  it('uses plan target when available', () => {
    const result = resolveDefault('ex1', 'Bench Press', planTargets, lastSession, lastSession.exercises);
    expect(result.source).toBe('plan_target');
    expect(result.reps).toBe(10);
    expect(result.weight).toBe(60);
  });

  it('falls back to last workout when no plan target exists', () => {
    const result = resolveDefault('ex3', 'Dumbbell Curl', [], lastSession, lastSession.exercises);
    expect(result.source).toBe('last_workout');
    expect(result.reps).toBe(15);
    expect(result.weight).toBe(30);
  });

  it('returns empty values when no plan target or history exists', () => {
    const result = resolveDefault('ex99', 'Nonexistent Exercise', [], undefined, undefined);
    expect(result.source).toBe('empty');
    expect(result.reps).toBe(0);
    expect(result.weight).toBe(0);
  });

  it('uses plan target even if last session exists', () => {
    // Plan target should take priority over last workout
    const result = resolveDefault('ex1', 'Bench Press', planTargets, lastSession, lastSession.exercises);
    expect(result.source).toBe('plan_target');
    expect(result.reps).toBe(10);
    expect(result.weight).toBe(60);
  });
});

describe('resolveCardioDefaults', () => {
  const planTargets: PlanExerciseTarget[] = [
    { id: 't3', planId: 'p1', exerciseId: 'ex5', targetDistanceMeters: 5000, targetDurationSeconds: 1800 },
  ];

  const lastSession: WorkoutSession = {
    id: 's2',
    planId: 'p2',
    date: new Date(Date.now() - 86400000 * 3),
    startTime: new Date(Date.now() - 86400000 * 3 - 1800000),
    endTime: new Date(Date.now() - 86400000 * 3),
    duration: 1800,
    exercises: [
      {
        exerciseId: 'ex5',
        sets: [],
        distanceMeters: 4200,
        exerciseDurationSeconds: 1500,
      },
    ],
  };

  it('uses plan target when available', () => {
    const result = resolveCardioDefaults('ex5', planTargets, lastSession);
    expect(result.source).toBe('plan_target');
    expect(result.targetDistanceMeters).toBe(5000);
    expect(result.targetDurationSeconds).toBe(1800);
  });

  it('falls back to last session when no plan target', () => {
    const result = resolveCardioDefaults('ex5', [], lastSession);
    expect(result.source).toBe('last_workout');
    expect(result.targetDistanceMeters).toBe(4200);
  });
});

describe('sourceLabel', () => {
  it('returns correct label for plan_target', () => {
    expect(sourceLabel('plan_target')).toBe('From plan');
  });
  it('returns correct label for last_workout', () => {
    expect(sourceLabel('last_workout')).toBe('From last workout');
  });
  it('returns empty string for empty', () => {
    expect(sourceLabel('empty')).toBe('');
  });
});

describe('getUnitMismatchMessage', () => {
  it('returns warning when plan target differs significantly from last workout', () => {
    const msg = getUnitMismatchMessage('plan_target', 60, 30);
    expect(msg).not.toBeNull();
    expect(msg).toContain('kg vs lb');
  });

  it('returns null when values are close', () => {
    const msg = getUnitMismatchMessage('plan_target', 60, 55);
    expect(msg).toBeNull();
  });

  it('returns null when no comparison data', () => {
    const msg = getUnitMismatchMessage('empty');
    expect(msg).toBeNull();
  });
});
