import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { WorkoutPlan } from '../../core/models/models';
import { ContributionDay, WeekDayEntry } from '../../core/models/activity-models';
import { planColor, intensityColor } from '../../core/domain/activity-utils';
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
          <div class="w-8 h-8 rounded-lg" [style.background]="schemeColor"></div>
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
        <div class="flex items-center gap-1 text-orange-500">
          <mat-icon class="text-sm">local_fire_department</mat-icon>
          <span class="font-bold text-sm">{{ streak }}</span>
        </div>
      </div>

      @if (viewMode === 'weekly') {
        <div class="grid grid-cols-7 gap-1.5">
          @for (day of weeklyData; track $index) {
            <div class="flex flex-col items-center gap-1">
              <span class="text-[10px] font-bold text-gray-400 uppercase">{{ day.dayLabel }}</span>
              <div
                class="w-full aspect-square rounded-lg flex items-center justify-center text-xs font-bold cursor-pointer select-none"
                [class.text-white]="day.isActive"
                [class.text-gray-300]="!day.isActive"
                [class.border]="!day.isActive"
                [class.border-gray-200]="!day.isActive"
                [style.background]="day.isActive ? dayColor : 'transparent'"
                (click)="onCellClick(plan.id, day)"
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

      @if (viewMode === 'yearly') {
        <div class="mt-2">
          <app-contribution-grid
            [data]="yearlyData"
            [colorScheme]="schemeName"
            [compact]="false"
            (cellClick)="onGridCellClick(plan.id, $event)"
          />
          <div class="flex items-center justify-between mt-2 text-xs text-gray-500">
            <span>{{ streak }} day streak</span>
            <span>{{ totalActiveDays }} active days</span>
          </div>
        </div>
      }
    </div>
  `,
})
export class PracticeCardComponent {
  @Input() plan!: WorkoutPlan;
  @Input() viewMode: 'weekly' | 'yearly' = 'weekly';
  @Input() weeklyData: WeekDayEntry[] = [];
  @Input() yearlyData: ContributionDay[] = [];
  @Input() colorScheme: string = 'blue';
  @Input() streak: number = 0;
  @Input() totalActiveDays: number = 0;
  @Output() cellClick = new EventEmitter<{ planId: string; date: Date }>();
  @Output() cellLongPress = new EventEmitter<{ planId: string; date: Date }>();

  private pressTimer: ReturnType<typeof setTimeout> | null = null;
  private pressedPlanId: string | null = null;
  private pressedDate: Date | null = null;

  get schemeColor(): string {
    const hexPalettes: Record<string, string[]> = {
      blue: ['#ebf5ff', '#b3d9ff', '#4da6ff', '#0066cc', '#003b80'],
      purple: ['#f3ebff', '#d4b3ff', '#8c4dff', '#5900cc', '#330080'],
      green: ['#ebf5eb', '#b3d9b3', '#4da64d', '#006600', '#003b00'],
      orange: ['#fff5eb', '#ffd4b3', '#ff8c4d', '#cc5900', '#803300'],
      pink: ['#fff0f5', '#ffb3d9', '#ff4da6', '#cc0066', '#800040'],
      teal: ['#e6fffa', '#b3f0e0', '#4dd4b2', '#00a88a', '#007a61'],
      indigo: ['#eef2ff', '#c7d2fe', '#818cf8', '#4f46e5', '#3730a3'],
      amber: ['#fffbeb', '#fde68a', '#f59e0b', '#d97706', '#b45309'],
    };
    return (hexPalettes[this.colorScheme] || hexPalettes['blue'])[2];
  }

  get schemeName(): string {
    return this.colorScheme;
  }

  get dayColor(): string {
    return this.schemeColor;
  }

  private get workoutType() {
    return getWorkoutPlanType(this.plan);
  }

  private get badgeVisual() {
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

  onCellClick(planId: string, day: WeekDayEntry) {
    if (day.isActive) {
      this.cellClick.emit({ planId, date: new Date() });
    }
  }

  onPointerDown(planId: string, day: WeekDayEntry, event: PointerEvent) {
    if (!day.isActive) return;
    this.pressedPlanId = planId;
    this.pressedDate = new Date();
    this.pressTimer = setTimeout(() => {
      if (this.pressedPlanId && this.pressedDate) {
        this.cellLongPress.emit({ planId: this.pressedPlanId, date: this.pressedDate! });
      }
      this.pressTimer = null;
    }, 500);
  }

  onPointerUp() {
    if (this.pressTimer) {
      clearTimeout(this.pressTimer);
      this.pressTimer = null;
    }
    this.pressedPlanId = null;
    this.pressedDate = null;
  }

  onGridCellClick(planId: string, event: { date: Date; count: number }) {
    this.cellClick.emit({ planId, date: event.date });
  }
}
