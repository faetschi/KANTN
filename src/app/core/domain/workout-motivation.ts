// Motivational feedback shown on the workout-completion screen.
//
// Design intent (see docs/ixd_requirements.md, Epic 1 / Story 3): the message
// must stay supportive and celebratory — never shaming, never guilt-tripping a
// user for a short streak or an easy session. Copy is intentionally positive
// and lightweight.

export interface WorkoutCompletionFeedback {
  /** Headline, e.g. "Workout complete!". */
  title: string;
  /** Supportive one-liner, optionally referencing the user's streak. */
  message: string;
  /** Emoji shown alongside the message. */
  emoji: string;
}

const GENERIC_MESSAGES: readonly string[] = [
  'Every session counts. Nice work today.',
  'That is one more workout in the books. Well done!',
  'Strong effort — your future self says thanks.',
  'You showed up and put in the work. Respect.',
  'Consistency beats intensity. Great job today.',
  'Another step forward. Keep it up!',
];

const STREAK_MESSAGES: readonly string[] = [
  'day streak — the fire is burning! 🔥',
  'days in a row. You are building a real habit.',
  'day streak and counting. Keep the momentum going!',
];

/**
 * Build a supportive completion message. When a streak is available it is woven
 * in; otherwise a friendly generic line is used. `seed` (e.g. a session id or
 * timestamp) keeps the pick stable for a given completion instead of flickering
 * across change-detection runs.
 */
export function buildWorkoutCompletionFeedback(
  streak: number,
  seed: number = Date.now(),
): WorkoutCompletionFeedback {
  const safeStreak = Number.isFinite(streak) && streak > 0 ? Math.floor(streak) : 0;
  const pick = (arr: readonly string[]) => arr[Math.abs(Math.floor(seed)) % arr.length];

  if (safeStreak >= 2) {
    return {
      title: 'Workout complete!',
      message: `${safeStreak} ${pick(STREAK_MESSAGES)}`,
      emoji: '🔥',
    };
  }

  if (safeStreak === 1) {
    return {
      title: 'Workout complete!',
      message: 'You started a streak today — come back tomorrow to keep it alive!',
      emoji: '🔥',
    };
  }

  return {
    title: 'Workout complete!',
    message: pick(GENERIC_MESSAGES),
    emoji: '💪',
  };
}
