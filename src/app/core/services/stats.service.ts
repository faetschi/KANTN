import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { WorkoutService } from './workout.service';
import { AuthService } from './auth.service';
import { SupabaseService } from './supabase.service';
import { startOfWeek, startOfMonth, isAfter } from 'date-fns';

interface AggregateStats {
  count: number;
  duration: number;
  calories: number;
}

interface StatsRpcRow {
  workout_count: number | string | null;
  total_duration_seconds: number | string | null;
  total_calories: number | string | null;
}

@Injectable({
  providedIn: 'root'
})
export class StatsService {
  private workoutService = inject(WorkoutService);
  private authService = inject(AuthService);
  private supabase = inject(SupabaseService);

  private weeklyStatsSignal = signal<AggregateStats>({ count: 0, duration: 0, calories: 0 });
  private monthlyStatsSignal = signal<AggregateStats>({ count: 0, duration: 0, calories: 0 });

  constructor() {
    effect(() => {
      const currentUser = this.authService.currentUser();
      const loadedUserId = this.workoutService.loadedUserId();
      const sessions = this.workoutService.sessions();

      void sessions;

      if (!currentUser || loadedUserId !== currentUser.id) {
        this.weeklyStatsSignal.set({ count: 0, duration: 0, calories: 0 });
        this.monthlyStatsSignal.set({ count: 0, duration: 0, calories: 0 });
        return;
      }

      void this.refreshStats();
    });
  }

  private getFallbackStats(fromTs: Date) {
    const sessions = this.workoutService.sessions().filter(s => isAfter(s.date, fromTs));
    return {
      count: sessions.length,
      duration: sessions.reduce((acc, session) => acc + (session.duration || 0), 0),
      calories: sessions.reduce((acc, session) => acc + (session.caloriesBurned || 0), 0),
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
      count: Number(row.workout_count || 0),
      duration: Number(row.total_duration_seconds || 0),
      calories: Number(row.total_calories || 0),
    };
  }

  private async refreshStats() {
    const now = new Date();
    const weekStart = startOfWeek(now);
    const monthStart = startOfMonth(now);

    const weeklyFallback = this.getFallbackStats(weekStart);
    const monthlyFallback = this.getFallbackStats(monthStart);

    const [weekly, monthly] = await Promise.all([
      this.fetchRangeStats(weekStart, now, weeklyFallback),
      this.fetchRangeStats(monthStart, now, monthlyFallback),
    ]);

    this.weeklyStatsSignal.set(weekly);
    this.monthlyStatsSignal.set(monthly);
  }

  weeklyStats = computed(() => this.weeklyStatsSignal());

  monthlyStats = computed(() => this.monthlyStatsSignal());
}
