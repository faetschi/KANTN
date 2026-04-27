import { Component, inject, signal, computed, OnInit, LOCALE_ID } from '@angular/core';
import { CommonModule, formatDate } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { WorkoutService } from '../../core/services/workout.service';
import { WorkoutSession } from '../../core/models/models';

interface CalendarDay {
  date: Date;
  isToday: boolean;
  isCurrentMonth: boolean;
  hasWorkouts: boolean;
  workouts: WorkoutSession[];
}

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule, MatIconModule, RouterLink],
  template: `
    <div class="p-6 pb-24 space-y-6">
      <header class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Training Calendar</h1>
          <p class="text-gray-500 text-sm">Track your consistency</p>
        </div>
        <div class="flex items-center gap-2">
            <button (click)="previousMonth()" class="p-2 rounded-xl bg-white border border-gray-100 shadow-sm">
                <mat-icon>chevron_left</mat-icon>
            </button>
            <span class="font-semibold text-gray-900 min-w-[120px] text-center">
                {{ currentMonth | date:'MMMM yyyy' }}
            </span>
            <button (click)="nextMonth()" class="p-2 rounded-xl bg-white border border-gray-100 shadow-sm">
                <mat-icon>chevron_right</mat-icon>
            </button>
        </div>
      </header>

      <!-- Stats Grid -->
      <div class="grid grid-cols-2 gap-4">
        <div class="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <div class="text-xs font-semibold text-gray-400 uppercase">Workouts</div>
            <div class="text-2xl font-bold text-blue-600">{{ monthStats().count }}</div>
        </div>
        <div class="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <div class="text-xs font-semibold text-gray-400 uppercase">Calories</div>
            <div class="text-2xl font-bold text-orange-500">{{ monthStats().calories }}</div>
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
            <div *ngIf="day.hasWorkouts" 
                 class="w-1 h-1 rounded-full mt-0.5"
                 [ngClass]="selectedDate()?.getTime() === day.date.getTime() ? 'bg-white' : 'bg-blue-500'">
            </div>
          </div>
        </div>
      </div>

      <!-- Selected Day Sessions -->
      <section *ngIf="selectedDayWorkouts().length > 0" class="space-y-3">
        <h3 class="text-sm font-bold text-gray-900 px-1">Workouts on {{ selectedDate() | date:'MMMM d' }}</h3>
        <div *ngFor="let session of selectedDayWorkouts()" 
             [routerLink]="['/history', session.id]"
             class="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <mat-icon>fitness_center</mat-icon>
            </div>
            <div>
              <div class="font-semibold text-gray-900">{{ getPlanName(session.planId) }}</div>
              <div class="text-xs text-gray-500">{{ session.date | date:'h:mm a' }} • {{ ((session.duration || 0) / 60) | number:'1.0-0' }} min</div>
            </div>
          </div>
          <div class="text-right">
            <div class="font-bold text-gray-900">{{ session.caloriesBurned || 0 }}</div>
            <div class="text-[10px] text-gray-400 uppercase font-medium">Kcal</div>
          </div>
        </div>
      </section>
      
      <div *ngIf="selectedDate() && selectedDayWorkouts().length === 0" class="text-center py-8 text-gray-400 text-sm">
        No workouts recorded for this day.
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class CalendarComponent implements OnInit {
  private workoutService = inject(WorkoutService);
  private locale = inject(LOCALE_ID);

  currentMonth = new Date();
  selectedDate = signal<Date | null>(new Date(new Date().setHours(0,0,0,0)));
  weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  ngOnInit() {
    this.currentMonth = new Date();
  }

  calendarDays = computed(() => {
    const sessions = this.workoutService.sessions();
    const year = this.currentMonth.getFullYear();
    const month = this.currentMonth.getMonth();
    
    // First day of month
    const firstDay = new Date(year, month, 1);
    // Last day of month
    const lastDay = new Date(year, month + 1, 0);
    
    // Start from the last Monday of previous month (or 1st if it's Monday)
    const start = new Date(firstDay);
    const dayOfWeek = start.getDay(); // 0 is Sunday
    const diff = (dayOfWeek === 0 ? 6 : dayOfWeek - 1); // Adjust for Monday start
    start.setDate(start.getDate() - diff);
    
    const days: CalendarDay[] = [];
    const today = new Date();
    today.setHours(0,0,0,0);
    
    // Generate 6 weeks (42 days) to keep calendar height consistent
    for (let i = 0; i < 42; i++) {
        const date = new Date(start);
        date.setDate(start.getDate() + i);
        date.setHours(0,0,0,0);
        
        const dayWorkouts = sessions.filter(s => {
            const d = new Date(s.date);
            d.setHours(0,0,0,0);
            return d.getTime() === date.getTime();
        });

        days.push({
            date,
            isToday: date.getTime() === today.getTime(),
            isCurrentMonth: date.getMonth() === month,
            hasWorkouts: dayWorkouts.length > 0,
            workouts: dayWorkouts
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

  monthStats = computed(() => {
    const month = this.currentMonth.getMonth();
    const year = this.currentMonth.getFullYear();
    const sessions = this.workoutService.sessions().filter(s => {
        const d = new Date(s.date);
        return d.getMonth() === month && d.getFullYear() === year;
    });

    return {
        count: sessions.length,
        calories: sessions.reduce((sum, s) => sum + (s.caloriesBurned || 0), 0)
    };
  });

  previousMonth() {
    this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() - 1, 1);
  }

  nextMonth() {
    this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + 1, 1);
  }

  selectDay(day: CalendarDay) {
    this.selectedDate.set(day.date);
  }

  getPlanName(planId: string) {
    return this.workoutService.getPlanById(planId)?.name || 'Freestyle Workout';
  }
}
