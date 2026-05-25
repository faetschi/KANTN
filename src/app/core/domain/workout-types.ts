import { Exercise, WorkoutPlan } from '../models/models';

export type WorkoutExerciseType = 'strength' | 'cardio' | 'mobility' | 'core' | 'full body' | 'mixed' | 'general' | 'hiit';

export interface WorkoutTypeVisual {
  label: string;
  color: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
}

const TYPE_VISUALS: Record<WorkoutExerciseType, WorkoutTypeVisual> = {
  strength: {
    label: 'Strength',
    color: '#dc2626',
    bgColor: '#fee2e2',
    textColor: '#991b1b',
    borderColor: '#fecaca',
  },
  cardio: {
    label: 'Cardio',
    color: '#ea580c',
    bgColor: '#ffedd5',
    textColor: '#9a3412',
    borderColor: '#fed7aa',
  },
  mobility: {
    label: 'Mobility',
    color: '#16a34a',
    bgColor: '#dcfce7',
    textColor: '#166534',
    borderColor: '#bbf7d0',
  },
  core: {
    label: 'Core',
    color: '#7c3aed',
    bgColor: '#ede9fe',
    textColor: '#5b21b6',
    borderColor: '#ddd6fe',
  },
  'full body': {
    label: 'Full Body',
    color: '#0d9488',
    bgColor: '#ccfbf1',
    textColor: '#115e59',
    borderColor: '#99f6e4',
  },
  mixed: {
    label: 'Mixed',
    color: '#4f46e5',
    bgColor: '#e0e7ff',
    textColor: '#3730a3',
    borderColor: '#c7d2fe',
  },
  general: {
    label: 'General',
    color: '#6b7280',
    bgColor: '#f3f4f6',
    textColor: '#374151',
    borderColor: '#e5e7eb',
  },
  hiit: {
    label: 'HIIT',
    color: '#f59e0b',
    bgColor: '#fef3c7',
    textColor: '#92400e',
    borderColor: '#fde68a',
  },
};

export function normalizeWorkoutType(type: string | null | undefined): WorkoutExerciseType {
  const normalized = (type || '').trim().toLowerCase();
  if (normalized === 'strength' || normalized === 'cardio' || normalized === 'mobility' || normalized === 'core' || normalized === 'full body' || normalized === 'hiit') {
    return normalized;
  }
  if (normalized === 'mixed') return 'mixed';
  return 'general';
}

export function getWorkoutTypeVisual(type: string | null | undefined): WorkoutTypeVisual {
  return TYPE_VISUALS[normalizeWorkoutType(type)];
}

export function workoutTypeBadgeStyle(type: string | null | undefined) {
  const visual = getWorkoutTypeVisual(type);
  return {
    backgroundColor: visual.bgColor,
    borderColor: visual.borderColor,
    color: visual.textColor,
  };
}

export function workoutTypeIconStyle(type: string | null | undefined) {
  const visual = getWorkoutTypeVisual(type);
  return {
    backgroundColor: visual.bgColor,
    color: visual.textColor,
  };
}

export function workoutTypeMarkerStyle(type: string | null | undefined) {
  return {
    backgroundColor: getWorkoutTypeVisual(type).color,
  };
}

export function deriveWorkoutPlanType(exercises: Exercise[]): WorkoutExerciseType {
  if (!exercises.length) return 'general';

  const counts = new Map<WorkoutExerciseType, number>();
  for (const exercise of exercises) {
    const type = normalizeWorkoutType(exercise.exerciseType);
    counts.set(type, (counts.get(type) || 0) + 1);
  }

  const [bestType, bestCount] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
  return bestCount > exercises.length / 2 ? bestType : 'mixed';
}

export function getWorkoutPlanType(plan: Pick<WorkoutPlan, 'exercises' | 'workoutPlanType'> | null | undefined): WorkoutExerciseType {
  if (!plan) return 'general';
  return normalizeWorkoutType(plan.workoutPlanType || deriveWorkoutPlanType(plan.exercises));
}

export function getWorkoutTypeEmoji(type: string | null | undefined): string | null {
  const normalized = (type || '').trim().toLowerCase();
  if (normalized === 'cardio') return '🚴';
  if (normalized === 'strength') return '🏋️';
  if (normalized === 'mobility') return '🧘';
  if (normalized === 'hiit') return '⚡';
  return null;
}

export function getWorkoutPlanEmoji(exercises: Exercise[]): string | null {
  if (!exercises.length) return null;
  return getWorkoutTypeEmoji(deriveWorkoutPlanType(exercises));
}

export function getWorkoutPlanAction(plan: Pick<WorkoutPlan, 'exercises' | 'workoutPlanType'> | null | undefined): {
  actionType: WorkoutExerciseType;
  emoji: string | null;
} {
  const actionType = getWorkoutPlanType(plan);
  return {
    actionType,
    emoji: getWorkoutTypeEmoji(actionType),
  };
}
