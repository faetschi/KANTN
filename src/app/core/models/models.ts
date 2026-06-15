export interface User {
  id: string;
  name: string;
  username?: string;
  email: string;
  height: number; // cm
  weight: number; // kg
  age: number;
  avatarUrl?: string;
  lastSeen?: string;
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
  source?: import('../domain/smart-defaults').DefaultSource;
}

export interface ExerciseSession {
  exerciseId: string;
  sets: Set[];
  exerciseTypeSnapshot?: string;
  notes?: string;
  // Cardio-specific fields
  distanceMeters?: number;
  avgPacePerKmSeconds?: number;
  maxPacePerKmSeconds?: number;
  avgSpeedKmh?: number;
  exerciseDurationSeconds?: number;
  mapSnapshotUrl?: string;
}

export interface WorkoutSession {
  id: string;
  planId: string;
  date: Date;
  createdAt: Date;
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
  category?: 'upper body' | 'lower body' | 'core' | 'mobility' | 'full body' | 'running' | 'cycling' | 'swimming' | 'hiking';
  workoutPlanType?: string;
  exercises: Exercise[];
  schedule?: string[]; // e.g., ['Monday', 'Wednesday', 'Friday']
  isActive: boolean;
  lastPerformed?: Date;
  visibility?: 'private' | 'shared' | 'public';
  ownerId?: string;
}

export interface WorkoutPlanInvite {
  id: string;
  planId: string;
  planName: string;
  planDescription: string;
  sharedByName?: string;
  sharedByEmail?: string;
  sharedAt: Date;
  status: 'pending' | 'accepted' | 'declined';
}

export interface CardioExerciseData {
  startTime: number;
  elapsedSeconds: number;
  distanceMeters: number;
  currentPaceSecondsPerKm: number;
  avgPaceSecondsPerKm: number;
  maxPaceSecondsPerKm: number;
  avgSpeedKmh: number;
  gpsEnabled: boolean;
  gpsCoordinates: Array<{lat: number; lng: number; timestamp: number}>;
  mapSnapshotUrl?: string;
}

export type ScheduledWorkoutStatus = 'scheduled' | 'completed' | 'missed' | 'skipped';

export interface ScheduledWorkout {
  id: string;
  planId: string;
  planName: string;
  planExercises: Exercise[];
  scheduledDate: Date;
  status: ScheduledWorkoutStatus;
  planCategory?: WorkoutPlan['category'];
}

export interface PlanExerciseTarget {
  id: string;
  planId: string;
  exerciseId: string;
  targetSets?: number;
  targetReps?: number;
  targetWeight?: number;
  targetDistanceMeters?: number;
  targetDurationSeconds?: number;
}

export interface InProgressWorkout {
  planId: string | null;
  freestyleMode: boolean;
  startTime: string;
  elapsedTime: number;
  currentExerciseIndex: number;
  workoutData: Record<string, Set[]>;
  freestyleExercises: Exercise[];
  cardioExerciseData?: Record<string, CardioExerciseData>;
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
