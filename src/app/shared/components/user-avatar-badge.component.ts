import { Component, EventEmitter, Input, Output, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { generateInitialsAvatar } from '../../core/domain/avatar-utils';
import { timeAgo } from '../../core/domain/time-ago';
import { getWorkoutTypeEmoji } from '../../core/domain/workout-types';

type AvatarSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-user-avatar-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="inline-flex flex-col items-center text-center">
      <div class="relative inline-flex">
        <button
          type="button"
          (click)="handleAvatarClick()"
          [class.cursor-pointer]="enableClick"
          [class.cursor-default]="!enableClick"
          [class.pointer-events-none]="!enableClick"
          [class.w-8]="size === 'sm'"
          [class.h-8]="size === 'sm'"
          [class.w-14]="size === 'md'"
          [class.h-14]="size === 'md'"
          [class.w-20]="size === 'lg'"
          [class.h-20]="size === 'lg'"
          class="rounded-full bg-gray-200 overflow-hidden ring-2 ring-gray-50"
        >
          <img
            [src]="avatarSrc()"
            (error)="onAvatarError($event)"
            [attr.alt]="displayName || 'User'"
            class="w-full h-full object-cover"
          />
        </button>
        <span
          class="absolute bottom-0 right-0 rounded-full border-2 border-white inline-block z-10"
          [style.width.px]="dotSizePx()"
          [style.height.px]="dotSizePx()"
          [class.bg-green-500]="isOnline"
          [class.bg-red-500]="!isOnline"
          [attr.aria-label]="isOnline ? 'Online' : 'Offline'"
        ></span>
        <span
          *ngIf="resolvedEmoji()"
          class="absolute top-0 right-0 flex items-center justify-center rounded-full bg-white shadow-sm border border-gray-100 z-10"
          [class.w-4]="size === 'sm'"
          [class.h-4]="size === 'sm'"
          [class.text-[10px]]="size === 'sm'"
          [class.w-5]="size === 'md'"
          [class.h-5]="size === 'md'"
          [class.text-xs]="size === 'md'"
          [class.w-6]="size === 'lg'"
          [class.h-6]="size === 'lg'"
          [class.text-sm]="size === 'lg'"
          [attr.aria-label]="actionLabel || 'Action'"
        >{{ resolvedEmoji() }}</span>
      </div>
      <span *ngIf="displayStatusText()" class="text-gray-400 text-xs mt-1">{{ displayStatusText() }}</span>
    </div>
  `,
})
export class UserAvatarBadgeComponent implements OnDestroy {
  @Input() avatarUrl = '';
  @Input() displayName = '';
  @Input() isOnline = false;
  @Input() lastSeen?: string;
  @Input() showLastSeen = true;
  @Input() actionEmoji?: string;
  @Input() actionType?: string;
  @Input() actionLabel?: string;
  @Input() size: AvatarSize = 'md';
  @Input() enableClick = false;
  @Output() avatarClick = new EventEmitter<void>();

  private refreshTick = signal(0);
  private tickTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.tickTimer = setInterval(() => this.refreshTick.set(Date.now()), 10_000);
  }

  displayStatusText = computed(() => {
    this.refreshTick();
    if (!this.showLastSeen) return '';
    if (this.isOnline) return 'Online';
    if (!this.lastSeen) return '';
    return `Last seen ${timeAgo(this.lastSeen)}`;
  });

  avatarSrc() {
    return this.avatarUrl || generateInitialsAvatar(this.displayName || 'User');
  }

  dotSizePx() {
    if (this.size === 'sm') return 10;
    if (this.size === 'lg') return 16;
    return 12;
  }

  resolvedEmoji() {
    if (this.actionEmoji) return this.actionEmoji;
    return getWorkoutTypeEmoji(this.actionType) || '';
  }

  onAvatarError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.src = generateInitialsAvatar(this.displayName || 'User');
  }

  handleAvatarClick() {
    if (!this.enableClick) return;
    this.avatarClick.emit();
  }

  ngOnDestroy() {
    if (this.tickTimer) clearInterval(this.tickTimer);
  }
}
