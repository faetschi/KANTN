import { ChangeDetectionStrategy, Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { WorkoutService } from './workout.service';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';

@Component({
  selector: 'app-plans',
  imports: [CommonModule, RouterLink, ButtonModule, TagModule],
  template: `
    <div class="p-6 space-y-6">
      <header class="flex justify-between items-center">
        <h1 class="text-3xl font-bold text-slate-900">Workout Plans</h1>
        <button routerLink="/plans/new" class="w-10 h-10 bg-apple-blue/10 text-apple-blue rounded-full flex items-center justify-center active:scale-90 transition-transform">
          <i class="pi pi-plus font-bold"></i>
        </button>
      </header>

      <div class="space-y-4">
        @for (plan of plans(); track plan.id) {
          <div class="ios-card relative overflow-hidden">
            <div class="flex justify-between items-start mb-2">
              <h3 class="text-xl font-bold">{{ plan.name }}</h3>
              @if (activePlanId() === plan.id) {
                <p-tag value="Active" severity="info" [rounded]="true" />
              }
            </div>
            <p class="text-apple-gray text-sm mb-4 line-clamp-2">{{ plan.description }}</p>
            
            <div class="flex items-center gap-4 mb-6 text-xs text-apple-gray font-medium">
              <span class="flex items-center gap-1">
                <i class="pi pi-list"></i>
                {{ plan.exercises.length }} exercises
              </span>
              <span class="flex items-center gap-1">
                <i class="pi pi-calendar"></i>
                {{ plan.durationWeeks }} weeks
              </span>
            </div>

            <div class="grid grid-cols-2 gap-3">
              @if (activePlanId() !== plan.id) {
                <button 
                  (click)="activatePlan(plan.id)"
                  class="ios-button-secondary !py-2 !text-sm"
                >
                  Activate
                </button>
              } @else {
                <button 
                  [routerLink]="['/workout', plan.id]"
                  class="ios-button-primary !py-2 !text-sm"
                >
                  Start Now
                </button>
              }
              <button 
                [routerLink]="['/plans/edit', plan.id]"
                class="ios-button-secondary !py-2 !text-sm !text-slate-600 !border-slate-200"
              >
                Edit
              </button>
            </div>
          </div>
        }
      </div>

      <!-- Comparison Section -->
      @if (activePlan(); as plan) {
        <section class="mt-8 space-y-4">
          <h3 class="text-lg font-bold">Plan Comparison</h3>
          <div class="ios-card bg-slate-50 border-none">
            <p class="text-sm text-apple-gray mb-4">Comparing current plan to your previous performance.</p>
            
            <div class="space-y-4">
              <div class="flex justify-between items-center">
                <span class="text-sm font-medium">Avg. Intensity</span>
                <div class="flex items-center gap-2 text-emerald-500 font-bold">
                  <i class="pi pi-arrow-up"></i>
                  <span>12%</span>
                </div>
              </div>
              <div class="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <div class="bg-apple-blue h-full w-[75%] rounded-full"></div>
              </div>
              
              <div class="flex justify-between items-center">
                <span class="text-sm font-medium">Consistency</span>
                <div class="flex items-center gap-2 text-emerald-500 font-bold">
                  <i class="pi pi-arrow-up"></i>
                  <span>5%</span>
                </div>
              </div>
              <div class="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <div class="bg-apple-blue h-full w-[90%] rounded-full"></div>
              </div>
            </div>
          </div>
        </section>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Plans {
  private workoutService = inject(WorkoutService);
  
  plans = this.workoutService.allPlans;
  activePlan = this.workoutService.activePlan;
  activePlanId = computed(() => this.activePlan()?.id);

  activatePlan(id: string) {
    this.workoutService.setActivePlan(id);
  }
}
