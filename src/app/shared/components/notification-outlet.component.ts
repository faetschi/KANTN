import { Component, computed, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-notification-outlet',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (prompt(); as promptState) {
      <div
        class="fixed inset-0 bg-black/40 flex items-center justify-center p-4"
        [style.z-index]="notifications.config.promptZIndex"
      >
        <div class="w-full max-w-md bg-white rounded-2xl p-5 shadow-xl border border-gray-100 space-y-4">
          <div>
            <h3 class="text-base font-bold text-gray-900">{{ promptState.title }}</h3>
            <p class="text-sm text-gray-500 mt-1">{{ promptState.message }}</p>
          </div>

          @if (promptState.inputLabel) {
            <div class="space-y-2">
              <label class="block text-xs font-semibold uppercase tracking-wide text-gray-500">{{ promptState.inputLabel }}</label>
              <input
                type="text"
                [(ngModel)]="promptInput"
                [placeholder]="promptState.inputPlaceholder || ''"
                class="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          }

          <div class="flex items-center justify-end gap-2">
            <button
              type="button"
              (click)="cancelPrompt()"
              class="px-3 py-2 rounded-lg text-sm font-semibold text-gray-600 bg-gray-100"
            >
              {{ promptState.cancelText }}
            </button>
            <button
              type="button"
              (click)="confirmPrompt()"
              class="px-3 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600"
            >
              {{ promptState.confirmText }}
            </button>
          </div>
        </div>
      </div>
    }

    @if (notification(); as note) {
      <div
        class="fixed left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl text-white text-sm shadow-lg"
        [style.z-index]="notifications.config.zIndex"
        [style.bottom]="bottomOffsetCss()"
        [class.bg-green-600]="note.type === 'success'"
        [class.bg-red-600]="note.type === 'error'"
        [class.bg-gray-800]="note.type === 'info'"
        role="status"
        aria-live="polite"
      >
        {{ note.text }}
      </div>
    }
  `,
})
export class NotificationOutletComponent {
  notifications = inject(NotificationService);
  notification = this.notifications.current;
  prompt = this.notifications.prompt;
  promptInput = '';

  bottomOffsetCss = computed(
    () => `calc(${this.notifications.config.bottomOffsetPx}px + env(safe-area-inset-bottom, 0px))`
  );

  constructor() {
    effect(() => {
      const prompt = this.prompt();
      if (!prompt) return;
      this.promptInput = prompt.inputInitialValue;
    });
  }

  confirmPrompt() {
    this.notifications.confirmPrompt(this.promptInput);
  }

  cancelPrompt() {
    this.notifications.cancelPrompt(this.promptInput);
  }
}
