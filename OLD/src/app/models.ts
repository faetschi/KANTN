export interface Exercise {
  id: string;
  name: string;
  category: 'Strength' | 'Cardio' | 'Flexibility';
  image: string;
  description: string;
  defaultSets?: number;
  defaultReps?: number;
}

export interface WorkoutExercise {
  exerciseId: string;
  sets: number;
  reps: number;
  weight?: number;
  duration?: number; // in seconds for cardio
}

export interface WorkoutPlan {
  id: string;
  name: string;
  description: string;
  exercises: WorkoutExercise[];
  durationWeeks: number;
  createdAt: Date;
}

export interface ExerciseResult {
  exerciseId: string;
  sets: {
    reps: number;
    weight: number;
  }[];
  duration?: number;
}

export interface WorkoutSession {
  id: string;
  planId: string;
  startTime: Date;
  endTime?: Date;
  results: ExerciseResult[];
  caloriesBurned: number;
}

export interface UserStats {
  totalWorkouts: number;
  totalTimeMinutes: number;
  totalCalories: number;
  weeklyProgress: number[]; // percentage of goal met for last 7 days
}
