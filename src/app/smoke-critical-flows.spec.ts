import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { convertToParamMap, ActivatedRoute, Router } from '@angular/router';
import { ProfileComponent } from './features/profile/profile.component';
import { PlanCreateComponent } from './features/plans/plan-create.component';
import { WorkoutComponent } from './features/workout/workout.component';
import { PlansComponent } from './features/plans/plans.component';
import { AuthService } from './core/services/auth.service';
import { SupabaseService } from './core/services/supabase.service';
import { StatsService } from './core/services/stats.service';
import { WorkoutService } from './core/services/workout.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Exercise } from './core/models/models';

describe('Critical flow smoke tests', () => {
  it('saves profile and refreshes auth profile state', async () => {
    const refreshProfile = jasmine.createSpy('refreshProfile').and.resolveTo();
    const eqSpy = jasmine.createSpy('eq').and.resolveTo({ error: null });
    const updateSpy = jasmine.createSpy('update').and.returnValue({ eq: eqSpy });
    const fromSpy = jasmine.createSpy('from').and.returnValue({ update: updateSpy });

    await TestBed.configureTestingModule({
      imports: [ProfileComponent],
      providers: [
        {
          provide: AuthService,
          useValue: {
            currentUser: () => ({
              id: 'user-1',
              name: 'User',
              email: 'user@example.com',
              height: 180,
              weight: 75,
              age: 30,
            }),
            refreshProfile,
            logout: jasmine.createSpy('logout'),
          },
        },
        { provide: StatsService, useValue: { monthlyStats: () => ({ count: 0, calories: 0, duration: 0 }) } },
        { provide: SupabaseService, useValue: { getClient: () => ({ from: fromSpy }) } },
        { provide: Router, useValue: { navigate: jasmine.createSpy('navigate') } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(ProfileComponent);
    const component = fixture.componentInstance;
    component.form = {
      name: 'Updated Name',
      avatarUrl: 'https://example.com/avatar.png',
      funFact: 'Loves coding',
      height: 181,
      weight: 76,
      age: 31,
    };

    await component.save();

    expect(fromSpy).toHaveBeenCalledWith('profiles');
    expect(updateSpy).toHaveBeenCalled();
    expect(eqSpy).toHaveBeenCalledWith('id', 'user-1');
    expect(refreshProfile).toHaveBeenCalled();
  });

  it('creates a plan via workout service', async () => {
    const createPlan = jasmine.createSpy('createPlan').and.resolveTo('plan-1');
    const navigate = jasmine.createSpy('navigate');
    const open = jasmine.createSpy('open');

    await TestBed.configureTestingModule({
      imports: [PlanCreateComponent],
      providers: [
        {
          provide: WorkoutService,
          useValue: {
            exercises: () => [],
            getPlanById: jasmine.createSpy('getPlanById').and.returnValue(null),
            createPlan,
          },
        },
        { provide: AuthService, useValue: { currentUser: () => ({ id: 'user-1' }) } },
        { provide: Router, useValue: { navigate } },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => null } } } },
        { provide: MatSnackBar, useValue: { open } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(PlanCreateComponent);
    const component = fixture.componentInstance;

    const exercise: Exercise = {
      id: 'ex-1',
      name: 'Push-up',
      imageUrl: 'https://example.com/pushup.png',
      description: '',
      muscleGroup: 'Chest',
    };

    component.name = 'Beginner Plan';
    component.description = 'Starter';
    component.selectedExercises.set([exercise]);

    await component.createPlan();

    expect(createPlan).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith(['/plans']);
  });

  it('finishes workout and persists session', async () => {
    const addSession = jasmine.createSpy('addSession').and.resolveTo(true);
    const navigate = jasmine.createSpy('navigate');
    const plan = {
      id: 'plan-1',
      name: 'Plan',
      description: '',
      exercises: [
        {
          id: 'ex-1',
          name: 'Squat',
          imageUrl: 'https://example.com/squat.png',
          description: '',
          muscleGroup: 'Legs',
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
            getPlanById: jasmine.createSpy('getPlanById').and.returnValue(plan),
            getLastSessionForPlan: jasmine.createSpy('getLastSessionForPlan').and.returnValue(undefined),
            addSession,
          },
        },
        { provide: Router, useValue: { navigate } },
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(convertToParamMap({ planId: 'plan-1' })),
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(WorkoutComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.elapsedTime.set(120);
    await component.finishWorkout();
    component.ngOnDestroy();

    expect(addSession).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith(['/home']);
  });

  it('shares a plan with a resolved user id', async () => {
    const sharePlan = jasmine.createSpy('sharePlan').and.resolveTo(true);
    const resolveUserIdByEmail = jasmine.createSpy('resolveUserIdByEmail').and.resolveTo('user-2');

    await TestBed.configureTestingModule({
      imports: [PlansComponent],
      providers: [
        {
          provide: WorkoutService,
          useValue: {
            plans: () => [{ id: 'plan-1', name: 'Plan', description: '', exercises: [], isActive: false, ownerId: 'user-1' }],
            resolveUserIdByEmail,
            sharePlan,
            setActivePlan: jasmine.createSpy('setActivePlan').and.resolveTo(true),
          },
        },
        { provide: AuthService, useValue: { currentUser: () => ({ id: 'user-1' }) } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(PlansComponent);
    const component = fixture.componentInstance;

    component.sharePlanId = 'plan-1';
    component.shareEmail = 'target@example.com';
    await component.sharePlan();

    expect(resolveUserIdByEmail).toHaveBeenCalledWith('target@example.com');
    expect(sharePlan).toHaveBeenCalledWith('plan-1', 'user-2');
  });
});
