import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { convertToParamMap, ActivatedRoute, Router } from '@angular/router';
import { WorkoutComponent } from './features/workout/workout.component';
import { WorkoutService } from './core/services/workout.service';
import { Exercise, CardioExerciseData, WorkoutSession } from './core/models/models';
import {
  calculateHaversineDistance,
  calculatePace,
  calculateSpeed,
  formatPace,
  formatDistance,
  buildCardioSessionPayload,
} from './core/domain/cardio-utils';
import { calcCalories, buildPersistedSessionPayload } from './core/domain/workout-domain';
import { deriveWorkoutPlanType, normalizeWorkoutType, getWorkoutTypeVisual } from './core/domain/workout-types';

describe('Cardio Unit Tests', () => {

  describe('Haversine Distance Calculation', () => {
    it('calculates distance for same point as 0', () => {
      const dist = calculateHaversineDistance(52.5200, 13.4050, 52.5200, 13.4050);
      expect(dist).toBeCloseTo(0, 1);
    });

    it('calculates approximate distance for Berlin to Munich (~504km)', () => {
      const dist = calculateHaversineDistance(52.5200, 13.4050, 48.1351, 11.5820);
      expect(dist).toBeGreaterThan(490000);
      expect(dist).toBeLessThan(520000);
    });

    it('calculates 1km distance approximately correctly', () => {
      const lat1 = 52.5200;
      const lon1 = 13.4050;
      const lat2 = lat1 + (1000 / 6371000) * (180 / Math.PI);
      const dist = calculateHaversineDistance(lat1, lon1, lat2, lon1);
      expect(dist).toBeGreaterThan(990);
      expect(dist).toBeLessThan(1010);
    });

    it('handles negative coordinates', () => {
      const dist = calculateHaversineDistance(-33.8688, 151.2093, -37.8136, 144.9631);
      expect(dist).toBeGreaterThan(700000);
      expect(dist).toBeLessThan(750000);
    });

    it('handles coordinates crossing the equator', () => {
      const dist = calculateHaversineDistance(1.0, 0.0, -1.0, 0.0);
      expect(dist).toBeGreaterThan(220000);
      expect(dist).toBeLessThan(230000);
    });
  });

  describe('Pace Calculation', () => {
    it('returns 0 when distance is 0', () => {
      expect(calculatePace(600, 0)).toBe(0);
    });

    it('returns 0 when elapsed time is 0', () => {
      expect(calculatePace(0, 5000)).toBe(0);
    });

    it('returns 0 when both are 0', () => {
      expect(calculatePace(0, 0)).toBe(0);
    });

    it('calculates 5km in 25min = 300s/km', () => {
      const pace = calculatePace(25 * 60, 5000);
      expect(pace).toBe(300);
    });

    it('calculates 10km in 50min = 300s/km', () => {
      const pace = calculatePace(50 * 60, 10000);
      expect(pace).toBe(300);
    });

    it('calculates 1km in 5min = 300s/km', () => {
      const pace = calculatePace(300, 1000);
      expect(pace).toBe(300);
    });

    it('handles sub-kilometer distances', () => {
      const pace = calculatePace(60, 200);
      expect(pace).toBe(300);
    });

    it('returns floor value for fractional pace', () => {
      const pace = calculatePace(601, 2000);
      expect(pace).toBe(300);
    });
  });

  describe('Speed Calculation', () => {
    it('returns 0 when elapsed time is 0', () => {
      expect(calculateSpeed(0, 5000)).toBe(0);
    });

    it('returns 0 when distance is 0', () => {
      expect(calculateSpeed(1800, 0)).toBe(0);
    });

    it('calculates 10km in 1 hour = 10 km/h', () => {
      const speed = calculateSpeed(3600, 10000);
      expect(speed).toBeCloseTo(10, 1);
    });

    it('calculates 5km in 30min = 10 km/h', () => {
      const speed = calculateSpeed(1800, 5000);
      expect(speed).toBeCloseTo(10, 1);
    });

    it('calculates 1km in 6min = 10 km/h', () => {
      const speed = calculateSpeed(360, 1000);
      expect(speed).toBeCloseTo(10, 1);
    });

    it('handles sub-kilometer distances', () => {
      const speed = calculateSpeed(360, 500);
      expect(speed).toBeCloseTo(5, 1);
    });
  });

  describe('Format Helpers', () => {
    describe('formatPace', () => {
      it('returns --:-- for 0 pace', () => {
        expect(formatPace(0)).toBe('--:--');
      });

      it('returns --:-- for Infinity', () => {
        expect(formatPace(Infinity)).toBe('--:--');
      });

      it('formats 300s/km as 5:00/km', () => {
        expect(formatPace(300)).toBe('5:00/km');
      });

      it('formats 365s/km as 6:05/km', () => {
        expect(formatPace(365)).toBe('6:05/km');
      });

      it('formats 420s/km as 7:00/km', () => {
        expect(formatPace(420)).toBe('7:00/km');
      });
    });

    describe('formatDistance', () => {
      it('shows meters for distances under 1000', () => {
        expect(formatDistance(500)).toBe('500m');
      });

      it('shows km for distances 1000 and above', () => {
        expect(formatDistance(1000)).toBe('1.00km');
      });

      it('formats 5000m as 5.00km', () => {
        expect(formatDistance(5000)).toBe('5.00km');
      });

      it('formats 3250m as 3.25km', () => {
        expect(formatDistance(3250)).toBe('3.25km');
      });
    });
  });

  describe('Calorie Calculation', () => {
    it('returns 0 for 0 duration', () => {
      expect(calcCalories(9.8, 0, 70)).toBe(0);
    });

    it('returns 0 for 0 MET', () => {
      expect(calcCalories(0, 600, 70)).toBe(0);
    });

    it('returns 0 for 0 weight', () => {
      expect(calcCalories(9.8, 600, 0)).toBe(0);
    });

    it('calculates calories for outdoor run (MET 9.8, 70kg, 30min)', () => {
      const calories = calcCalories(70, 9.8, 1800);
      expect(calories).toBeCloseTo(360.15, 1);
    });

    it('handles negative MET by clamping to 0', () => {
      expect(calcCalories(-5, 600, 70)).toBe(0);
    });
  });

  describe('Cardio Session Payload Building', () => {
    const mockExercise: Exercise = {
      id: 'cardio-ex-1',
      name: 'Outdoor Run',
      imageUrl: '',
      description: '',
      muscleGroup: 'Full Body',
      exerciseType: 'cardio',
      metValue: 9.8,
    };

    const strengthExercise: Exercise = {
      id: 'strength-ex-1',
      name: 'Push-Up',
      imageUrl: '',
      description: '',
      muscleGroup: 'Chest',
      exerciseType: 'strength',
      metValue: 8.0,
    };

    function resolveExerciseById(id: string): Exercise | undefined {
      if (id === 'cardio-ex-1') return mockExercise;
      if (id === 'strength-ex-1') return strengthExercise;
      return undefined;
    }

    it('includes cardio exercise in payload even without sets', () => {
      const session: WorkoutSession = {
        id: 'test-1',
        planId: 'plan-1',
        date: new Date('2026-01-15T10:00:00Z'),
        startTime: new Date('2026-01-15T10:00:00Z'),
        endTime: new Date('2026-01-15T10:30:00Z'),
        duration: 1800,
        exercises: [
          {
            exerciseId: 'cardio-ex-1',
            sets: [],
            distanceMeters: 5000,
            avgPacePerKmSeconds: 360,
            maxPacePerKmSeconds: 400,
            avgSpeedKmh: 10,
            exerciseDurationSeconds: 1800,
          },
        ],
      };

      const payload = buildPersistedSessionPayload(session, resolveExerciseById, 70);
      expect(payload.exercises.length).toBe(1);
      expect(payload.exercises[0].exerciseId).toBe('cardio-ex-1');
      expect(payload.exercises[0].distanceMeters).toBe(5000);
      expect(payload.exercises[0].sets).toEqual([]);
    });

    it('uses per-exercise duration for cardio exercises', () => {
      const session: WorkoutSession = {
        id: 'test-2',
        planId: 'plan-1',
        date: new Date('2026-01-15T10:00:00Z'),
        startTime: new Date('2026-01-15T10:00:00Z'),
        endTime: new Date('2026-01-15T10:30:00Z'),
        duration: 1800,
        exercises: [
          {
            exerciseId: 'cardio-ex-1',
            sets: [],
            distanceMeters: 3000,
            exerciseDurationSeconds: 1200,
          },
        ],
      };

      const payload = buildPersistedSessionPayload(session, resolveExerciseById, 70);
      expect(payload.exercises[0].durationSeconds).toBe(1200);
    });

    it('calculates calories for cardio exercise', () => {
      const session: WorkoutSession = {
        id: 'test-3',
        planId: 'plan-1',
        date: new Date('2026-01-15T10:00:00Z'),
        startTime: new Date('2026-01-15T10:00:00Z'),
        endTime: new Date('2026-01-15T10:30:00Z'),
        duration: 1800,
        exercises: [
          {
            exerciseId: 'cardio-ex-1',
            sets: [],
            distanceMeters: 5000,
            exerciseDurationSeconds: 1800,
          },
        ],
      };

      const payload = buildPersistedSessionPayload(session, resolveExerciseById, 70);
      expect(payload.exercises[0].caloriesBurned).toBeGreaterThan(0);
    });

    it('includes all cardio fields in payload', () => {
      const session: WorkoutSession = {
        id: 'test-4',
        planId: 'plan-1',
        date: new Date('2026-01-15T10:00:00Z'),
        startTime: new Date('2026-01-15T10:00:00Z'),
        endTime: new Date('2026-01-15T10:30:00Z'),
        duration: 1800,
        exercises: [
          {
            exerciseId: 'cardio-ex-1',
            sets: [],
            distanceMeters: 5000,
            avgPacePerKmSeconds: 360,
            maxPacePerKmSeconds: 400,
            avgSpeedKmh: 10.0,
            exerciseDurationSeconds: 1800,
          },
        ],
      };

      const payload = buildPersistedSessionPayload(session, resolveExerciseById, 70);
      const ex = payload.exercises[0];
      expect(ex.distanceMeters).toBe(5000);
      expect(ex.avgPacePerKmSeconds).toBe(360);
      expect(ex.maxPacePerKmSeconds).toBe(400);
      expect(ex.avgSpeedKmh).toBe(10.0);
    });
  });

  describe('Mixed Strength + Cardio Session Payload', () => {
    const cardioExercise: Exercise = {
      id: 'cardio-ex-1',
      name: 'Outdoor Run',
      imageUrl: '',
      description: '',
      muscleGroup: 'Full Body',
      exerciseType: 'cardio',
      metValue: 9.8,
    };

    const strengthExercise: Exercise = {
      id: 'strength-ex-1',
      name: 'Push-Up',
      imageUrl: '',
      description: '',
      muscleGroup: 'Chest',
      exerciseType: 'strength',
      metValue: 8.0,
    };

    function resolveExerciseById(id: string): Exercise | undefined {
      if (id === 'cardio-ex-1') return cardioExercise;
      if (id === 'strength-ex-1') return strengthExercise;
      return undefined;
    }

    it('includes both cardio and strength exercises', () => {
      const session: WorkoutSession = {
        id: 'test-mixed-1',
        planId: 'plan-1',
        date: new Date('2026-01-15T10:00:00Z'),
        startTime: new Date('2026-01-15T10:00:00Z'),
        endTime: new Date('2026-01-15T11:00:00Z'),
        duration: 3600,
        exercises: [
          {
            exerciseId: 'cardio-ex-1',
            sets: [],
            distanceMeters: 5000,
            exerciseDurationSeconds: 1800,
          },
          {
            exerciseId: 'strength-ex-1',
            sets: [{ reps: 10, weight: 0, completed: true }],
          },
        ],
      };

      const payload = buildPersistedSessionPayload(session, resolveExerciseById, 70);
      expect(payload.exercises.length).toBe(2);

      const cardioPayload = payload.exercises.find(e => e.exerciseId === 'cardio-ex-1');
      expect(cardioPayload).toBeTruthy();
      expect(cardioPayload?.sets).toEqual([]);
      expect(cardioPayload?.distanceMeters).toBe(5000);

      const strengthPayload = payload.exercises.find(e => e.exerciseId === 'strength-ex-1');
      expect(strengthPayload).toBeTruthy();
      expect(strengthPayload?.sets.length).toBe(1);
    });

    it('allocates remaining time to strength exercises after cardio duration', () => {
      const session: WorkoutSession = {
        id: 'test-mixed-2',
        planId: 'plan-1',
        date: new Date('2026-01-15T10:00:00Z'),
        startTime: new Date('2026-01-15T10:00:00Z'),
        endTime: new Date('2026-01-15T11:00:00Z'),
        duration: 3600,
        exercises: [
          {
            exerciseId: 'cardio-ex-1',
            sets: [],
            distanceMeters: 5000,
            exerciseDurationSeconds: 1800,
          },
          {
            exerciseId: 'strength-ex-1',
            sets: [{ reps: 10, weight: 0, completed: true }],
          },
          {
            exerciseId: 'strength-ex-2',
            sets: [{ reps: 12, weight: 20, completed: true }],
          },
        ],
      };

      const strengthEx2: Exercise = {
        id: 'strength-ex-2',
        name: 'Squat',
        imageUrl: '',
        description: '',
        muscleGroup: 'Legs',
        exerciseType: 'strength',
        metValue: 5.0,
      };

      const resolveWithExtra = (id: string): Exercise | undefined => {
        if (id === 'cardio-ex-1') return cardioExercise;
        if (id === 'strength-ex-1') return strengthExercise;
        if (id === 'strength-ex-2') return strengthEx2;
        return undefined;
      };

      const payload = buildPersistedSessionPayload(session, resolveWithExtra, 70);
      const strengthExercises = payload.exercises.filter(e => {
        const ex = resolveWithExtra(e.exerciseId || '');
        return ex?.exerciseType !== 'cardio';
      });

      const totalStrengthDuration = strengthExercises.reduce((sum, e) => sum + e.durationSeconds, 0);
      expect(totalStrengthDuration).toBe(1800);
    });
  });
});

