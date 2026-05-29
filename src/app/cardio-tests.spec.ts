import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { convertToParamMap, ActivatedRoute, Router } from '@angular/router';
import { WorkoutComponent } from './features/workout/workout.component';
import { CardioMapComponent } from './features/workout/cardio-map.component';
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
      const calories = calcCalories(9.8, 1800, 70);
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
      const inProgress = vi.fn().mockReturnValue(null);
      const setInProgress = vi.fn();
      const clearInProgress = vi.fn();
      const markPlanStartedLocally = vi.fn();
      const markPlanCompletedLocally = vi.fn();

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
              inProgress,
              setInProgress,
              clearInProgress,
              markPlanStartedLocally,
              markPlanCompletedLocally,
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
      const inProgress = vi.fn().mockReturnValue(null);
      const setInProgress = vi.fn();
      const clearInProgress = vi.fn();
      const markPlanStartedLocally = vi.fn();
      const markPlanCompletedLocally = vi.fn();

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
              inProgress,
              setInProgress,
              clearInProgress,
              markPlanStartedLocally,
              markPlanCompletedLocally,
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
      const setInProgress = vi.fn();
      const markPlanStartedLocally = vi.fn();
      const markPlanCompletedLocally = vi.fn();

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
                setInProgress,
                markPlanStartedLocally,
                markPlanCompletedLocally,
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
      expect(visual.color).toBe('#059669');
    });

    it('returns red color for strength', () => {
      const visual = getWorkoutTypeVisual('strength');
      expect(visual.label).toBe('Strength');
      expect(visual.color).toBe('#dc2626');
    });
  });

  describe('Cardio Map Integration', () => {
    function createCardioPlan() {
      const exercise: Exercise = {
        id: 'cardio-ex-1', name: 'Outdoor Run', imageUrl: '', description: '', muscleGroup: '',
        exerciseType: 'cardio', metValue: 9.8,
      };
      return {
        id: 'plan-1', name: 'Cardio Plan', category: 'running', visibility: 'default' as const,
        exercises: [exercise], createdBy: 'user-1', createdAt: new Date().toISOString(),
        isAdmin: false,
      };
    }

    it('shows embedded map when GPS is enabled', async () => {
      const plan = createCardioPlan();
      const navigate = vi.fn();
      const inProgress = vi.fn().mockReturnValue(null);

      await TestBed.configureTestingModule({
        imports: [WorkoutComponent],
        providers: [
          { provide: WorkoutService, useValue: {
            getPlanById: vi.fn().mockReturnValue(plan),
            getLastSessionForPlan: vi.fn().mockReturnValue(undefined),
            addSession: vi.fn(),
            getExerciseById: vi.fn(),
            inProgress,
            setInProgress: vi.fn(),
            clearInProgress: vi.fn(),
            markPlanStartedLocally: vi.fn(),
            markPlanCompletedLocally: vi.fn(),
          }},
          { provide: Router, useValue: { navigate } },
          { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap({ planId: 'plan-1' })) } },
        ],
      }).compileComponents();

      const fixture = TestBed.createComponent(WorkoutComponent);
      const component = fixture.componentInstance;
      fixture.detectChanges();

      const exerciseId = component.currentExercise()!.id;
      const data = new Map<string, CardioExerciseData>();
      data.set(exerciseId, {
        startTime: Date.now(), elapsedSeconds: 100, distanceMeters: 500,
        currentPaceSecondsPerKm: 360, avgPaceSecondsPerKm: 360, maxPaceSecondsPerKm: 380,
        avgSpeedKmh: 10.0, gpsEnabled: true,
        gpsCoordinates: [{ lat: 52.52, lng: 13.405, timestamp: Date.now() }],
      });
      component.cardioExerciseData.set(data);
      fixture.detectChanges();

      const mapEl = fixture.nativeElement.querySelector('app-cardio-map');
      expect(mapEl).toBeTruthy();
    });

    it('shows placeholder when GPS is disabled', async () => {
      const plan = createCardioPlan();
      const navigate = vi.fn();
      const inProgress = vi.fn().mockReturnValue(null);

      await TestBed.configureTestingModule({
        imports: [WorkoutComponent],
        providers: [
          { provide: WorkoutService, useValue: {
            getPlanById: vi.fn().mockReturnValue(plan),
            getLastSessionForPlan: vi.fn().mockReturnValue(undefined),
            addSession: vi.fn(),
            getExerciseById: vi.fn(),
            inProgress,
            setInProgress: vi.fn(),
            clearInProgress: vi.fn(),
            markPlanStartedLocally: vi.fn(),
            markPlanCompletedLocally: vi.fn(),
          }},
          { provide: Router, useValue: { navigate } },
          { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap({ planId: 'plan-1' })) } },
        ],
      }).compileComponents();

      const fixture = TestBed.createComponent(WorkoutComponent);
      const component = fixture.componentInstance;
      fixture.detectChanges();

      const placeholder = fixture.nativeElement.querySelector('mat-icon');
      const placeholderText = fixture.nativeElement.textContent;
      expect(placeholderText).toContain('Enable GPS to view your route');
    });

    it('renders strength layout without map for strength exercises', async () => {
      const exercise: Exercise = {
        id: 'strength-ex-1', name: 'Bench Press', imageUrl: '', description: '', muscleGroup: 'chest',
        exerciseType: 'strength', metValue: 5.0,
      };
      const plan = {
        id: 'plan-3', name: 'Strength Plan', category: 'strength' as const, visibility: 'default' as const,
        exercises: [exercise], createdBy: 'user-1', createdAt: new Date().toISOString(),
        isAdmin: false,
      };
      const navigate = vi.fn();
      const inProgress = vi.fn().mockReturnValue(null);

      await TestBed.configureTestingModule({
        imports: [WorkoutComponent],
        providers: [
          { provide: WorkoutService, useValue: {
            getPlanById: vi.fn().mockReturnValue(plan),
            getLastSessionForPlan: vi.fn().mockReturnValue(undefined),
            addSession: vi.fn(),
            getExerciseById: vi.fn(),
            inProgress,
            setInProgress: vi.fn(),
            clearInProgress: vi.fn(),
            markPlanStartedLocally: vi.fn(),
            markPlanCompletedLocally: vi.fn(),
          }},
          { provide: Router, useValue: { navigate } },
          { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap({ planId: 'plan-3' })) } },
        ],
      }).compileComponents();

      const fixture = TestBed.createComponent(WorkoutComponent);
      const component = fixture.componentInstance;
      fixture.detectChanges();

      const mapEl = fixture.nativeElement.querySelector('app-cardio-map');
      expect(mapEl).toBeFalsy();

      const setsSection = fixture.nativeElement.querySelector('.workout-content');
      expect(setsSection).toBeTruthy();
    });

    it('keeps cardio-only workouts to one exercise', async () => {
      const exercise1: Exercise = {
        id: 'cardio-ex-1', name: 'Outdoor Run', imageUrl: '', description: '', muscleGroup: '',
        exerciseType: 'cardio', metValue: 9.8,
      };
      const exercise2: Exercise = {
        id: 'cardio-ex-2', name: 'Cycling', imageUrl: '', description: '', muscleGroup: '',
        exerciseType: 'cardio', metValue: 7.5,
      };
      const plan = {
        id: 'plan-2', name: 'Cardio Plan', category: 'running' as const, visibility: 'default' as const,
        exercises: [exercise1, exercise2], createdBy: 'user-1', createdAt: new Date().toISOString(),
        isAdmin: false,
      };
      const navigate = vi.fn();
      const inProgress = vi.fn().mockReturnValue(null);

      await TestBed.configureTestingModule({
        imports: [WorkoutComponent],
        providers: [
          { provide: WorkoutService, useValue: {
            getPlanById: vi.fn().mockReturnValue(plan),
            getLastSessionForPlan: vi.fn().mockReturnValue(undefined),
            addSession: vi.fn(),
            getExerciseById: vi.fn(),
            inProgress,
            setInProgress: vi.fn(),
            clearInProgress: vi.fn(),
            markPlanStartedLocally: vi.fn(),
            markPlanCompletedLocally: vi.fn(),
          }},
          { provide: Router, useValue: { navigate } },
          { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap({ planId: 'plan-2' })) } },
        ],
      }).compileComponents();

      const fixture = TestBed.createComponent(WorkoutComponent);
      const component = fixture.componentInstance;
      fixture.detectChanges();

      const setGpsOn = (exId: string) => {
        component.cardioExerciseData.update(map => {
          const next = new Map(map);
          next.set(exId, { ...next.get(exId)!, gpsEnabled: true });
          return next;
        });
      };
      setGpsOn(exercise1.id);
      fixture.detectChanges();

      expect(component.currentExerciseIndex()).toBe(0);
      expect(fixture.nativeElement.querySelector('app-cardio-map')).toBeTruthy();

      component.nextExercise();
      fixture.detectChanges();

      expect(component.currentExerciseIndex()).toBe(0);
      expect(component.totalExercisesCount()).toBe(1);
      expect(fixture.nativeElement.querySelector('app-cardio-map')).toBeTruthy();
    });

    it('renders CardioMapComponent with correct GPS coordinate inputs', () => {
      const coords = [
        { lat: 52.52, lng: 13.405, timestamp: 1000 },
        { lat: 52.521, lng: 13.406, timestamp: 2000 },
      ];

      const fixture = TestBed.createComponent(CardioMapComponent);
      const component = fixture.componentInstance;
      fixture.componentRef.setInput('gpsCoordinates', coords);
      fixture.componentRef.setInput('currentPosition', { lat: 52.521, lng: 13.406 });
      fixture.detectChanges();

      expect(component.gpsCoordinates().length).toBe(2);
      expect(component.gpsCoordinates()[0].lat).toBe(52.52);
      expect(component.currentPosition()).toEqual({ lat: 52.521, lng: 13.406 });
    });

    it('shows waiting for GPS message when no coordinates', () => {
      const fixture = TestBed.createComponent(CardioMapComponent);
      fixture.componentRef.setInput('gpsCoordinates', []);
      fixture.detectChanges();

      const waitingMsg = fixture.nativeElement.textContent;
      expect(waitingMsg).toContain('Waiting for GPS');
    });

    it('shows SSR fallback when platform is not browser', () => {
      const fixture = TestBed.createComponent(CardioMapComponent);
      const component = fixture.componentInstance;
      component['isBrowser'] = false;
      fixture.detectChanges();

      const fallback = fixture.nativeElement.textContent;
      expect(fallback).toContain('Map unavailable');
    });

    it('captureSnapshot returns null when map is not initialized', async () => {
      const fixture = TestBed.createComponent(CardioMapComponent);
      const component = fixture.componentInstance;
      component['isBrowser'] = true;

      const result = await component.captureSnapshot();
      expect(result).toBeNull();
    });

    it('captureSnapshot returns null when no polyline', async () => {
      const fixture = TestBed.createComponent(CardioMapComponent);
      const component = fixture.componentInstance;
      component['isBrowser'] = true;
      component['map'] = { fitBounds: vi.fn(), remove: vi.fn() } as any;

      const result = await component.captureSnapshot();
      expect(result).toBeNull();
      fixture.destroy();
    });
  });

  describe('Map Snapshot in Finished Session', () => {
    it('passes mapSnapshotUrl through to session exercise data', async () => {
      const addSession = vi.fn().mockResolvedValue(true);
      const navigate = vi.fn();
      const inProgress = vi.fn().mockReturnValue(null);
      const setInProgress = vi.fn();
      const clearInProgress = vi.fn();
      const markPlanStartedLocally = vi.fn();
      const markPlanCompletedLocally = vi.fn();

      const exercise: Exercise = {
        id: 'cardio-ex-1',
        name: 'Outdoor Run',
        imageUrl: '',
        description: '',
        muscleGroup: 'Full Body',
        exerciseType: 'cardio',
        metValue: 9.8,
      };

      const plan = {
        id: 'cardio-plan-snap',
        name: 'Snapshot Test',
        description: '',
        exercises: [exercise],
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
              getExerciseById: vi.fn().mockReturnValue(exercise),
              inProgress,
              setInProgress,
              clearInProgress,
              markPlanStartedLocally,
              markPlanCompletedLocally,
            },
          },
          { provide: Router, useValue: { navigate } },
          { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap({ planId: 'cardio-plan-snap' })) } },
        ],
      }).compileComponents();

      const fixture = TestBed.createComponent(WorkoutComponent);
      const component = fixture.componentInstance;
      fixture.detectChanges();

      component.elapsedTime.set(600);

      // Mock the cardioMap to return a snapshot URL
      component.cardioMap = { captureSnapshot: vi.fn().mockResolvedValue('data:image/jpeg;base64,mock-snapshot') } as any;

      const cardioData = new Map<string, CardioExerciseData>();
      cardioData.set('cardio-ex-1', {
        startTime: Date.now() - 600000,
        elapsedSeconds: 600,
        distanceMeters: 2000,
        currentPaceSecondsPerKm: 300,
        avgPaceSecondsPerKm: 300,
        maxPaceSecondsPerKm: 320,
        avgSpeedKmh: 12.0,
        gpsEnabled: true,
        gpsCoordinates: [
          { lat: 52.52, lng: 13.405, timestamp: Date.now() - 600000 },
          { lat: 52.521, lng: 13.406, timestamp: Date.now() - 300000 },
        ],
      });
      component.cardioExerciseData.set(cardioData);

      await component.finishWorkout();
      component.ngOnDestroy();

      expect(addSession).toHaveBeenCalled();
      const sessionArg = addSession.mock.calls[0][0];
      const cardioEx = sessionArg.exercises.find((e: any) => e.exerciseId === 'cardio-ex-1');
      expect(cardioEx).toBeTruthy();
      expect(cardioEx.mapSnapshotUrl).toBe('data:image/jpeg;base64,mock-snapshot');
    });
  });

  describe('5-Second GPS Interval Tracking', () => {
    it('startGPSTracking does not throw when geolocation unavailable', () => {
      const origGeo = navigator.geolocation;
      try {
        Object.defineProperty(navigator, 'geolocation', {
          value: undefined,
          configurable: true,
        });

        const navigate = vi.fn();
        const ex: Exercise = { id: 'gps-test', name: 'GPS', imageUrl: '', description: '', muscleGroup: '', exerciseType: 'cardio', metValue: 9.8 };
        const plan = { id: 'plan', name: 'P', description: '', exercises: [ex], isActive: true };

        TestBed.configureTestingModule({
          imports: [WorkoutComponent],
          providers: [
            { provide: WorkoutService, useValue: {
              getPlanById: vi.fn().mockReturnValue(plan),
              getLastSessionForPlan: vi.fn().mockReturnValue(undefined),
              addSession: vi.fn(), getExerciseById: vi.fn().mockReturnValue(ex),
              inProgress: vi.fn().mockReturnValue(null), setInProgress: vi.fn(),
              clearInProgress: vi.fn(), markPlanStartedLocally: vi.fn(), markPlanCompletedLocally: vi.fn(),
            }},
            { provide: Router, useValue: { navigate } },
            { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap({ planId: 'plan' })) } },
          ],
        }).compileComponents();

        const fixture = TestBed.createComponent(WorkoutComponent);
        fixture.detectChanges();
        expect(() => fixture.componentInstance.initCardioExercise('gps-test')).not.toThrow();
        fixture.destroy();
      } finally {
        Object.defineProperty(navigator, 'geolocation', {
          value: origGeo,
          configurable: true,
        });
      }
    });

    it('starts GPS tracking with immediate getCurrentPosition call', () => {
      const getCurrentPosition = vi.fn();
      const origGeo = navigator.geolocation;
      Object.defineProperty(navigator, 'geolocation', {
        value: { getCurrentPosition },
        configurable: true,
      });

      const navigate = vi.fn();
      const inProgress = vi.fn().mockReturnValue(null);
      const exercise: Exercise = {
        id: 'cardio-gps-test',
        name: 'GPS Test',
        imageUrl: '',
        description: '',
        muscleGroup: '',
        exerciseType: 'cardio',
        metValue: 9.8,
      };
      const plan = {
        id: 'plan-gps',
        name: 'GPS Plan',
        description: '',
        exercises: [exercise],
        isActive: true,
      };

      TestBed.configureTestingModule({
        imports: [WorkoutComponent],
        providers: [
          { provide: WorkoutService, useValue: {
            getPlanById: vi.fn().mockReturnValue(plan),
            getLastSessionForPlan: vi.fn().mockReturnValue(undefined),
            addSession: vi.fn(),
            getExerciseById: vi.fn().mockReturnValue(exercise),
            inProgress,
            setInProgress: vi.fn(),
            clearInProgress: vi.fn(),
            markPlanStartedLocally: vi.fn(),
            markPlanCompletedLocally: vi.fn(),
          }},
          { provide: Router, useValue: { navigate } },
          { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap({ planId: 'plan-gps' })) } },
        ],
      }).compileComponents();

      const fixture = TestBed.createComponent(WorkoutComponent);
      const component = fixture.componentInstance;
      fixture.detectChanges();

      component.initCardioExercise('cardio-gps-test');

      expect(getCurrentPosition).toHaveBeenCalled();

      Object.defineProperty(navigator, 'geolocation', {
        value: origGeo,
        configurable: true,
      });
    });
  });
});
