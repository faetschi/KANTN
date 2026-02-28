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
        <button type="button" (click)="openAvatarModal()" class="w-24 h-24 rounded-full bg-gray-200 overflow-hidden mb-4 ring-4 ring-gray-50">
          <img [src]="user()?.avatarUrl || form.avatarUrl || defaultAvatar" class="w-full h-full object-cover">
        </button>
        <div class="relative w-full flex items-center justify-center">
          <input
            [(ngModel)]="form.name"
            (keydown.enter)="applyInlineEdit()"
            name="inlineName"
            [readonly]="activeField !== 'name'"
            [class.pointer-events-none]="activeField !== 'name'"
            [class.bg-transparent]="activeField !== 'name'"
            [class.bg-gray-50]="activeField === 'name'"
            [class.cursor-default]="activeField !== 'name'"
            [class.cursor-text]="activeField === 'name'"
            class="text-xl font-bold text-gray-900 border-0 rounded-xl px-2 py-1 text-center w-52 focus:outline-none focus:ring-0"
          />
          <div class="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <button *ngIf="activeField !== 'name'" type="button" (click)="beginInlineEdit('name')" class="text-gray-400 hover:text-gray-600">
              <mat-icon class="text-base">edit</mat-icon>
            </button>
            <button *ngIf="activeField === 'name'" type="button" (click)="applyInlineEdit()" class="text-blue-600 hover:text-blue-700">
              <mat-icon class="text-base">check</mat-icon>
            </button>
            <button *ngIf="activeField === 'name'" type="button" (click)="cancelInlineEdit()" class="text-gray-400 hover:text-gray-600">
              <mat-icon class="text-base">close</mat-icon>
            </button>
          </div>
        </div>
        <p class="text-gray-500 text-sm">{{ user()?.email }}</p>
        <div class="relative w-full flex items-center justify-center mt-2 mb-6 min-h-6">
          <input
            [(ngModel)]="form.funFact"
            (keydown.enter)="applyInlineEdit()"
            name="inlineFunFact"
            [readonly]="activeField !== 'funFact'"
            [class.pointer-events-none]="activeField !== 'funFact'"
            [class.bg-transparent]="activeField !== 'funFact'"
            [class.bg-gray-50]="activeField === 'funFact'"
            [class.cursor-default]="activeField !== 'funFact'"
            [class.cursor-text]="activeField === 'funFact'"
            class="text-sm text-gray-400 border-0 rounded-xl px-2 py-1 w-60 text-center focus:outline-none focus:ring-0"
            placeholder="No fun fact yet"
          />
          <div class="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <button *ngIf="activeField !== 'funFact'" type="button" (click)="beginInlineEdit('funFact')" class="text-gray-400 hover:text-gray-600">
              <mat-icon class="text-sm">edit</mat-icon>
            </button>
            <button *ngIf="activeField === 'funFact'" type="button" (click)="applyInlineEdit()" class="text-blue-600 hover:text-blue-700">
              <mat-icon class="text-sm">check</mat-icon>
            </button>
            <button *ngIf="activeField === 'funFact'" type="button" (click)="cancelInlineEdit()" class="text-gray-400 hover:text-gray-600">
              <mat-icon class="text-sm">close</mat-icon>
            </button>
          </div>
        </div>

        <div class="grid grid-cols-3 gap-8 w-full border-t border-gray-100 pt-6">
          <div>
            <div class="flex items-center justify-center gap-1">
              <input
                [(ngModel)]="form.weight"
                (keydown.enter)="applyInlineEdit()"
                name="inlineWeight"
                type="number"
                min="1"
                max="300"
                [readonly]="activeField !== 'weight'"
                [class.pointer-events-none]="activeField !== 'weight'"
                [class.bg-transparent]="activeField !== 'weight'"
                [class.bg-gray-50]="activeField === 'weight'"
                [class.cursor-default]="activeField !== 'weight'"
                [class.cursor-text]="activeField === 'weight'"
                class="w-16 border-0 rounded-xl px-1 py-1 text-lg font-bold text-gray-900 text-right focus:outline-none focus:ring-0"
              />
              <span class="text-xs font-normal text-gray-400">kg</span>
              <button *ngIf="activeField !== 'weight'" type="button" (click)="beginInlineEdit('weight')" class="text-gray-400 hover:text-gray-600">
                <mat-icon class="text-sm">edit</mat-icon>
              </button>
              <button *ngIf="activeField === 'weight'" type="button" (click)="applyInlineEdit()" class="text-blue-600 hover:text-blue-700">
                <mat-icon class="text-sm">check</mat-icon>
              </button>
              <button *ngIf="activeField === 'weight'" type="button" (click)="cancelInlineEdit()" class="text-gray-400 hover:text-gray-600">
                <mat-icon class="text-sm">close</mat-icon>
              </button>
            </div>
            <p class="text-xs text-gray-400 uppercase tracking-wider mt-1">Weight</p>
          </div>
          <div>
            <div class="flex items-center justify-center gap-1">
              <input
                [(ngModel)]="form.height"
                (keydown.enter)="applyInlineEdit()"
                name="inlineHeight"
                type="number"
                min="1"
                max="300"
                [readonly]="activeField !== 'height'"
                [class.pointer-events-none]="activeField !== 'height'"
                [class.bg-transparent]="activeField !== 'height'"
                [class.bg-gray-50]="activeField === 'height'"
                [class.cursor-default]="activeField !== 'height'"
                [class.cursor-text]="activeField === 'height'"
                class="w-16 border-0 rounded-xl px-1 py-1 text-lg font-bold text-gray-900 text-right focus:outline-none focus:ring-0"
              />
              <span class="text-xs font-normal text-gray-400">cm</span>
              <button *ngIf="activeField !== 'height'" type="button" (click)="beginInlineEdit('height')" class="text-gray-400 hover:text-gray-600">
                <mat-icon class="text-sm">edit</mat-icon>
              </button>
              <button *ngIf="activeField === 'height'" type="button" (click)="applyInlineEdit()" class="text-blue-600 hover:text-blue-700">
                <mat-icon class="text-sm">check</mat-icon>
              </button>
              <button *ngIf="activeField === 'height'" type="button" (click)="cancelInlineEdit()" class="text-gray-400 hover:text-gray-600">
                <mat-icon class="text-sm">close</mat-icon>
              </button>
            </div>
            <p class="text-xs text-gray-400 uppercase tracking-wider mt-1">Height</p>
          </div>
          <div>
            <div class="flex items-center justify-center gap-1">
              <input
                [(ngModel)]="form.age"
                (keydown.enter)="applyInlineEdit()"
                name="inlineAge"
                type="number"
                min="1"
                max="150"
                [readonly]="activeField !== 'age'"
                [class.pointer-events-none]="activeField !== 'age'"
                [class.bg-transparent]="activeField !== 'age'"
                [class.bg-gray-50]="activeField === 'age'"
                [class.cursor-default]="activeField !== 'age'"
                [class.cursor-text]="activeField === 'age'"
                class="w-16 border-0 rounded-xl px-1 py-1 text-lg font-bold text-gray-900 text-right focus:outline-none focus:ring-0"
              />
              <span class="text-xs font-normal text-gray-400">yo</span>
              <button *ngIf="activeField !== 'age'" type="button" (click)="beginInlineEdit('age')" class="text-gray-400 hover:text-gray-600">
                <mat-icon class="text-sm">edit</mat-icon>
              </button>
              <button *ngIf="activeField === 'age'" type="button" (click)="applyInlineEdit()" class="text-blue-600 hover:text-blue-700">
                <mat-icon class="text-sm">check</mat-icon>
              </button>
              <button *ngIf="activeField === 'age'" type="button" (click)="cancelInlineEdit()" class="text-gray-400 hover:text-gray-600">
                <mat-icon class="text-sm">close</mat-icon>
              </button>
            </div>
            <p class="text-xs text-gray-400 uppercase tracking-wider mt-1">Age</p>
          </div>
        </div>
      </div>

      <div
        *ngIf="message"
        class="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 text-white text-sm px-4 py-2 rounded-xl shadow-lg"
        [class.bg-green-600]="toastType === 'success'"
        [class.bg-red-600]="toastType === 'error'"
      >
        {{ message }}
      </div>

      <div *ngIf="avatarModalOpen" class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
        <div class="bg-white w-full max-w-sm rounded-2xl p-5 shadow-lg border border-gray-100">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-base font-semibold text-gray-900">Profile Picture Upload</h3>
            <button type="button" (click)="closeAvatarModal()" class="text-gray-400 hover:text-gray-600">
              <mat-icon class="text-base">close</mat-icon>
            </button>
          </div>

          <div class="flex flex-col items-center gap-3">
            <img [src]="user()?.avatarUrl || form.avatarUrl || defaultAvatar" class="w-24 h-24 rounded-full object-cover bg-gray-100" />
            <input #avatarUploadInput type="file" accept="image/*" (change)="uploadAvatar($event)" class="hidden" />
            <button type="button" (click)="avatarUploadInput.click()" class="bg-blue-600 text-white text-sm font-semibold px-3 py-2 rounded-xl w-full">
              {{ avatarUploading ? 'Uploading...' : 'Upload Photo' }}
            </button>
            <span class="text-xs text-gray-500 text-center" *ngIf="avatarUploadMessage">{{ avatarUploadMessage }}</span>
          </div>

          <div class="flex justify-end gap-2 mt-4">
            <button type="button" (click)="closeAvatarModal()" class="px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-700">Cancel</button>
            <button type="button" (click)="saveAvatarAndClose()" class="px-3 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold">Done</button>
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
  supabase = inject(SupabaseService);
  router = inject(Router);
  user = this.authService.currentUser;
  activeField: 'name' | 'funFact' | 'height' | 'weight' | 'age' | null = null;
  avatarModalOpen = false;
  message = '';
  toastType: 'success' | 'error' = 'success';
  private toastTimeoutId: ReturnType<typeof setTimeout> | null = null;
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

  beginInlineEdit(field: 'name' | 'funFact' | 'height' | 'weight' | 'age') {
    this.activeField = field;
    this.message = '';
    if (this.toastTimeoutId) {
      clearTimeout(this.toastTimeoutId);
      this.toastTimeoutId = null;
    }
  }

  private showToast(text: string, type: 'success' | 'error' = 'success') {
    this.message = text;
    this.toastType = type;
    if (this.toastTimeoutId) {
      clearTimeout(this.toastTimeoutId);
    }
    this.toastTimeoutId = setTimeout(() => {
      this.message = '';
      this.toastTimeoutId = null;
    }, 3000);
  }

  private validateActiveField(): string | null {
    if (this.activeField === 'age') {
      const age = Number(this.form.age);
      if (!Number.isFinite(age) || age < 1 || age > 150) {
        return 'Age must be between 1 and 150.';
      }
    }

    if (this.activeField === 'height') {
      const height = Number(this.form.height);
      if (!Number.isFinite(height) || height <= 0 || height > 300) {
        return 'Height must be between 1 and 300 cm.';
      }
    }

    if (this.activeField === 'weight') {
      const weight = Number(this.form.weight);
      if (!Number.isFinite(weight) || weight <= 0 || weight > 300) {
        return 'Weight must be between 1 and 300 kg.';
      }
    }

    return null;
  }

  async applyInlineEdit() {
    if (!this.activeField) return;

    const validationError = this.validateActiveField();
    if (validationError) {
      this.showToast(validationError, 'error');
      return;
    }

    await this.save();
    this.activeField = null;
  }

  cancelInlineEdit() {
    const current = this.user();
    if (!current) {
      this.activeField = null;
      return;
    }

    this.form = {
      name: current.name || '',
      avatarUrl: current.avatarUrl || '',
      funFact: current.funFact || '',
      height: current.height || 0,
      weight: current.weight || 0,
      age: current.age || 0,
    };
    this.activeField = null;
  }

  openAvatarModal() {
    this.avatarModalOpen = true;
    this.avatarUploadMessage = '';
  }

  closeAvatarModal() {
    this.avatarModalOpen = false;
    this.avatarUploadMessage = '';
  }

  async saveAvatarAndClose() {
    await this.save();
    this.closeAvatarModal();
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
      const fileName = `avatar-${Date.now()}${extension ? '.' + extension : ''}`;
      const path = `${current.id}/${fileName}`;
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
      this.showToast(error.message || 'Failed to save profile.', 'error');
      return;
    }

    this.showToast('Saved.');
    await this.authService.refreshProfile();
  }
}
