import { ChangeDetectionStrategy, Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { WorkoutService } from './workout.service';
import { ButtonModule } from 'primeng/button';
import { ProgressBarModule } from 'primeng/progressbar';
import { FormsModule } from '@angular/forms';
import { WorkoutPlan, WorkoutSession, ExerciseResult } from './models';

@Component({
  selector: 'app-active-workout',
  imports: [CommonModule, ButtonModule, ProgressBarModule, FormsModule],
  template: `
    <div class="min-h-screen bg-surface-ground text-white flex flex-col font-mono">
      <!-- HUD Header -->
      <header class="p-4 bg-surface-card border-b border-white/10 flex justify-between items-center sticky top-0 z-50 backdrop-blur-md bg-opacity-90">
        <button (click)="cancelWorkout()" class="text-red-500 hover:text-red-400 font-bold text-xs uppercase tracking-widest border border-red-500/30 px-3 py-1 hover:bg-red-500/10 transition-colors clip-corner-sm">
           Abort
        </button>
        <div class="text-center flex flex-col items-center">
          <div class="flex items-center gap-2 mb-1">
             <div class="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
             <span class="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">Live Session</span>
          </div>
          <div class="font-display font-black text-2xl text-white tracking-tighter leading-none">{{ timerDisplay() }}</div>
        </div>
        <button (click)="finishWorkout()" class="text-neon-lime hover:text-white font-bold text-xs uppercase tracking-widest border border-neon-lime/30 px-3 py-1 hover:bg-neon-lime/10 transition-colors clip-corner-sm">
           Complete
        </button>
      </header>

      <!-- Tactical Progress -->
      <div class="px-6 py-4 bg-surface-ground border-b border-white/5">
        <div class="flex justify-between text-[10px] font-bold text-slate-500 uppercase mb-2 tracking-widest">
          <span>Target Progress</span>
          <span class="text-neon-lime">{{ currentExerciseIndex() + 1 }} <span class="text-slate-600">/</span> {{ plan()?.exercises?.length }}</span>
        </div>
        <!-- Custom Segmented Bar -->
        <div class="w-full flex gap-1 h-1.5">
            @for (ex of plan()?.exercises; track $index) {
                <div 
                    class="h-full flex-1 transition-all duration-300"
                    [class.bg-neon-lime]="$index < currentExerciseIndex()"
                    [class.bg-white]="$index === currentExerciseIndex()"
                    [class.animate-pulse]="$index === currentExerciseIndex()"
                    [class.bg-white-10]="$index > currentExerciseIndex()"
                ></div>
            }
        </div>
      </div>

      <!-- Main Workout Interface -->
      <main class="flex-1 overflow-y-auto pb-32">
        @if (currentExercise(); as ex) {
          <div class="animate-fade-in">
            <!-- Exercise Visual -->
            <div class="relative h-64 w-full overflow-hidden border-b border-white/10 group">
                <div class="absolute inset-0 bg-black/40 z-10 group-hover:bg-black/20 transition-colors"></div>
                <!-- Grid Overlay -->
                <div class="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTAgNDAgTDQwIDAiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIgc3Ryb2tlLXdpZHRoPSIxIiBmaWxsPSJub25lIi8+PC9zdmc+')] z-10 opacity-30"></div>
                
                <img [src]="getExerciseInfo(ex.exerciseId)?.image" [alt]="getExerciseInfo(ex.exerciseId)?.name" class="w-full h-full object-cover grayscale opacity-80 group-hover:scale-105 transition-transform duration-700" />
                
                <div class="absolute bottom-0 left-0 right-0 p-6 z-20 bg-gradient-to-t from-surface-ground to-transparent">
                  <div class="text-[9px] text-neon-lime uppercase tracking-widest font-mono mb-1 border border-neon-lime/30 inline-block px-2 py-0.5 bg-black/50 backdrop-blur-sm">{{ getExerciseInfo(ex.exerciseId)?.category }}</div>
                  <h2 class="text-3xl font-display font-black text-white uppercase italic tracking-tighter">{{ getExerciseInfo(ex.exerciseId)?.name }}</h2>
                </div>
            </div>

            <!-- Dashboard -->
            <div class="p-6 space-y-8">
              
              <!-- Set Controller -->
              <div class="space-y-4">
                <div class="flex justify-between items-end border-b border-white/10 pb-2">
                  <h3 class="text-lg font-display font-bold uppercase text-white italic">Sequence Log</h3>
                  <div class="text-right">
                    <span class="text-[9px] text-slate-500 uppercase tracking-widest block">Objective</span>
                    <span class="text-xs font-mono text-white">{{ ex.sets }} SETS <span class="text-slate-600">x</span> {{ ex.reps }} REPS</span>
                  </div>
                </div>

                <div class="space-y-3">
                  @for (set of currentSets(); track $index) {
                    <div 
                      class="flex items-center justify-between p-1 pr-2 transition-all border-l-2 bg-surface-card border-y border-r border-white/5 relative overflow-hidden group"
                      [class.border-l-neon-lime]="set.completed"
                      [class.border-l-slate-700]="!set.completed"
                    >
                        <!-- Background success scanline -->
                        <div class="absolute inset-0 bg-neon-lime/5 transform -translate-x-full transition-transform duration-500 ease-out" [class.translate-x-0]="set.completed"></div>

                      <div class="flex items-center gap-4 relative z-10 pl-2">
                        <div class="font-mono text-xs text-slate-500">
                           #{{ $index + 1 | number:'2.0' }}
                        </div>

                        <div class="flex gap-4">
                            <!-- Load Input -->
                            <div class="flex flex-col gap-1">
                                <label class="text-[8px] text-slate-500 uppercase font-bold tracking-wider">Load (KG)</label>
                                <input type="number" 
                                    [(ngModel)]="set.weight" 
                                    class="w-16 bg-black border border-white/20 p-2 text-center font-mono text-sm text-neon-lime focus:border-neon-lime focus:outline-none focus:ring-1 focus:ring-neon-lime/50 transition-all" 
                                    [disabled]="set.completed"
                                />
                            </div>
                            <!-- Reps Input -->
                            <div class="flex flex-col gap-1">
                                <label class="text-[8px] text-slate-500 uppercase font-bold tracking-wider">Count</label>
                                <input type="number" 
                                    [(ngModel)]="set.reps" 
                                    class="w-16 bg-black border border-white/20 p-2 text-center font-mono text-sm text-electric-blue focus:border-electric-blue focus:outline-none focus:ring-1 focus:ring-electric-blue/50 transition-all"
                                    [disabled]="set.completed" 
                                />
                            </div>
                        </div>
                      </div>

                      <button 
                        (click)="toggleSet($index)"
                        class="relative z-10 w-12 h-12 flex items-center justify-center border transition-all active:scale-95 group/btn"
                        [class.bg-neon-lime]="set.completed"
                        [class.border-neon-lime]="set.completed"
                        [class.text-black]="set.completed"
                        [class.bg-transparent]="!set.completed"
                        [class.border-white-20]="!set.completed"
                        [class.text-slate-500]="!set.completed"
                        [class.hover:border-neon-lime]="!set.completed"
                        [class.hover:text-neon-lime]="!set.completed"
                      >
                        <i class="pi font-bold text-lg" [class.pi-check]="set.completed" [class.pi-power-off]="!set.completed"></i>
                      </button>
                    </div>
                  }
                </div>
              </div>

               <!-- Previous Perf -->
                @if (lastSession(); as last) {
                  @if (getLastResult(last, ex.exerciseId); as lastRes) {
                      <div class="bg-electric-blue/5 border border-electric-blue/20 p-4 relative overflow-hidden">
                        <div class="absolute top-0 right-0 p-1">
                             <i class="pi pi-database text-electric-blue/40 text-4xl -rotate-12"></i>
                        </div>
                        <div class="relative z-10">
                            <div class="text-[9px] font-bold text-electric-blue uppercase tracking-widest mb-1 flex items-center gap-2">
                                <span class="w-1 h-1 bg-electric-blue rounded-full"></span>
                                Historical Data
                            </div>
                            <div class="font-mono text-xs text-slate-300">
                                <span class="text-white font-bold">{{ lastRes.sets.length }} SETS</span> @ <span class="text-white font-bold">{{ lastRes.sets[0].weight }} KG</span>
                            </div>
                        </div>
                      </div>
                  }
                }
            </div>
          </div>
        }
      </main>

      <!-- Control Deck -->
      <footer class="fixed bottom-0 left-0 right-0 p-4 bg-surface-ground/90 backdrop-blur-xl border-t border-white/10 z-50 flex gap-4">
        <button 
          (click)="prevExercise()" 
          class="w-16 h-14 border border-white/20 flex items-center justify-center hover:bg-white/10 active:scale-95 transition-all bg-surface-card text-white clip-corner-sm"
          [disabled]="currentExerciseIndex() === 0"
          [class.opacity-50]="currentExerciseIndex() === 0"
        >
          <i class="pi pi-chevron-left"></i>
        </button>
        
        <button 
          (click)="nextExercise()" 
          class="flex-1 neo-button-primary h-14 flex items-center justify-center gap-3 text-sm font-bold tracking-wider"
        >
           <span>{{ isLastExercise() ? 'FINISH MISSION' : 'NEXT PROTOCOL' }}</span>
           <i class="pi" [class.pi-flag-fill]="isLastExercise()" [class.pi-chevron-right]="!isLastExercise()"></i>
        </button>
      </footer>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActiveWorkout implements OnInit, OnDestroy {
  private workoutService = inject(WorkoutService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  plan = signal<WorkoutPlan | null>(null);
  currentExerciseIndex = signal(0);
  startTime = new Date();
  secondsElapsed = signal(0);
  results = signal<ExerciseResult[]>([]);
  private timerInterval: any;
  
  // Current exercise state
  currentSets = signal<any[]>([]);

  timerDisplay = computed(() => {
    const s = this.secondsElapsed();
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  });

  currentExercise = computed(() => {
    const p = this.plan();
    if (!p) return null;
    return p.exercises[this.currentExerciseIndex()];
  });

  isLastExercise = computed(() => {
    const p = this.plan();
    if (!p) return false;
    return this.currentExerciseIndex() === p.exercises.length - 1;
  });

  lastSession = computed(() => {
    const p = this.plan();
    return p ? this.workoutService.getLastSessionForPlan(p.id) : null;
  });

  constructor() {
      // Logic handled in ngOnInit
  }

  ngOnInit() {
    const planId = this.route.snapshot.paramMap.get('id');
    if (planId) {
      const p = this.workoutService.getPlanById(planId);
      if (p) {
        this.plan.set(p);
        // Initialize if first load
        this.initExerciseWithState();
      }
    }

    // Timer
    this.timerInterval = setInterval(() => {
      this.secondsElapsed.update(s => s + 1);
    }, 1000);
  }

  ngOnDestroy() {
      if (this.timerInterval) clearInterval(this.timerInterval);
  }

  // Improved init that looks for existing result data if user navigates back/forth
  initExerciseWithState() {
     const ex = this.currentExercise();
     if (!ex) return;

     // Check if we already have results for this exercise in this active session
     const existingResult = this.results().find(r => r.exerciseId === ex.exerciseId);

     if (existingResult) {
         // Restore state
         this.currentSets.set(existingResult.sets.map(s => ({ 
             reps: s.reps, 
             weight: s.weight, 
             completed: true // Assume completed if saved, or logic can be refined
         })));
     } else {
         // New state
         const sets = [];
         for (let i = 0; i < ex.sets; i++) {
            sets.push({ reps: ex.reps, weight: ex.weight || 0, completed: false });
         }
         this.currentSets.set(sets);
     }
  }

  getExerciseInfo(id: string) {
    return this.workoutService.getExerciseById(id);
  }

  getLastResult(session: WorkoutSession, exerciseId: string) {
    if (!session || !session.results) return null;
    return session.results.find(r => r.exerciseId === exerciseId);
  }

  toggleSet(index: number) {
    this.currentSets.update(sets => {
      const newSets = [...sets];
      // Toggle completion
      newSets[index].completed = !newSets[index].completed;
      return newSets;
    });
  }

  saveCurrentExerciseResult() {
    const ex = this.currentExercise();
    if (ex) {
      // Only save completed sets or all? Let's save all but maybe filter later.
      // For now we trust the inputs.
      const result: ExerciseResult = {
        exerciseId: ex.exerciseId,
        sets: this.currentSets().map(s => ({ reps: s.reps, weight: s.weight }))
      };
      
      this.results.update(res => {
        const existing = res.findIndex(r => r.exerciseId === ex.exerciseId);
        if (existing > -1) {
          const newRes = [...res];
          newRes[existing] = result;
          return newRes;
        }
        return [...res, result];
      });
    }
  }

  nextExercise() {
    this.saveCurrentExerciseResult();
    if (this.isLastExercise()) {
      this.finishWorkout();
    } else {
      this.currentExerciseIndex.update(i => i + 1);
      this.initExerciseWithState();
    }
  }

  prevExercise() {
    if (this.currentExerciseIndex() > 0) {
      this.saveCurrentExerciseResult();
      this.currentExerciseIndex.update(i => i - 1);
      this.initExerciseWithState();
    }
  }

  cancelWorkout() {
    if (confirm('ABORT MISSION? Progress will be lost.')) {
      this.router.navigate(['/home']);
    }
  }

  finishWorkout() {
    this.saveCurrentExerciseResult();
    const p = this.plan();
    if (p) {
      const session: WorkoutSession = {
        id: Math.random().toString(36).substring(7),
        planId: p.id,
        startTime: this.startTime,
        endTime: new Date(),
        results: this.results(),
        caloriesBurned: Math.round(this.secondsElapsed() * 0.15)
      };
      this.workoutService.saveSession(session);
      this.router.navigate(['/history']);
    }
  }
}
