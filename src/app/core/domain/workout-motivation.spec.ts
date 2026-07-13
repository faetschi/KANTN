import { buildWorkoutCompletionFeedback } from './workout-motivation';

describe('buildWorkoutCompletionFeedback', () => {
  it('celebrates an ongoing streak (>= 2 days) with the streak count and fire emoji', () => {
    const fb = buildWorkoutCompletionFeedback(5, 0);
    expect(fb.emoji).toBe('🔥');
    expect(fb.message).toContain('5');
    expect(fb.title).toBe('Workout complete!');
  });

  it('gives a "streak started" message for exactly 1 day', () => {
    const fb = buildWorkoutCompletionFeedback(1, 0);
    expect(fb.emoji).toBe('🔥');
    expect(fb.message.toLowerCase()).toContain('streak');
  });

  it('falls back to a supportive generic message when there is no streak', () => {
    const fb = buildWorkoutCompletionFeedback(0, 0);
    expect(fb.emoji).toBe('💪');
    expect(fb.message.length).toBeGreaterThan(0);
    // No shaming language.
    expect(fb.message.toLowerCase()).not.toContain('lazy');
    expect(fb.message.toLowerCase()).not.toContain('failed');
  });

  it('treats invalid streak values as no streak instead of throwing', () => {
    expect(() => buildWorkoutCompletionFeedback(NaN, 0)).not.toThrow();
    expect(buildWorkoutCompletionFeedback(NaN, 0).emoji).toBe('💪');
    expect(buildWorkoutCompletionFeedback(-3, 0).emoji).toBe('💪');
  });

  it('is deterministic for a given seed', () => {
    const a = buildWorkoutCompletionFeedback(0, 42);
    const b = buildWorkoutCompletionFeedback(0, 42);
    expect(a.message).toBe(b.message);
  });
});
