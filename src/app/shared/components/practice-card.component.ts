import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { WorkoutPlan } from '../../core/models/models';
import { ContributionDay, WeekDayEntry } from '../../core/models/activity-models';
import { intensityColor } from '../../core/domain/activity-utils';
import { getWorkoutPlanType, getWorkoutTypeVisual, getWorkoutTypeEmoji, workoutTypeBadgeStyle } from '../../core/domain/workout-types';
import { ContributionGridComponent } from './contribution-grid.component';

@Component({
  selector: 'app-practice-card',
  standalone: true,
  imports: [CommonModule, MatIconModule, ContributionGridComponent],
  template: `
    <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
      <div class="flex justify-between items-center mb-3">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-lg flex items-center justify-center" [style.background]="badgeVisual.bgColor">
            <mat-icon class="text-base" [style]="{fontSize:'16px',width:'16px',height:'16px',color:badgeVisual.color}">fitness_center</mat-icon>
          </div>
          <div class="flex flex-col">
            <span class="font-semibold text-gray-900">{{ plan.name }}</span>
            <div class="flex items-center gap-1 mt-0.5">
              <span
                class="inline-flex items-center rounded-full border px-1.5 py-[1px] text-[9px] font-bold uppercase tracking-wide leading-tight"
                [ngStyle]="badgeStyle"
              >
                <span class="mr-0.5" aria-hidden="true">{{ badgeEmoji }}</span>
                {{ badgeLabel }}
              </span>
              @if (plan.category) {
                <span class="inline-flex items-center rounded-full bg-blue-50 px-1.5 py-[1px] text-[9px] font-bold uppercase tracking-wide leading-tight text-blue-600">
                  {{ plan.category }}
                </span>
              }
            </div>
          </div>
        </div>
        @if (streak > 0) {
          <div class="flex items-center gap-1 text-orange-500">
            <mat-icon class="text-sm">local_fire_department</mat-icon>
            <span class="font-bold text-sm">{{ streak }}</span>
          </div>
        }
      </div>

      @if (viewMode === 'weekly') {
        <div class="grid grid-cols-7 gap-1.5">
          @for (day of weeklyData; track $index) {
            <div class="flex flex-col items-center gap-1">
              <span class="text-[10px] font-bold text-gray-400 uppercase">{{ day.dayLabel }}</span>
              <div
                class="w-full aspect-square rounded-lg flex items-center justify-center text-xs font-bold cursor-pointer select-none transition-transform duration-150 active:scale-90"
                [class.text-white]="day.isActive"
                [class.text-gray-300]="!day.isActive"
                [class.border]="!day.isActive"
                [class.border-gray-200]="!day.isActive"
                [class.shadow-sm]="day.isActive"
                [style.background]="day.isActive ? intensityColor(2, 'green') : 'transparent'"
                [style.touch-action]="'manipulation'"
                (pointerdown)="onPointerDown(plan.id, day, $event)"
                (pointerup)="onPointerUp()"
                (pointerleave)="onPointerUp()"
              >
                {{ day.value }}
              </div>
            </div>
          }
        </div>
      }

      @if (viewMode === 'monthly') {
        <div class="mt-2">
          <div class="grid grid-cols-7 gap-1">
            @for (label of weekdayLabels; track $index) {
              <span class="text-[10px] font-bold text-gray-400 uppercase text-center">{{ label }}</span>
            }
            @for (pad of monthlyLeadingPad; track $index) {
              <div class="aspect-square rounded-sm"></div>
            }
            @for (day of monthlyData; track $index) {
              <div
                class="aspect-square rounded-sm flex items-center justify-center text-[10px] font-bold transition-opacity"
                [class.active-cell]="day.count > 0"
                [class.text-white]="day.count > 0"
                [class.text-gray-300]="day.count === 0"
                [style.backgroundColor]="day.count > 0 ? intensityColor(day.intensity, 'green') : 'transparent'"
                [title]="day.count > 0 ? (day.date.toLocaleDateString() + ': ' + day.count + ' sessions') : ''"
                (click)="day.count > 0 && onContributionClick(plan.id, day)"
              >{{ day.date.getDate() }}</div>
            }
          </div>
          <div class="flex items-center justify-between mt-2 text-xs text-gray-500">
            @if (streak > 0) {
              <span>{{ streak }} day streak</span>
            }
            <span>{{ totalActiveDays }} active days</span>
          </div>
        </div>
      }

      @if (viewMode === 'yearly') {
        <div class="mt-2">
          <app-contribution-grid
            [data]="yearlyData"
            [compact]="false"
            
          />
          <div class="flex items-center justify-between mt-2 text-xs text-gray-500">
            @if (streak > 0) {
              <span>{{ streak }} day streak</span>
            }
            <span>{{ totalActiveDays }} active days</span>
          </div>
        </div>
      }
    </div>
  `,
  host: { class: 'block' },
})
export class PracticeCardComponent {
  @Input() plan!: WorkoutPlan;
  @Input() viewMode: 'weekly' | 'monthly' | 'yearly' = 'weekly';
  @Input() weeklyData: WeekDayEntry[] = [];
  @Input() monthlyData: ContributionDay[] = [];
  @Input() yearlyData: ContributionDay[] = [];
  @Input() streak: number = 0;
  @Input() totalActiveDays: number = 0;
  @Output() cellClick = new EventEmitter<{ planId: string; date: Date }>();
  @Output() cellLongPress = new EventEmitter<{ planId: string; date: Date }>();

  intensityColor = intensityColor;
  weekdayLabels = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];

  get monthlyLeadingPad(): number[] {
    if (this.monthlyData.length === 0) return [];
    const first = this.monthlyData[0].date.getDay();
    const pad = first === 0 ? 6 : first - 1;
    return new Array(pad).fill(0);
  }

  onContributionClick(planId: string, day: ContributionDay) {
    this.cellClick.emit({ planId, date: day.date });
  }

  private pressTimer: ReturnType<typeof setTimeout> | null = null;
  private pressedPlanId: string | null = null;
  private pressedDate: Date | null = null;

  private get workoutType() {
    return getWorkoutPlanType(this.plan);
  }

  get badgeVisual() {
    return getWorkoutTypeVisual(this.workoutType);
  }

  get badgeStyle() {
    return workoutTypeBadgeStyle(this.workoutType);
  }

  get badgeLabel() {
    return this.badgeVisual.label;
  }

  get badgeEmoji() {
    return getWorkoutTypeEmoji(this.workoutType) || '';
  }

  onPointerDown(planId: string, day: WeekDayEntry, event: PointerEvent) {
    event.preventDefault();
    this.pressedPlanId = planId;
    this.pressedDate = day.date;
    this.pressTimer = setTimeout(() => {
      if (this.pressedPlanId && this.pressedDate) {
        this.cellLongPress.emit({ planId: this.pressedPlanId, date: this.pressedDate });
      }
      this.pressTimer = null;
    }, 500);
  }

  onPointerUp() {
    if (this.pressTimer) {
      clearTimeout(this.pressTimer);
      this.pressTimer = null;
      if (this.pressedPlanId && this.pressedDate) {
        this.cellClick.emit({ planId: this.pressedPlanId, date: this.pressedDate });
      }
    }
    this.pressedPlanId = null;
    this.pressedDate = null;
  }
}
