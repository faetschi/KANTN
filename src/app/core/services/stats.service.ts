import { Injectable, computed, inject } from '@angular/core';
import { WorkoutService } from './workout.service';
import { startOfWeek, startOfMonth, isAfter } from 'date-fns';

@Injectable({
  providedIn: 'root'
})
export class StatsService {
  private workoutService = inject(WorkoutService);

  weeklyStats = computed(() => {
    const now = new Date();
    const weekStart = startOfWeek(now);
    const sessions = this.workoutService.sessions().filter(s => isAfter(s.date, weekStart));

    return {
      count: sessions.length,
      duration: sessions.reduce((acc, s) => acc + (s.duration || 0), 0),
      calories: sessions.reduce((acc, s) => acc + (s.caloriesBurned || 0), 0)
    };
  });

  monthlyStats = computed(() => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const sessions = this.workoutService.sessions().filter(s => isAfter(s.date, monthStart));

    return {
      count: sessions.length,
      duration: sessions.reduce((acc, s) => acc + (s.duration || 0), 0),
      calories: sessions.reduce((acc, s) => acc + (s.caloriesBurned || 0), 0)
    };
  });
}
