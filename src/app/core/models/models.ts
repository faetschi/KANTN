export interface User {
  id: string;
  name: string;
  email: string;
  height: number; // cm
  weight: number; // kg
  age: number;
  avatarUrl?: string;
  funFact?: string;
}

export interface Exercise {
  id: string;
  name: string;
  imageUrl: string;
  description: string;
  muscleGroup: string;
  exerciseType?: string;
  metValue?: number;
  visibility?: 'default' | 'private' | 'shared';
  createdBy?: string | null;
  isActive?: boolean;
}

export interface Set {
  reps: number;
  weight: number;
  completed: boolean;
}

export interface ExerciseSession {
  exerciseId: string;
  sets: Set[];
  notes?: string;
}

export interface WorkoutSession {
  id: string;
  planId: string;
  date: Date;
  startTime: Date;
  endTime?: Date;
  duration?: number; // seconds
  exercises: ExerciseSession[];
  caloriesBurned?: number;
}

export interface WorkoutPlan {
  id: string;
  name: string;
  description: string;
  exercises: Exercise[];
  schedule?: string[]; // e.g., ['Monday', 'Wednesday', 'Friday']
  isActive: boolean;
  lastPerformed?: Date;
  visibility?: 'private' | 'shared' | 'public';
  ownerId?: string;
}

export interface CreateExerciseInput {
  name: string;
  description?: string;
  imageUrl?: string;
  muscleGroup?: string;
  exerciseType?: string;
  metValue?: number;
  visibility?: 'default' | 'private' | 'shared';
}
