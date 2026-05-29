import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { WorkoutService } from '../../core/services/workout.service';
import { WorkoutSession, ScheduledWorkout } from '../../core/models/models';
import {
  deriveWorkoutPlanType,
  getWorkoutPlanType,
  getWorkoutTypeEmoji,
  getWorkoutTypeVisual,
  workoutTypeBadgeStyle,
  workoutTypeIconStyle,
  workoutTypeMarkerStyle
} from '../../core/domain/workout-types';

interface CalendarDay {
  date: Date;
  isToday: boolean;
  isCurrentMonth: boolean;
  hasWorkouts: boolean;
  workouts: WorkoutSession[];
  hasScheduled: boolean;
  scheduledWorkouts: ScheduledWorkout[];
}

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="p-6 pb-24 space-y-6">
      <header>
        <h1 class="text-2xl font-bold text-gray-900">Training Calendar</h1>
        <p class="text-gray-500 text-sm">Track your consistency</p>
      </header>

      <!-- Week/Month Toggle -->
      <div class="flex items-center gap-2 bg-gray-100 rounded-xl p-1 w-fit">
        <button (click)="viewMode.set('week'); setAnchorToToday()" class="px-4 py-1.5 rounded-lg text-sm font-semibold transition-all" [ngClass]="viewMode() === 'week' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'">Week</button>
        <button (click)="viewMode.set('month'); setAnchorToToday()" class="px-4 py-1.5 rounded-lg text-sm font-semibold transition-all" [ngClass]="viewMode() === 'month' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'">Month</button>
      </div>

      <!-- Hero Stats: workouts planned + done with visual punch -->
      <div (click)="toggleCategoryDetails()" class="relative overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-700 p-5 rounded-3xl shadow-lg cursor-pointer group">
        <div class="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div class="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>
        <div class="relative">
          <div class="flex items-center gap-2 text-white/80 mb-3">
            <mat-icon class="text-lg">bar_chart</mat-icon>
            <span class="text-[11px] font-bold uppercase tracking-widest">{{ viewMode() === 'month' ? 'Monthly' : 'Weekly' }} Progress</span>
            <mat-icon class="text-base ml-auto transition-all">{{ showCategoryDetails() ? 'expand_less' : 'expand_more' }}</mat-icon>
          </div>
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-baseline gap-3">
              <span class="text-4xl font-black text-emerald-300">{{ monthCompleted() }}</span>
              <span class="text-xl">✅</span> <span class="text-emerald-200/80 text-sm font-medium">done</span>
            </div>
            <div class="flex items-baseline gap-3">
              <span class="text-4xl font-black text-white">{{ monthPlanned() }}</span>
              <span class="text-xl">📋</span> <span class="text-white/70 text-sm font-medium">planned</span>
            </div>
          </div>
          <!-- Progress Bar -->
          <div class="w-full h-2.5 bg-white/20 rounded-full overflow-hidden">
            <div
              class="h-full rounded-full transition-all duration-500"
              [ngClass]="completionPercent() >= 100 ? 'bg-emerald-400' : 'bg-white'"
              [style.width.%]="completionPercent()"
            ></div>
          </div>
          <div class="flex justify-between mt-1.5">
            <span class="text-white/60 text-xs">{{ monthCompleted() }}/{{ monthPlanned() }} {{ viewMode() === 'month' ? 'this month' : 'this week' }}</span>
            <span class="text-white font-bold text-sm" [class.text-emerald-300]="completionPercent() >= 100">
              {{ completionPercent() }}%
            </span>
          </div>
        </div>

        <!-- Inline Type Breakdown -->
        <div *ngIf="showCategoryDetails()" class="mt-4 pt-4 border-t border-white/15">
          <div class="flex items-center gap-2 text-white/70 mb-3">
            <span class="text-lg">📊</span>
            <span class="text-[11px] font-bold uppercase tracking-widest">By Type</span>
          </div>
          <div class="space-y-1.5 -mx-1">
            <div *ngFor="let c of typeBreakdown()" class="flex items-center justify-between py-2.5 px-3 rounded-xl bg-black/20">
              <div class="flex items-center gap-2.5 min-w-0">
                <span class="w-2.5 h-2.5 rounded-full shrink-0" [style.backgroundColor]="typeColor(c.type)"></span>
                <span class="text-xl shrink-0">{{ c.emoji }}</span>
                <div class="min-w-0">
                  <div class="font-semibold text-white text-sm">{{ c.label }}</div>
                  <div class="text-[11px] text-white/50">{{ c.planned }} planned</div>
                </div>
              </div>
              <div class="flex items-center gap-3 shrink-0 ml-3">
                <div class="w-20 h-1.5 bg-white/15 rounded-full overflow-hidden">
                  <div
                    class="h-full rounded-full transition-all"
                    [ngStyle]="{ backgroundColor: c.completed === c.planned && c.planned > 0 ? '#34d399' : typeColor(c.type), width: (c.planned > 0 ? (c.completed / c.planned * 100) : 0) + '%' }"
                  ></div>
                </div>
                <span class="font-bold text-white text-sm">{{ c.completed }}<span class="text-white/40 font-normal">/{{ c.planned }}</span></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Calendar Grid -->
      <div class="bg-white rounded-3xl p-4 shadow-sm border border-gray-100">
        <div class="grid grid-cols-7 mb-2">
          <div *ngFor="let day of weekDays" class="text-center text-[10px] font-bold text-gray-400 uppercase">{{ day }}</div>
        </div>
        
        <div class="grid grid-cols-7 gap-1">
          <div
            *ngFor="let day of calendarDays()"
            (click)="selectDay(day)"
            class="aspect-square flex flex-col items-center justify-center rounded-xl transition-all cursor-pointer relative"
            [ngClass]="{
              'bg-blue-50 text-blue-600 font-bold': day.isToday,
              'text-gray-900': day.isCurrentMonth && !day.isToday,
              'text-gray-300': !day.isCurrentMonth,
              'bg-blue-600 text-white': selectedDate()?.getTime() === day.date.getTime()
            }"
          >
            <span class="text-sm">{{ day.date | date:'d' }}</span>
            <div class="mt-1 flex max-w-full items-center justify-center gap-0.5 overflow-hidden min-h-[12px] flex-wrap">
              <span
                *ngFor="let type of getCalendarDayWorkoutTypes(day)"
                class="h-1.5 w-1.5 rounded-full border border-white/70"
                [ngStyle]="typeMarkerStyle(type)"
              ></span>
              <span
                *ngFor="let sw of getCalendarDayScheduled(day)"
                class="h-1.5 w-1.5 rounded-full border-2 border-blue-400 bg-blue-50"
              ></span>
            </div>
          </div>
        </div>

        <!-- Month Navigation -->
        <div class="flex items-center justify-center gap-3 mt-3">
          <button (click)="previousMonth()" class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 text-gray-600 text-sm font-semibold hover:bg-gray-200 transition-colors">
            <mat-icon class="text-base">chevron_left</mat-icon>
            <span>Previous</span>
          </button>
          <span class="font-bold text-gray-900 min-w-[180px] text-center text-sm">
            {{ periodLabel() }}
          </span>
          <button (click)="nextMonth()" class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 text-gray-600 text-sm font-semibold hover:bg-gray-200 transition-colors">
            <span>Next</span>
            <mat-icon class="text-base">chevron_right</mat-icon>
          </button>
        </div>
      </div>

      <!-- Selected Day: Scheduled + Completed Workouts + Schedule Picker -->
      <section *ngIf="selectedDate()" class="space-y-3">
        <h3 class="text-sm font-bold text-gray-900 px-1">{{ selectedDate() | date:'MMMM d' }}</h3>

        <!-- Scheduled workouts -->
        <div *ngFor="let sw of selectedDayScheduled()" class="bg-blue-50/60 p-3 rounded-2xl shadow-sm border border-blue-100 flex items-center justify-between">
          <div class="flex items-center gap-3 min-w-0">
            <div class="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
              <mat-icon class="text-lg">event</mat-icon>
            </div>
            <div class="min-w-0">
              <div class="font-semibold text-gray-900 text-sm truncate">{{ sw.planName }}</div>
              <span class="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700 uppercase tracking-wide">Planned</span>
            </div>
          </div>
          <button (click)="startScheduledWorkout(sw)" class="px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg active:scale-95 transition-transform whitespace-nowrap shrink-0 ml-2">Start</button>
        </div>

        <!-- Completed/logged workouts -->
        <div *ngFor="let session of selectedDayWorkouts()" 
             (click)="openSession(session.id)"
             class="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between cursor-pointer">
          <div class="flex items-center gap-3 min-w-0">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" [ngStyle]="sessionIconStyle(session)">
              <mat-icon>fitness_center</mat-icon>
            </div>
            <div class="min-w-0">
              <div class="font-semibold text-gray-900 text-sm truncate">{{ getPlanName(session.planId) }}</div>
              <span class="mt-1 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide" [ngStyle]="sessionBadgeStyle(session)">
                {{ sessionTypeLabel(session) }}
              </span>
              <div class="text-xs text-gray-500">{{ session.date | date:'h:mm a' }} • {{ ((session.duration || 0) / 60) | number:'1.0-0' }} min</div>
            </div>
          </div>
          <div class="text-right shrink-0 ml-2">
            <div class="font-bold text-gray-900 text-sm">{{ session.caloriesBurned || 0 }}</div>
            <div class="text-[10px] text-gray-400 uppercase font-medium">Kcal</div>
          </div>
        </div>

        <!-- Schedule Workout button + inline plan picker -->
        <div class="pt-1">
          <button (click)="showSchedulePicker.set(!showSchedulePicker())" class="w-full flex items-center justify-center gap-2 p-3 rounded-2xl border-2 border-dashed border-gray-200 text-gray-500 text-sm font-semibold hover:bg-gray-50 active:bg-gray-50 transition-colors">
            <mat-icon class="text-lg">add</mat-icon>
            Schedule Workout
          </button>
          <div *ngIf="showSchedulePicker()" class="mt-2 space-y-1">
            <div *ngFor="let plan of availablePlans()" 
                 (click)="scheduleWorkout(plan.id)"
                 class="flex items-center gap-3 p-3 rounded-xl bg-white border border-gray-100 cursor-pointer active:bg-gray-50">
              <mat-icon class="text-gray-400 text-lg">fitness_center</mat-icon>
              <span class="font-medium text-gray-900 text-sm">{{ plan.name }}</span>
              <mat-icon class="ml-auto text-gray-300">chevron_right</mat-icon>
            </div>
            <div *ngIf="availablePlans().length === 0" class="text-center py-4 text-gray-400 text-sm">
              All plans already scheduled for this day.
            </div>
          </div>
        </div>

        <div *ngIf="selectedDayWorkouts().length === 0 && selectedDayScheduled().length === 0 && !showSchedulePicker()" class="text-center py-8 text-gray-400 text-sm">
          No workouts for this day.
        </div>
      </section>

    </div>
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class CalendarComponent implements OnInit {
  private workoutService = inject(WorkoutService);
  private router = inject(Router);

  currentMonth = signal(new Date());
  selectedDate = signal<Date | null>(new Date(new Date().setHours(0,0,0,0)));
  weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  viewMode = signal<'month' | 'week'>('month');
  showCategoryDetails = signal(false);
  showSchedulePicker = signal(false);

  ngOnInit() {
    this.currentMonth.set(new Date());
  }

  private getWeekStart(date: Date): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const day = d.getDay();
    d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
    return d;
  }

  periodStart = computed(() => {
    if (this.viewMode() === 'month') {
      return new Date(this.currentMonth().getFullYear(), this.currentMonth().getMonth(), 1);
    }
    return this.getWeekStart(this.currentMonth());
  });

  periodEnd = computed(() => {
    const start = this.periodStart();
    if (this.viewMode() === 'month') {
      return new Date(start.getFullYear(), start.getMonth() + 1, 0);
    }
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return end;
  });

  periodLabel = computed(() => {
    const start = this.periodStart();
    const end = this.periodEnd();
    if (this.viewMode() === 'month') {
      const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
      return `${months[start.getMonth()]} ${start.getFullYear()}`;
    }
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    if (start.getMonth() === end.getMonth()) {
      return `${months[start.getMonth()]} ${start.getDate()} - ${end.getDate()}`;
    }
    return `${months[start.getMonth()]} ${start.getDate()} - ${months[end.getMonth()]} ${end.getDate()}`;
  });

  private inPeriod(d: Date): boolean {
    const start = this.periodStart();
    const end = this.periodEnd();
    const t = d.getTime();
    const s = new Date(start).setHours(0,0,0,0);
    const e = new Date(end).setHours(23,59,59,999);
    return t >= s && t <= e;
  }

  monthPlanned = computed(() => {
    const sessions = this.workoutService.sessions().filter(s => this.inPeriod(new Date(s.date))).length;
    const scheduled = this.workoutService.scheduledWorkouts().filter(sw => {
      if (sw.status !== 'scheduled') return false;
      return this.inPeriod(new Date(sw.scheduledDate));
    }).length;
    return sessions + scheduled;
  });

  monthCompleted = computed(() => {
    return this.workoutService.sessions().filter(s => {
      const completed = !!(s.endTime || s.duration);
      return completed && this.inPeriod(new Date(s.date));
    }).length;
  });

  completionPercent = computed(() => {
    const planned = this.monthPlanned();
    if (planned === 0) return 0;
    return Math.round((this.monthCompleted() / planned) * 100);
  });

  typeBreakdown = computed(() => {
    const sessions = this.workoutService.sessions();
    const byType: Record<string, { type: string; label: string; emoji: string | null; planned: number; completed: number }> = {};

    sessions.forEach(s => {
      if (!this.inPeriod(new Date(s.date))) return;
      const type = this.getSessionWorkoutType(s);
      if (!byType[type]) {
        byType[type] = { type, label: getWorkoutTypeVisual(type).label, emoji: getWorkoutTypeEmoji(type), planned: 0, completed: 0 };
      }
      byType[type].planned += 1;
      if (s.endTime || s.duration) byType[type].completed += 1;
    });

    return Object.values(byType).sort((a, b) => b.planned - a.planned);
  });

  calendarDays = computed(() => {
    const sessions = this.workoutService.sessions();
    const scheduled = this.workoutService.scheduledWorkouts();
    const totalDays = this.viewMode() === 'week' ? 7 : 42;
    const start = this.viewMode() === 'week' ? this.getWeekStart(this.currentMonth()) : (() => {
      const year = this.currentMonth().getFullYear();
      const month = this.currentMonth().getMonth();
      const firstDay = new Date(year, month, 1);
      const d = new Date(firstDay);
      const dayOfWeek = d.getDay();
      d.setDate(d.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
      return d;
    })();

    const month = this.currentMonth().getMonth();
    const days: CalendarDay[] = [];
    const today = new Date();
    today.setHours(0,0,0,0);

    for (let i = 0; i < totalDays; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      date.setHours(0,0,0,0);

      const dayWorkouts = sessions.filter(s => {
        const d = new Date(s.date);
        d.setHours(0,0,0,0);
        return d.getTime() === date.getTime();
      });

      const dayScheduled = scheduled.filter(sw => {
        const d = new Date(sw.scheduledDate);
        d.setHours(0,0,0,0);
        return d.getTime() === date.getTime();
      });

      days.push({
        date,
        isToday: date.getTime() === today.getTime(),
        isCurrentMonth: date.getMonth() === month,
        hasWorkouts: dayWorkouts.length > 0,
        workouts: dayWorkouts,
        hasScheduled: dayScheduled.length > 0,
        scheduledWorkouts: dayScheduled
      });
    }

    return days;
  });

  selectedDayWorkouts = computed(() => {
     const selected = this.selectedDate();
     if (!selected) return [];
     
     return this.workoutService.sessions().filter(s => {
         const d = new Date(s.date);
         d.setHours(0,0,0,0);
         return d.getTime() === selected.getTime();
     });
  });

  setAnchorToToday() {
    const now = new Date();
    if (this.viewMode() === 'month') {
      this.currentMonth.set(new Date(now.getFullYear(), now.getMonth(), 1));
    } else {
      this.currentMonth.set(this.getWeekStart(now));
    }
  }

  previousMonth() {
    const d = this.currentMonth();
    if (this.viewMode() === 'month') {
      this.currentMonth.set(new Date(d.getFullYear(), d.getMonth() - 1, 1));
    } else {
      const weekStart = this.getWeekStart(d);
      weekStart.setDate(weekStart.getDate() - 7);
      this.currentMonth.set(weekStart);
    }
  }

  nextMonth() {
    const d = this.currentMonth();
    if (this.viewMode() === 'month') {
      this.currentMonth.set(new Date(d.getFullYear(), d.getMonth() + 1, 1));
    } else {
      const weekStart = this.getWeekStart(d);
      weekStart.setDate(weekStart.getDate() + 7);
      this.currentMonth.set(weekStart);
    }
  }

  selectDay(day: CalendarDay) {
    this.selectedDate.set(day.date);
  }

  openSession(sessionId: string) {
    void this.router.navigate(['/history', sessionId], { state: { fromCalendar: true } });
  }

  toggleCategoryDetails() {
    this.showCategoryDetails.update(v => !v);
  }

  getPlanName(planId: string) {
    return this.workoutService.getPlanById(planId)?.name || 'Freestyle Workout';
  }

  getCalendarDayWorkoutTypes(day: CalendarDay) {
    return day.workouts.slice(0, 3).map(session => this.getSessionWorkoutType(session));
  }

  getCalendarDayScheduled(day: CalendarDay) {
    return day.scheduledWorkouts.slice(0, 2);
  }

  selectedDayScheduled = computed(() => {
    const selected = this.selectedDate();
    if (!selected) return [];
    return this.workoutService.scheduledWorkouts().filter(sw => {
      const d = new Date(sw.scheduledDate);
      d.setHours(0,0,0,0);
      return d.getTime() === selected.getTime();
    });
  });

  startScheduledWorkout(sw: ScheduledWorkout) {
    void this.router.navigate(['/workout', sw.planId], { queryParams: { scheduleId: sw.id } });
  }

  availablePlans = computed(() => {
    const alreadyScheduled = this.selectedDayScheduled().map(sw => sw.planId);
    return this.workoutService.plans().filter(p => p.isActive && !alreadyScheduled.includes(p.id));
  });

  async scheduleWorkout(planId: string) {
    const selected = this.selectedDate();
    if (!selected) return;
    await this.workoutService.schedulePlan(planId, selected);
    this.showSchedulePicker.set(false);
  }

  getSessionWorkoutType(session: WorkoutSession) {
    const plan = this.workoutService.getPlanById(session.planId);
    if (plan) return getWorkoutPlanType(plan);

    const exercises = session.exercises
      .map(item => this.workoutService.getExerciseById(item.exerciseId))
      .filter(exercise => !!exercise);

    return deriveWorkoutPlanType(exercises);
  }

  sessionTypeLabel(session: WorkoutSession) {
    return getWorkoutTypeVisual(this.getSessionWorkoutType(session)).label;
  }

  sessionIconStyle(session: WorkoutSession) {
    return workoutTypeIconStyle(this.getSessionWorkoutType(session));
  }

  sessionBadgeStyle(session: WorkoutSession) {
    return workoutTypeBadgeStyle(this.getSessionWorkoutType(session));
  }

  typeMarkerStyle(type: string) {
    return workoutTypeMarkerStyle(type);
  }

  typeColor(type: string) {
    return getWorkoutTypeVisual(type).color;
  }
}
