import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { WorkoutService } from '../../core/services/workout.service';
import { Exercise, WorkoutPlan, WorkoutSession, Set } from '../../core/models/models';

@Component({
  selector: 'app-workout',
  standalone: true,
  imports: [CommonModule, MatIconModule, FormsModule],
  template: `
    <div class="h-screen flex flex-col bg-white">
      <!-- Header -->
      <header class="px-6 py-4 flex justify-between items-center border-b border-gray-100">
        <button (click)="cancelWorkout()" class="text-gray-400">
          <mat-icon>close</mat-icon>
        </button>
        <div class="text-center">
          <h2 class="font-bold text-gray-900">{{ plan()?.name }}</h2>
          <p class="text-xs text-blue-600 font-mono">{{ formatTime(elapsedTime()) }}</p>
        </div>
        <button (click)="finishWorkout()" class="text-blue-600 font-bold text-sm">
          Finish
        </button>
      </header>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto p-6">
        @if (saveErrorMessage) {
          <div class="mb-4 rounded-xl bg-red-50 text-red-600 text-sm px-4 py-3 border border-red-100">{{ saveErrorMessage }}</div>
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
                <div class="grid grid-cols-4 gap-4 items-center">
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
              }

              <button (click)="addSet()" class="w-full py-3 mt-4 text-blue-600 font-semibold text-sm bg-blue-50 rounded-xl border border-blue-100 border-dashed">
                + Add Set
              </button>
            </div>
          </div>
        }
      </div>

      <!-- Footer Navigation -->
      <div class="bg-white border-t border-gray-100 p-4 safe-area-pb">
        <div class="flex justify-between items-center">
          <button (click)="prevExercise()" [disabled]="currentExerciseIndex() === 0" class="p-4 rounded-full bg-gray-100 text-gray-600 disabled:opacity-30">
            <mat-icon>arrow_back</mat-icon>
          </button>
          
          <span class="text-sm font-medium text-gray-500">
            {{ currentExerciseIndex() + 1 }} / {{ plan()?.exercises?.length }}
          </span>

          <button (click)="nextExercise()" class="px-6 py-4 rounded-full bg-blue-600 text-white font-bold shadow-lg shadow-blue-200 flex items-center space-x-2">
            <span>{{ isLastExercise() ? 'Finish' : 'Next' }}</span>
            <mat-icon>arrow_forward</mat-icon>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .safe-area-pb {
      padding-bottom: env(safe-area-inset-bottom, 20px);
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
  
  currentExerciseIndex = signal(0);
  currentExercise = computed(() => this.plan()?.exercises[this.currentExerciseIndex()]);
  
  // State for the current workout session
  workoutData = signal<Map<string, Set[]>>(new Map());
  
  startTime = new Date();
  elapsedTime = signal(0);
  timerInterval: any;
  saveErrorMessage = '';
  
  showInfo = false;

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('planId');
      if (id) {
        this.planId.set(id);
        this.startTime = new Date();
        this.elapsedTime.set(0);
        clearInterval(this.timerInterval);
        this.initializeWorkoutData();
        this.startTimer();
      }
    });
  }

  ngOnDestroy() {
    clearInterval(this.timerInterval);
  }

  initializeWorkoutData() {
    const plan = this.plan();
    if (plan) {
      const data = new Map<string, Set[]>();
      
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
    }
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
    if (this.isLastExercise()) {
      this.finishWorkout();
    } else {
      this.currentExerciseIndex.update(i => i + 1);
    }
  }

  isLastExercise() {
    return this.currentExerciseIndex() === (this.plan()?.exercises.length || 0) - 1;
  }

  cancelWorkout() {
    if (confirm('Are you sure you want to cancel this workout?')) {
      clearInterval(this.timerInterval);
      this.router.navigate(['/home']);
    }
  }

  async finishWorkout() {
    const plan = this.plan();
    if (!plan) return;

    const exercises = Array.from(this.workoutData().entries()).map(([exerciseId, sets]) => ({
      exerciseId,
      sets
    }));

    const session: WorkoutSession = {
      id: Math.random().toString(36).substr(2, 9),
      planId: plan.id,
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
    this.router.navigate(['/home']);
  }
}
