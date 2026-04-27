import { Injectable, signal } from '@angular/core';

export type NotificationType = 'success' | 'error' | 'info';

export interface NotificationState {
  id: number;
  text: string;
  type: NotificationType;
  durationMs: number;
}

export interface NotificationPromptOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  inputLabel?: string;
  inputPlaceholder?: string;
  inputInitialValue?: string;
}

export interface NotificationPromptState {
  id: number;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  inputLabel?: string;
  inputPlaceholder?: string;
  inputInitialValue: string;
}

export interface NotificationPromptResult {
  confirmed: boolean;
  inputValue: string;
}

export const NOTIFICATION_CONFIG = {
  // Single place to configure global notification behavior.
  defaultDurationMs: 5000,
  maxDurationMs: 5000,
  bottomOffsetPx: 104,
  zIndex: 70,
  promptZIndex: 90,
} as const;

@Injectable({ providedIn: 'root' })
export class NotificationService {
  readonly config = NOTIFICATION_CONFIG;
  readonly current = signal<NotificationState | null>(null);
  readonly prompt = signal<NotificationPromptState | null>(null);

  private timer: ReturnType<typeof setTimeout> | null = null;
  private nextId = 1;
  private promptResolver: ((result: NotificationPromptResult) => void) | null = null;

  show(text: string, type: NotificationType = 'info', durationMs?: number) {
    const requested = durationMs ?? this.config.defaultDurationMs;
    const boundedDuration = Math.max(500, Math.min(requested, this.config.maxDurationMs));

    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    const state: NotificationState = {
      id: this.nextId++,
      text,
      type,
      durationMs: boundedDuration,
    };

    this.current.set(state);

    this.timer = setTimeout(() => {
      this.current.set(null);
      this.timer = null;
    }, boundedDuration);
  }

  success(text: string, durationMs?: number) {
    this.show(text, 'success', durationMs);
  }

  error(text: string, durationMs?: number) {
    this.show(text, 'error', durationMs);
  }

  info(text: string, durationMs?: number) {
    this.show(text, 'info', durationMs);
  }

  clear() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.current.set(null);
  }

  openPrompt(options: NotificationPromptOptions): Promise<NotificationPromptResult> {
    // Resolve any previous pending prompt as cancelled before opening a new one.
    if (this.promptResolver) {
      this.promptResolver({ confirmed: false, inputValue: '' });
      this.promptResolver = null;
    }

    const promptState: NotificationPromptState = {
      id: this.nextId++,
      title: options.title,
      message: options.message,
      confirmText: options.confirmText || 'Confirm',
      cancelText: options.cancelText || 'Cancel',
      inputLabel: options.inputLabel,
      inputPlaceholder: options.inputPlaceholder,
      inputInitialValue: options.inputInitialValue || '',
    };

    this.prompt.set(promptState);

    return new Promise<NotificationPromptResult>((resolve) => {
      this.promptResolver = resolve;
    });
  }

  confirmPrompt(inputValue: string) {
    if (!this.promptResolver) return;
    this.promptResolver({ confirmed: true, inputValue });
    this.promptResolver = null;
    this.prompt.set(null);
  }

  cancelPrompt(inputValue = '') {
    if (!this.promptResolver) {
      this.prompt.set(null);
      return;
    }
    this.promptResolver({ confirmed: false, inputValue });
    this.promptResolver = null;
    this.prompt.set(null);
  }
}
