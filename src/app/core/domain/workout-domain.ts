import { Exercise, WorkoutSession } from '../models/models';

export interface PersistedSessionExercise {
  exerciseId: string | null;
  exerciseNameSnapshot: string;
  exerciseTypeSnapshot: string;
  metValueSnapshot: number;
  position: number;
  durationSeconds: number;
  caloriesBurned: number;
  sets: {
    reps: number;
    weight: number;
    completed: boolean;
  }[];
  // Cardio-specific fields
  distanceMeters?: number;
  avgPacePerKmSeconds?: number;
  maxPacePerKmSeconds?: number;
  avgSpeedKmh?: number;
}

export interface PersistedSessionPayload {
  startedAtIso: string;
  finishedAtIso: string;
  durationSeconds: number;
  totalCalories: number;
  planId: string | null;
  finishedAtDate: Date;
  exercises: PersistedSessionExercise[];
}

export function calcCalories(metValue: number, durationSeconds: number, weightKg: number): number {
  const safeMet = Math.max(0, metValue || 0);
  const safeWeight = Math.max(0, weightKg || 0);
  const safeDuration = Math.max(0, durationSeconds || 0);
  return Math.round((((safeMet * 3.5 * safeWeight) / 200) * (safeDuration / 60)) * 100) / 100;
}

export function buildPersistedSessionPayload(
  session: WorkoutSession,
  resolveExerciseById: (exerciseId: string) => Exercise | undefined,
  userWeightKg: number
): PersistedSessionPayload {
  const durationSeconds = Math.max(0, session.duration || 0);

  // FIX: Include cardio exercises even without completed sets
  const effectiveExercises = session.exercises.filter(ex => {
    const exercise = resolveExerciseById(ex.exerciseId);
    const isCardio = exercise?.exerciseType === 'cardio';
    const hasCompletedSets = ex.sets.some(s => s.completed);
    return isCardio || hasCompletedSets || ex.sets.length > 0;
  });

  // Separate cardio and strength exercises for duration calculation
  const cardioExercises = effectiveExercises.filter(ex => {
    const exercise = resolveExerciseById(ex.exerciseId);
    return exercise?.exerciseType === 'cardio';
  });
  const strengthExercises = effectiveExercises.filter(ex => {
    const exercise = resolveExerciseById(ex.exerciseId);
    return exercise?.exerciseType !== 'cardio';
  });

  // Calculate total cardio duration from per-exercise durations
  const totalCardioDuration = cardioExercises.reduce((sum, ex) => sum + (ex.exerciseDurationSeconds || 0), 0);
  // Remaining time for strength exercises (even split)
  const strengthDuration = durationSeconds - totalCardioDuration;
  const baseStrengthDuration = strengthExercises.length > 0 ? Math.floor(Math.max(0, strengthDuration) / strengthExercises.length) : 0;
  const remainderStrengthDuration = strengthExercises.length > 0 ? Math.max(0, strengthDuration) - (baseStrengthDuration * strengthExercises.length) : 0;

  let strengthIndex = 0;
  const exercisePayload = effectiveExercises.map((exerciseSession) => {
    const exercise = resolveExerciseById(exerciseSession.exerciseId);
    const isCardio = exercise?.exerciseType === 'cardio';

    // Use per-exercise duration for cardio, even split for strength
    const exerciseDuration = isCardio
      ? (exerciseSession.exerciseDurationSeconds || 0)
      : baseStrengthDuration + (strengthIndex === strengthExercises.length - 1 ? remainderStrengthDuration : 0);

    if (!isCardio) strengthIndex++;

    const metValue = Number(exercise?.metValue ?? 5);

    return {
      exerciseId: exercise?.id || null,
      exerciseNameSnapshot: exercise?.name || 'Custom Exercise',
      exerciseTypeSnapshot: exercise?.exerciseType || 'general',
      metValueSnapshot: metValue,
      position: effectiveExercises.indexOf(exerciseSession),
      durationSeconds: exerciseDuration,
      caloriesBurned: calcCalories(metValue, exerciseDuration, userWeightKg),
      // Cardio fields
      distanceMeters: exerciseSession.distanceMeters || 0,
      avgPacePerKmSeconds: exerciseSession.avgPacePerKmSeconds || 0,
      maxPacePerKmSeconds: exerciseSession.maxPacePerKmSeconds || 0,
      avgSpeedKmh: exerciseSession.avgSpeedKmh || 0,
      // Strength fields (empty for cardio)
      sets: isCardio ? [] : exerciseSession.sets.map(set => ({
        reps: set.reps,
        weight: set.weight,
        completed: !!set.completed,
      })),
    };
  });

  const totalCalories = Math.round(exercisePayload.reduce((acc, ex) => acc + ex.caloriesBurned, 0) * 100) / 100;
  const finishedAtDate = session.endTime || session.date;

  return {
    startedAtIso: session.startTime.toISOString(),
    finishedAtIso: finishedAtDate.toISOString(),
    durationSeconds,
    totalCalories,
    planId: session.planId || null,
    finishedAtDate,
    exercises: exercisePayload,
  };
}
