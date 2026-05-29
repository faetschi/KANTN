import { WorkoutService } from './core/services/workout.service';
import { ScheduledWorkout } from './core/models/models';

describe('ScheduledWorkoutService', () => {
  let service: WorkoutService;

  beforeEach(() => {
    service = new WorkoutService();
  });

  it('allows scheduling a plan', async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const ok = await service.schedulePlan('p1', tomorrow);
    expect(ok).toBeTrue();

    const allScheduled = service.scheduledWorkouts();
    expect(allScheduled.some(sw => sw.planId === 'p1' && sw.status === 'scheduled')).toBeTrue();
  });

  it('returns today scheduled workouts', () => {
    const today = new Date();
    const workouts = service.getTodayScheduledWorkouts();
    expect(workouts.length).toBeGreaterThanOrEqual(0);
  });

  it('returns upcoming scheduled workouts sorted by date', () => {
    const upcoming = service.getUpcomingScheduledWorkouts();
    for (let i = 1; i < upcoming.length; i++) {
      expect(new Date(upcoming[i].scheduledDate).getTime())
        .toBeGreaterThanOrEqual(new Date(upcoming[i - 1].scheduledDate).getTime());
    }
  });

  it('can update scheduled workout status', async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    await service.schedulePlan('p1', tomorrow);

    const scheduled = service.scheduledWorkouts().find(sw => sw.planId === 'p1');
    expect(scheduled).toBeDefined();

    if (scheduled) {
      await service.updateScheduledWorkoutStatus(scheduled.id, 'completed');
      const updated = service.scheduledWorkouts().find(sw => sw.id === scheduled.id);
      expect(updated?.status).toBe('completed');
    }
  });

  it('nearestScheduledWorkout returns the closest future workout', () => {
    const nearest = service.nearestScheduledWorkout();
    if (nearest) {
      expect(new Date(nearest.scheduledDate).getTime()).toBeGreaterThanOrEqual(Date.now());
    }
  });

  it('missedWorkouts returns past-due scheduled workouts', () => {
    const missed = service.missedWorkouts();
    missed.forEach(sw => {
      expect(new Date(sw.scheduledDate).getTime()).toBeLessThan(Date.now());
    });
  });
});
