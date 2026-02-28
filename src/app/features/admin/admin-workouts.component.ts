import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-admin-workouts',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="p-6 space-y-6">
      <header class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-gray-900">Default Workout Plans</h1>
        <a routerLink="/admin" class="px-3 py-2 rounded-xl bg-gray-200 text-gray-800 text-sm">Back</a>
      </header>

      <section class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <p class="text-sm text-gray-600">
          This admin subpage is reserved for default workout plan management. Exercises are managed in the dedicated
          Default Exercises page.
        </p>
      </section>
    </div>
  `,
})
export class AdminWorkoutsComponent {}