describe('Cardio Integration Tests', () => {

  describe('Cardio Session Persistence via WorkoutComponent', () => {
    it('finishes cardio workout and persists session with cardio metrics', async () => {
      const addSession = vi.fn().mockResolvedValue(true);
      const navigate = vi.fn();
      const getExerciseById = vi.fn().mockReturnValue({
        id: 'cardio-ex-1',
        name: 'Outdoor Run',
        imageUrl: 'https://example.com/run.png',
        description: '',
        muscleGroup: 'Full Body',
        exerciseType: 'cardio',
        metValue: 9.8,
      });

      const plan = {
        id: 'cardio-plan-1',
        name: 'Beginner Cardio',
        description: '',
        exercises: [
          {
            id: 'cardio-ex-1',
            name: 'Outdoor Run',
            imageUrl: 'https://example.com/run.png',
            description: '',
            muscleGroup: 'Full Body',
            exerciseType: 'cardio',
            metValue: 9.8,
          },
        ],
        isActive: true,
      };

      await TestBed.configureTestingModule({
        imports: [WorkoutComponent],
        providers: [
          {
            provide: WorkoutService,
            useValue: {
              getPlanById: vi.fn().mockReturnValue(plan),
              getLastSessionForPlan: vi.fn().mockReturnValue(undefined),
              addSession,
              getExerciseById,
            },
          },
          { provide: Router, useValue: { navigate } },
          {
            provide: ActivatedRoute,
            useValue: {
              paramMap: of(convertToParamMap({ planId: 'cardio-plan-1' })),
            },
          },
        ],
      }).compileComponents();

      const fixture = TestBed.createComponent(WorkoutComponent);
      const component = fixture.componentInstance;
      fixture.detectChanges();

      component.elapsedTime.set(1800);

      const cardioData = new Map<string, CardioExerciseData>();
      cardioData.set('cardio-ex-1', {
        startTime: Date.now() - 1800000,
        elapsedSeconds: 1800,
        distanceMeters: 5000,
        currentPaceSecondsPerKm: 360,
        avgPaceSecondsPerKm: 360,
        maxPaceSecondsPerKm: 400,
        avgSpeedKmh: 10.0,
        gpsEnabled: false,
        gpsCoordinates: [],
      });
      component.cardioExerciseData.set(cardioData);

      await component.finishWorkout();
      component.ngOnDestroy();

      expect(addSession).toHaveBeenCalled();
      const sessionArg = addSession.mock.calls[0][0];
      expect(sessionArg.exercises.length).toBe(1);
      expect(sessionArg.exercises[0].exerciseId).toBe('cardio-ex-1');
      expect(sessionArg.exercises[0].distanceMeters).toBe(5000);
      expect(sessionArg.exercises[0].avgPacePerKmSeconds).toBe(360);
      expect(sessionArg.exercises[0].avgSpeedKmh).toBe(10.0);
      expect(sessionArg.exercises[0].exerciseDurationSeconds).toBe(1800);
      expect(navigate).toHaveBeenCalledWith(['/home']);
    });
  });

  describe('Mixed Strength + Cardio Session via WorkoutComponent', () => {
    it('persists both strength and cardio exercises correctly', async () => {
      const addSession = vi.fn().mockResolvedValue(true);
      const navigate = vi.fn();

      const cardioExercise: Exercise = {
        id: 'cardio-ex-1',
        name: 'Outdoor Run',
        imageUrl: 'https://example.com/run.png',
        description: '',
        muscleGroup: 'Full Body',
        exerciseType: 'cardio',
        metValue: 9.8,
      };

      const strengthExercise: Exercise = {
        id: 'strength-ex-1',
        name: 'Push-Up',
        imageUrl: 'https://example.com/pushup.png',
        description: '',
        muscleGroup: 'Chest',
        exerciseType: 'strength',
        metValue: 8.0,
      };

      const plan = {
        id: 'mixed-plan-1',
        name: 'HIIT Mix',
        description: '',
        exercises: [cardioExercise, strengthExercise],
        isActive: true,
      };

      const getExerciseById = (id: string) => id === 'cardio-ex-1' ? cardioExercise : strengthExercise;

      await TestBed.configureTestingModule({
        imports: [WorkoutComponent],
        providers: [
          {
            provide: WorkoutService,
            useValue: {
              getPlanById: vi.fn().mockReturnValue(plan),
              getLastSessionForPlan: vi.fn().mockReturnValue(undefined),
              addSession,
              getExerciseById,
            },
          },
          { provide: Router, useValue: { navigate } },
          {
            provide: ActivatedRoute,
            useValue: {
              paramMap: of(convertToParamMap({ planId: 'mixed-plan-1' })),
            },
          },
        ],
      }).compileComponents();

      const fixture = TestBed.createComponent(WorkoutComponent);
      const component = fixture.componentInstance;
      fixture.detectChanges();

      component.elapsedTime.set(3600);

      const cardioData = new Map<string, CardioExerciseData>();
      cardioData.set('cardio-ex-1', {
        startTime: Date.now() - 1800000,
        elapsedSeconds: 1800,
        distanceMeters: 3000,
        currentPaceSecondsPerKm: 360,
        avgPaceSecondsPerKm: 360,
        maxPaceSecondsPerKm: 380,
        avgSpeedKmh: 10.0,
        gpsEnabled: false,
        gpsCoordinates: [],
      });
      component.cardioExerciseData.set(cardioData);

      await component.finishWorkout();
      component.ngOnDestroy();

      expect(addSession).toHaveBeenCalled();
      const sessionArg = addSession.mock.calls[0][0];
      expect(sessionArg.exercises.length).toBe(2);

      const cardioEx = sessionArg.exercises.find((e: any) => e.exerciseId === 'cardio-ex-1');
      expect(cardioEx).toBeTruthy();
      expect(cardioEx.distanceMeters).toBe(3000);
      expect(cardioEx.sets).toEqual([]);

      const strengthEx = sessionArg.exercises.find((e: any) => e.exerciseId === 'strength-ex-1');
      expect(strengthEx).toBeTruthy();
      expect(strengthEx.sets.length).toBeGreaterThan(0);
      expect(navigate).toHaveBeenCalledWith(['/home']);
    });
  });

  describe('Resume Paused Cardio Workout', () => {
    it('restores cardio data from in-progress state', async () => {
      const addSession = vi.fn().mockResolvedValue(true);
      const navigate = vi.fn();
      const clearInProgress = vi.fn();
      const inProgressFn = vi.fn().mockReturnValue(null);

      const cardioExercise: Exercise = {
        id: 'cardio-ex-1',
        name: 'Outdoor Run',
        imageUrl: 'https://example.com/run.png',
        description: '',
        muscleGroup: 'Full Body',
        exerciseType: 'cardio',
        metValue: 9.8,
      };

      const plan = {
        id: 'resume-plan-1',
        name: 'Resume Cardio',
        description: '',
        exercises: [cardioExercise],
        isActive: true,
      };

      await TestBed.configureTestingModule({
        imports: [WorkoutComponent],
        providers: [
          {
            provide: WorkoutService,
            useValue: {
              getPlanById: vi.fn().mockReturnValue(plan),
              getLastSessionForPlan: vi.fn().mockReturnValue(undefined),
              addSession,
              getExerciseById: vi.fn().mockReturnValue(cardioExercise),
              inProgress: inProgressFn,
              clearInProgress,
              setInProgress: vi.fn(),
              markPlanStartedLocally: vi.fn(),
            },
          },
          { provide: Router, useValue: { navigate } },
          {
            provide: ActivatedRoute,
            useValue: {
              paramMap: of(convertToParamMap({ planId: 'resume-plan-1' })),
            },
          },
        ],
      }).compileComponents();

      const fixture = TestBed.createComponent(WorkoutComponent);
      const component = fixture.componentInstance;
      fixture.detectChanges();

      component.elapsedTime.set(1200);

      const cardioData = new Map<string, CardioExerciseData>();
      cardioData.set('cardio-ex-1', {
        startTime: Date.now() - 1200000,
        elapsedSeconds: 1200,
        distanceMeters: 2500,
        currentPaceSecondsPerKm: 300,
        avgPaceSecondsPerKm: 288,
        maxPaceSecondsPerKm: 320,
        avgSpeedKmh: 12.5,
        gpsEnabled: false,
        gpsCoordinates: [],
      });
      component.cardioExerciseData.set(cardioData);

      await component.finishWorkout();
      component.ngOnDestroy();

      expect(addSession).toHaveBeenCalled();
      const sessionArg = addSession.mock.calls[0][0];
      expect(sessionArg.exercises[0].distanceMeters).toBe(2500);
      expect(sessionArg.exercises[0].exerciseDurationSeconds).toBe(1200);
      expect(clearInProgress).toHaveBeenCalled();
    });
  });
});

