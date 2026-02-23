import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/services/auth.service';
import { StatsService } from '../../core/services/stats.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="p-6 space-y-8">
      <header class="flex justify-between items-center">
        <h1 class="text-2xl font-bold text-gray-900">Profile</h1>
        <button (click)="logout()" class="text-red-500 font-medium text-sm">Log Out</button>
      </header>

      <!-- Profile Card -->
      <div class="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
        <div class="w-24 h-24 rounded-full bg-gray-200 overflow-hidden mb-4 ring-4 ring-gray-50">
          <img [src]="user()?.avatarUrl" class="w-full h-full object-cover">
        </div>
        <h2 class="text-xl font-bold text-gray-900">{{ user()?.name }}</h2>
        <p class="text-gray-500 text-sm mb-6">{{ user()?.email }}</p>

        <div class="grid grid-cols-3 gap-8 w-full border-t border-gray-100 pt-6">
          <div>
            <p class="text-lg font-bold text-gray-900">{{ user()?.weight }} <span class="text-xs font-normal text-gray-400">kg</span></p>
            <p class="text-xs text-gray-400 uppercase tracking-wider mt-1">Weight</p>
          </div>
          <div>
            <p class="text-lg font-bold text-gray-900">{{ user()?.height }} <span class="text-xs font-normal text-gray-400">cm</span></p>
            <p class="text-xs text-gray-400 uppercase tracking-wider mt-1">Height</p>
          </div>
          <div>
            <p class="text-lg font-bold text-gray-900">{{ user()?.age }} <span class="text-xs font-normal text-gray-400">yo</span></p>
            <p class="text-xs text-gray-400 uppercase tracking-wider mt-1">Age</p>
          </div>
        </div>
      </div>

      <!-- Monthly Stats -->
      <section>
        <h3 class="text-lg font-bold text-gray-900 mb-4">Monthly Overview</h3>
        <div class="bg-gray-900 text-white p-6 rounded-3xl shadow-xl">
          <div class="grid grid-cols-2 gap-6">
            <div>
              <p class="text-3xl font-bold text-blue-400">{{ statsService.monthlyStats().count }}</p>
              <p class="text-sm text-gray-400 mt-1">Workouts</p>
            </div>
            <div>
              <p class="text-3xl font-bold text-orange-400">{{ (statsService.monthlyStats().calories / 1000).toFixed(1) }}k</p>
              <p class="text-sm text-gray-400 mt-1">Calories</p>
            </div>
            <div class="col-span-2 pt-4 border-t border-gray-800">
              <p class="text-3xl font-bold text-white">{{ (statsService.monthlyStats().duration / 3600).toFixed(1) }} <span class="text-lg font-normal text-gray-500">hrs</span></p>
              <p class="text-sm text-gray-400 mt-1">Total Active Time</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Settings List -->
      <section class="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
        <div class="p-4 flex items-center justify-between border-b border-gray-50 active:bg-gray-50 transition-colors">
          <div class="flex items-center space-x-3">
            <div class="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <mat-icon class="text-sm">notifications</mat-icon>
            </div>
            <span class="font-medium text-gray-900">Notifications</span>
          </div>
          <mat-icon class="text-gray-300">chevron_right</mat-icon>
        </div>
        <div class="p-4 flex items-center justify-between border-b border-gray-50 active:bg-gray-50 transition-colors">
          <div class="flex items-center space-x-3">
            <div class="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <mat-icon class="text-sm">sync</mat-icon>
            </div>
            <span class="font-medium text-gray-900">Sync Data</span>
          </div>
          <mat-icon class="text-gray-300">chevron_right</mat-icon>
        </div>
        <div class="p-4 flex items-center justify-between active:bg-gray-50 transition-colors">
          <div class="flex items-center space-x-3">
            <div class="w-8 h-8 rounded-lg bg-gray-50 text-gray-600 flex items-center justify-center">
              <mat-icon class="text-sm">settings</mat-icon>
            </div>
            <span class="font-medium text-gray-900">Settings</span>
          </div>
          <mat-icon class="text-gray-300">chevron_right</mat-icon>
        </div>
      </section>
    </div>
  `
})
export class ProfileComponent {
  authService = inject(AuthService);
  statsService = inject(StatsService);
  user = this.authService.currentUser;

  logout() {
    this.authService.logout();
    // In a real app, navigate to login
  }
}
