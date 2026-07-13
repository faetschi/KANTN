import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { WorkoutService } from './workout.service';
import { AuthService } from './auth.service';
import { SupabaseService } from './supabase.service';
import { startOfWeek, startOfMonth } from 'date-fns';
import { computePeriodTotalsSince } from '../domain/stats-utils';

interface AggregateStats {
  count: number;
  duration: number;
  calories: number;
  /** Total training volume lifted (kg = reps × weight over completed sets). */
  volumeKg: number;
  /** Total distance covered from cardio exercises (metres). */
  distanceMeters: number;
}

const EMPTY_STATS: AggregateStats = { count: 0, duration: 0, calories: 0, volumeKg: 0, distanceMeters: 0 };

/** Period totals available from the DB stats RPC (no volume/distance). */
type RpcPeriodTotals = Pick<AggregateStats, 'count' | 'duration' | 'calories'>;

interface StatsRpcRow {
  workout_count: number | string | null;
  total_duration_seconds: number | string | null;
  total_calories: number | string | null;
}

interface StatsPeriodRow extends StatsRpcRow {
  period: string | null;
}

function parseNumberOrFallback(value: number | string | null | undefined, fallback: number): number {
  if (value === null || value === undefined) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

@Injectable({
  providedIn: 'root'
})
export class StatsService {
  private workoutService = inject(WorkoutService);
  private authService = inject(AuthService);
  private supabase = inject(SupabaseService);

  private weeklyStatsSignal = signal<AggregateStats>({ ...EMPTY_STATS });
  private monthlyStatsSignal = signal<AggregateStats>({ ...EMPTY_STATS });
  private yearlyStatsSignal = signal<AggregateStats>({ ...EMPTY_STATS });

  constructor() {
    effect(() => {
      const currentUser = this.authService.currentUser();
      const loadedUserId = this.workoutService.loadedUserId();
      const sessions = this.workoutService.sessions();

      void sessions;

      if (!currentUser || loadedUserId !== currentUser.id) {
        this.weeklyStatsSignal.set({ ...EMPTY_STATS });
        this.monthlyStatsSignal.set({ ...EMPTY_STATS });
        this.yearlyStatsSignal.set({ ...EMPTY_STATS });
        return;
      }

      void this.refreshStats();
    });
  }

  private getFallbackStats(fromTs: Date): AggregateStats {
    const sessions = this.workoutService.sessions().filter(s => s.createdAt >= fromTs);
    const totals = computePeriodTotalsSince(this.workoutService.sessions(), fromTs);
    return {
      count: sessions.length,
      duration: sessions.reduce((acc, session) => acc + (session.duration || 0), 0),
      calories: sessions.reduce((acc, session) => acc + (session.caloriesBurned || 0), 0),
      volumeKg: totals.volumeKg,
      distanceMeters: totals.distanceMeters,
    };
  }

  private async fetchRangeStats(fromTs: Date, toTs: Date, fallback: AggregateStats): Promise<AggregateStats> {
    const client = this.supabase.getClient();
    if (!client) return fallback;

    const { data, error } = await client.rpc('get_my_stats', {
      from_ts: fromTs.toISOString(),
      to_ts: toTs.toISOString(),
    });

    if (error) {
      console.warn('Failed to fetch aggregated stats from Supabase RPC, using fallback.', error);
      return fallback;
    }

    const row = (Array.isArray(data) ? data[0] : data) as StatsRpcRow | null;
    if (!row) return fallback;

    return {
      count: parseNumberOrFallback(row.workout_count, fallback.count),
      duration: parseNumberOrFallback(row.total_duration_seconds, fallback.duration),
      calories: parseNumberOrFallback(row.total_calories, fallback.calories),
      // Volume/distance are not provided by the RPC — always taken from local sessions.
      volumeKg: fallback.volumeKg,
      distanceMeters: fallback.distanceMeters,
    };
  }

  private async fetchPeriodStats(): Promise<{ weekly?: RpcPeriodTotals; monthly?: RpcPeriodTotals } | null> {
    const client = this.supabase.getClient();
    if (!client) return null;

    const { data, error } = await client.rpc('get_my_stats_periods');
    if (error || !Array.isArray(data)) return null;

    const byPeriod = new Map<string, RpcPeriodTotals>();
    for (const row of data as StatsPeriodRow[]) {
      const key = (row.period || '').toLowerCase();
      if (key !== 'week' && key !== 'month') continue;
      byPeriod.set(key, {
        count: parseNumberOrFallback(row.workout_count, 0),
        duration: parseNumberOrFallback(row.total_duration_seconds, 0),
        calories: parseNumberOrFallback(row.total_calories, 0),
      });
    }

    return {
      weekly: byPeriod.get('week'),
      monthly: byPeriod.get('month'),
    };
  }

  private async refreshStats() {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const monthStart = startOfMonth(now);
    const yearStart = new Date(now.getFullYear(), 0, 1);

    const weeklyFallback = this.getFallbackStats(weekStart);
    const monthlyFallback = this.getFallbackStats(monthStart);
    const yearlyFallback = this.getFallbackStats(yearStart);

    const [yearly, periodStats] = await Promise.all([
      this.fetchRangeStats(yearStart, now, yearlyFallback),
      this.fetchPeriodStats(),
    ]);
    this.yearlyStatsSignal.set(yearly);

    if (periodStats?.weekly && periodStats?.monthly) {
      this.weeklyStatsSignal.set({
        count: periodStats.weekly.count ?? weeklyFallback.count,
        duration: periodStats.weekly.duration ?? weeklyFallback.duration,
        calories: periodStats.weekly.calories ?? weeklyFallback.calories,
        // Volume/distance are computed locally regardless of the RPC.
        volumeKg: weeklyFallback.volumeKg,
        distanceMeters: weeklyFallback.distanceMeters,
      });
      this.monthlyStatsSignal.set({
        count: periodStats.monthly.count ?? monthlyFallback.count,
        duration: periodStats.monthly.duration ?? monthlyFallback.duration,
        calories: periodStats.monthly.calories ?? monthlyFallback.calories,
        volumeKg: monthlyFallback.volumeKg,
        distanceMeters: monthlyFallback.distanceMeters,
      });
      return;
    }

    const [weekly, monthly] = await Promise.all([
      this.fetchRangeStats(weekStart, now, weeklyFallback),
      this.fetchRangeStats(monthStart, now, monthlyFallback),
    ]);

    this.weeklyStatsSignal.set(weekly);
    this.monthlyStatsSignal.set(monthly);
  }

  weeklyStats = computed(() => this.weeklyStatsSignal());

  monthlyStats = computed(() => this.monthlyStatsSignal());

  yearlyStats = computed(() => this.yearlyStatsSignal());
}
