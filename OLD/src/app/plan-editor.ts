import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { WorkoutService } from './workout.service';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { FormsModule } from '@angular/forms';
import { Exercise, WorkoutExercise, WorkoutPlan } from './models';

@Component({
  selector: 'app-plan-editor',
  imports: [CommonModule, ButtonModule, InputTextModule, TextareaModule, SelectModule, FormsModule, RouterLink],
  template: `
    <div class="p-6 space-y-8 pb-32 min-h-screen bg-surface-ground text-white">
      <header class="flex items-center gap-4">
        <div class="relative group">
            <button routerLink="/plans" class="w-12 h-12 border border-white/20 flex items-center justify-center hover:bg-white/10 active:scale-95 transition-all bg-surface-card text-white clip-corner-top-left">
            <i class="pi pi-chevron-left text-xl"></i>
            </button>
            <div class="absolute -bottom-1 -right-1 w-2 h-2 bg-neon-lime"></div>
        </div>
        <div>
            <h1 class="text-3xl font-display font-black uppercase italic text-white tracking-tighter">{{ isEdit ? 'Edit Mission' : 'Create Mission' }}</h1>
            <div class="flex items-center gap-2 text-xs font-mono text-neon-lime uppercase tracking-widest mt-1">
                <span class="w-2 h-2 bg-neon-lime rounded-full animate-pulse"></span>
                <span>Classified Clearance LeveL 1</span>
            </div>
        </div>
      </header>

      <div class="space-y-6">
        <!-- Basic Info -->
        <section class="space-y-6">
          <div class="flex flex-col gap-2 group">
            <label for="planName" class="text-xs font-mono font-bold text-slate-500 uppercase tracking-widest group-focus-within:text-neon-lime transition-colors">Mission Codename</label>
            <input id="planName" pInputText [ngModel]="planName()" (ngModelChange)="planName.set($event)" placeholder="e.g. OPERATION SHRED" class="w-full !rounded-none !bg-surface-card !border !border-white/10 !p-4 !text-white !font-display !font-bold !text-lg focus:!border-neon-lime focus:!ring-0 transition-colors placeholder:text-slate-600" />
          </div>
          <div class="flex flex-col gap-2 group">
            <label for="planDesc" class="text-xs font-mono font-bold text-slate-500 uppercase tracking-widest group-focus-within:text-neon-lime transition-colors">Tactical Briefing</label>
            <textarea id="planDesc" pTextarea [ngModel]="planDescription()" (ngModelChange)="planDescription.set($event)" rows="3" placeholder="Define mission parameters and primary objectives..." class="w-full !rounded-none !bg-surface-card !border !border-white/10 !p-4 !text-white !font-mono focus:!border-neon-lime focus:!ring-0 transition-colors placeholder:text-slate-600"></textarea>
          </div>
        </section>

        <!-- Exercises -->
        <section class="space-y-4">
          <div class="flex justify-between items-center border-b border-white/10 pb-2">
            <h3 class="text-lg font-display font-bold uppercase text-white italic">Tactical Tasks <span class="text-neon-lime not-italic text-sm ml-2 font-mono">({{selectedExercises().length}})</span></h3>
            <button (click)="showExercisePicker.set(true)" class="text-black bg-neon-lime text-xs font-mono font-bold flex items-center gap-2 px-4 py-2 hover:bg-white transition-colors uppercase tracking-wider clip-corner-sm">
              <i class="pi pi-plus"></i>
              Add Task
            </button>
          </div>

          <div class="space-y-3">
            @for (ex of selectedExercises(); track $index) {
              <div class="neo-card flex items-center gap-4 !p-0 group hover:border-white/30 pr-4 bg-surface-card border border-white/10 relative overflow-hidden">
                
                <!-- Drag handle / Index -->
                <div class="w-8 self-stretch bg-black/40 flex items-center justify-center border-r border-white/5 text-slate-600 font-mono text-xs">
                    {{ $index + 1 | number:'2.0' }}
                </div>

                <div class="w-16 h-16 bg-black border-r border-white/10 flex-shrink-0 relative overflow-hidden">
                  <img [src]="getExerciseInfo(ex.exerciseId)?.image" [alt]="getExerciseInfo(ex.exerciseId)?.name" class="w-full h-full object-cover grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition-all scale-110" />
                </div>
                <div class="flex-1 min-w-0 py-3">
                  <div class="font-display font-bold text-sm truncate uppercase text-white tracking-tight group-hover:text-neon-lime transition-colors">{{ getExerciseInfo(ex.exerciseId)?.name }}</div>
                  <div class="flex items-center gap-4 mt-2">
                    <div class="flex items-center gap-2">
                        <span class="text-[9px] text-slate-500 uppercase font-mono tracking-widest">Sets</span>
                        <input type="number" [ngModel]="ex.sets" (ngModelChange)="ex.sets = $event" class="w-12 text-center text-xs bg-black border border-white/10 text-neon-lime font-mono p-1 focus:border-neon-lime focus:outline-none" />
                    </div>
                    <div class="w-px h-4 bg-white/10"></div>
                     <div class="flex items-center gap-2">
                        <span class="text-[9px] text-slate-500 uppercase font-mono tracking-widest">Reps</span>
                        <input type="number" [ngModel]="ex.reps" (ngModelChange)="ex.reps = $event" class="w-12 text-center text-xs bg-black border border-white/10 text-electric-blue font-mono p-1 focus:border-electric-blue focus:outline-none" />
                    </div>
                  </div>
                </div>
                <button (click)="removeExercise($index)" class="w-8 h-8 flex items-center justify-center text-slate-600 hover:text-red-500 hover:bg-red-500/10 transition-colors border border-transparent hover:border-red-500/30">
                  <i class="pi pi-times"></i>
                </button>
              </div>
            } @empty {
              <div class="text-center py-16 bg-black/20 border border-dashed border-white/10 text-slate-500 font-mono text-xs uppercase tracking-widest flex flex-col items-center gap-2">
                <i class="pi pi-box text-2xl mb-2 opacity-50"></i>
                <p>No tasks assigned.</p>
                <p class="opacity-50 text-[10px]">Add exercises to initialize sequence</p>
              </div>
            }
          </div>
        </section>
      </div>

      <!-- Footer Action -->
      <div class="fixed bottom-0 left-0 right-0 p-6 bg-surface-ground/90 backdrop-blur-xl border-t border-white/10 z-50 flex justify-end">
        <button 
          (click)="savePlan()"
          class="w-full neo-button-primary"
          [disabled]="!planName() || selectedExercises().length === 0"
        >
          {{ isEdit ? 'Update Mission Protocols' : 'Initialize Mission' }}
        </button>
      </div>

      <!-- Exercise Picker Modal (Simplified for this demo) -->
      @if (showExercisePicker()) {
        <div class="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6 animate-fade-in">
          <div class="w-full max-w-lg bg-surface-ground border border-white/20 sm:rounded-none h-[80vh] flex flex-col shadow-2xl relative">
            
            <!-- Modal Header -->
            <div class="flex justify-between items-center p-6 border-b border-white/10 bg-surface-card relative overflow-hidden">
             <!-- Decorative bg striped -->
             <div class="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNCIgaGVpZ2h0PSI0IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXRoIGQ9Ik0tMSwxIGwyLC0yIE0wLDQgbDQsLTQgTTMsNSBsMiwtMiIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDMpIiBzdHJva2Utd2lkdGg9IjEiLz48L3N2Zz4=')] opacity-50 pointer-events-none"></div>
              
              <div class="relative z-10">
                <h3 class="text-xl font-display font-black uppercase italic text-white tracking-tighter">Select Task</h3>
                <div class="text-[10px] font-mono text-neon-lime uppercase tracking-widest">Database Access: Granted</div>
              </div>
              <button (click)="showExercisePicker.set(false)" class="relative z-10 w-10 h-10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors border border-transparent hover:border-white/20">
                <i class="pi pi-times"></i>
              </button>
            </div>

            <!-- List -->
            <div class="flex-1 overflow-y-auto p-4 space-y-2">
              @for (ex of allExercises(); track ex.id) {
                <button 
                  (click)="addExercise(ex)"
                  class="w-full flex items-center gap-4 text-left hover:bg-white/5 active:bg-neon-lime/10 transition-all group !p-2 border border-transparent hover:border-white/10 relative overflow-hidden"
                >
                    <!-- Hover Effect Bar -->
                    <div class="absolute left-0 top-0 bottom-0 w-1 bg-neon-lime transform -translate-x-full group-hover:translate-x-0 transition-transform duration-200"></div>

                    <div class="w-14 h-14 bg-black border border-white/10 flex-shrink-0 relative overflow-hidden">
                        <img [src]="ex.image" class="w-full h-full object-cover grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all scale-110" />
                    </div>
                    <div class="flex-1 min-w-0 pl-2">
                        <div class="font-display font-bold text-sm uppercase text-white group-hover:text-neon-lime transition-colors tracking-tight">{{ ex.name }}</div>
                        <div class="text-[10px] text-slate-500 font-mono uppercase tracking-widest group-hover:text-slate-400">{{ ex.category }}</div>
                    </div>
                    <div class="w-8 h-8 flex items-center justify-center border border-white/5 group-hover:border-neon-lime/50 text-slate-600 group-hover:text-neon-lime transition-all">
                        <i class="pi pi-plus text-xs"></i>
                    </div>
                </button>
              }
            </div>
          </div>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlanEditor {
  private workoutService = inject(WorkoutService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  planName = signal('');
  planDescription = signal('');
  selectedExercises = signal<WorkoutExercise[]>([]);
  showExercisePicker = signal(false);
  isEdit = false;
  planId: string | null = null;

  allExercises = this.workoutService.allExercises;

  constructor() {
    this.planId = this.route.snapshot.paramMap.get('id');
    if (this.planId) {
      this.isEdit = true;
      const plan = this.workoutService.getPlanById(this.planId);
      if (plan) {
        this.planName.set(plan.name);
        this.planDescription.set(plan.description);
        this.selectedExercises.set([...plan.exercises.map(ex => ({ ...ex }))]);
      }
    }
  }

  getExerciseInfo(id: string) {
    return this.workoutService.getExerciseById(id);
  }

  addExercise(ex: Exercise) {
    // Add default sets/reps
    this.selectedExercises.update(list => [...list, {
      exerciseId: ex.id,
      sets: ex.defaultSets || 3,
      reps: ex.defaultReps || 10
    }]);
    this.showExercisePicker.set(false);
  }

  removeExercise(index: number) {
    this.selectedExercises.update(list => list.filter((_, i) => i !== index));
  }

  savePlan() {
    const newPlan: WorkoutPlan = {
      id: this.planId || Math.random().toString(36).substring(7),
      name: this.planName(),
      description: this.planDescription(),
      exercises: this.selectedExercises(),
      durationWeeks: 4,
      createdAt: new Date()
    };

    if (this.isEdit) {
      // Logic for update would go here
       this.workoutService.addPlan(newPlan); // Simplified for this demo
    } else {
      this.workoutService.addPlan(newPlan);
    }
    
    this.router.navigate(['/plans']);
  }
}
