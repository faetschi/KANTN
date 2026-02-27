import { Exercise, WorkoutPlan, WorkoutSession, User } from './models';

export const MOCK_EXERCISES: Exercise[] = [
  {
    id: '1',
    name: 'Bench Press',
    imageUrl: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8YmVuY2glMjBwcmVzc3xlbnwwfHwwfHx8MA%3D%3D',
    description: 'Lie on a flat bench and press the weight up.',
    muscleGroup: 'Chest'
  },
  {
    id: '2',
    name: 'Squat',
    imageUrl: 'https://picsum.photos/seed/squat/500/500',
    description: 'Stand with feet shoulder-width apart and lower your hips.',
    muscleGroup: 'Legs'
  },
  {
    id: '3',
    name: 'Deadlift',
    imageUrl: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8ZGVhZGxpZnR8ZW58MHx8MHx8fDA%3D',
    description: 'Lift a loaded barbell off the ground to the hips.',
    muscleGroup: 'Back'
  },
  {
    id: '4',
    name: 'Pull Up',
    imageUrl: 'https://picsum.photos/seed/pullup/500/500',
    description: 'Pull yourself up until your chin is above the bar.',
    muscleGroup: 'Back'
  },
  {
    id: '5',
    name: 'Dumbbell Shoulder Press',
    imageUrl: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fGd5bXxlbnwwfHwwfHx8MA%3D%3D',
    description: 'Press dumbbells overhead while seated or standing.',
    muscleGroup: 'Shoulders'
  },
  {
    id: '6',
    name: 'Plank',
    imageUrl: 'https://images.unsplash.com/photo-1566241440091-ec10de8db2e1?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8cGxhbmt8ZW58MHx8MHx8fDA%3D',
    description: 'Hold a push-up position with your body in a straight line.',
    muscleGroup: 'Core'
  }
];

export const MOCK_PLANS: WorkoutPlan[] = [
  {
    id: 'p1',
    name: 'Full Body Beginner',
    description: 'A great start for beginners to hit all muscle groups.',
    exercises: [MOCK_EXERCISES[0], MOCK_EXERCISES[1], MOCK_EXERCISES[3], MOCK_EXERCISES[5]],
    isActive: true,
    lastPerformed: new Date(Date.now() - 86400000 * 2) // 2 days ago
  },
  {
    id: 'p2',
    name: 'Upper Body Power',
    description: 'Focus on chest, back, and shoulders.',
    exercises: [MOCK_EXERCISES[0], MOCK_EXERCISES[2], MOCK_EXERCISES[4]],
    isActive: false
  }
];

export const MOCK_USER: User = {
  id: 'u1',
  name: 'Alex Fitness',
  email: 'alex@example.com',
  height: 180,
  weight: 75,
  age: 28,
  avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8YXZhdGFyfGVufDB8fDB8fHww'
};

export const MOCK_SESSIONS: WorkoutSession[] = [
  {
    id: 's1',
    planId: 'p1',
    date: new Date(Date.now() - 86400000 * 2), // 2 days ago
    startTime: new Date(Date.now() - 86400000 * 2 - 3600000),
    endTime: new Date(Date.now() - 86400000 * 2),
    duration: 3600,
    caloriesBurned: 450,
    exercises: [
      {
        exerciseId: '1',
        sets: [
          { reps: 10, weight: 60, completed: true },
          { reps: 10, weight: 60, completed: true },
          { reps: 10, weight: 60, completed: true }
        ]
      },
      {
        exerciseId: '2',
        sets: [
          { reps: 12, weight: 80, completed: true },
          { reps: 12, weight: 80, completed: true },
          { reps: 12, weight: 80, completed: true }
        ]
      }
    ]
  },
  {
    id: 's2',
    planId: 'p1',
    date: new Date(Date.now() - 86400000 * 5), // 5 days ago
    startTime: new Date(Date.now() - 86400000 * 5 - 3000000),
    endTime: new Date(Date.now() - 86400000 * 5),
    duration: 3000,
    caloriesBurned: 380,
    exercises: [
      {
        exerciseId: '1',
        sets: [
          { reps: 8, weight: 55, completed: true },
          { reps: 8, weight: 55, completed: true },
          { reps: 8, weight: 55, completed: true }
        ]
      }
    ]
  }
];
