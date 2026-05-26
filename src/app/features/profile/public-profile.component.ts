import { Component, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { ProfileService, PublicProfile } from '../../core/services/profile.service';
import { UserAvatarBadgeComponent } from '../../shared/components/user-avatar-badge.component';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-public-profile',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, UserAvatarBadgeComponent],
  template: `
    <div class="p-4 sm:p-6 space-y-6 sm:space-y-8">
      <header class="flex items-center justify-between">
        <button type="button" (click)="goBack()" class="text-sm text-gray-500">Back</button>
        <h1 class="text-2xl font-bold text-gray-900">Profile</h1>
        <a [routerLink]="['/profile']" class="text-sm text-blue-600">My Profile</a>
      </header>

      <div *ngIf="loading" class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 text-center text-sm text-gray-500">
        Loading profile...
      </div>

      <div *ngIf="!loading && !profile" class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 text-center text-sm text-gray-500">
        User not found.
      </div>

      <div *ngIf="!loading && profile" class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
        <app-user-avatar-badge
          class="mb-3"
          [avatarUrl]="profile.avatarUrl || ''"
          [displayName]="profile.name"
          [isOnline]="false"
          [lastSeen]="profile.lastSeen"
          [showLastSeen]="true"
          size="lg"
        ></app-user-avatar-badge>
        <div class="text-lg font-bold text-gray-900">{{ profile.name }}</div>
        <p class="text-gray-500 text-sm">@{{ profile.username }}</p>
        <p class="text-gray-700 text-sm mt-2" *ngIf="profile.funFact">{{ profile.funFact }}</p>

        <div class="grid grid-cols-3 gap-4 w-full border-t border-gray-100 pt-4 mt-4">
          <div>
            <div class="text-base font-bold text-gray-900 text-center">{{ profile.weight || 0 }}</div>
            <p class="text-xs text-gray-400 uppercase tracking-wider mt-1 text-center">Weight</p>
          </div>
          <div>
            <div class="text-base font-bold text-gray-900 text-center">{{ profile.height || 0 }}</div>
            <p class="text-xs text-gray-400 uppercase tracking-wider mt-1 text-center">Height</p>
          </div>
          <div>
            <div class="text-base font-bold text-gray-900 text-center">{{ profile.age || 0 }}</div>
            <p class="text-xs text-gray-400 uppercase tracking-wider mt-1 text-center">Age</p>
          </div>
        </div>
      </div>

    </div>
  `,
})
export class PublicProfileComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private profiles = inject(ProfileService);
  private auth = inject(AuthService);

  loading = true;
  profile: PublicProfile | null = null;

  constructor() {
    effect(() => {
      const username = this.route.snapshot.paramMap.get('username') || '';
      void this.loadProfile(username);
    });
  }

  isSelf() {
    const current = this.auth.currentUser();
    if (!current || !this.profile) return false;
    return current.id === this.profile.id;
  }

  async loadProfile(username: string) {
    this.loading = true;
    this.profile = await this.profiles.getProfileByUsername(username);
    this.loading = false;
  }

  goBack() {
    this.router.navigate(['/home']);
  }
}
