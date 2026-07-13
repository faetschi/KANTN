import { Component, inject, effect, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { SupabaseService } from '../../core/services/supabase.service';
import { PresenceService } from '../../core/services/presence.service';
import { optimizeImageForUpload } from '../../core/domain/image-upload-domain';
import { Router } from '@angular/router';
import { NotificationService } from '../../core/services/notification.service';
import { UserAvatarBadgeComponent } from '../../shared/components/user-avatar-badge.component';
import { isValidUsername, normalizeUsername } from '../../core/domain/username-utils';
import { ActivityService } from '../../core/services/activity.service';
import { intensityColor, buildContributionGrid } from '../../core/domain/activity-utils';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, MatIconModule, FormsModule, RouterLink, UserAvatarBadgeComponent],
  template: `
    <div class="p-6 space-y-6">
      <header class="flex justify-between items-center">
        <h1 class="text-2xl font-bold text-gray-900">Profile</h1>
        <button (click)="logout()" class="text-red-500 font-medium text-sm">Log Out</button>
      </header>

      <div class="fade-in space-y-6">
      <!-- Profile Card -->
      <div class="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
        <app-user-avatar-badge
          class="mb-2"
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
            [class.bg-gray-50]="activeField === 'name'"
            [class.cursor-text]="activeField === 'name'"
            class="border-0 rounded-xl px-2 py-0.5 text-center max-w-44 focus:outline-none focus:ring-0 transition-all text-lg font-bold text-gray-900 bg-transparent cursor-pointer"
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
          <div
            *ngIf="activeField !== 'username'"
            class="w-full text-center cursor-pointer"
            (click)="beginInlineEdit('username')"
            (keydown.enter)="beginInlineEdit('username')"
            role="button"
            tabindex="0"
          >
            <span class="text-sm text-gray-500 lowercase">@{{ form.username }}</span>
          </div>
          <span
            *ngIf="activeField === 'username'"
            class="text-sm text-gray-900 transition-all"
          >@</span>
          <input
            *ngIf="activeField === 'username'"
            #usernameInput
            [(ngModel)]="form.username"
            (keydown.enter)="applyInlineEdit()"
            (blur)="onFieldBlur()"
            name="inlineUsername"
            class="border-0 p-0 bg-gray-50 text-gray-900 font-semibold cursor-text focus:outline-none focus:ring-0 lowercase transition-all"
            [size]="(form.username.length || 1)"
            placeholder="username"
            maxlength="20"
            autocapitalize="off"
            autocomplete="off"
            spellcheck="false"
          />
          <div class="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <button *ngIf="activeField === 'username'" type="button" (click)="applyInlineEdit(); $event.stopPropagation()" class="text-blue-600 hover:text-blue-700">
              <mat-icon class="text-sm">check</mat-icon>
            </button>
            <button *ngIf="activeField === 'username'" type="button" (mousedown)="cancelInlineEdit(); $event.stopPropagation()" class="text-gray-400 hover:text-gray-600">
              <mat-icon class="text-sm">close</mat-icon>
            </button>
          </div>
        </div>

        
        <div class="grid grid-cols-3 gap-2 w-full border-t border-gray-100 pt-2 mt-1">
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
            <p class="text-xs text-gray-400 uppercase tracking-wider mt-0.5 text-center">Weight</p>
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
            <p class="text-xs text-gray-400 uppercase tracking-wider mt-0.5 text-center">Height</p>
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
            <p class="text-xs text-gray-400 uppercase tracking-wider mt-0.5 text-center">Age</p>
          </div>
        </div>
      </div>

      <!-- Streak Badge -->
      @if (activityService.overallStreak() > 0) {
        <div class="flex justify-center">
          <div class="flex items-center gap-1 px-3 py-1 rounded-full bg-orange-50 text-orange-700">
            <mat-icon class="text-sm">local_fire_department</mat-icon>
            <span class="font-bold text-sm">{{ activityService.overallStreak() }} day streak</span>
          </div>
        </div>
      }

      <!-- Activity Heatmap with Month/Year toggle -->
      <section>
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-lg font-bold text-gray-900">Activity</h3>
          <span class="text-xs text-gray-400">{{ activityService.totalContributions() }} workouts</span>
        </div>
        <div (click)="goToActivity()" class="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 cursor-pointer active:bg-gray-50 transition-colors">
          <div class="flex items-center gap-2 mb-3">
            <button (click)="$event.stopPropagation(); activityPeriod.set('month')" class="px-3 py-0.5 rounded-full text-xs font-semibold transition-all" [class.bg-gray-100]="activityPeriod() === 'month'" [class.text-gray-900]="activityPeriod() === 'month'" [class.text-gray-400]="activityPeriod() !== 'month'">Month</button>
            <button (click)="$event.stopPropagation(); activityPeriod.set('year')" class="px-3 py-0.5 rounded-full text-xs font-semibold transition-all" [class.bg-gray-100]="activityPeriod() === 'year'" [class.text-gray-900]="activityPeriod() === 'year'" [class.text-gray-400]="activityPeriod() !== 'year'">Year</button>
          </div>
          @if (activityPeriod() === 'month') {
            <div class="flex gap-[3px] items-end py-1">
              @for (day of monthlyActivity(); track $index) {
                <div class="flex-1 aspect-[1/2] rounded-sm" [style.background]="day > 0 ? intensityColor(day, 'blue') : '#e5e7eb'"></div>
              }
            </div>
          } @else {
            <div class="flex gap-[1.5px]">
              @for (week of yearlyWeeks; track $index) {
                <div class="flex flex-col gap-[1.5px] flex-1">
                  @for (day of week; track $index) {
                    <div
                      class="aspect-square rounded-[1px]"
                      [style.background]="day.intensity > 0 ? intensityColor(day.intensity, 'blue') : '#e5e7eb'"
                      [title]="day.date.toLocaleDateString() + ': ' + day.count + ' sessions'"
                    ></div>
                  }
                </div>
              }
            </div>
          }
          @if (activityPeriod() === 'month') {
            <p class="text-xs text-gray-400 mt-2"><strong>{{ activityService.totalActiveDays() }}</strong> active days in <strong>{{ monthName }}</strong></p>
          } @else {
            <p class="text-xs text-gray-400 mt-2"><strong>{{ activityService.totalActiveDays() }}</strong> active days in <strong>{{ currentYear }}</strong></p>
          }
        </div>
      </section>

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

      <!-- Privacy: leaderboard visibility -->
      <section class="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
        <div class="p-4 flex items-center justify-between gap-3">
          <div class="flex items-center space-x-3">
            <div class="w-8 h-8 rounded-lg bg-green-50 text-green-600 flex items-center justify-center">
              <mat-icon class="text-sm">leaderboard</mat-icon>
            </div>
            <div>
              <span class="font-medium text-gray-900 block">Show me on the ranking</span>
              <span class="text-xs text-gray-400">Only your accepted friends can see the ranking.</span>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            [attr.aria-checked]="leaderboardVisible()"
            [disabled]="savingVisibility()"
            (click)="toggleLeaderboardVisibility()"
            class="relative inline-flex h-6 w-11 flex-shrink-0 rounded-full transition-colors disabled:opacity-50"
            [class.bg-green-500]="leaderboardVisible()"
            [class.bg-gray-200]="!leaderboardVisible()"
          >
            <span
              class="inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform mt-0.5"
              [class.translate-x-5]="leaderboardVisible()"
              [class.translate-x-0.5]="!leaderboardVisible()"
            ></span>
          </button>
        </div>
        <p class="px-4 pb-4 -mt-1 text-xs text-gray-400">
          When off, your name and stats are hidden from your friends' ranking. Your friends feed and your own view are unaffected.
        </p>
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
    </div>
  `,
  styles: [`
    .fade-in { animation: fadeIn 0.4s ease-out backwards; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class ProfileComponent {
  authService = inject(AuthService);
  supabase = inject(SupabaseService);
  presenceService = inject(PresenceService);
  notifications = inject(NotificationService);
  router = inject(Router);
  cdr = inject(ChangeDetectorRef);
  activityService = inject(ActivityService);
  intensityColor = intensityColor;
  activityPeriod = signal<'month' | 'year'>('month');
  user = this.authService.currentUser;
  activeField: 'name' | 'height' | 'weight' | 'age' | 'username' | null = null;
  avatarModalOpen = false;
  avatarUploading = false;
  avatarUploadMessage = '';
  form = {
    name: '',
    username: '',
    avatarUrl: '',
    height: 0,
    weight: 0,
    age: 0,
  };

  leaderboardVisible = signal<boolean>(true);
  savingVisibility = signal<boolean>(false);

  constructor() {
    effect(() => {
      const u = this.user();
      if (!u) return;
      this.form = {
        name: u.name || '',
        username: u.username || '',
        avatarUrl: u.avatarUrl || '',
        height: u.height || 0,
        weight: u.weight || 0,
        age: u.age || 0,
      };
      this.leaderboardVisible.set(u.leaderboardVisible ?? true);
    });
  }

  get monthName() {
    return new Date().toLocaleDateString('en-US', { month: 'long' });
  }

  get currentYear() {
    return new Date().getFullYear();
  }

  goToActivity() {
    this.router.navigate(['/activity']);
  }

  monthlyActivity(): number[] {
    return buildContributionGrid(this.activityService.sessions(), 30).map(d => d.intensity);
  }

  get yearlyWeeks() {
    const days = this.activityService.aggregateYearlyActivity();
    const weeks: typeof days[] = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }
    return weeks;
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  beginInlineEdit(field: 'name' | 'height' | 'weight' | 'age' | 'username', inputEl?: HTMLInputElement) {
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

  async toggleLeaderboardVisibility() {
    if (this.savingVisibility()) return;

    const client = this.supabase.getClient();
    const current = this.user();
    if (!client || !current) return;

    const next = !this.leaderboardVisible();
    // Optimistic flip; revert on failure so the switch never lies.
    this.leaderboardVisible.set(next);
    this.savingVisibility.set(true);

    const { error } = await client.from('profiles')
      .update({ leaderboard_visible: next })
      .eq('id', current.id);

    this.savingVisibility.set(false);

    if (error) {
      this.leaderboardVisible.set(!next);
      this.notifications.error(error.message || 'Failed to update visibility.');
      return;
    }

    this.notifications.success(next ? 'You are shown on the ranking.' : 'You are hidden from the ranking.');
    await this.authService.refreshProfile();
  }
}

