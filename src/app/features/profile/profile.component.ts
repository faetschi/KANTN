import { Component, inject, effect, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { StatsService } from '../../core/services/stats.service';
import { SupabaseService } from '../../core/services/supabase.service';
import { PresenceService } from '../../core/services/presence.service';
import { optimizeImageForUpload } from '../../core/domain/image-upload-domain';
import { Router } from '@angular/router';
import { NotificationService } from '../../core/services/notification.service';
import { UserAvatarBadgeComponent } from '../../shared/components/user-avatar-badge.component';
import { isValidUsername, normalizeUsername } from '../../core/domain/username-utils';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, MatIconModule, FormsModule, RouterLink, UserAvatarBadgeComponent],
  template: `
    <div class="p-4 sm:p-6 space-y-6 sm:space-y-8">
      <header class="flex justify-between items-center">
        <h1 class="text-2xl font-bold text-gray-900">Profile</h1>
        <button (click)="logout()" class="text-red-500 font-medium text-sm">Log Out</button>
      </header>

      <!-- Profile Card -->
      <div class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
        <app-user-avatar-badge
          class="mb-3"
          [avatarUrl]="user()?.avatarUrl || form.avatarUrl"
          [displayName]="user()?.name || 'User'"
          [isOnline]="presenceService.isOnline()"
          [lastSeen]="user()?.lastSeen"
          [showLastSeen]="true"
          size="lg"
          [enableClick]="true"
          (avatarClick)="openAvatarModal()"
        ></app-user-avatar-badge>
        <div class="relative w-full flex items-center justify-center">
          <input
            #nameInput
            [(ngModel)]="form.name"
            (keydown.enter)="applyInlineEdit()"
            (blur)="onFieldBlur()"
            (click)="beginInlineEdit('name', nameInput)"
            name="inlineName"
            [readonly]="activeField !== 'name'"
            [class.text-lg]="activeField !== 'name'"
            [class.font-bold]="activeField !== 'name'"
            [class.text-gray-900]="activeField !== 'name'"
            [class.bg-transparent]="activeField !== 'name'"
            [class.bg-gray-50]="activeField === 'name'"
            [class.cursor-pointer]="activeField !== 'name'"
            [class.cursor-text]="activeField === 'name'"
            class="border-0 rounded-xl px-2 py-1 text-center max-w-44 focus:outline-none focus:ring-0 transition-all"
          />
          <div class="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <button *ngIf="activeField === 'name'" type="button" (click)="applyInlineEdit(); $event.stopPropagation()" class="text-blue-600 hover:text-blue-700">
              <mat-icon class="text-base">check</mat-icon>
            </button>
            <button *ngIf="activeField === 'name'" type="button" (mousedown)="cancelInlineEdit(); $event.stopPropagation()" class="text-gray-400 hover:text-gray-600">
              <mat-icon class="text-base">close</mat-icon>
            </button>
          </div>
        </div>
        <div class="relative w-full flex items-center justify-center">
          <div class="flex items-center justify-center gap-0">
            <span
              [class.text-gray-400]="activeField !== 'username'"
              [class.text-gray-900]="activeField === 'username'"
              class="text-sm transition-all shrink-0"
            >@</span>
            <input
              #usernameInput
              [(ngModel)]="form.username"
              (keydown.enter)="applyInlineEdit()"
              (blur)="onFieldBlur()"
              (click)="beginInlineEdit('username', usernameInput)"
              name="inlineUsername"
              [readonly]="activeField !== 'username'"
              [class.text-sm]="true"
              [class.text-gray-500]="activeField !== 'username'"
              [class.text-gray-900]="activeField === 'username'"
              [class.font-semibold]="activeField === 'username'"
              [class.bg-transparent]="activeField !== 'username'"
              [class.bg-gray-50]="activeField === 'username'"
              [class.cursor-pointer]="activeField !== 'username'"
              [class.cursor-text]="activeField === 'username'"
              class="border-0 p-0 text-center focus:outline-none focus:ring-0 lowercase transition-all"
              placeholder="username"
              maxlength="20"
              autocapitalize="off"
              autocomplete="off"
              spellcheck="false"
            />
          </div>
          <div class="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <button *ngIf="activeField === 'username'" type="button" (click)="applyInlineEdit(); $event.stopPropagation()" class="text-blue-600 hover:text-blue-700">
              <mat-icon class="text-sm">check</mat-icon>
            </button>
            <button *ngIf="activeField === 'username'" type="button" (mousedown)="cancelInlineEdit(); $event.stopPropagation()" class="text-gray-400 hover:text-gray-600">
              <mat-icon class="text-sm">close</mat-icon>
            </button>
          </div>
        </div>

        <div class="relative w-full flex items-center justify-center mt-3 mb-3">
          <div class="flex items-center justify-center gap-0">
            <mat-icon *ngIf="activeField !== 'funFact' && form.funFact" class="text-sm text-yellow-400 w-auto h-auto">auto_awesome</mat-icon>
            <input
              #funFactInput
              [(ngModel)]="form.funFact"
              (keydown.enter)="applyInlineEdit()"
              (blur)="onFieldBlur()"
              (click)="beginInlineEdit('funFact', funFactInput)"
              name="inlineFunFact"
              [readonly]="activeField !== 'funFact'"
              [class.text-sm]="activeField !== 'funFact'"
              [class.font-semibold]="activeField !== 'funFact'"
              [class.text-gray-900]="activeField !== 'funFact'"
              [class.bg-transparent]="activeField !== 'funFact'"
              [class.bg-gray-50]="activeField === 'funFact'"
              [class.cursor-pointer]="activeField !== 'funFact'"
              [class.cursor-text]="activeField === 'funFact'"
              class="border-0 rounded-xl px-0.5 py-1 text-center focus:outline-none focus:ring-0 transition-all"
              placeholder="No fun fact yet"
            />
          </div>
          <div class="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <button *ngIf="activeField === 'funFact'" type="button" (click)="applyInlineEdit(); $event.stopPropagation()" class="text-blue-600 hover:text-blue-700">
              <mat-icon class="text-sm">check</mat-icon>
            </button>
            <button *ngIf="activeField === 'funFact'" type="button" (mousedown)="cancelInlineEdit(); $event.stopPropagation()" class="text-gray-400 hover:text-gray-600">
              <mat-icon class="text-sm">close</mat-icon>
            </button>
          </div>
        </div>

        <div class="grid grid-cols-3 gap-4 w-full border-t border-gray-100 pt-4 mt-3">
          <div>
            <div class="flex items-center justify-center gap-1">
              <input
                #weightInput
                [(ngModel)]="form.weight"
                (keydown.enter)="applyInlineEdit()"
                (blur)="onFieldBlur()"
                (click)="beginInlineEdit('weight', weightInput)"
                name="inlineWeight"
                type="number"
                min="1"
                max="300"
                [readonly]="activeField !== 'weight'"
                [class.text-sm]="activeField === 'weight'"
                [class.text-base]="activeField !== 'weight'"
                [class.text-gray-900]="activeField !== 'weight'"
                [class.text-gray-400]="activeField === 'weight'"
                [class.bg-transparent]="activeField !== 'weight'"
                [class.bg-gray-50]="activeField === 'weight'"
                [class.cursor-pointer]="activeField !== 'weight'"
                [class.cursor-text]="activeField === 'weight'"
                class="w-14 border-0 rounded-xl px-1 py-0.5 font-bold text-center focus:outline-none focus:ring-0 transition-all"
              />
              <span class="text-xs font-normal text-gray-400">kg</span>
              <button *ngIf="activeField === 'weight'" type="button" (click)="applyInlineEdit(); $event.stopPropagation()" class="text-blue-600 hover:text-blue-700">
                <mat-icon class="text-sm">check</mat-icon>
              </button>
              <button *ngIf="activeField === 'weight'" type="button" (mousedown)="cancelInlineEdit(); $event.stopPropagation()" class="text-gray-400 hover:text-gray-600">
                <mat-icon class="text-sm">close</mat-icon>
              </button>
            </div>
            <p class="text-xs text-gray-400 uppercase tracking-wider mt-1 text-center">Weight</p>
          </div>
          <div>
            <div class="flex items-center justify-center gap-1">
              <input
                #heightInput
                [(ngModel)]="form.height"
                (keydown.enter)="applyInlineEdit()"
                (blur)="onFieldBlur()"
                (click)="beginInlineEdit('height', heightInput)"
                name="inlineHeight"
                type="number"
                min="1"
                max="300"
                [readonly]="activeField !== 'height'"
                [class.text-sm]="activeField === 'height'"
                [class.text-base]="activeField !== 'height'"
                [class.text-gray-900]="activeField !== 'height'"
                [class.text-gray-400]="activeField === 'height'"
                [class.bg-transparent]="activeField !== 'height'"
                [class.bg-gray-50]="activeField === 'height'"
                [class.cursor-pointer]="activeField !== 'height'"
                [class.cursor-text]="activeField === 'height'"
                class="w-14 border-0 rounded-xl px-1 py-0.5 font-bold text-center focus:outline-none focus:ring-0 transition-all"
              />
              <span class="text-xs font-normal text-gray-400">cm</span>
              <button *ngIf="activeField === 'height'" type="button" (click)="applyInlineEdit(); $event.stopPropagation()" class="text-blue-600 hover:text-blue-700">
                <mat-icon class="text-sm">check</mat-icon>
              </button>
              <button *ngIf="activeField === 'height'" type="button" (mousedown)="cancelInlineEdit(); $event.stopPropagation()" class="text-gray-400 hover:text-gray-600">
                <mat-icon class="text-sm">close</mat-icon>
              </button>
            </div>
            <p class="text-xs text-gray-400 uppercase tracking-wider mt-1 text-center">Height</p>
          </div>
          <div>
            <div class="flex items-center justify-center gap-1">
              <input
                #ageInput
                [(ngModel)]="form.age"
                (keydown.enter)="applyInlineEdit()"
                (blur)="onFieldBlur()"
                (click)="beginInlineEdit('age', ageInput)"
                name="inlineAge"
                type="number"
                min="1"
                max="150"
                [readonly]="activeField !== 'age'"
                [class.text-sm]="activeField === 'age'"
                [class.text-base]="activeField !== 'age'"
                [class.text-gray-900]="activeField !== 'age'"
                [class.text-gray-400]="activeField === 'age'"
                [class.bg-transparent]="activeField !== 'age'"
                [class.bg-gray-50]="activeField === 'age'"
                [class.cursor-pointer]="activeField !== 'age'"
                [class.cursor-text]="activeField === 'age'"
                class="w-14 border-0 rounded-xl px-1 py-0.5 font-bold text-center focus:outline-none focus:ring-0 transition-all"
              />
              <span class="text-xs font-normal text-gray-400">yo</span>
              <button *ngIf="activeField === 'age'" type="button" (click)="applyInlineEdit(); $event.stopPropagation()" class="text-blue-600 hover:text-blue-700">
                <mat-icon class="text-sm">check</mat-icon>
              </button>
              <button *ngIf="activeField === 'age'" type="button" (mousedown)="cancelInlineEdit(); $event.stopPropagation()" class="text-gray-400 hover:text-gray-600">
                <mat-icon class="text-sm">close</mat-icon>
              </button>
            </div>
            <p class="text-xs text-gray-400 uppercase tracking-wider mt-1 text-center">Age</p>
          </div>
        </div>
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
            <img [src]="form.avatarUrl || user()?.avatarUrl" class="w-24 h-24 rounded-full object-cover bg-gray-100" />
            <input #avatarUploadInput type="file" accept="image/*" (change)="uploadAvatar($event)" class="hidden" />
            <button type="button" [disabled]="avatarUploading" (click)="avatarUploadInput.click()" class="bg-blue-600 text-white text-sm font-semibold px-3 py-2 rounded-xl w-full disabled:opacity-70">
              Upload Photo
            </button>
            <span class="text-xs text-gray-500 text-center" *ngIf="avatarUploadMessage">{{ avatarUploadMessage }}</span>
          </div>

          <div class="flex justify-end gap-2 mt-4">
            <button type="button" (click)="closeAvatarModal()" class="px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-700">Cancel</button>
            <button type="button" [disabled]="avatarUploading" (click)="saveAvatarAndClose()" class="px-3 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold disabled:opacity-70">Done</button>
          </div>
        </div>
      </div>

      <!-- Period Toggle + Stats -->
      <section>
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-bold text-gray-900">Overview</h3>
          <div class="flex items-center gap-2">
            <button (click)="setPeriod('month')" [class.font-semibold]="showPeriod==='month'" class="px-3 py-1 rounded-full bg-gray-100">Month</button>
            <button (click)="setPeriod('week')" [class.font-semibold]="showPeriod==='week'" class="px-3 py-1 rounded-full bg-gray-100">Week</button>
          </div>
        </div>

        <div class="bg-gray-900 text-white p-6 rounded-3xl shadow-xl">
          <div class="grid grid-cols-2 gap-6">
            <div>
              <p class="text-3xl font-bold text-blue-400">{{ currentStats().count }}</p>
              <p class="text-sm text-gray-400 mt-1">Workouts</p>
            </div>
            <div>
              <p class="text-3xl font-bold text-orange-400">{{ (currentStats().calories / 1000).toFixed(1) }}k</p>
              <p class="text-sm text-gray-400 mt-1">Calories</p>
            </div>
            <div class="col-span-2 pt-4 border-t border-gray-800">
              <p class="text-3xl font-bold text-white">{{ (currentStats().duration / 3600).toFixed(1) }} <span class="text-lg font-normal text-gray-500">hrs</span></p>
              <p class="text-sm text-gray-400 mt-1">Total Active Time</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Settings List -->
      <section class="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
        <a *ngIf="user()?.is_admin" [routerLink]="['/admin']" class="p-4 flex items-center justify-between border-b border-gray-50 active:bg-gray-50 transition-colors cursor-pointer no-underline">
          <div class="flex items-center space-x-3">
            <div class="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
              <mat-icon class="text-sm">admin_panel_settings</mat-icon>
            </div>
            <span class="font-medium text-gray-900">Admin Panel</span>
          </div>
          <mat-icon class="text-gray-300">chevron_right</mat-icon>
        </a>
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
  presenceService = inject(PresenceService);
  notifications = inject(NotificationService);
  router = inject(Router);
  cdr = inject(ChangeDetectorRef);
  user = this.authService.currentUser;
  activeField: 'name' | 'funFact' | 'height' | 'weight' | 'age' | 'username' | null = null;
  avatarModalOpen = false;
  avatarUploading = false;
  avatarUploadMessage = '';
  form = {
    name: '',
    username: '',
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
        username: u.username || '',
        avatarUrl: u.avatarUrl || '',
        funFact: u.funFact || '',
        height: u.height || 0,
        weight: u.weight || 0,
        age: u.age || 0,
      };
    });

    try {
      const stored = typeof localStorage !== 'undefined' ? localStorage.getItem('profile_stats_period') : null;
      if (stored === 'week' || stored === 'month') {
        this.showPeriod = stored;
      }
    } catch {
      // ignore storage errors
    }
  }

  showPeriod: 'week' | 'month' = 'month';

  currentStats() {
    return this.showPeriod === 'week' ? this.statsService.weeklyStats() : this.statsService.monthlyStats();
  }

  setPeriod(period: 'week' | 'month') {
    this.showPeriod = period;
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('profile_stats_period', period);
      }
    } catch {
      // ignore storage errors
    }
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  beginInlineEdit(field: 'name' | 'funFact' | 'height' | 'weight' | 'age' | 'username', inputEl?: HTMLInputElement) {
    this.activeField = field;
    if (inputEl) {
      setTimeout(() => inputEl.focus());
    } else if (field === 'username') {
      setTimeout(() => document.querySelector<HTMLInputElement>('[name="inlineUsername"]')?.focus());
    }
  }

  onFieldBlur() {
    setTimeout(() => {
      if (this.activeField) {
        this.applyInlineEdit();
      }
    });
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

    if (this.activeField === 'username') {
      const normalized = normalizeUsername(this.form.username || '');
      if (!isValidUsername(normalized)) {
        return 'Username must be 3-20 characters (a-z, 0-9, underscore).';
      }
      this.form.username = normalized;
    }

    return null;
  }

  async applyInlineEdit() {
    if (!this.activeField) return;

    const validationError = this.validateActiveField();
    if (validationError) {
      this.notifications.error(validationError);
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
      username: current.username || '',
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
    this.avatarUploading = false;
    this.cdr.detectChanges();
  }

  closeAvatarModal() {
    this.avatarModalOpen = false;
    this.avatarUploadMessage = '';
    this.avatarUploading = false;
    this.cdr.detectChanges();
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
      this.cdr.detectChanges();
      return;
    }

    this.avatarUploading = true;
    this.avatarUploadMessage = 'Uploading...';
    this.cdr.detectChanges();

    try {
      const optimizedFile = await optimizeImageForUpload(file, {
        maxWidth: 1024,
        maxHeight: 1024,
        quality: 0.8,
        maxProcessingMs: 1800,
      });

      const extension = optimizedFile.name.split('.').pop()?.replace(/[^a-z0-9]/gi, '').toLowerCase();
      const fileName = `avatar-${Date.now()}${extension ? '.' + extension : ''}`;
      const path = `${current.id}/${fileName}`;
      const bucket = client.storage.from('avatars');

      const uploadPromise = bucket.upload(path, optimizedFile, { upsert: true });
      const timeoutPromise = new Promise<{ data: null; error: { message: string } }>(resolve => {
        setTimeout(() => resolve({ data: null, error: { message: 'Upload timed out. Please try again.' } }), 10000); // 10 seconds timeout
      });

      const { error } = await Promise.race([uploadPromise, timeoutPromise]);
      if (error) {
        this.avatarUploadMessage = error.message || 'Avatar upload failed.';
        this.cdr.detectChanges();
        return;
      }

      const { data } = bucket.getPublicUrl(path);
      if (!data?.publicUrl) {
        this.avatarUploadMessage = 'Avatar uploaded but preview unavailable.';
        this.cdr.detectChanges();
        return;
      }

      this.form.avatarUrl = data.publicUrl;
      this.avatarUploadMessage = 'Uploaded! Save to apply.';
      this.cdr.detectChanges();
    } catch {
      this.avatarUploadMessage = 'Avatar upload failed.';
      this.cdr.detectChanges();
    } finally {
      this.avatarUploading = false;
      this.cdr.detectChanges();
    }
  }

  async save() {
    const client = this.supabase.getClient();
    if (!client) return;

    const current = this.user();
    if (!current) return;

    const normalizedUsername = normalizeUsername(this.form.username || '');
    if (!isValidUsername(normalizedUsername)) {
      this.notifications.error('Username must be 3-20 characters (a-z, 0-9, underscore).');
      return;
    }

    const { error } = await client.from('profiles').update({
      display_name: this.form.name || null,
      username: normalizedUsername || null,
      avatar_url: this.form.avatarUrl || null,
      fun_fact: this.form.funFact || null,
      height: this.form.height || null,
      weight: this.form.weight || null,
      age: this.form.age || null,
    }).eq('id', current.id);

    if (error) {
      const message = error.message || 'Failed to save profile.';
      if (message.toLowerCase().includes('username')) {
        this.notifications.error('Username is already taken.');
      } else {
        this.notifications.error(message);
      }
      return;
    }

    this.notifications.success('Saved.');
    await this.authService.refreshProfile();
  }
}
