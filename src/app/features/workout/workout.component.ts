import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { WorkoutService } from '../../core/services/workout.service';
import { NotificationService } from '../../core/services/notification.service';
import { Exercise, WorkoutPlan, WorkoutSession, Set as WorkoutSet } from '../../core/models/models';
import { SearchBarComponent } from '../../shared/components/search-bar.component';

interface ActiveWorkoutDraft {
  workoutId: string;
  freestyleMode: boolean;
  startTimeIso: string;
  elapsedSeconds: number;
  currentExerciseIndex: number;
  freestyleExerciseIds: string[];
  setsByExerciseId: Record<string, WorkoutSet[]>;
}

@Component({
  selector: 'app-workout',
  standalone: true,
  imports: [CommonModule, MatIconModule, FormsModule, SearchBarComponent],
  template: `
    <div class="h-screen flex flex-col bg-white">
      <!-- Header -->
      <header class="sticky top-0 z-20 bg-white px-6 py-4 flex justify-between items-center border-b border-gray-100">
        <button (click)="cancelWorkout()" class="text-gray-400">
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
              <img [src]="exercise.imageUrl" class="w-full h-full object-cover">
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
      <div class="fixed left-0 right-0 bottom-[-1px] z-40 bg-white border-t border-gray-100 px-4 pt-3 pb-[calc(env(safe-area-inset-bottom,1rem)+1px)] after:content-[''] after:absolute after:top-full after:left-0 after:right-0 after:h-20 after:bg-white workout-action-bar">
        <div class="flex justify-between items-center max-w-screen-xl mx-auto">
          <button (click)="prevExercise()" [disabled]="currentExerciseIndex() === 0" class="p-2.5 rounded-full bg-gray-100 text-gray-600 disabled:opacity-30">
            <mat-icon>arrow_back</mat-icon>
          </button>
          
          <span class="text-sm font-medium text-gray-500">
            {{ currentExercise() ? currentExerciseIndex() + 1 : 0 }} / {{ totalExercisesCount() }}
          </span>

          <button (click)="nextExercise()" class="px-6 py-2.5 rounded-full bg-blue-600 text-white font-bold shadow-lg shadow-blue-200 flex items-center space-x-2">
            <span>{{ isLastExercise() ? 'Finish' : 'Next' }}</span>
            <mat-icon>arrow_forward</mat-icon>
          </button>
        </div>
      </div>

      @if (showCancelWorkoutModal()) {
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

    </div>
  `,
  styles: [`
    .workout-content {
      padding-bottom: calc(176px + env(safe-area-inset-bottom, 20px));
    }
    .workout-action-bar {
      bottom: calc(72px + env(safe-area-inset-bottom, 20px));
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
  notifications = inject(NotificationService);

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
  timerInterval: any;
  saveErrorMessage = '';
  
  showInfo = false;
  showExercisePicker = false;
  exerciseSearchQuery = '';
  showCancelWorkoutModal = signal(false);
  private persistDraftOnDestroy = true;

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('planId');
      if (id) {
        this.planId.set(id);
        this.freestyleMode.set(id === 'freestyle');
        this.workoutService.setActiveWorkout(id === 'freestyle' ? 'freestyle' : id);
        if (id === 'freestyle') {
          this.freestyleExercises.set([]);
          this.showExercisePicker = true;
        }
        this.startTime = new Date();
        this.elapsedTime.set(0);
        this.currentExerciseIndex.set(0);
        clearInterval(this.timerInterval);
        this.initializeWorkoutData();
        this.restoreDraftIfPossible(id);
        this.startTimer();
      }
    });
  }

  ngOnDestroy() {
    if (this.persistDraftOnDestroy) {
      this.persistDraft();
    }
    clearInterval(this.timerInterval);
  }

  private persistDraft() {
    if (!this.currentExercise() && !this.freestyleExercises().length) return;

    const setsByExerciseId: Record<string, WorkoutSet[]> = {};
    for (const [exerciseId, sets] of this.workoutData().entries()) {
      setsByExerciseId[exerciseId] = sets.map(set => ({ ...set }));
    }

    const draft: ActiveWorkoutDraft = {
      workoutId: this.freestyleMode() ? 'freestyle' : this.planId(),
      freestyleMode: this.freestyleMode(),
      startTimeIso: this.startTime.toISOString(),
      elapsedSeconds: this.elapsedTime(),
      currentExerciseIndex: this.currentExerciseIndex(),
      freestyleExerciseIds: this.freestyleExercises().map(exercise => exercise.id),
      setsByExerciseId,
    };

    this.workoutService.saveActiveWorkoutDraft(JSON.stringify(draft));
  }

  private restoreDraftIfPossible(workoutId: string) {
    const draftRaw = this.workoutService.readActiveWorkoutDraft();
    if (!draftRaw) return;

    try {
      const draft = JSON.parse(draftRaw) as ActiveWorkoutDraft;
      if (draft.workoutId !== workoutId) return;

      if (draft.freestyleMode) {
        const byId = new Map(this.workoutService.exercises().map(exercise => [exercise.id, exercise]));
        const restoredFreestyle = draft.freestyleExerciseIds
          .map(id => byId.get(id))
          .filter((exercise): exercise is Exercise => !!exercise);
        this.freestyleExercises.set(restoredFreestyle);
        this.showExercisePicker = restoredFreestyle.length === 0;
      }

      const restoredMap = new Map<string, WorkoutSet[]>();
      for (const [exerciseId, sets] of Object.entries(draft.setsByExerciseId || {})) {
        restoredMap.set(exerciseId, sets.map(set => ({ ...set })));
      }
      if (restoredMap.size > 0) {
        this.workoutData.set(restoredMap);
      }

      this.startTime = new Date(draft.startTimeIso || new Date().toISOString());
      this.elapsedTime.set(Math.max(0, Number(draft.elapsedSeconds || 0)));
      const maxIndex = Math.max(0, this.totalExercisesCount() - 1);
      this.currentExerciseIndex.set(Math.min(Math.max(0, Number(draft.currentExerciseIndex || 0)), maxIndex));
    } catch {
      // Ignore invalid persisted draft payload.
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
      this.persistDraft();
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
    this.persistDraft();
  }

  removeSet(index: number) {
    const exId = this.currentExercise()?.id;
    if (!exId) return;

    const sets = this.workoutData().get(exId) || [];
    if (sets.length <= 1) return;

    sets.splice(index, 1);
    this.workoutData.update(m => new Map(m.set(exId, sets)));
    this.persistDraft();
  }

  toggleSet(index: number) {
    const exId = this.currentExercise()?.id;
    if (exId) {
      const sets = this.workoutData().get(exId) || [];
      sets[index].completed = !sets[index].completed;
      this.workoutData.update(m => new Map(m.set(exId, sets)));
      this.persistDraft();
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
      this.persistDraft();
    }
  }

  nextExercise() {
    if (!this.currentExercise()) return;

    if (this.isLastExercise()) {
      this.finishWorkout();
    } else {
      this.currentExerciseIndex.update(i => i + 1);
      this.persistDraft();
    }
  }

  isLastExercise() {
    return this.currentExerciseIndex() === (this.totalExercisesCount() || 0) - 1;
  }

  cancelWorkout() {
    this.showCancelWorkoutModal.set(true);
  }

  dismissCancelWorkoutModal() {
    this.showCancelWorkoutModal.set(false);
  }

  confirmCancelWorkout() {
    this.showCancelWorkoutModal.set(false);
    this.persistDraftOnDestroy = false;
    clearInterval(this.timerInterval);
    this.workoutService.clearActiveWorkout();
    this.workoutService.clearActiveWorkoutDraft();
    this.router.navigate(['/home']);
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

    clearInterval(this.timerInterval);
    const saved = await this.workoutService.addSession(session);
    if (!saved) {
      this.saveErrorMessage = 'Failed to save workout session. Please try again.';
      this.startTimer();
      return;
    }

    this.saveErrorMessage = '';

    if (this.freestyleMode()) {
      await this.handleFreestylePlanPrompt();
      return;
    }

    this.persistDraftOnDestroy = false;
    this.workoutService.clearActiveWorkout();
    this.workoutService.clearActiveWorkoutDraft();
    this.router.navigate(['/home']);
  }

  private async handleFreestylePlanPrompt() {
    const promptResult = await this.notifications.openPrompt({
      title: 'Save as workout plan?',
      message: 'Your freestyle session is saved. Optionally save these exercises as a reusable plan.',
      inputLabel: 'Plan Name',
      inputPlaceholder: 'Freestyle plan name',
      inputInitialValue: `Freestyle ${new Date().toLocaleDateString()}`,
      confirmText: 'Save Plan',
      cancelText: 'Skip',
    });

    if (!promptResult.confirmed) {
      this.saveErrorMessage = '';
      this.persistDraftOnDestroy = false;
      this.workoutService.clearActiveWorkout();
      this.workoutService.clearActiveWorkoutDraft();
      this.router.navigate(['/home']);
      return;
    }

    const planName = promptResult.inputValue.trim();
    if (!planName) {
      this.notifications.error('Enter a plan name or skip plan creation.');
      await this.handleFreestylePlanPrompt();
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
      this.notifications.error('Workout saved, but failed to create plan from freestyle session.');
      await this.handleFreestylePlanPrompt();
      return;
    }

    this.saveErrorMessage = '';
    this.persistDraftOnDestroy = false;
    this.workoutService.clearActiveWorkout();
    this.workoutService.clearActiveWorkoutDraft();
    this.notifications.success('Saved.');
    this.router.navigate(['/home']);
  }
}
