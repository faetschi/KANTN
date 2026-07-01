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
    color: '#ef4444',
    bgColor: '#fee2e2',
    textColor: '#991b1b',
    borderColor: '#fecaca',
  },
  cardio: {
    label: 'Cardio',
    color: '#10b981',
    bgColor: '#d1fae5',
    textColor: '#065f46',
    borderColor: '#a7f3d0',
  },
  mobility: {
    label: 'Mobility',
    color: '#22c55e',
    bgColor: '#dcfce7',
    textColor: '#166534',
    borderColor: '#bbf7d0',
  },
  core: {
    label: 'Core',
    color: '#8b5cf6',
    bgColor: '#ede9fe',
    textColor: '#5b21b6',
    borderColor: '#ddd6fe',
  },
  'full body': {
    label: 'Full Body',
    color: '#14b8a6',
    bgColor: '#ccfbf1',
    textColor: '#115e59',
    borderColor: '#99f6e4',
  },
  mixed: {
    label: 'Mixed',
    color: '#6366f1',
    bgColor: '#e0e7ff',
    textColor: '#3730a3',
    borderColor: '#c7d2fe',
  },
  general: {
    label: 'Freestyle',
    color: '#22d3ee',
    bgColor: '#ecfeff',
    textColor: '#155e75',
    borderColor: '#a5f3fc',
  },
  hiit: {
    label: 'HIIT',
    color: '#fbbf24',
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

const CARDIO_CATEGORIES = new Set(['running', 'cycling', 'swimming', 'hiking']);
const STRENGTH_CATEGORIES = new Set(['upper body', 'lower body', 'core', 'mobility', 'full body']);

export function deriveTypeFromCategory(category: string | undefined | null): WorkoutExerciseType {
  const cat = (category || '').trim().toLowerCase();
  if (CARDIO_CATEGORIES.has(cat)) return 'cardio';
  if (STRENGTH_CATEGORIES.has(cat)) return 'strength';
  return 'general';
}

export function getWorkoutPlanTypeWithFallback(plan: Pick<WorkoutPlan, 'exercises' | 'workoutPlanType' | 'category'> | null | undefined): WorkoutExerciseType {
  if (!plan) return 'general';
  if (plan.workoutPlanType) return normalizeWorkoutType(plan.workoutPlanType);
  if (plan.exercises.length > 0) return deriveWorkoutPlanType(plan.exercises);
  return deriveTypeFromCategory(plan.category);
}

export function getWorkoutPlanType(plan: Pick<WorkoutPlan, 'exercises' | 'workoutPlanType' | 'category'> | null | undefined): WorkoutExerciseType {
  if (!plan) return 'general';
  return getWorkoutPlanTypeWithFallback(plan);
}

export function getScheduledWorkoutType(sw: { planExercises: Exercise[]; planCategory?: string | null } | null | undefined): WorkoutExerciseType {
  if (!sw) return 'general';
  if (sw.planExercises.length > 0) return deriveWorkoutPlanType(sw.planExercises);
  return deriveTypeFromCategory(sw.planCategory);
}

export function getWorkoutTypeEmoji(type: string | null | undefined): string | null {
  const normalized = (type || '').trim().toLowerCase();
  if (normalized === 'cardio') return '🏃';
  if (normalized === 'strength') return '💪';
  if (normalized === 'core') return '🤸';
  if (normalized === 'mobility') return '🧘';
  if (normalized === 'hiit') return '⚡';
  if (normalized === 'general') return '✨';
  return null;
}

export function getWorkoutPlanEmoji(exercises: Exercise[]): string | null {
  if (!exercises.length) return null;
  return getWorkoutTypeEmoji(deriveWorkoutPlanType(exercises));
}

export function getWorkoutPlanAction(plan: Pick<WorkoutPlan, 'exercises' | 'workoutPlanType' | 'category'> | null | undefined): {
  actionType: WorkoutExerciseType;
  emoji: string | null;
} {
  const actionType = getWorkoutPlanType(plan);
  return {
    actionType,
    emoji: getWorkoutTypeEmoji(actionType),
  };
}
