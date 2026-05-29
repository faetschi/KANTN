import { isToday, isUpcoming, isMissed } from './core/domain/date-status';
import { ScheduledWorkout } from './core/models/models';

function makeScheduled(date: Date, status: ScheduledWorkout['status'] = 'scheduled'): ScheduledWorkout {
  return {
    id: 'sw1',
    planId: 'p1',
    planName: 'Test Plan',
    planExercises: [],
    scheduledDate: date,
    status,
  };
}

describe('isToday', () => {
  it('returns true for today', () => {
    const sw = makeScheduled(new Date());
    expect(isToday(sw)).toBeTrue();
  });

  it('returns false for yesterday', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const sw = makeScheduled(yesterday);
    expect(isToday(sw)).toBeFalse();
  });

  it('returns false for tomorrow', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const sw = makeScheduled(tomorrow);
    expect(isToday(sw)).toBeFalse();
  });
});

describe('isUpcoming', () => {
  it('returns true for a future date', () => {
    const future = new Date();
    future.setDate(future.getDate() + 3);
    const sw = makeScheduled(future);
    expect(isUpcoming(sw)).toBeTrue();
  });

  it('returns false for today', () => {
    const sw = makeScheduled(new Date());
    expect(isUpcoming(sw)).toBeFalse();
  });

  it('returns false for a past date', () => {
    const past = new Date();
    past.setDate(past.getDate() - 3);
    const sw = makeScheduled(past);
    expect(isUpcoming(sw)).toBeFalse();
  });

  it('returns false for skipped workout', () => {
    const future = new Date();
    future.setDate(future.getDate() + 1);
    const sw = makeScheduled(future, 'skipped');
    expect(isUpcoming(sw)).toBeFalse();
  });
});

describe('isMissed', () => {
  it('returns true for a past scheduled date that was not completed', () => {
    const past = new Date();
    past.setDate(past.getDate() - 2);
    past.setHours(0, 0, 0, 0);
    const sw = makeScheduled(past);
    expect(isMissed(sw)).toBeTrue();
  });

  it('returns false for today', () => {
    const sw = makeScheduled(new Date());
    expect(isMissed(sw)).toBeFalse();
  });

  it('returns false for a future date', () => {
    const future = new Date();
    future.setDate(future.getDate() + 2);
    const sw = makeScheduled(future);
    expect(isMissed(sw)).toBeFalse();
  });

  it('returns false for completed workout', () => {
    const past = new Date();
    past.setDate(past.getDate() - 2);
    const sw = makeScheduled(past, 'completed');
    expect(isMissed(sw)).toBeFalse();
  });

  it('returns false for skipped workout', () => {
    const past = new Date();
    past.setDate(past.getDate() - 2);
    const sw = makeScheduled(past, 'skipped');
    expect(isMissed(sw)).toBeFalse();
  });
});
