import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { WorkoutPlan } from '../../core/models/models';
import { PlanYearData } from '../../core/models/activity-models';
import { planColor } from '../../core/domain/activity-utils';
import { PracticeCardComponent } from '../../shared/components/practice-card.component';

@Component({
  selector: 'app-monthly-view',
  standalone: true,
  imports: [CommonModule, MatIconModule, RouterLink, PracticeCardComponent],
  template: `
    <div class="space-y-4 stagger">
      @if (plans.length === 0) {
        <div class="text-center py-12">
          <p class="text-gray-500 font-medium">No practices yet. Create a workout plan to start tracking.</p>
          <a routerLink="/plans/create" class="inline-block mt-3 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold">Create Plan</a>
        </div>
      } @else if (hasNoActivity) {
        <div class="text-center py-8">
          <p class="text-gray-400 text-sm">Complete a workout to start your streak.</p>
        </div>
      }

      @for (plan of plans; track plan.id) {
        <app-practice-card
          [plan]="plan"
          viewMode="monthly"
          [monthlyData]="getMonthData(plan.id)"
          [streak]="getStreak(plan.id)"
          [totalActiveDays]="getTotalActiveDays(plan.id)"
          (cellClick)="cellClick.emit($event)"
        />
      }
    </div>
  `,
})
export class MonthlyViewComponent {
  @Input() plans: WorkoutPlan[] = [];
  @Input() monthData: PlanYearData[] = [];
  @Output() cellClick = new EventEmitter<{ planId: string; date: Date }>();

  get hasNoActivity(): boolean {
    return this.monthData.every(md => md.totalActiveDays === 0);
  }

  getMonthData(planId: string) {
    return this.monthData.find(md => md.planId === planId)?.contributions || [];
  }

  getStreak(planId: string): number {
    return this.monthData.find(md => md.planId === planId)?.streak || 0;
  }

  getTotalActiveDays(planId: string): number {
    return this.monthData.find(md => md.planId === planId)?.totalActiveDays || 0;
  }

  getPlanColor(planId: string): string {
    return planColor(planId);
  }
}