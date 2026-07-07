import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { SocialService } from '../../core/services/social.service';
import { NotificationService } from '../../core/services/notification.service';
import { generateInitialsAvatar } from '../../core/domain/avatar-utils';
import { timeAgo } from '../../core/domain/time-ago';

type SocialTab = 'feed' | 'friends' | 'leaderboard';

@Component({
  selector: 'app-social',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatIconModule],
  template: `
    <div class="p-4 sm:p-6 pb-24 space-y-6 max-w-2xl mx-auto">
      <!-- Header: own streak -->
      <header class="bg-gradient-to-br from-orange-500 to-red-500 rounded-3xl p-5 text-white shadow-sm">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-orange-100 text-sm font-medium">Your streak</p>
            <div class="flex items-baseline gap-2 mt-1">
              <span class="text-5xl font-extrabold leading-none">{{ social.myStreak() }}</span>
              <span class="text-lg font-semibold text-orange-50">{{ social.myStreak() === 1 ? 'day' : 'days' }}</span>
            </div>
            <p class="text-orange-100 text-xs mt-2">
              {{ social.myStreak() > 0 ? 'Keep the fire going!' : 'Work out today to start a streak.' }}
            </p>
          </div>
          <div class="text-6xl select-none" aria-hidden="true">🔥</div>
        </div>
      </header>

      <!-- Tabs -->
      <div class="flex bg-gray-100 rounded-2xl p-1">
        <button
          type="button"
          (click)="setTab('feed')"
          [class.bg-white]="activeTab() === 'feed'"
          [class.shadow-sm]="activeTab() === 'feed'"
          [class.text-gray-900]="activeTab() === 'feed'"
          [class.text-gray-500]="activeTab() !== 'feed'"
          class="flex-1 py-2 rounded-xl text-sm font-semibold transition-colors"
        >
          Feed
        </button>
        <button
          type="button"
          (click)="setTab('friends')"
          [class.bg-white]="activeTab() === 'friends'"
          [class.shadow-sm]="activeTab() === 'friends'"
          [class.text-gray-900]="activeTab() === 'friends'"
          [class.text-gray-500]="activeTab() !== 'friends'"
          class="flex-1 py-2 rounded-xl text-sm font-semibold transition-colors relative"
        >
          Friends
          @if (social.pendingRequestCount() > 0) {
            <span class="absolute top-1 right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold inline-flex items-center justify-center">
              {{ social.pendingRequestCount() }}
            </span>
          }
        </button>
        <button
          type="button"
          (click)="setTab('leaderboard')"
          [class.bg-white]="activeTab() === 'leaderboard'"
          [class.shadow-sm]="activeTab() === 'leaderboard'"
          [class.text-gray-900]="activeTab() === 'leaderboard'"
          [class.text-gray-500]="activeTab() !== 'leaderboard'"
          class="flex-1 py-2 rounded-xl text-sm font-semibold transition-colors"
        >
          Ranking
        </button>
      </div>

      <!-- FEED -->
      @if (activeTab() === 'feed') {
        <section class="space-y-3">
          @if (social.activity().length === 0) {
            <div class="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center text-gray-400">
              <mat-icon class="!w-10 !h-10 !text-4xl mb-2 text-gray-300">groups</mat-icon>
              <p class="text-sm">No activity yet. Add friends to see their workouts here.</p>
            </div>
          }
          @for (item of social.activity(); track item.sessionId) {
            <article
              (click)="openSession(item.sessionId)"
              (keyup.enter)="openSession(item.sessionId)"
              tabindex="0"
              role="button"
              [attr.aria-label]="'View ' + item.displayName + '\\'s workout'"
              class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 cursor-pointer transition-shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              <div class="flex items-center gap-3">
                <a [routerLink]="'/profile/@' + item.username" (click)="$event.stopPropagation()" class="shrink-0">
                  <img
                    [src]="item.avatarUrl || avatarFor(item.displayName)"
                    (error)="onImgError($event, item.displayName)"
                    [alt]="item.displayName"
                    class="w-11 h-11 rounded-full object-cover bg-gray-200"
                  />
                </a>
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-2">
                    <a [routerLink]="'/profile/@' + item.username" (click)="$event.stopPropagation()" class="font-semibold text-gray-900 truncate">{{ item.displayName }}</a>
                    @if (item.streak > 0) {
                      <span class="text-xs font-semibold text-orange-500 shrink-0">🔥 {{ item.streak }}</span>
                    }
                  </div>
                  <p class="text-xs text-gray-400">{{ ago(item.finishedAt) }}</p>
                </div>
              </div>

              <p class="text-sm text-gray-700 mt-3">
                Completed <span class="font-semibold">{{ item.planName || 'a workout' }}</span>
              </p>

              @if (item.photoUrl) {
                <img [src]="item.photoUrl" alt="Workout photo" class="w-full rounded-xl mt-3 border border-gray-100 max-h-80 object-cover" />
              }

              <div class="flex items-center gap-4 mt-3 text-sm text-gray-500">
                <span class="flex items-center gap-1">
                  <mat-icon class="!w-4 !h-4 !text-base text-orange-500">local_fire_department</mat-icon>
                  {{ item.totalCalories | number:'1.0-0' }} kcal
                </span>
                <span class="flex items-center gap-1">
                  <mat-icon class="!w-4 !h-4 !text-base text-blue-500">timer</mat-icon>
                  {{ formatDuration(item.durationSeconds) }}
                </span>
              </div>
            </article>
          }
        </section>
      }

      <!-- FRIENDS -->
      @if (activeTab() === 'friends') {
        <section class="space-y-5">
          <!-- Add friend -->
          <div class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <label class="text-sm font-semibold text-gray-900">Add a friend</label>
            <div class="flex gap-2 mt-2">
              <div class="flex items-center flex-1 bg-gray-50 rounded-xl px-3 border border-gray-200 focus-within:border-blue-400">
                <span class="text-gray-400">&#64;</span>
                <input
                  [(ngModel)]="usernameInput"
                  (keyup.enter)="add()"
                  type="text"
                  placeholder="username"
                  autocapitalize="none"
                  autocomplete="off"
                  class="flex-1 bg-transparent py-2.5 px-1 text-sm outline-none"
                />
              </div>
              <button
                type="button"
                (click)="add()"
                [disabled]="adding() || !usernameInput.trim()"
                class="px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold disabled:opacity-40"
              >
                {{ adding() ? '...' : 'Add' }}
              </button>
            </div>
          </div>

          <!-- Incoming requests -->
          @if (social.friendRequests().length > 0) {
            <div class="space-y-2">
              <h2 class="text-sm font-bold text-gray-900 px-1">Requests</h2>
              @for (req of social.friendRequests(); track req.requestId) {
                <div class="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 flex items-center gap-3">
                  <a [routerLink]="'/profile/@' + req.username" class="shrink-0">
                    <img
                      [src]="req.avatarUrl || avatarFor(req.displayName)"
                      (error)="onImgError($event, req.displayName)"
                      [alt]="req.displayName"
                      class="w-10 h-10 rounded-full object-cover bg-gray-200"
                    />
                  </a>
                  <div class="min-w-0 flex-1">
                    <p class="font-semibold text-gray-900 truncate">{{ req.displayName }}</p>
                    <p class="text-xs text-gray-400 truncate">@{{ req.username }}</p>
                  </div>
                  <button type="button" (click)="respond(req.requestId, true)" class="w-9 h-9 rounded-full bg-green-100 text-green-700 flex items-center justify-center" aria-label="Accept">
                    <mat-icon class="!w-5 !h-5 !text-xl">check</mat-icon>
                  </button>
                  <button type="button" (click)="respond(req.requestId, false)" class="w-9 h-9 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center" aria-label="Decline">
                    <mat-icon class="!w-5 !h-5 !text-xl">close</mat-icon>
                  </button>
                </div>
              }
            </div>
          }

          <!-- Friends list -->
          <div class="space-y-2">
            <h2 class="text-sm font-bold text-gray-900 px-1">Friends ({{ social.friends().length }})</h2>
            @if (social.friends().length === 0) {
              <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center text-sm text-gray-400">
                No friends yet. Add someone by their &#64;username.
              </div>
            }
            @for (friend of social.friends(); track friend.id) {
              <div class="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 flex items-center gap-3">
                <a [routerLink]="'/profile/@' + friend.username" class="shrink-0">
                  <img
                    [src]="friend.avatarUrl || avatarFor(friend.displayName)"
                    (error)="onImgError($event, friend.displayName)"
                    [alt]="friend.displayName"
                    class="w-10 h-10 rounded-full object-cover bg-gray-200"
                  />
                </a>
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-2">
                    <p class="font-semibold text-gray-900 truncate">{{ friend.displayName }}</p>
                    @if (friend.streak > 0) {
                      <span class="text-xs font-semibold text-orange-500 shrink-0">🔥 {{ friend.streak }}</span>
                    }
                  </div>
                  <p class="text-xs text-gray-400">{{ friend.totalWorkouts }} workouts · {{ friend.totalCalories | number:'1.0-0' }} kcal</p>
                </div>
                <button type="button" (click)="remove(friend)" class="text-gray-300 hover:text-red-500" aria-label="Remove friend">
                  <mat-icon class="!w-5 !h-5 !text-xl">person_remove</mat-icon>
                </button>
              </div>
            }
          </div>
        </section>
      }

      <!-- LEADERBOARD -->
      @if (activeTab() === 'leaderboard') {
        <section class="space-y-2">
          @if (social.leaderboard().length === 0) {
            <div class="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center text-gray-400 text-sm">
              No one on the leaderboard yet.
            </div>
          }
          @for (entry of social.leaderboard(); track entry.userId; let i = $index) {
            <div
              class="rounded-2xl p-3 shadow-sm border flex items-center gap-3"
              [class.bg-blue-50]="entry.isMe"
              [class.border-blue-200]="entry.isMe"
              [class.bg-white]="!entry.isMe"
              [class.border-gray-100]="!entry.isMe"
            >
              <div class="w-8 text-center shrink-0">
                <span class="text-lg">{{ rankBadge(i) }}</span>
              </div>
              <a [routerLink]="'/profile/@' + entry.username" class="shrink-0">
                <img
                  [src]="entry.avatarUrl || avatarFor(entry.displayName)"
                  (error)="onImgError($event, entry.displayName)"
                  [alt]="entry.displayName"
                  class="w-10 h-10 rounded-full object-cover bg-gray-200"
                />
              </a>
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2">
                  <p class="font-semibold text-gray-900 truncate">{{ entry.displayName }}{{ entry.isMe ? ' (you)' : '' }}</p>
                  @if (entry.streak > 0) {
                    <span class="text-xs font-semibold text-orange-500 shrink-0">🔥 {{ entry.streak }}</span>
                  }
                </div>
                <p class="text-xs text-gray-400">{{ entry.totalWorkouts }} workouts</p>
              </div>
              <div class="text-right shrink-0">
                <p class="font-bold text-gray-900">{{ entry.totalCalories | number:'1.0-0' }}</p>
                <p class="text-[10px] uppercase tracking-wider text-gray-400">kcal</p>
              </div>
            </div>
          }
        </section>
      }
    </div>
  `,
})
export class SocialComponent implements OnInit {
  protected social = inject(SocialService);
  private notifications = inject(NotificationService);
  private router = inject(Router);

