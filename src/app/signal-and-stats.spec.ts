import { describe, it, expect } from 'vitest';
import {
  distanceCuesReached,
  formatCueInterval,
  CARDIO_CUE_INTERVAL_OPTIONS,
  DEFAULT_CARDIO_CUE_INTERVAL,
} from './core/domain/audio-cue';
import { computePeriodTotals, computePeriodTotalsSince } from './core/domain/stats-utils';
import { WorkoutSession } from './core/models/models';

describe('Distance signal-tone milestones', () => {
  it('returns 0 when interval is off (0)', () => {
    expect(distanceCuesReached(5000, 0)).toBe(0);
  });

  it('returns 0 for no distance covered', () => {
    expect(distanceCuesReached(0, 1000)).toBe(0);
  });

  it('counts 5 milestones for 5200m at a 1km interval', () => {
    expect(distanceCuesReached(5200, 1000)).toBe(5);
  });

  it('counts 1 milestone for exactly one interval', () => {
    expect(distanceCuesReached(5000, 5000)).toBe(1);
  });

  it('does not count a milestone until the interval is reached', () => {
    expect(distanceCuesReached(4999, 5000)).toBe(0);
  });

  it('handles half-kilometer intervals', () => {
    expect(distanceCuesReached(1600, 500)).toBe(3);
  });

  it('models crossing a new milestone as reached > already cued', () => {
    // Simulate the component logic: only beep when a new milestone appears.
    const interval = 1000;
    let cued = 0;
    const beepsAt: number[] = [];
    for (const distance of [400, 900, 1000, 1200, 2050, 2100]) {
      const reached = distanceCuesReached(distance, interval);
      if (reached > cued) {
        beepsAt.push(distance);
        cued = reached;
      }
    }
    expect(beepsAt).toEqual([1000, 2050]);
  });
});

describe('formatCueInterval', () => {
  it('labels 0 as Off', () => {
    expect(formatCueInterval(0)).toBe('Off');
  });

  it('labels sub-kilometer intervals in metres', () => {
    expect(formatCueInterval(500)).toBe('500 m');
  });

  it('labels whole kilometers without decimals', () => {
    expect(formatCueInterval(1000)).toBe('1 km');
    expect(formatCueInterval(5000)).toBe('5 km');
  });

  it('labels fractional kilometers with one decimal', () => {
    expect(formatCueInterval(1500)).toBe('1.5 km');
  });

  it('default interval is one of the offered options', () => {
    expect((CARDIO_CUE_INTERVAL_OPTIONS as readonly number[])).toContain(DEFAULT_CARDIO_CUE_INTERVAL);
  });
});

describe('Period totals (volume + distance)', () => {
  function session(partial: Partial<WorkoutSession>): WorkoutSession {
    return {
      id: Math.random().toString(36).slice(2),
      planId: 'p',
      date: new Date('2026-07-08T10:00:00Z'),
      createdAt: new Date('2026-07-08T10:00:00Z'),
      startTime: new Date('2026-07-08T10:00:00Z'),
      exercises: [],
      ...partial,
    };
  }

  it('returns zero totals for no sessions', () => {
    expect(computePeriodTotals([])).toEqual({ volumeKg: 0, distanceMeters: 0 });
  });

  it('sums volume only over completed sets (reps × weight)', () => {
    const s = session({
      exercises: [
        {
          exerciseId: 'bench',
          sets: [
            { reps: 10, weight: 50, completed: true },
            { reps: 8, weight: 60, completed: true },
            { reps: 8, weight: 60, completed: false }, // ignored
          ],
        },
      ],
    });
    // 10*50 + 8*60 = 500 + 480 = 980
    expect(computePeriodTotals([s]).volumeKg).toBe(980);
  });

  it('sums cardio distance across exercises and sessions', () => {
    const a = session({ exercises: [{ exerciseId: 'run', sets: [], distanceMeters: 5000 }] });
    const b = session({ exercises: [{ exerciseId: 'cycle', sets: [], distanceMeters: 12000 }] });
    expect(computePeriodTotals([a, b]).distanceMeters).toBe(17000);
  });

  it('ignores negative or missing values defensively', () => {
    const s = session({
      exercises: [
        { exerciseId: 'x', sets: [{ reps: -5, weight: 50, completed: true }], distanceMeters: -100 },
      ],
    });
    expect(computePeriodTotals([s])).toEqual({ volumeKg: 0, distanceMeters: 0 });
  });

  it('filters sessions by createdAt when using computePeriodTotalsSince', () => {
    const older = session({
      createdAt: new Date('2026-07-01T10:00:00Z'),
      exercises: [{ exerciseId: 'run', sets: [], distanceMeters: 3000 }],
    });
    const newer = session({
      createdAt: new Date('2026-07-09T10:00:00Z'),
      exercises: [{ exerciseId: 'run', sets: [], distanceMeters: 4000 }],
    });
    const from = new Date('2026-07-06T00:00:00Z');
    expect(computePeriodTotalsSince([older, newer], from).distanceMeters).toBe(4000);
  });
});
