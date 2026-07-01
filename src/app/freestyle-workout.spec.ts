import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { convertToParamMap, ActivatedRoute, Router } from '@angular/router';
import { WorkoutComponent } from './features/workout/workout.component';
import { WorkoutService } from './core/services/workout.service';
import { Exercise } from './core/models/models';

describe('Freestyle workout start flow', () => {
  let setInProgress: ReturnType<typeof vi.fn>;
  let inProgressFn: ReturnType<typeof vi.fn>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let fixture: any;
  let component: WorkoutComponent;

  const pushUps: Exercise = {
    id: 'ex-push',
    name: 'Push-Ups',
    imageUrl: '',
    description: '',
    muscleGroup: 'Chest',
    exerciseType: 'strength',
    metValue: 8,
  };
  const squats: Exercise = {
    id: 'ex-squat',
    name: 'Squats',
    imageUrl: '',
    description: '',
    muscleGroup: 'Legs',
    exerciseType: 'strength',
    metValue: 5,
  };

  beforeEach(async () => {
    setInProgress = vi.fn();
    inProgressFn = vi.fn().mockReturnValue(null);

    await TestBed.configureTestingModule({
      imports: [WorkoutComponent],
      providers: [
        {
          provide: WorkoutService,
          useValue: {
            exercises: () => [pushUps, squats],
            getPlanById: vi.fn().mockReturnValue(null),
            getLastSessionForPlan: vi.fn().mockReturnValue(null),
            getPlanExerciseTargets: vi.fn().mockReturnValue([]),
            addSession: vi.fn().mockResolvedValue(true),
            getExerciseById: vi.fn().mockImplementation((id: string) => (id === pushUps.id ? pushUps : squats)),
            inProgress: inProgressFn,
            setInProgress,
            clearInProgress: vi.fn(),
            markPlanStartedLocally: vi.fn(),
            markPlanCompletedLocally: vi.fn(),
          },
        },
        { provide: Router, useValue: { navigate: vi.fn() } },
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(convertToParamMap({ planId: 'freestyle' })),
            snapshot: { queryParamMap: { get: () => null } },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(WorkoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('opens the picker when entering freestyle mode', () => {
    expect(component.freestyleMode()).toBe(true);
    expect(component.showFreestylePicker()).toBe(true);
    expect(component.freestyleStarted()).toBe(false);
  });

  it('starts the workout with the "current" exercise first when Start Workout is pressed', () => {
    component.selectFreestyleWorkoutType('strength');
    component.addFreestyleExercise(squats);
    component.addFreestyleExercise(pushUps);
    fixture.detectChanges();

    // The first selected exercise is highlighted as "(current)" in the picker
    // (currentExercise() returns freestyleExercises()[0] because currentExerciseIndex === 0)
    const currentInPicker = component.currentExercise();
    expect(currentInPicker?.id).toBe(squats.id);

    component.startFreestyleWorkout();
    fixture.detectChanges();

    // The picker is closed and the workout view shows the current exercise first
    expect(component.showFreestylePicker()).toBe(false);
    expect(component.freestyleStarted()).toBe(true);
    expect(component.currentExercise()?.id).toBe(squats.id);
    expect(setInProgress).toHaveBeenCalled();
  });

  it('clicking the Start Workout button in the DOM closes the picker and shows the workout', () => {
    component.selectFreestyleWorkoutType('strength');
    component.addFreestyleExercise(pushUps);
    fixture.detectChanges();

    const buttons: HTMLButtonElement[] = Array.from(fixture.nativeElement.querySelectorAll('button'));
    const startBtn = buttons.find(b => /Start Workout/.test(b.textContent || ''));
    expect(startBtn).toBeTruthy();

    startBtn!.click();
    fixture.detectChanges();

    expect(component.showFreestylePicker()).toBe(false);
    expect(component.freestyleStarted()).toBe(true);
    expect(component.currentExercise()?.id).toBe(pushUps.id);
  });
});

describe('Freestyle workout start (resuming an unstarted freestyle session)', () => {
  let setInProgress: ReturnType<typeof vi.fn>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let fixture: any;
  let component: WorkoutComponent;

  const LithuaniaRun: Exercise = {
    id: 'ex-run',
    name: 'Run',
    imageUrl: '',
    description: '',
    muscleGroup: 'Full Body',
    exerciseType: 'cardio',
    metValue: 9.8,
  };

  it('resumes an unstarted freestyle session and Start Workout begins the workout', async () => {
    setInProgress = vi.fn();
    const persisted: { current: any } = {
      current: {
        planId: 'freestyle',
        freestyleMode: true,
        startTime: new Date().toISOString(),
        elapsedTime: 0,
        currentExerciseIndex: 0,
        workoutData: {},
        freestyleExercises: [LithuaniaRun],
        freestyleStarted: false,
      },
    };
    const inProgressFn = vi.fn().mockImplementation(() => persisted.current);

    await TestBed.configureTestingModule({
      imports: [WorkoutComponent],
      providers: [
        {
          provide: WorkoutService,
          useValue: {
            exercises: () => [LithuaniaRun],
            getPlanById: vi.fn().mockReturnValue(null),
            getLastSessionForPlan: vi.fn().mockReturnValue(null),
            getPlanExerciseTargets: vi.fn().mockReturnValue([]),
            addSession: vi.fn().mockResolvedValue(true),
            getExerciseById: vi.fn().mockReturnValue(LithuaniaRun),
            inProgress: inProgressFn,
            setInProgress,
            clearInProgress: vi.fn(),
            markPlanStartedLocally: vi.fn(),
            markPlanCompletedLocally: vi.fn(),
          },
        },
        { provide: Router, useValue: { navigate: vi.fn() } },
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(convertToParamMap({ planId: 'freestyle' })),
            snapshot: { queryParamMap: { get: () => null } },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(WorkoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    // Resume path restored the unstarted workout and opened the picker again
    expect(component.freestyleMode()).toBe(true);
    expect(component.freestyleExercises().length).toBe(1);
    expect(component.showFreestylePicker()).toBe(true);
    expect(component.freestyleStarted()).toBe(false);

    component.startFreestyleWorkout();
    fixture.detectChanges();

    expect(component.showFreestylePicker()).toBe(false);
    expect(component.freestyleStarted()).toBe(true);
    expect(component.currentExercise()?.id).toBe(LithuaniaRun.id);
  });
});