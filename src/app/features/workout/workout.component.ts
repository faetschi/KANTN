import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { WorkoutService } from '../../core/services/workout.service';
import { Exercise, InProgressWorkout, WorkoutSession, Set as WorkoutSet } from '../../core/models/models';
import { SearchBarComponent } from '../../shared/components/search-bar.component';

@Component({
  selector: 'app-workout',
  standalone: true,
  imports: [CommonModule, MatIconModule, FormsModule, SearchBarComponent],
  template: `
    <div class="h-screen flex flex-col bg-white">
      <!-- Header -->
      <header class="sticky top-0 z-20 bg-white px-6 py-4 flex justify-between items-center border-b border-gray-100">
        <button (click)="openExitOptions()" class="text-gray-400">
          <mat-icon>close</mat-icon>
        </button>
        <div class="text-center">
          <h2 class="font-bold text-gray-900">{{ workoutTitle() }}</h2>
          <p class="text-xs text-blue-600 font-mono">{{ formatTime(elapsedTime()) }}</p>
        </div>
        <button (click)="finishWorkout()" class="text-blue-600 font-bold text-sm">
          Finish
        </button>
      </header>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto p-6 workout-content">
        @if (saveErrorMessage) {
          <div class="mb-4 rounded-xl bg-red-50 text-red-600 text-sm px-4 py-3 border border-red-100">{{ saveErrorMessage }}</div>
        }

        @if (freestyleMode()) {
          <div class="mb-4 flex items-center justify-between">
            <button type="button" (click)="showExercisePicker = !showExercisePicker" class="px-3 py-2 rounded-xl bg-blue-50 text-blue-700 text-sm font-semibold">
              {{ showExercisePicker ? 'Hide Exercise Picker' : 'Add Exercise' }}
            </button>
            <span class="text-xs text-gray-500">{{ freestyleExercises().length }} selected</span>
          </div>

          @if (showExercisePicker) {
            <div class="mb-4 p-3 rounded-xl bg-gray-50 border border-gray-200 space-y-3">
              <app-search-bar
                [value]="exerciseSearchQuery"
                (valueChange)="exerciseSearchQuery = $event"
                placeholder="Search exercises"
              />
              <div class="mt-5 max-h-52 overflow-y-auto space-y-2">
                @for (exercise of filteredExerciseOptions(); track exercise.id) {
                  <button
                    type="button"
                    (click)="addFreestyleExercise(exercise)"
                    class="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-white border border-gray-200 text-left"
                  >
                    <span class="text-sm text-gray-900">{{ exercise.name }}</span>
                    <span class="text-xs text-gray-500">{{ exercise.muscleGroup }}</span>
                  </button>
                }
              </div>
            </div>
          }
        }

        @if (currentExercise(); as exercise) {
          <div class="mb-8 animate-fade-in">
            <div class="aspect-video rounded-2xl overflow-hidden mb-6 shadow-sm bg-gray-100">
              <img [src]="exercise.imageUrl" [alt]="exercise.name" class="w-full h-full object-cover">
            </div>
            
            <div class="flex justify-between items-start mb-2">
              <h1 class="text-2xl font-bold text-gray-900">{{ exercise.name }}</h1>
              <button class="text-blue-600 text-sm font-medium" (click)="showInfo = !showInfo">
                {{ showInfo ? 'Hide Info' : 'Info' }}
              </button>
            </div>
            
            @if (showInfo) {
              <p class="text-gray-500 text-sm mb-6 bg-gray-50 p-4 rounded-xl">{{ exercise.description }}</p>
            }

            <!-- Sets -->
            <div class="space-y-3">
              <div class="grid grid-cols-4 gap-4 text-xs font-semibold text-gray-400 uppercase tracking-wider text-center mb-2">
                <span>Set</span>
                <span>Kg</span>
                <span>Reps</span>
                <span>Done</span>
              </div>

              @for (set of currentSets(); track $index) {
                <div
                  class="grid grid-cols-4 gap-4 items-center rounded-xl px-2 py-2 transition-colors border"
                  [class.bg-green-50]="set.completed"
                  [class.border-green-200]="set.completed"
                  [class.bg-white]="!set.completed"
                  [class.border-transparent]="!set.completed"
                >
                  <div class="flex justify-center">
                    <div class="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-500">
                      {{ $index + 1 }}
                    </div>
                  </div>
                  <input type="number" [(ngModel)]="set.weight" class="bg-gray-50 border-none rounded-xl text-center font-bold text-gray-900 py-2 focus:ring-2 focus:ring-blue-500">
                  <input type="number" [(ngModel)]="set.reps" class="bg-gray-50 border-none rounded-xl text-center font-bold text-gray-900 py-2 focus:ring-2 focus:ring-blue-500">
                  <button (click)="toggleSet($index)" 
                          [class.bg-green-500]="set.completed" 
                          [class.text-white]="set.completed"
                          [class.bg-gray-100]="!set.completed"
                          [class.text-gray-300]="!set.completed"
                          class="h-10 w-full rounded-xl flex items-center justify-center transition-colors">
                    <mat-icon>check</mat-icon>
                  </button>
                </div>
                <div class="flex justify-end mt-1">
                  <button
                    type="button"
                    (click)="removeSet($index)"
                    [disabled]="currentSets().length <= 1"
                    class="text-xs text-red-500 disabled:text-gray-300"
                  >
                    Remove
                  </button>
                </div>
              }

              <button (click)="addSet()" class="w-full py-3 mt-4 text-blue-600 font-semibold text-sm bg-blue-50 rounded-xl border border-blue-100 border-dashed">
                + Add Set
              </button>
            </div>
          </div>
        } @else {
          <div class="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
            <p class="text-gray-600 text-sm">
              {{ freestyleMode() ? 'No freestyle exercise selected yet.' : 'No exercises in this workout plan.' }}
            </p>
          </div>
        }
      </div>

      <!-- Footer Navigation -->
      <div class="fixed left-0 right-0 bottom-[-1px] z-[60] bg-white border-t border-gray-100 px-4 pt-3 pb-[calc(env(safe-area-inset-bottom,1rem)+1px)] after:content-[''] after:absolute after:top-full after:left-0 after:right-0 after:h-20 after:bg-white workout-action-bar">
        <div class="flex justify-between items-center max-w-screen-xl mx-auto">
          <button (click)="prevExercise()" [disabled]="currentExerciseIndex() === 0" class="p-2.5 rounded-full bg-gray-100 text-gray-600 disabled:opacity-30">
            <mat-icon>arrow_back</mat-icon>
          </button>
          
          <button type="button" (click)="openExerciseListModal()" class="text-sm font-medium text-gray-500">
            {{ currentExercise() ? currentExerciseIndex() + 1 : 0 }} / {{ totalExercisesCount() }}
          </button>

          <button (click)="nextExercise()" class="px-6 py-2.5 rounded-full bg-blue-600 text-white font-bold shadow-lg shadow-blue-200 flex items-center space-x-2">
            <span>{{ isLastExercise() ? 'Finish' : 'Next' }}</span>
            <mat-icon>arrow_forward</mat-icon>
          </button>
        </div>
      </div>

      @if (false) {
        <div class="fixed inset-0 z-40 bg-black/40 flex items-center justify-center p-4">
          <div class="w-full max-w-md bg-white rounded-2xl p-5 shadow-xl border border-gray-100 space-y-4">
            <div>
              <h3 class="text-base font-bold text-gray-900">Cancel workout?</h3>
              <p class="text-sm text-gray-500 mt-1">Are you sure you want to cancel this workout?</p>
            </div>

            <div class="flex items-center justify-end gap-2">
              <button type="button" (click)="dismissCancelWorkoutModal()" class="px-3 py-2 rounded-lg text-sm font-semibold text-gray-600 bg-gray-100">No</button>
              <button type="button" (click)="confirmCancelWorkout()" class="px-3 py-2 rounded-lg text-sm font-semibold text-white bg-red-600">Yes</button>
            </div>
          </div>
        </div>
      }

      @if (showExitOptionsModal()) {
        <div class="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div class="w-full max-w-md bg-white rounded-2xl p-5 shadow-xl border border-gray-100 space-y-4">
            <div>
              <h3 class="text-base font-bold text-gray-900">Exit workout</h3>
              <p class="text-sm text-gray-500 mt-1">Do you want to pause and exit (resume later), cancel the workout, or continue?</p>
            </div>

            <div class="flex items-center justify-end gap-2">
              <button type="button" (click)="dismissExitOptionsModal()" class="px-3 py-2 rounded-lg text-sm font-semibold text-gray-600 bg-gray-100">Continue</button>
              <button type="button" (click)="exitWorkout()" class="px-3 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600">Pause & Exit</button>
              <button type="button" (click)="cancelWorkout()" class="px-3 py-2 rounded-lg text-sm font-semibold text-white bg-red-600">Cancel Workout</button>
            </div>
          </div>
        </div>
      }

      @if (showFreestyleSaveModal()) {
        <div class="fixed top-0 left-0 right-0 z-50 bg-black/40 flex items-center justify-center p-4" style="bottom: calc(72px + env(safe-area-inset-bottom, 20px));">
          <div class="w-full max-w-md bg-white rounded-2xl p-5 shadow-xl border border-gray-100 space-y-4">
            <div>
              <h3 class="text-base font-bold text-gray-900">Save as workout plan?</h3>
              <p class="text-sm text-gray-500 mt-1">Your freestyle session is saved. Optionally save these exercises as a reusable plan.</p>
            </div>

            <div class="space-y-2">
              <label for="freestyle-plan-name" class="block text-xs font-semibold uppercase tracking-wide text-gray-500">Plan Name</label>
              <input
                id="freestyle-plan-name"
                type="text"
                [(ngModel)]="freestylePlanName"
                class="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Freestyle plan name"
              />
            </div>

            <div class="flex items-center justify-end gap-2">
              <button type="button" (click)="skipFreestylePlanSave()" class="px-3 py-2 rounded-lg text-sm font-semibold text-gray-600 bg-gray-100">Skip</button>
              <button type="button" (click)="saveFreestylePlanFromModal()" class="px-3 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600">Save Plan</button>
            </div>
          </div>
        </div>
      }
      
      @if (showExerciseListModal()) {
        <div class="fixed top-0 left-0 right-0 z-70 bg-black/40 flex items-center justify-center p-4" style="bottom: calc(72px + env(safe-area-inset-bottom, 20px));">
          <div class="w-full max-w-lg bg-white rounded-2xl p-4 shadow-xl border border-gray-100 space-y-3" style="max-height: calc(100vh - (72px + env(safe-area-inset-bottom, 20px)) - 32px); overflow:auto;">
            <div class="flex items-center justify-between">
              <h3 class="text-base font-bold text-gray-900">Exercises</h3>
              <button type="button" (click)="closeExerciseListModal()" class="text-gray-400">
                <mat-icon>close</mat-icon>
              </button>
            </div>

            <div class="max-h-64 overflow-y-auto space-y-2">
              @for (exercise of (freestyleMode() ? freestyleExercises() : (plan()?.exercises || [])); track exercise.id) {
                <button type="button" (click)="selectExercise($index)" class="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 flex items-center justify-between">
                  <span class="font-medium text-gray-900">{{ exercise.name }}</span>
                  <span class="text-xs text-gray-400">{{ $index + 1 }}</span>
                </button>
              }
            </div>

            <div class="flex justify-end">
              <button type="button" (click)="closeExerciseListModal()" class="px-3 py-2 rounded-lg bg-gray-100 text-sm">Close</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .workout-content {
      padding-bottom: calc(72px + env(safe-area-inset-bottom, 20px));
    }
    .workout-action-bar {
      bottom: 0;
      z-index: 60;
    }
    .animate-fade-in {
      animation: fadeIn 0.3s ease-out;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class WorkoutComponent implements OnInit, OnDestroy {
  route = inject(ActivatedRoute);
  router = inject(Router);
  workoutService = inject(WorkoutService);

  planId = signal<string>('');
  plan = computed(() => this.workoutService.getPlanById(this.planId()));
  freestyleMode = signal(false);
  freestyleExercises = signal<Exercise[]>([]);
  workoutTitle = computed(() => this.freestyleMode() ? 'Freestyle Workout' : (this.plan()?.name || 'Workout'));
  
  currentExerciseIndex = signal(0);
  currentExercise = computed(() => {
    if (this.freestyleMode()) {
      return this.freestyleExercises()[this.currentExerciseIndex()];
    }
    return this.plan()?.exercises[this.currentExerciseIndex()];
  });
  totalExercisesCount = computed(() => this.freestyleMode() ? this.freestyleExercises().length : (this.plan()?.exercises.length || 0));
  
  // State for the current workout session
  workoutData = signal<Map<string, WorkoutSet[]>>(new Map());
  
  startTime = new Date();
  elapsedTime = signal(0);
  timerInterval: ReturnType<typeof setInterval> | undefined;
  saveErrorMessage = '';
  
  showInfo = false;
  showExercisePicker = false;
  showExerciseListModal = signal(false);
  exerciseSearchQuery = '';
  showCancelWorkoutModal = signal(false);
  showExitOptionsModal = signal(false);
  showFreestyleSaveModal = signal(false);
  freestylePlanName = '';

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('planId');
      if (!id) return;

      // If there is an in-progress workout matching this id, resume it
      const inProgress = this.workoutService.inProgress();
      if (inProgress && inProgress.planId === id) {
        this.planId.set(id);
        this.freestyleMode.set(!!inProgress.freestyleMode);
        this.currentExerciseIndex.set(inProgress.currentExerciseIndex || 0);
        this.startTime = inProgress.startTime ? new Date(inProgress.startTime) : new Date();
        this.elapsedTime.set(inProgress.elapsedTime || 0);
        // restore workoutData map
        const restored = new Map<string, WorkoutSet[]>();
        if (inProgress.workoutData) {
          for (const [exId, sets] of Object.entries(inProgress.workoutData)) {
            restored.set(exId, sets as WorkoutSet[]);
          }
        }
        if (this.freestyleMode()) {
          this.freestyleExercises.set(inProgress.freestyleExercises || []);
        }
        this.workoutData.set(restored);
        if (this.timerInterval !== undefined) {
          clearInterval(this.timerInterval);
          this.timerInterval = undefined;
        }
        this.startTimer();
        return;
      }

      // No resume – start a fresh workout
      this.planId.set(id);
      this.freestyleMode.set(id === 'freestyle');
      if (id === 'freestyle') {
        this.freestyleExercises.set([]);
        this.showExercisePicker = true;
      }
      this.startTime = new Date();
      this.elapsedTime.set(0);
      this.currentExerciseIndex.set(0);
      if (this.timerInterval !== undefined) {
        clearInterval(this.timerInterval);
        this.timerInterval = undefined;
      }
      this.initializeWorkoutData();
      this.startTimer();

      // Optimistically mark the plan as started so UI shows it as started
      if (!this.freestyleMode()) {
        const plan = this.plan();
        if (plan) {
          this.workoutService.markPlanStartedLocally(plan.id, this.startTime);
        }
      }

      // persist lightweight in-progress marker so user can resume after navigation
      this.persistInProgress();
    });
  }

  ngOnDestroy() {
    if (this.timerInterval !== undefined) {
      clearInterval(this.timerInterval);
      this.timerInterval = undefined;
    }
  }

  initializeWorkoutData() {
    if (this.freestyleMode()) {
      this.workoutData.set(new Map());
      return;
    }

    const plan = this.plan();
    if (plan) {
      const data = new Map<string, WorkoutSet[]>();
      
      // Try to load previous session data for comparison/pre-fill
      const lastSession = this.workoutService.getLastSessionForPlan(plan.id);
      
      plan.exercises.forEach(ex => {
        // Pre-fill with 3 empty sets or last session's sets
        const previousExerciseData = lastSession?.exercises.find(e => e.exerciseId === ex.id);
        
        if (previousExerciseData) {
           data.set(ex.id, previousExerciseData.sets.map(s => ({ ...s, completed: false })));
        } else {
           data.set(ex.id, [
            { reps: 10, weight: 0, completed: false },
            { reps: 10, weight: 0, completed: false },
            { reps: 10, weight: 0, completed: false }
          ]);
        }
      });
      this.workoutData.set(data);
    }
  }

  persistInProgress() {
    const dataObj: Record<string, WorkoutSet[]> = {};
    for (const [k, v] of this.workoutData().entries()) {
      dataObj[k] = v;
    }
    const payload: InProgressWorkout = {
      planId: this.planId(),
      freestyleMode: this.freestyleMode(),
      startTime: this.startTime.toISOString(),
      elapsedTime: this.elapsedTime(),
      currentExerciseIndex: this.currentExerciseIndex(),
      workoutData: dataObj,
      freestyleExercises: this.freestyleExercises() || [],
    };
    this.workoutService.setInProgress(payload);
  }

  currentSets = computed(() => {
    const exId = this.currentExercise()?.id;
    if (!exId) return [];
    return this.workoutData().get(exId) || [];
  });

  addSet() {
    const exId = this.currentExercise()?.id;
    if (exId) {
      const sets = this.workoutData().get(exId) || [];
      const lastSet = sets[sets.length - 1] || { reps: 10, weight: 0, completed: false };
      
      sets.push({ ...lastSet, completed: false });
      this.workoutData.update(m => new Map(m.set(exId, sets)));
    }
  }

  filteredExerciseOptions() {
    const query = this.exerciseSearchQuery.trim().toLowerCase();
    const selectedIds = new Set(this.freestyleExercises().map(ex => ex.id));
    const all = this.workoutService.exercises().filter(ex => !selectedIds.has(ex.id));
    if (!query) return all;

    return all.filter(exercise => {
      const haystack = [exercise.name, exercise.muscleGroup || '', exercise.exerciseType || ''].join(' ').toLowerCase();
      return haystack.includes(query);
    });
  }

  addFreestyleExercise(exercise: Exercise) {
    this.freestyleExercises.update(current => [...current, exercise]);
    this.workoutData.update(current => {
      const next = new Map(current);
      next.set(exercise.id, [
        { reps: 10, weight: 0, completed: false },
        { reps: 10, weight: 0, completed: false },
        { reps: 10, weight: 0, completed: false },
      ]);
      return next;
    });
    this.currentExerciseIndex.set(Math.max(0, this.freestyleExercises().length - 1));
    this.showExercisePicker = false;
  }

  removeSet(index: number) {
    const exId = this.currentExercise()?.id;
    if (!exId) return;

    const sets = this.workoutData().get(exId) || [];
    if (sets.length <= 1) return;

    sets.splice(index, 1);
    this.workoutData.update(m => new Map(m.set(exId, sets)));
  }

  toggleSet(index: number) {
    const exId = this.currentExercise()?.id;
    if (exId) {
      const sets = this.workoutData().get(exId) || [];
      sets[index].completed = !sets[index].completed;
      this.workoutData.update(m => new Map(m.set(exId, sets)));
    }
  }

  startTimer() {
    this.timerInterval = setInterval(() => {
      this.elapsedTime.update(t => t + 1);
    }, 1000);
  }

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  prevExercise() {
    if (this.currentExerciseIndex() > 0) {
      this.currentExerciseIndex.update(i => i - 1);
    }
  }

  nextExercise() {
    if (!this.currentExercise()) return;

    if (this.isLastExercise()) {
      this.finishWorkout();
    } else {
      this.currentExerciseIndex.update(i => i + 1);
    }
  }

  isLastExercise() {
    return this.currentExerciseIndex() === (this.totalExercisesCount() || 0) - 1;
  }

  cancelWorkout() {
    void this.confirmCancelWorkout();
  }

  openExitOptions() {
    this.showExitOptionsModal.set(true);
  }

  dismissExitOptionsModal() {
    this.showExitOptionsModal.set(false);
  }

  /**
   * Exit the workout without cancelling. Persist current in-progress state
   * so the user can resume later, and navigate away.
   */
  exitWorkout() {
    // stop timer but keep state
    if (this.timerInterval !== undefined) {
      clearInterval(this.timerInterval);
      this.timerInterval = undefined;
    }
    this.persistInProgress();
    this.router.navigate(['/home']);
  }

  dismissCancelWorkoutModal() {
    this.showCancelWorkoutModal.set(false);
  }

  async confirmCancelWorkout() {
    this.showCancelWorkoutModal.set(false);
    if (this.timerInterval !== undefined) {
      clearInterval(this.timerInterval);
      this.timerInterval = undefined;
    }

    // clear in-progress marker when cancelling
    this.workoutService.clearInProgress();

    // Ensure navigation completes and double-check clear (race safety)
    try {
      await this.router.navigate(['/home']);
    } finally {
      this.workoutService.clearInProgress();
    }
  }

  async finishWorkout() {
    const plan = this.plan();
    if (!this.freestyleMode() && !plan) return;
    if (this.freestyleMode() && !this.freestyleExercises().length) {
      this.saveErrorMessage = 'Please add at least one exercise for freestyle workout.';
      return;
    }

    const exercises = Array.from(this.workoutData().entries()).map(([exerciseId, sets]) => ({
      exerciseId,
      sets
    }));

    const session: WorkoutSession = {
      id: Math.random().toString(36).substr(2, 9),
      planId: this.freestyleMode() ? '' : (plan?.id || ''),
      date: new Date(),
      startTime: this.startTime,
      endTime: new Date(),
      duration: this.elapsedTime(),
      exercises
    };

    if (this.timerInterval !== undefined) {
      clearInterval(this.timerInterval);
      this.timerInterval = undefined;
    }
    const saved = await this.workoutService.addSession(session);
    if (!saved) {
      this.saveErrorMessage = 'Failed to save workout session. Please try again.';
      this.startTimer();
      return;
    }

    // clear in-progress marker on successful finish
    this.workoutService.clearInProgress();

    // Optimistically mark the plan as completed so UI reflects the finished workout
    if (!this.freestyleMode()) {
      const plan = this.plan();
      if (plan) {
        this.workoutService.markPlanCompletedLocally(plan.id, session.endTime || new Date());
      }
    }

    this.saveErrorMessage = '';

    if (this.freestyleMode()) {
      this.freestylePlanName = `Freestyle ${new Date().toLocaleDateString()}`;
      this.showFreestyleSaveModal.set(true);
      return;
    }

    this.router.navigate(['/home']);
  }

  async saveFreestylePlanFromModal() {
    const planName = this.freestylePlanName.trim();
    if (!planName) {
      this.saveErrorMessage = 'Enter a plan name or skip plan creation.';
      return;
    }

    const created = await this.workoutService.createPlan({
      id: Math.random().toString(36).substr(2, 9),
      name: planName,
      description: 'Created from freestyle workout',
      exercises: this.freestyleExercises(),
      isActive: false,
    });

    if (!created) {
      this.saveErrorMessage = 'Workout saved, but failed to create plan from freestyle session.';
      return;
    }

    this.saveErrorMessage = '';
    this.showFreestyleSaveModal.set(false);
    this.router.navigate(['/home']);
  }

  skipFreestylePlanSave() {
    this.saveErrorMessage = '';
    this.showFreestyleSaveModal.set(false);
    this.router.navigate(['/home']);
  }

  openExerciseListModal() {
    this.showExerciseListModal.set(true);
  }

  closeExerciseListModal() {
    this.showExerciseListModal.set(false);
  }

  selectExercise(index: number) {
    this.currentExerciseIndex.set(index);
    this.showExerciseListModal.set(false);
  }
}
