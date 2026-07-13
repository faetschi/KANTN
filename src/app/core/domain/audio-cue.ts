/**
 * Lightweight audible / haptic feedback used to reduce cognitive load during a
 * workout: the user gets a signal tone instead of having to watch the screen
 * (e.g. an interval beep every configurable distance while running/cycling).
 *
 * Uses the Web Audio API so no audio assets are required and it works offline.
 * Everything is guarded so it is a no-op under SSR or in test environments.
 */

/** Distance-interval options (metres) offered for the cardio signal tone. 0 = Off. */
export const CARDIO_CUE_INTERVAL_OPTIONS = [0, 500, 1000, 2000, 5000] as const;

export const DEFAULT_CARDIO_CUE_INTERVAL = 1000;

let sharedContext: AudioContext | null = null;

type AudioContextCtor = typeof AudioContext;

function resolveAudioContextCtor(): AudioContextCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as { AudioContext?: AudioContextCtor; webkitAudioContext?: AudioContextCtor };
  return w.AudioContext || w.webkitAudioContext || null;
}

/**
 * Returns a shared, resumed AudioContext (creating it lazily). Must ideally be
 * called from within a user gesture so browsers allow playback.
 */
function getAudioContext(): AudioContext | null {
  const Ctor = resolveAudioContextCtor();
  if (!Ctor) return null;
  try {
    if (!sharedContext) {
      sharedContext = new Ctor();
    }
    if (sharedContext.state === 'suspended') {
      void sharedContext.resume();
    }
    return sharedContext;
  } catch {
    return null;
  }
}

/**
 * Unlock/resume the audio context in response to a user gesture (e.g. tapping
 * "GPS ON"). Safe to call repeatedly.
 */
export function primeAudioCue(): void {
  getAudioContext();
}

export interface BeepOptions {
  frequency?: number;
  durationMs?: number;
  volume?: number;
}

/** Play a single short tone. No-op if audio is unavailable. */
export function playBeep(options: BeepOptions = {}): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  const { frequency = 880, durationMs = 180, volume = 0.15 } = options;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = frequency;
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    const end = now + durationMs / 1000;
    // Small attack/release envelope avoids audible clicks.
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.01);
    gain.gain.linearRampToValueAtTime(0, end);

    osc.start(now);
    osc.stop(end + 0.02);
  } catch {
    // Ignore — audio feedback is best-effort.
  }
}

/** Trigger a device vibration if supported. */
export function vibrate(pattern: number | number[]): void {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  } catch {
    // Ignore.
  }
}

/** Distinctive two-tone cue played when a distance milestone is reached. */
export function playDistanceCue(): void {
  playBeep({ frequency: 880, durationMs: 150 });
  setTimeout(() => playBeep({ frequency: 1175, durationMs: 220 }), 170);
  vibrate([120, 60, 160]);
}

/**
 * How many interval milestones a given distance has crossed.
 * e.g. 5200m with a 1000m interval → 5 milestones.
 */
export function distanceCuesReached(distanceMeters: number, intervalMeters: number): number {
  if (intervalMeters <= 0 || distanceMeters <= 0) return 0;
  return Math.floor(distanceMeters / intervalMeters);
}

/** Human-readable label for a cue interval (metres). */
export function formatCueInterval(intervalMeters: number): string {
  if (intervalMeters <= 0) return 'Off';
  if (intervalMeters < 1000) return `${intervalMeters} m`;
  const km = intervalMeters / 1000;
  return `${Number.isInteger(km) ? km : km.toFixed(1)} km`;
}