  protected activeTab = signal<SocialTab>('feed');
  protected usernameInput = '';
  protected adding = signal(false);

  ngOnInit(): void {
    void this.social.refreshAll();
  }

  setTab(tab: SocialTab): void {
    this.activeTab.set(tab);
  }

  openSession(sessionId: string): void {
    void this.router.navigate(['/social/session', sessionId]);
  }

  async add(): Promise<void> {
    const value = this.usernameInput.trim();
    if (!value || this.adding()) return;

    this.adding.set(true);
    try {
      const result = await this.social.sendRequest(value);
      switch (result) {
        case 'sent':
          this.notifications.success('Friend request sent.');
          this.usernameInput = '';
          break;
        case 'accepted_incoming':
          this.notifications.success('You are now friends!');
          this.usernameInput = '';
          break;
        case 'already_friends':
          this.notifications.info('You are already friends.');
          break;
        case 'already_pending':
          this.notifications.info('Request already pending.');
          break;
        case 'self':
          this.notifications.error("You can't add yourself.");
          break;
        case 'not_found':
          this.notifications.error('No user found with that username.');
          break;
        default:
          this.notifications.error('Could not send the request. Please try again.');
      }
    } finally {
      this.adding.set(false);
    }
  }

  async respond(requestId: string, accept: boolean): Promise<void> {
    const ok = await this.social.respondRequest(requestId, accept);
    if (ok) {
      this.notifications.success(accept ? 'Friend added.' : 'Request declined.');
    } else {
      this.notifications.error('Something went wrong. Please try again.');
    }
  }

  async remove(friend: { id: string; displayName: string }): Promise<void> {
    const confirmed = await this.notifications.openPrompt({
      title: 'Remove friend',
      message: `Remove ${friend.displayName} from your friends?`,
      confirmText: 'Remove',
      cancelText: 'Cancel',
    });
    if (!confirmed.confirmed) return;

    const ok = await this.social.removeFriend(friend.id);
    if (ok) {
      this.notifications.success('Friend removed.');
    } else {
      this.notifications.error('Could not remove friend.');
    }
  }

  rankBadge(index: number): string {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `${index + 1}`;
  }

  avatarFor(name: string): string {
    return generateInitialsAvatar(name || 'User');
  }

  onImgError(event: Event, name: string): void {
    (event.target as HTMLImageElement).src = generateInitialsAvatar(name || 'User');
  }

  ago(iso: string): string {
    return timeAgo(iso);
  }

  formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
}
