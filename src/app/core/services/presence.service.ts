import { Injectable, NgZone, OnDestroy, inject, signal, computed } from '@angular/core';
import { AuthService } from './auth.service';
import { SupabaseService } from './supabase.service';

const HEARTBEAT_MS = 60_000;
const OFFLINE_THRESHOLD_MS = 120_000;
const DEBOUNCE_ACTIVITY_MS = 30_000;

@Injectable({ providedIn: 'root' })
export class PresenceService implements OnDestroy {
  private auth = inject(AuthService);
  private supabase = inject(SupabaseService);
  private zone = inject(NgZone);

  private _lastHeartbeat = signal<number>(0);
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private activityTimer: ReturnType<typeof setTimeout> | null = null;
  private activityListeners: (() => void)[] = [];

  lastHeartbeat = computed(() => this._lastHeartbeat());

  isOnline = computed(() => {
    const last = this._lastHeartbeat();
    if (!last) return false;
    return Date.now() - last < OFFLINE_THRESHOLD_MS;
  });

  constructor() {
    this.zone.runOutsideAngular(() => {
      this.touch();
      this.heartbeatTimer = setInterval(() => this.touch(), HEARTBEAT_MS);
      this.activityListeners.push(
        listenEvent(document, 'visibilitychange', () => {
          if (document.visibilityState === 'visible') this.touch();
        }),
        listenEvent(window, 'focus', () => this.touch()),
        listenEvent(document, 'click', () => this.bump()),
        listenEvent(document, 'keydown', () => this.bump()),
      );
    });
  }

  private bump() {
    if (this.activityTimer) return;
    this.activityTimer = setTimeout(() => {
      this.activityTimer = null;
      this.touch();
    }, DEBOUNCE_ACTIVITY_MS);
  }

  private touch() {
    const user = this.auth.currentUser();
    if (!user) return;
    const client = this.supabase.getClient();
    if (!client) return;

    const now = new Date().toISOString();
    this._lastHeartbeat.set(Date.now());

    client
      .from('profiles')
      .update({ last_seen: now })
      .eq('id', user.id)
      .then(({ error }) => {
        if (error) console.warn('Failed to update last_seen', error);
      });

    this.auth.updateLastSeen(now);
  }

  ngOnDestroy() {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.activityListeners.forEach(fn => fn());
    if (this.activityTimer) clearTimeout(this.activityTimer);
  }
}

function listenEvent(target: EventTarget, event: string, fn: () => void): () => void {
  target.addEventListener(event, fn);
  return () => target.removeEventListener(event, fn);
}
