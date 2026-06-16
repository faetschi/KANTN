import { Component, inject, signal, computed, effect, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterLink } from '@angular/router';
import { PeriodToggleComponent } from '../../shared/components/period-toggle.component';
import { AuthService } from '../../core/services/auth.service';
import { WorkoutService } from '../../core/services/workout.service';
import { TimeSlot, WorkoutSession, ScheduledWorkout, WorkoutPlan } from '../../core/models/models';
import { TimeSlotPickerComponent, TimeSlotItem } from '../../shared/components/time-slot-picker.component';
import { generateInitialsAvatar } from '../../core/domain/avatar-utils';
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
  imports: [CommonModule, MatIconModule, RouterLink, PeriodToggleComponent, TimeSlotPickerComponent],
  template: `
    <div class="p-6 pb-24 space-y-6">
      <header class="flex justify-between items-center">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Training Calendar</h1>
          <p class="text-gray-500 text-sm">Track your consistency</p>
        </div>
        <div class="flex items-center gap-3">
          <button (click)="logout()" class="text-xs font-semibold text-red-500">Log Out</button>
          <a [routerLink]="['/profile']" class="w-10 h-10 rounded-full bg-gray-200 overflow-hidden border-2 border-white shadow-sm cursor-pointer block">
            <img [src]="user()?.avatarUrl || generateInitialsAvatar(user()?.name || 'User')" (error)="onAvatarError($event)" alt="Profile" class="w-full h-full object-cover">
          </a>
        </div>
      </header>

      <div class="mb-4">
        <app-period-toggle [value]="viewMode()" (valueChange)="onViewModeChange($event)" />
      </div>

      <!-- Hero Stats: workouts planned + done with visual punch -->
      <div (click)="toggleCategoryDetails()" class="relative overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-700 p-5 rounded-3xl shadow-lg cursor-pointer group">
        <div class="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div class="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>
        <div class="relative">
          <div class="flex items-center gap-2 text-white/80 mb-3">
            <mat-icon class="text-lg">bar_chart</mat-icon>
            <span class="text-xs font-extrabold uppercase tracking-widest">{{ viewMode() === 'month' ? 'Monthly' : 'Weekly' }} Progress</span>
            <mat-icon class="text-base ml-auto transition-all">{{ showCategoryDetails() ? 'expand_less' : 'expand_more' }}</mat-icon>
          </div>
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-baseline gap-3">
              <span class="text-4xl font-black text-emerald-300">{{ monthCompleted() }}</span>
              <span class="text-xl">✅</span><span class="text-emerald-200/80 text-sm font-medium">done</span>
            </div>
            <div class="flex items-baseline gap-3">
              <span class="text-4xl font-black text-white">{{ monthPlanned() }}</span>
              <span class="text-xl">📋</span><span class="text-white/70 text-sm font-medium">planned</span>
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

      <div class="fade-in space-y-6">
      <!-- Calendar Grid -->
      <div class="bg-white rounded-3xl p-4 shadow-sm border border-gray-100">
        <div class="grid grid-cols-7 mb-2">
          <div *ngFor="let day of weekDays" class="text-center text-[10px] font-bold text-gray-400 uppercase">{{ day }}</div>
        </div>
        
        <div class="grid grid-cols-7 gap-1">
          <div
            *ngFor="let day of calendarDays()"
            (click)="selectDay(day)"
            class="aspect-square flex flex-col items-center justify-center rounded-xl transition-all duration-150 cursor-pointer relative active:scale-90"
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
        <div class="flex items-center justify-center gap-1 mt-3">
          <button (click)="previousMonth()" class="flex items-center justify-center w-8 h-8 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
            <mat-icon class="text-lg">chevron_left</mat-icon>
          </button>
          <span class="font-bold text-gray-900 text-center text-sm px-2">
            {{ periodLabel() }}
          </span>
          <button (click)="nextMonth()" class="flex items-center justify-center w-8 h-8 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
            <mat-icon class="text-lg">chevron_right</mat-icon>
          </button>
        </div>
      </div>

      <!-- Selected Day: Scheduled + Completed Workouts -->
      <section *ngIf="selectedDate()" class="space-y-3 stagger">
        <h3 class="text-sm font-bold text-gray-900 px-1 mt-6">{{ selectedDate() | date:'MMMM d' }}</h3>

        <!-- Scheduled workouts -->
        <div *ngFor="let sw of selectedDayScheduled()" class="relative p-3 rounded-2xl shadow-sm border flex items-center justify-between transition-colors"
             [ngClass]="scheduledCardClass(sw)">
          <button (click)="removeScheduled(sw.id); $event.stopPropagation()" class="absolute -top-1 -right-1 w-5 h-5 bg-gray-300 text-gray-500 rounded-full flex items-center justify-center hover:bg-gray-400 hover:text-gray-700 transition-colors z-10 text-xs leading-none font-bold">
            ✕
          </button>
          <div class="flex items-center gap-3 min-w-0">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" [ngClass]="scheduledIconClass(sw)">
              <mat-icon class="text-lg">{{ scheduledIcon(sw) }}</mat-icon>
            </div>
            <div class="min-w-0">
              <div class="font-semibold text-sm truncate" [ngClass]="sw.status === 'skipped' ? 'text-gray-400 line-through' : 'text-gray-900'">{{ sw.planName }}</div>
              @switch (sw.status) {
                @case ('completed') {
                  <span class="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 uppercase tracking-wide">Done</span>
                }
                @case ('skipped') {
                  <span class="inline-flex items-center rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Skipped</span>
                }
                @default {
                  <span class="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700 uppercase tracking-wide">{{ sw.timeSlot ? timeSlotLabel(sw.timeSlot) : 'Planned' }}</span>
                }
              }
            </div>
          </div>
          @switch (sw.status) {
            @case ('completed') {
              <mat-icon class="text-emerald-500 shrink-0 ml-2">check_circle</mat-icon>
            }
            @case ('skipped') {
              <button (click)="unskipWorkout(sw)" class="px-3 py-1.5 text-xs font-semibold text-blue-600 rounded-lg hover:bg-blue-50 active:scale-95 transition-all whitespace-nowrap shrink-0 ml-2">Undo</button>
            }
            @default {
              <div class="flex items-center gap-1.5 shrink-0 ml-2">
                <button (click)="openSkipModal(sw)" class="px-3 py-1.5 text-xs font-semibold text-gray-500 rounded-lg hover:bg-gray-100 active:scale-95 transition-all whitespace-nowrap">Skip</button>
                <button (click)="startScheduledWorkout(sw)" class="px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg active:scale-95 transition-transform whitespace-nowrap">Start</button>
              </div>
            }
          }
        </div>

        <!-- Completed/logged workouts -->
        <div *ngFor="let session of selectedDayWorkouts()" 
             (click)="openSession(session.id)"
             class="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between cursor-pointer">
          <div class="flex items-center gap-3 min-w-0">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-emerald-100 text-emerald-600">
              <mat-icon>check_circle</mat-icon>
            </div>
            <div class="min-w-0">
              <div class="font-semibold text-gray-900 text-sm truncate">{{ getPlanName(session.planId) }}</div>
              <div class="mt-1 flex items-center gap-2">
                <span class="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide" [ngStyle]="sessionBadgeStyle(session)">
                  {{ sessionTypeLabel(session) }}
                </span>
                <span class="text-xs text-gray-500">{{ session.date | date:'h:mm a' }} • {{ ((session.duration || 0) / 60) | number:'1.0-0' }} min</span>
              </div>
            </div>
          </div>
          <div class="text-right shrink-0 ml-2">
            <div class="font-bold text-gray-900 text-sm">{{ session.caloriesBurned || 0 }}</div>
            <div class="text-[10px] text-gray-400 uppercase font-medium">Kcal</div>
          </div>
        </div>

        <div *ngIf="selectedDayWorkouts().length === 0 && selectedDayScheduled().length === 0" class="text-center py-8 text-gray-400 text-sm">
          {{ isTodaySelected() ? 'No workouts today.' : 'No workouts for this day.' }}
        </div>
      </section>
    </div>

    <!-- FAB Button -->
    <button
      (click)="openScheduleModal()"
      class="fixed bottom-24 right-6 bg-blue-600 hover:bg-blue-700 text-white w-14 h-14 rounded-full shadow flex items-center justify-center z-40 hover:shadow-lg active:scale-95 transition-all duration-150 ease-out focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2"
    >
      <mat-icon>add</mat-icon>
    </button>

    <!-- Schedule Workout Modal -->
    <div *ngIf="showScheduleModal()" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-backdrop" (click)="closeScheduleModal()">
        <div class="bg-white rounded-3xl shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden animate-scale-in" (click)="$event.stopPropagation()">
          <ng-container *ngIf="!scheduleWorkoutType(); else planList">
            <!-- Workout Type Picker -->
            <div class="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 class="text-lg font-bold text-gray-900">What kind of workout?</h3>
              <button (click)="closeScheduleModal()" class="text-gray-400 hover:text-gray-600 p-1">
                <mat-icon class="text-xl">close</mat-icon>
              </button>
            </div>
            <div class="grid grid-cols-2 gap-3 p-4">
              <button type="button" (click)="selectScheduleWorkoutType('strength')"
                      class="flex flex-col items-center justify-center gap-2 p-6 rounded-2xl border-2 transition-all active:scale-95"
                      [class.border-red-300]="true" [class.bg-red-50]="true">
                <span class="text-3xl">{{ workoutTypeEmoji('strength') }}</span>
                <span class="text-base font-bold text-gray-900">Strength</span>
                <span class="text-xs text-gray-500">Weightlifting, resistance training</span>
              </button>
              <button type="button" (click)="selectScheduleWorkoutType('cardio')"
                      class="flex flex-col items-center justify-center gap-2 p-6 rounded-2xl border-2 transition-all active:scale-95"
                      [class.border-green-300]="true" [class.bg-green-50]="true">
                <span class="text-3xl">{{ workoutTypeEmoji('cardio') }}</span>
                <span class="text-base font-bold text-gray-900">Cardio</span>
                <span class="text-xs text-gray-500">Running, cycling, hiking</span>
              </button>
            </div>
          </ng-container>
          <ng-template #planList>
            <div class="flex items-center justify-between p-4 border-b border-gray-100">
              <div class="flex items-center gap-2">
                <button type="button" (click)="scheduleWorkoutType.set(null)" class="text-gray-400 hover:text-gray-600 p-1 flex items-center">
                  <mat-icon class="text-xl">arrow_back</mat-icon>
                </button>
                <h3 class="text-lg font-bold text-gray-900">Schedule Workout</h3>
                <span class="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide" [ngStyle]="typeBadgeStyle(scheduleWorkoutType())">
                  {{ typeLabel(scheduleWorkoutType()) }}
                </span>
              </div>
              <button (click)="closeScheduleModal()" class="text-gray-400 hover:text-gray-600 p-1">
                <mat-icon class="text-xl">close</mat-icon>
              </button>
            </div>
            <div class="p-4 space-y-2 max-h-[60vh] overflow-y-auto animate-fade-in">
              <div *ngFor="let plan of availablePlans()"
                   (click)="scheduleWorkout(plan.id); closeScheduleModal()"
                   class="flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors"
                   [ngClass]="scheduledPlanIds().has(plan.id) ? 'bg-gray-100 border-gray-200 opacity-60' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'">
                <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" [ngStyle]="planIconStyle(plan)">
                  <mat-icon class="text-lg" [style.color]="planIconTextColor(plan)">fitness_center</mat-icon>
                </div>
                <div class="min-w-0 flex-1">
                  <div class="font-semibold text-gray-900 text-sm truncate">{{ plan.name }}</div>
                  <div class="flex items-center gap-2 mt-1">
                    <span class="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide" [ngStyle]="planBadgeStyle(plan)">
                      {{ planTypeLabel(plan) }}
                    </span>
                    <span *ngIf="plan.lastPerformed" class="text-[10px] text-gray-400">Last: {{ plan.lastPerformed | date:'MMM d' }}</span>
                    <span *ngIf="scheduledPlanIds().has(plan.id)" class="text-[10px] text-gray-400 ml-auto">Already scheduled</span>
                  </div>
                </div>
                <mat-icon class="text-gray-300 shrink-0">chevron_right</mat-icon>
              </div>
              <div *ngIf="availablePlans().length === 0" class="text-center py-4 text-gray-400 text-sm">
                All plans already scheduled for this day.
              </div>
            </div>
          </ng-template>
        </div>
      </div>

      <!-- Time-slot picker for multi-workout days -->
      <app-time-slot-picker *ngIf="showTimeSlotPicker()"
        [workouts]="timeSlotItems()"
        (saved)="onTimeSlotsSaved($event)"
        (cancelled)="showTimeSlotPicker.set(false)"
      />

      <!-- Gentle skip confirmation -->
      <div *ngIf="showSkipModal()" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-backdrop" (click)="closeSkipModal()">
        <div class="bg-white rounded-3xl shadow-xl max-w-sm w-full overflow-hidden animate-scale-in" (click)="$event.stopPropagation()">
          <div class="p-5 text-center">
            <div class="w-12 h-12 mx-auto rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mb-3">
              <mat-icon>self_improvement</mat-icon>
            </div>
            <h3 class="text-lg font-bold text-gray-900">Skip this workout?</h3>
            <p class="text-sm text-gray-500 mt-1">{{ skipTarget()?.planName }} — that's completely okay. Rest is part of training. 💙</p>
          </div>
          <div class="px-5 pb-2">
            <p class="text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-2">Reason (optional)</p>
            <div class="flex flex-wrap gap-2">
              <button *ngFor="let reason of skipReasons" type="button" (click)="toggleSkipReason(reason)"
                      class="px-3 py-1.5 rounded-full text-xs font-semibold border transition-all active:scale-95"
                      [ngClass]="skipReason() === reason ? 'bg-amber-500 text-white border-amber-500' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'">
                {{ reason }}
              </button>
            </div>
          </div>
          <div class="flex items-center gap-2 p-4">
            <button (click)="closeSkipModal()" class="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 active:scale-95 transition-all">Keep it</button>
            <button (click)="confirmSkip()" class="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-amber-500 hover:bg-amber-600 active:scale-95 transition-all">Skip workout</button>
          </div>
        </div>
      </div>
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class CalendarComponent implements OnInit {
  private authService = inject(AuthService);
  private workoutService = inject(WorkoutService);
  private router = inject(Router);
  generateInitialsAvatar = generateInitialsAvatar;

  user = this.authService.currentUser;

  onAvatarError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.src = generateInitialsAvatar(this.user()?.name || 'User');
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  currentMonth = signal(new Date());
  selectedDate = signal<Date | null>(new Date(new Date().setHours(0,0,0,0)));
  weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  viewMode = signal<'month' | 'week'>('month');
  showCategoryDetails = signal(false);
  isTodaySelected = computed(() => {
    const d = this.selectedDate();
    if (!d) return false;
    const now = new Date();
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
  });
  showScheduleModal = signal(false);
  scheduleWorkoutType = signal<'strength' | 'cardio' | null>(null);

  // ── Time-slot assignment state ──
  showTimeSlotPicker = signal(false);
  timeSlotItems = signal<TimeSlotItem[]>([]);
  private pendingScheduledPlanId = '';
  private pendingScheduledDate: Date | null = null;

  constructor() {
    effect(() => {
      const ids = this.scheduledPlanIds();
      const all = this.availablePlans();
      if (this.showScheduleModal() && all.length > 0 && all.every(p => ids.has(p.id))) {
        this.scheduleWorkoutType.set(null);
        this.showScheduleModal.set(false);
      }
    });
  }

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

  onViewModeChange(mode: string) {
    this.viewMode.set(mode as 'month' | 'week');
    this.setAnchorToToday();
  }

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

  scheduledPlanIds = computed(() => new Set(this.selectedDayScheduled().map(sw => sw.planId)));

  removeScheduled(scheduleId: string) {
    this.workoutService.removeScheduledWorkout(scheduleId);
  }

  startScheduledWorkout(sw: ScheduledWorkout) {
    void this.router.navigate(['/workout', sw.planId], { queryParams: { scheduleId: sw.id } });
  }

  // ── Skip workout (gentle) ──
  showSkipModal = signal(false);
  skipTarget = signal<ScheduledWorkout | null>(null);
  skipReason = signal<string | null>(null);
  skipReasons = ['Rest day', 'Feeling tired', 'No time today', 'Injured / sore'];

  openSkipModal(sw: ScheduledWorkout) {
    this.skipTarget.set(sw);
    this.skipReason.set(null);
    this.showSkipModal.set(true);
  }

  closeSkipModal() {
    this.showSkipModal.set(false);
    this.skipTarget.set(null);
  }

  toggleSkipReason(reason: string) {
    this.skipReason.update(current => current === reason ? null : reason);
  }

  async confirmSkip() {
    const target = this.skipTarget();
    if (!target) return;
    await this.workoutService.updateScheduledWorkoutStatus(target.id, 'skipped');
    this.closeSkipModal();
  }

  async unskipWorkout(sw: ScheduledWorkout) {
    await this.workoutService.updateScheduledWorkoutStatus(sw.id, 'scheduled');
  }

  scheduledCardClass(sw: ScheduledWorkout): string {
    if (sw.status === 'completed') return 'bg-emerald-50/60 border-emerald-100';
    if (sw.status === 'skipped') return 'bg-gray-50 border-gray-100';
    return 'bg-blue-50/60 border-blue-100';
  }

  scheduledIconClass(sw: ScheduledWorkout): string {
    if (sw.status === 'completed') return 'bg-emerald-100 text-emerald-600';
    if (sw.status === 'skipped') return 'bg-gray-200 text-gray-400';
    return 'bg-blue-100 text-blue-600';
  }

  scheduledIcon(sw: ScheduledWorkout): string {
    if (sw.status === 'completed') return 'check_circle';
    if (sw.status === 'skipped') return 'skip_next';
    return 'event';
  }

  availablePlans = computed(() => {
    const type = this.scheduleWorkoutType();
    const plans = this.workoutService.plans();
    if (!type) return plans;
    return plans.filter(plan => getWorkoutPlanType(plan) === type);
  });

  isPlanScheduled(planId: string) {
    return this.scheduledPlanIds().has(planId);
  }

  openScheduleModal() {
    this.scheduleWorkoutType.set(null);
    this.showScheduleModal.set(true);
  }

  closeScheduleModal() {
    this.scheduleWorkoutType.set(null);
    this.showScheduleModal.set(false);
  }

  selectScheduleWorkoutType(type: 'strength' | 'cardio') {
    this.scheduleWorkoutType.set(type);
  }

  workoutTypeEmoji(type: string | null | undefined) {
    return getWorkoutTypeEmoji(type);
  }

  typeLabel(type: string | null | undefined) {
    return getWorkoutTypeVisual(type).label;
  }

  typeBadgeStyle(type: string | null | undefined) {
    return workoutTypeBadgeStyle(type);
  }

  async scheduleWorkout(planId: string) {
    const selected = this.selectedDate();
    if (!selected) return;

    const existing = this.workoutService.getScheduledWorkoutsForDate(selected);
    if (existing.length === 0) {
      await this.workoutService.schedulePlan(planId, selected);
      return;
    }

    // Conflict — show time-slot picker
    const plan = this.workoutService.getPlanById(planId);
    this.pendingScheduledPlanId = planId;
    this.pendingScheduledDate = selected;
    this.timeSlotItems.set([
      ...existing.map(sw => ({ id: sw.id, planName: sw.planName, timeSlot: sw.timeSlot ?? null })),
      { id: null, planName: plan?.name || 'New Workout', timeSlot: null },
    ]);
    this.showTimeSlotPicker.set(true);
  }

  async onTimeSlotsSaved(items: TimeSlotItem[]) {
    this.showTimeSlotPicker.set(false);

    const newItem = items.find(i => i.id === null);
    const existingItems = items.filter(i => i.id !== null);

    if (newItem?.timeSlot && this.pendingScheduledDate) {
      await this.workoutService.schedulePlan(this.pendingScheduledPlanId, this.pendingScheduledDate, newItem.timeSlot);
    }

    for (const item of existingItems) {
      if (item.id && item.timeSlot) {
        await this.workoutService.updateTimeSlot(item.id, item.timeSlot as TimeSlot);
      }
    }
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

  timeSlotLabel(slot: TimeSlot): string {
    return slot === 'morning' ? '🌅 Morning' : slot === 'afternoon' ? '☀️ Afternoon' : '🌙 Evening';
  }

  planTypeLabel(plan: WorkoutPlan) {
    return getWorkoutTypeVisual(getWorkoutPlanType(plan)).label;
  }

  planBadgeStyle(plan: WorkoutPlan) {
    return workoutTypeBadgeStyle(getWorkoutPlanType(plan));
  }

  planIconStyle(plan: WorkoutPlan) {
    return workoutTypeIconStyle(getWorkoutPlanType(plan));
  }

  planIconTextColor(plan: WorkoutPlan) {
    return getWorkoutTypeVisual(getWorkoutPlanType(plan)).textColor;
  }
}