describe('Exercise Type Detection Logic', () => {
  describe('normalizeWorkoutType', () => {
    it('normalizes cardio type', () => {
      expect(normalizeWorkoutType('cardio')).toBe('cardio');
      expect(normalizeWorkoutType('CARDIO')).toBe('cardio');
      expect(normalizeWorkoutType('Cardio')).toBe('cardio');
    });

    it('normalizes strength type', () => {
      expect(normalizeWorkoutType('strength')).toBe('strength');
      expect(normalizeWorkoutType('STRENGTH')).toBe('strength');
    });

    it('returns general for unknown types', () => {
      expect(normalizeWorkoutType('unknown')).toBe('general');
      expect(normalizeWorkoutType(null as unknown as string)).toBe('general');
      expect(normalizeWorkoutType(undefined)).toBe('general');
      expect(normalizeWorkoutType('')).toBe('general');
    });
  });

  describe('deriveWorkoutPlanType', () => {
    it('returns general for empty exercises', () => {
      expect(deriveWorkoutPlanType([])).toBe('general');
    });

    it('returns cardio when majority are cardio exercises', () => {
      const exercises: Exercise[] = [
        { id: '1', name: 'Run', imageUrl: '', description: '', muscleGroup: '', exerciseType: 'cardio', metValue: 9.8 },
        { id: '2', name: 'Cycle', imageUrl: '', description: '', muscleGroup: '', exerciseType: 'cardio', metValue: 7.5 },
        { id: '3', name: 'Push-Up', imageUrl: '', description: '', muscleGroup: '', exerciseType: 'strength', metValue: 8.0 },
      ];
      expect(deriveWorkoutPlanType(exercises)).toBe('cardio');
    });

    it('returns mixed when no dominant type', () => {
      const exercises: Exercise[] = [
        { id: '1', name: 'Run', imageUrl: '', description: '', muscleGroup: '', exerciseType: 'cardio', metValue: 9.8 },
        { id: '2', name: 'Push-Up', imageUrl: '', description: '', muscleGroup: '', exerciseType: 'strength', metValue: 8.0 },
      ];
      expect(deriveWorkoutPlanType(exercises)).toBe('mixed');
    });

    it('returns strength when all are strength', () => {
      const exercises: Exercise[] = [
        { id: '1', name: 'Push-Up', imageUrl: '', description: '', muscleGroup: '', exerciseType: 'strength', metValue: 8.0 },
        { id: '2', name: 'Squat', imageUrl: '', description: '', muscleGroup: '', exerciseType: 'strength', metValue: 5.0 },
      ];
      expect(deriveWorkoutPlanType(exercises)).toBe('strength');
    });
  });

  describe('getWorkoutTypeVisual', () => {
    it('returns orange color for cardio', () => {
      const visual = getWorkoutTypeVisual('cardio');
      expect(visual.label).toBe('Cardio');
      expect(visual.color).toBe('#ea580c');
    });

    it('returns red color for strength', () => {
      const visual = getWorkoutTypeVisual('strength');
      expect(visual.label).toBe('Strength');
      expect(visual.color).toBe('#dc2626');
    });
  });
});
