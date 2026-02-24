import { Component, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { StatsService } from '../../core/services/stats.service';
import { SupabaseService } from '../../core/services/supabase.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, MatIconModule, FormsModule],
  template: `
    <div class="p-6 space-y-8">
      <header class="flex justify-between items-center">
        <h1 class="text-2xl font-bold text-gray-900">Profile</h1>
        <button (click)="logout()" class="text-red-500 font-medium text-sm">Log Out</button>
      </header>

      <!-- Profile Card -->
      <div class="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
        <div class="w-24 h-24 rounded-full bg-gray-200 overflow-hidden mb-4 ring-4 ring-gray-50">
          <img [src]="user()?.avatarUrl || form.avatarUrl || defaultAvatar" class="w-full h-full object-cover">
        </div>
        <h2 class="text-xl font-bold text-gray-900">{{ user()?.name }}</h2>
        <p class="text-gray-500 text-sm">{{ user()?.email }}</p>
        <p class="text-sm text-gray-400 mb-6" *ngIf="user()?.funFact">{{ user()?.funFact }}</p>

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

      <section class="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-bold text-gray-900">Edit Profile</h3>
          <button (click)="toggleEdit()" class="text-blue-600 text-sm font-semibold">
            {{ editing ? 'Cancel' : 'Edit' }}
          </button>
        </div>

        <form *ngIf="editing" (ngSubmit)="save()" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input [(ngModel)]="form.name" name="name" class="w-full border border-gray-200 rounded-xl px-3 py-2" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Avatar URL</label>
            <input [(ngModel)]="form.avatarUrl" name="avatarUrl" class="w-full border border-gray-200 rounded-xl px-3 py-2" />
            <div class="flex items-center gap-3 mt-2">
              <input #avatarUploadInput type="file" accept="image/*" (change)="uploadAvatar($event)" class="hidden" />
              <button type="button" (click)="avatarUploadInput.click()" class="bg-blue-600 text-white text-sm font-semibold px-3 py-2 rounded-xl">
                {{ avatarUploading ? 'Uploading...' : 'Upload Photo' }}
              </button>
              <span class="text-xs text-gray-500" *ngIf="avatarUploadMessage">{{ avatarUploadMessage }}</span>
            </div>
            <p class="text-xs text-gray-400 mt-2 break-words" *ngIf="form.avatarUrl">{{ form.avatarUrl }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Fun Fact</label>
            <input [(ngModel)]="form.funFact" name="funFact" class="w-full border border-gray-200 rounded-xl px-3 py-2" />
          </div>
          <div class="grid grid-cols-3 gap-3">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Height (cm)</label>
              <input [(ngModel)]="form.height" name="height" type="number" class="w-full border border-gray-200 rounded-xl px-3 py-2" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
              <input [(ngModel)]="form.weight" name="weight" type="number" class="w-full border border-gray-200 rounded-xl px-3 py-2" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Age</label>
              <input [(ngModel)]="form.age" name="age" type="number" class="w-full border border-gray-200 rounded-xl px-3 py-2" />
            </div>
          </div>
          <div class="flex items-center gap-3">
            <button type="submit" class="bg-blue-600 text-white px-4 py-2 rounded-xl font-semibold">Save</button>
            <span class="text-sm text-gray-500" *ngIf="message">{{ message }}</span>
          </div>
        </form>
      </section>

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
  supabase = inject(SupabaseService);
  router = inject(Router);
  user = this.authService.currentUser;
  editing = false;
  message = '';
  avatarUploading = false;
  avatarUploadMessage = '';
  defaultAvatar = 'https://api.dicebear.com/7.x/bottts/svg?seed=kantn';
  form = {
    name: '',
    avatarUrl: '',
    funFact: '',
    height: 0,
    weight: 0,
    age: 0,
  };

  constructor() {
    effect(() => {
      const u = this.user();
      if (!u) return;
      this.form = {
        name: u.name || '',
        avatarUrl: u.avatarUrl || '',
        funFact: u.funFact || '',
        height: u.height || 0,
        weight: u.weight || 0,
        age: u.age || 0,
      };
    });
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  toggleEdit() {
    this.editing = !this.editing;
    this.message = '';
  }

  async uploadAvatar(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    input.value = '';

    const client = this.supabase.getClient();
    const current = this.user();
    if (!client || !current) {
      this.avatarUploadMessage = 'Please reload and try again.';
      return;
    }

    this.avatarUploading = true;
    this.avatarUploadMessage = 'Uploading...';

    try {
      const extension = file.name.split('.').pop()?.replace(/[^a-z0-9]/gi, '').toLowerCase();
      const fileName = `${current.id}-${Date.now()}${extension ? '.' + extension : ''}`;
      const path = `public/${fileName}`;
      const bucket = client.storage.from('avatars');

      const { error } = await bucket.upload(path, file, { upsert: true });
      if (error) {
        this.avatarUploadMessage = error.message || 'Avatar upload failed.';
        return;
      }

      const { data } = bucket.getPublicUrl(path);
      if (!data?.publicUrl) {
        this.avatarUploadMessage = 'Avatar uploaded but preview unavailable.';
        return;
      }

      this.form.avatarUrl = data.publicUrl;
      this.avatarUploadMessage = 'Avatar ready. Save to apply.';
    } finally {
      this.avatarUploading = false;
    }
  }

  async save() {
    const client = this.supabase.getClient();
    if (!client) return;

    const current = this.user();
    if (!current) return;

    const { error } = await client.from('profiles').update({
      display_name: this.form.name || null,
      avatar_url: this.form.avatarUrl || null,
      fun_fact: this.form.funFact || null,
      height: this.form.height || null,
      weight: this.form.weight || null,
      age: this.form.age || null,
    }).eq('id', current.id);

    if (error) {
      this.message = error.message || 'Failed to save profile.';
      return;
    }

    this.message = 'Saved.';
    this.editing = false;
    await this.authService.refreshProfile();
  }
}
