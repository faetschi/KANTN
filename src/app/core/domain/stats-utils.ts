import { WorkoutSession } from '../models/models';

/**
 * Aggregate performance figures for a set of sessions that go beyond the
 * count/duration/calories tracked by the DB stats RPCs:
 *  - total training volume (kg lifted = reps × weight over completed sets)
 *  - total distance covered (metres, from cardio exercises)
 *
 * Computed client-side from already-loaded sessions so no DB migration is
 * required.
 */
export interface PeriodTotals {
  volumeKg: number;
  distanceMeters: number;
}

export function computePeriodTotals(sessions: WorkoutSession[]): PeriodTotals {
  let volumeKg = 0;
  let distanceMeters = 0;

  for (const session of sessions) {
    for (const exercise of session.exercises || []) {
      distanceMeters += Math.max(0, exercise.distanceMeters || 0);
      for (const set of exercise.sets || []) {
        if (set.completed) {
          volumeKg += Math.max(0, set.reps || 0) * Math.max(0, set.weight || 0);
        }
      }
    }
  }

  return {
    volumeKg: Math.round(volumeKg * 100) / 100,
    distanceMeters: Math.round(distanceMeters),
  };
}

/** Sum totals for sessions created on/after the given timestamp. */
export function computePeriodTotalsSince(sessions: WorkoutSession[], fromTs: Date): PeriodTotals {
  return computePeriodTotals(sessions.filter(s => s.createdAt >= fromTs));
}
