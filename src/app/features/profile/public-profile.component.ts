import { Component, effect, inject, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { ProfileService, PublicProfile } from '../../core/services/profile.service';
import { SocialService, UserSession } from '../../core/services/social.service';
import { UserAvatarBadgeComponent } from '../../shared/components/user-avatar-badge.component';
import { AuthService } from '../../core/services/auth.service';
import { timeAgo } from '../../core/domain/time-ago';
import { generateInitialsAvatar } from '../../core/domain/avatar-utils';

@Component({
  selector: 'app-public-profile',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, UserAvatarBadgeComponent],
  template: `
    <div class="p-4 sm:p-6 space-y-6 max-w-2xl mx-auto pb-24">
      <header class="grid grid-cols-3 items-center">
        <button type="button" (click)="goBack()" class="text-gray-500 hover:text-gray-700 p-1 -ml-1 justify-self-start">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h1 class="text-2xl font-bold text-gray-900 text-center">Profile</h1>
        <div class="flex items-center gap-3 justify-self-end">
          <button (click)="logout()" class="text-xs font-semibold text-red-500">Log Out</button>
          <a [routerLink]="['/profile']" class="w-10 h-10 rounded-full bg-gray-200 overflow-hidden border-2 border-white shadow-sm cursor-pointer block">
            <img [src]="user()?.avatarUrl || generateInitialsAvatar(user()?.name || 'User')" alt="Profile" class="w-full h-full object-cover">
          </a>
        </div>
      </header>

      @if (loading()) {
        <div class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 text-center text-sm text-gray-500">
          Loading profile...
        </div>
      }

      @if (!loading() && !profile()) {
        <div class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 text-center text-sm text-gray-500">
          User not found.
        </div>
      }

      @if (!loading() && profile(); as p) {
        <div class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center animate-fade-in">
          <app-user-avatar-badge
            class="mb-3"
            [avatarUrl]="p.avatarUrl || ''"
            [displayName]="p.name"
            [isOnline]="false"
            [lastSeen]="p.lastSeen"
            [showLastSeen]="true"
            size="lg"
          ></app-user-avatar-badge>
          <div class="text-lg font-bold text-gray-900">{{ p.name }}</div>
          <p class="text-gray-500 text-sm">@{{ p.username }}</p>

          <div class="grid grid-cols-3 gap-4 w-full border-t border-gray-100 pt-4 mt-4">
            <div>
              <div class="text-base font-bold text-gray-900 text-center">{{ p.weight || 0 }}</div>
              <p class="text-xs text-gray-400 uppercase tracking-wider mt-1 text-center">Weight</p>
            </div>
            <div>
              <div class="text-base font-bold text-gray-900 text-center">{{ p.height || 0 }}</div>
              <p class="text-xs text-gray-400 uppercase tracking-wider mt-1 text-center">Height</p>
            </div>
            <div>
              <div class="text-base font-bold text-gray-900 text-center">{{ p.age || 0 }}</div>
              <p class="text-xs text-gray-400 uppercase tracking-wider mt-1 text-center">Age</p>
            </div>
          </div>
        </div>

        <!-- Workouts -->
        <section class="space-y-3 animate-fade-in">
          <h2 class="text-sm font-bold text-gray-900 px-1">
            {{ isSelf() ? 'Your workouts' : p.name + '&rsquo;s workouts' }}
          </h2>

          @if (sessionsLoading()) {
            <div class="flex justify-center py-6">
              <div class="w-6 h-6 rounded-full border-2 border-gray-200 border-t-orange-500 animate-spin"></div>
            </div>
          } @else if (sessions().length === 0) {
            <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center text-sm text-gray-400">
              @if (isSelf()) {
                No workouts yet.
              } @else {
                You can only see workouts of friends. Add {{ p.name }} as a friend first.
              }
            </div>
          }

          @for (s of sessions(); track s.sessionId) {
            <article
              (click)="openSession(s.sessionId)"
              (keyup.enter)="openSession(s.sessionId)"
              tabindex="0"
              role="button"
              [attr.aria-label]="'View workout ' + (s.planName || 'workout')"
              class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 cursor-pointer transition-shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-300 animate-fade-in"
            >
              <div class="flex items-center justify-between gap-3">
                <div class="min-w-0">
                  <p class="text-sm font-semibold text-gray-900 truncate">{{ s.planName || 'Workout' }}</p>
                  <p class="text-xs text-gray-400">{{ ago(s.finishedAt) }}</p>
                </div>
                @if (s.photoUrl) {
                  <mat-icon class="!w-5 !h-5 !text-xl text-gray-300 shrink-0">image</mat-icon>
                }
              </div>

              @if (s.photoUrl) {
                <img [src]="s.photoUrl" alt="Workout photo" class="w-full rounded-xl mt-3 border border-gray-100 max-h-72 object-cover" />
              }

              <div class="flex items-center gap-4 mt-3 text-sm text-gray-500">
                <span class="flex items-center gap-1">
                  <mat-icon class="!w-4 !h-4 !text-base text-orange-500">local_fire_department</mat-icon>
                  {{ s.totalCalories | number:'1.0-0' }} kcal
                </span>
                <span class="flex items-center gap-1">
                  <mat-icon class="!w-4 !h-4 !text-base text-blue-500">timer</mat-icon>
                  {{ formatDuration(s.durationSeconds) }}
                </span>
              </div>
            </article>
          }

          @if (hasMore()) {
            <button
              type="button"
              (click)="loadMore()"
              [disabled]="loadingMore()"
              class="w-full py-3 rounded-2xl bg-white shadow-sm border border-gray-100 text-sm font-semibold text-gray-600 disabled:opacity-50"
            >
              {{ loadingMore() ? 'Loading…' : 'Load more' }}
            </button>
          }
        </section>
      }
    </div>
  `,
})
export class PublicProfileComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);
  private profiles = inject(ProfileService);
  private social = inject(SocialService);
  authService = inject(AuthService);
  generateInitialsAvatar = generateInitialsAvatar;
  user = this.authService.currentUser;

  private readonly pageSize = 20;

  loading = signal(true);
  profile = signal<PublicProfile | null>(null);
  sessions = signal<UserSession[]>([]);
  sessionsLoading = signal(false);
  loadingMore = signal(false);
  hasMore = signal(false);

  constructor() {
    effect(() => {
      const username = this.route.snapshot.paramMap.get('username') || '';
      void this.loadProfile(username);
    });
  }

  isSelf(): boolean {
    const current = this.authService.currentUser();
    const p = this.profile();
    if (!current || !p) return false;
    return current.id === p.id;
  }

  async loadProfile(username: string): Promise<void> {
    this.loading.set(true);
    this.sessions.set([]);
    this.hasMore.set(false);
    const profile = await this.profiles.getProfileByUsername(username);
    this.profile.set(profile);
    this.loading.set(false);

    if (profile) {
      void this.loadSessions(profile.id);
    }
  }

  private async loadSessions(userId: string): Promise<void> {
    this.sessionsLoading.set(true);
    try {
      const rows = await this.social.loadUserSessions(userId, this.pageSize);
      this.sessions.set(rows);
      this.hasMore.set(rows.length >= this.pageSize);
    } finally {
      this.sessionsLoading.set(false);
    }
  }

  async loadMore(): Promise<void> {
    const p = this.profile();
    const current = this.sessions();
    const last = current[current.length - 1];
    if (!p || !last || this.loadingMore()) return;

    this.loadingMore.set(true);
    try {
      const rows = await this.social.loadUserSessions(p.id, this.pageSize, last.finishedAt, last.sessionId);
      const seen = new Set(current.map((item) => item.sessionId));
      const fresh = rows.filter((item) => !seen.has(item.sessionId));
      if (fresh.length > 0) {
        this.sessions.set([...current, ...fresh]);
      }
      this.hasMore.set(rows.length >= this.pageSize);
    } finally {
      this.loadingMore.set(false);
    }
  }

  openSession(sessionId: string): void {
    void this.router.navigate(['/social/session', sessionId]);
  }

  ago(iso: string): string {
    return timeAgo(iso);
  }

  formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  goBack(): void {
    // Step back through history so we return to wherever we came from (feed,
    // friends list, leaderboard, …). Fall back to /social only on a direct
    // deep-link load where there is no in-app history to pop.
    if (typeof window !== 'undefined' && window.history.length > 1) {
      this.location.back();
    } else {
      this.router.navigate(['/social']);
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
