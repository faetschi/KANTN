import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { SocialService, FriendSessionDetail } from '../../core/services/social.service';
import { generateInitialsAvatar } from '../../core/domain/avatar-utils';
import { timeAgo } from '../../core/domain/time-ago';

@Component({
  selector: 'app-friend-session',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule],
  template: `
    <div class="p-4 sm:p-6 pb-24 space-y-6 max-w-2xl mx-auto">
      <header class="flex items-center gap-3">
        <button (click)="goBack()" class="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 shrink-0">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Workout</h1>
          <p class="text-gray-500 text-sm">Session details</p>
        </div>
      </header>

      @if (loading()) {
        <section class="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center text-gray-400">
          <p class="text-sm">Loading…</p>
        </section>
      } @else if (session(); as s) {
        <!-- Author -->
        <section class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div class="flex items-center gap-3">
            <a [routerLink]="'/profile/@' + s.username" class="shrink-0">
              <img
                [src]="s.avatarUrl || avatarFor(s.displayName)"
                (error)="onImgError($event, s.displayName)"
                [alt]="s.displayName"
                class="w-12 h-12 rounded-full object-cover bg-gray-200"
              />
            </a>
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2">
                <a [routerLink]="'/profile/@' + s.username" class="font-semibold text-gray-900 truncate">{{ s.displayName }}</a>
                @if (s.streak > 0) {
                  <span class="text-xs font-semibold text-orange-500 shrink-0">🔥 {{ s.streak }}</span>
                }
              </div>
              <p class="text-xs text-gray-400">{{ ago(s.finishedAt) }}</p>
            </div>
          </div>

          <p class="text-sm text-gray-700 mt-3">
            Completed <span class="font-semibold">{{ s.planName || 'a workout' }}</span>
          </p>

          @if (s.photoUrl) {
            <img [src]="s.photoUrl" alt="Workout photo" class="w-full rounded-xl mt-3 border border-gray-100 max-h-96 object-cover" />
          }

          <div class="grid grid-cols-2 gap-3 pt-3">
            <div class="bg-gray-50 rounded-xl p-3">
              <p class="text-[10px] uppercase tracking-wider text-gray-500">Duration</p>
              <p class="text-lg font-semibold text-gray-900">{{ formatTime(s.durationSeconds) }}</p>
            </div>
            <div class="bg-gray-50 rounded-xl p-3">
              <p class="text-[10px] uppercase tracking-wider text-gray-500">Calories</p>
              <p class="text-lg font-semibold text-gray-900">{{ s.totalCalories | number:'1.0-0' }} kcal</p>
            </div>
          </div>
        </section>

        <!-- Exercises -->
        <section class="space-y-3">
          @for (exercise of s.exercises; track $index) {
            <article class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <h3 class="font-semibold text-gray-900 mb-3">{{ exercise.name }}</h3>

              @if (isCardio(exercise)) {
                <div class="space-y-2 bg-orange-50 rounded-xl p-3">
                  <div class="grid grid-cols-2 gap-3">
                    <div>
                      <p class="text-[10px] uppercase tracking-wider text-gray-500">Distance</p>
                      <p class="text-lg font-semibold text-gray-900">{{ formatDistance(exercise.distanceMeters) }}</p>
                    </div>
                    <div>
                      <p class="text-[10px] uppercase tracking-wider text-gray-500">Duration</p>
                      <p class="text-lg font-semibold text-gray-900">{{ formatTime(exercise.durationSeconds) }}</p>
                    </div>
                  </div>
                  @if (exercise.avgPacePerKmSeconds > 0) {
                    <div>
                      <p class="text-[10px] uppercase tracking-wider text-gray-500">Avg Pace</p>
                      <p class="text-lg font-semibold text-gray-900">{{ formatPace(exercise.avgPacePerKmSeconds) }}</p>
                    </div>
                  }
                  @if (exercise.avgSpeedKmh > 0) {
                    <div>
                      <p class="text-[10px] uppercase tracking-wider text-gray-500">Avg Speed</p>
                      <p class="text-lg font-semibold text-gray-900">{{ exercise.avgSpeedKmh | number:'1.1-1' }} km/h</p>
                    </div>
                  }
                </div>
              } @else {
                <div class="space-y-2">
                  @for (set of exercise.sets; track $index) {
                    <div class="grid grid-cols-[auto_1fr_auto] gap-3 items-center rounded-xl border border-gray-100 px-3 py-2">
                      <span class="text-xs text-gray-500">Set {{ $index + 1 }}</span>
                      <span class="text-sm text-gray-700">{{ set.weight }} kg × {{ set.reps }} reps</span>
                      <span
                        class="px-2 py-1 rounded-full text-[10px] font-semibold"
                        [class.bg-green-100]="set.completed"
                        [class.text-green-700]="set.completed"
                        [class.bg-gray-100]="!set.completed"
                        [class.text-gray-500]="!set.completed"
                      >
                        {{ set.completed ? 'Done' : 'Not done' }}
                      </span>
                    </div>
                  }
                  @if (exercise.sets.length === 0) {
                    <p class="text-gray-400 text-sm">No sets recorded.</p>
                  }
                </div>
              }
            </article>
          }

          @if (s.exercises.length === 0) {
            <p class="text-gray-400 text-center py-8">No exercise details saved for this workout.</p>
          }
        </section>
      } @else {
        <section class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center space-y-3">
          <p class="text-gray-500">This workout is not available.</p>
          <a (click)="goBack()" class="text-blue-600 font-semibold cursor-pointer">Back to Feed</a>
        </section>
      }
    </div>
  `,
})
export class FriendSessionComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private social = inject(SocialService);

  protected loading = signal(true);
  protected session = signal<FriendSessionDetail | null>(null);

  private sessionId = toSignal(
    this.route.paramMap.pipe(map(params => params.get('sessionId') || '')),
    { initialValue: '' }
  );

  ngOnInit(): void {
    void this.load();
  }

  private async load(): Promise<void> {
    const id = this.sessionId();
    if (!id) {
      this.loading.set(false);
      return;
    }
    this.loading.set(true);
    try {
      const detail = await this.social.loadSession(id);
      this.session.set(detail);
    } finally {
      this.loading.set(false);
    }
  }

  isCardio(exercise: { exerciseTypeSnapshot: string | null; distanceMeters: number }): boolean {
    return exercise.exerciseTypeSnapshot === 'cardio' || exercise.distanceMeters > 0;
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

  formatDistance(meters: number): string {
    if (meters < 1000) return `${meters}m`;
    return `${(meters / 1000).toFixed(2)} km`;
  }

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  formatPace(secondsPerKm: number): string {
    if (secondsPerKm === 0) return '--:--';
    const mins = Math.floor(secondsPerKm / 60);
    const secs = secondsPerKm % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}/km`;
  }

  goBack(): void {
    void this.router.navigate(['/social']);
  }
}
