import { ScheduledWorkout } from '../models/models';

export function isToday(sw: ScheduledWorkout): boolean {
  const d = new Date(sw.scheduledDate);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() &&
         d.getMonth() === now.getMonth() &&
         d.getDate() === now.getDate();
}

export function isUpcoming(sw: ScheduledWorkout): boolean {
  if (sw.status !== 'scheduled') return false;
  const d = new Date(sw.scheduledDate);
  d.setHours(0, 0, 0, 0);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return d > now;
}

export function isMissed(sw: ScheduledWorkout): boolean {
  if (sw.status === 'completed' || sw.status === 'skipped') return false;
  const d = new Date(sw.scheduledDate);
  d.setHours(0, 0, 0, 0);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return d < now;
}

export function scheduledWorkoutStatusLabel(sw: ScheduledWorkout): string {
  if (sw.status === 'completed') return 'Completed';
  if (sw.status === 'skipped') return 'Skipped';
  if (isToday(sw)) return 'Today';
  if (isMissed(sw)) return 'Missed';
  if (isUpcoming(sw)) return 'Upcoming';
  return 'Scheduled';
}
