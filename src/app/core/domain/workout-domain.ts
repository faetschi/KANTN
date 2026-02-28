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
  const completedExercises = session.exercises.filter(ex => ex.sets.some(s => s.completed));
  const effectiveExercises = completedExercises.length ? completedExercises : session.exercises;

  const baseDuration = effectiveExercises.length ? Math.floor(durationSeconds / effectiveExercises.length) : 0;
  const remainderDuration = effectiveExercises.length ? durationSeconds - (baseDuration * effectiveExercises.length) : 0;

  const exercisePayload = effectiveExercises.map((exerciseSession, index) => {
    const exercise = resolveExerciseById(exerciseSession.exerciseId);
    const exerciseDuration = baseDuration + (index === effectiveExercises.length - 1 ? remainderDuration : 0);
    const metValue = Number(exercise?.metValue ?? 5);

    return {
      exerciseId: exercise?.id || null,
      exerciseNameSnapshot: exercise?.name || 'Custom Exercise',
      exerciseTypeSnapshot: exercise?.exerciseType || 'general',
      metValueSnapshot: metValue,
      position: index,
      durationSeconds: exerciseDuration,
      caloriesBurned: calcCalories(metValue, exerciseDuration, userWeightKg),
      sets: exerciseSession.sets.map(set => ({
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
