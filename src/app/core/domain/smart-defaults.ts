import { PlanExerciseTarget, ExerciseSession, Set, WorkoutSession } from '../models/models';

export type DefaultSource = 'plan_target' | 'last_workout' | 'empty';

export interface ResolvedDefault {
  reps: number;
  weight: number;
  source: DefaultSource;
}

export interface ResolvedCardioDefault {
  targetDistanceMeters: number;
  targetDurationSeconds: number;
  source: DefaultSource;
}

const SIMILARITY_THRESHOLD = 0.7;

function wordSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  const shorter = a.length < b.length ? a : b;
  const longer = a.length < b.length ? b : a;
  if (longer.length === 0) return 0;

  const editDist = levenshteinDistance(shorter, longer);
  return 1 - editDist / longer.length;
}

function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b[i - 1] === a[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

export function resolveDefault(
  exerciseId: string,
  exerciseName: string,
  planTargets: PlanExerciseTarget[],
  lastSession: WorkoutSession | undefined,
  lastSessionExercises: ExerciseSession[] | undefined,
): ResolvedDefault {
  // Priority 1: Plan target value
  const planTarget = planTargets.find(t => t.exerciseId === exerciseId);
  if (planTarget && (planTarget.targetReps || planTarget.targetWeight)) {
    return {
      reps: planTarget.targetReps || 0,
      weight: planTarget.targetWeight || 0,
      source: 'plan_target',
    };
  }

  // Priority 2: Last workout value
  if (lastSession && lastSessionExercises) {
    // Try exact ID match first
    let match = lastSessionExercises.find(e => e.exerciseId === exerciseId);
    
    // Fall back to fuzzy name match if no ID match
    if (!match) {
      const allExercises = lastSession.exercises;
      const scored = allExercises
        .map((e, idx) => ({
          index: idx,
          similarity: wordSimilarity(exerciseName, getExerciseNameFromSession(e) || exerciseName),
        }))
        .filter(s => s.similarity >= SIMILARITY_THRESHOLD)
        .sort((a, b) => b.similarity - a.similarity);

      if (scored.length > 0) {
        match = lastSessionExercises[scored[0].index] || allExercises[scored[0].index];
      }
    }

    if (match) {
      const lastSet = match.sets[match.sets.length - 1];
      if (lastSet && (lastSet.reps > 0 || lastSet.weight > 0)) {
        return {
          reps: lastSet.reps,
          weight: lastSet.weight,
          source: 'last_workout',
        };
      }
    }
  }

  // Priority 3: Empty values
  return { reps: 0, weight: 0, source: 'empty' };
}

export function resolveCardioDefaults(
  exerciseId: string,
  planTargets: PlanExerciseTarget[],
  lastSession: WorkoutSession | undefined,
): ResolvedCardioDefault {
  // Priority 1: Plan target
  const planTarget = planTargets.find(t => t.exerciseId === exerciseId);
  if (planTarget && (planTarget.targetDistanceMeters || planTarget.targetDurationSeconds)) {
    return {
      targetDistanceMeters: planTarget.targetDistanceMeters || 0,
      targetDurationSeconds: planTarget.targetDurationSeconds || 0,
      source: 'plan_target',
    };
  }

  // Priority 2: Last session
  if (lastSession) {
    const lastEx = lastSession.exercises.find(e => e.exerciseId === exerciseId);
    if (lastEx && (lastEx.distanceMeters || lastEx.exerciseDurationSeconds)) {
      return {
        targetDistanceMeters: lastEx.distanceMeters || 0,
        targetDurationSeconds: lastEx.exerciseDurationSeconds || 0,
        source: 'last_workout',
      };
    }
  }

  return { targetDistanceMeters: 0, targetDurationSeconds: 0, source: 'empty' };
}

function getExerciseNameFromSession(exercise: ExerciseSession): string | undefined {
  return (exercise as { exerciseNameSnapshot?: string }).exerciseNameSnapshot;
}

export function getUnitMismatchMessage(
  source: DefaultSource,
  planTargetWeight?: number,
  lastWorkoutWeight?: number,
): string | null {
  if (source === 'plan_target' && planTargetWeight !== undefined && lastWorkoutWeight !== undefined) {
    const diff = Math.abs(planTargetWeight - lastWorkoutWeight);
    if (diff > 20) {
      return 'Plan target differs significantly from your last session. Check units (kg vs lb) and adjust if needed.';
    }
  }
  if (source === 'last_workout' && lastWorkoutWeight !== undefined && planTargetWeight !== undefined) {
    const diff = Math.abs(planTargetWeight - lastWorkoutWeight);
    if (diff > 20) {
      return 'Last session value differs from plan target. Verify units are correct.';
    }
  }
  return null;
}

export function sourceLabel(source: DefaultSource): string {
  switch (source) {
    case 'plan_target': return 'From plan';
    case 'last_workout': return 'From last workout';
    case 'empty': return '';
  }
}
