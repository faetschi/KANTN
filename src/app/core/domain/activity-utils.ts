import { WorkoutSession } from '../models/models';
import { ContributionDay, WeekDayEntry } from '../models/activity-models';

const ACTIVITY_COLORS: Record<string, string[]> = {
  blue: ['#ebf5ff', '#b3d9ff', '#4da6ff', '#0066cc', '#003b80'],
  green: ['#ebf5eb', '#b3d9b3', '#4da64d', '#006600', '#003b00'],
  purple: ['#f3ebff', '#d4b3ff', '#8c4dff', '#5900cc', '#330080'],
  orange: ['#fff5eb', '#ffd4b3', '#ff8c4d', '#cc5900', '#803300'],
  pink: ['#fff0f5', '#ffb3d9', '#ff4da6', '#cc0066', '#800040'],
};

const PLAN_COLORS = ['blue', 'purple', 'green', 'orange', 'pink', 'teal', 'indigo', 'amber'];

const DAY_LABELS = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function intensityColor(intensity: number, scheme: string): string {
  const palette = ACTIVITY_COLORS[scheme] || ACTIVITY_COLORS['blue'];
  return palette[Math.min(Math.max(intensity, 0), 4)];
}

export function planColor(planId: string): string {
  let hash = 0;
  for (let i = 0; i < planId.length; i++) {
    hash = ((hash << 5) - hash) + planId.charCodeAt(i);
    hash |= 0;
  }
  return PLAN_COLORS[Math.abs(hash) % PLAN_COLORS.length];
}

export function getDayLabel(date: Date): string {
  const day = date.getDay();
  return DAY_LABELS[day === 0 ? 6 : day - 1];
}

export function getMonthLabels(year: number): { index: number; label: string }[] {
  const labels: { index: number; label: string }[] = [];
  const firstDayOfYear = new Date(year, 0, 1);
  const startDayOfWeek = firstDayOfYear.getDay();
  const startOffset = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

  for (let m = 0; m < 12; m++) {
    const firstOfMonth = new Date(year, m, 1);
    const dayOfYear = Math.floor((firstOfMonth.getTime() - firstDayOfYear.getTime()) / 86400000);
    const weekIndex = Math.floor((dayOfYear + startOffset) / 7);
    labels.push({ index: weekIndex, label: MONTH_LABELS[m] });
  }
  return labels;
}

export function computeStreak(sessions: WorkoutSession[], planId?: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const activeDays = new Set<string>();
  for (const s of sessions) {
    if (planId && s.planId !== planId) continue;
    const d = new Date(s.date);
    d.setHours(0, 0, 0, 0);
    activeDays.add(d.toISOString().slice(0, 10));
  }

  let streak = 0;
  const cursor = new Date(today);
  while (true) {
    const key = cursor.toISOString().slice(0, 10);
    if (activeDays.has(key)) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

export function computeOverallStreak(sessions: WorkoutSession[]): number {
  return computeStreak(sessions);
}

export function computePlanStreak(sessions: WorkoutSession[], planId: string): number {
  return computeStreak(sessions, planId);
}

export function countUniqueDays(sessions: WorkoutSession[], planId?: string): number {
  const days = new Set<string>();
  for (const s of sessions) {
    if (planId && s.planId !== planId) continue;
    const d = new Date(s.date);
    d.setHours(0, 0, 0, 0);
    days.add(d.toISOString().slice(0, 10));
  }
  return days.size;
}

export function buildContributionGrid(sessions: WorkoutSession[], days = 365, planId?: string): ContributionDay[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const sessionCountByDay = new Map<string, number>();
  for (const s of sessions) {
    if (planId && s.planId !== planId) continue;
    const d = new Date(s.date);
    d.setHours(0, 0, 0, 0);
    const key = d.toISOString().slice(0, 10);
    sessionCountByDay.set(key, (sessionCountByDay.get(key) || 0) + 1);
  }

  const contributions: ContributionDay[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const key = date.toISOString().slice(0, 10);
    const count = sessionCountByDay.get(key) || 0;
    contributions.push({
      date: new Date(date),
      count,
      intensity: countToIntensity(count),
    });
  }
  return contributions;
}

export function mapCountToIntensity(count: number): 0 | 1 | 2 | 3 | 4 {
  return countToIntensity(count);
}

function countToIntensity(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count === 0) return 0;
  if (count === 1) return 1;
  if (count <= 2) return 2;
  if (count <= 3) return 3;
  return 4;
}

export function buildWeekData(sessions: WorkoutSession[], weekStart: Date, planId: string): WeekDayEntry[] {
  const weekDays: WeekDayEntry[] = [];
  const sessionsForPlan = sessions.filter(s => s.planId === planId);

  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + i);
    date.setHours(0, 0, 0, 0);

    const daySessions = sessionsForPlan.filter(s => {
      const d = new Date(s.date);
      d.setHours(0, 0, 0, 0);
      return d.getTime() === date.getTime();
    });

    const isActive = daySessions.length > 0;
    const totalCount = daySessions.reduce((sum, s) => sum + s.exercises.length, 0);

    weekDays.push({
      date: new Date(date),
      dayLabel: getDayLabel(date),
      value: isActive ? (totalCount > 0 ? totalCount : '✓') : '',
      isActive,
    });
  }

  return weekDays;
}

export function buildWeekDataForAllPlans(sessions: WorkoutSession[], weekStart: Date, planIds: string[]): Map<string, WeekDayEntry[]> {
  const result = new Map<string, WeekDayEntry[]>();
  for (const planId of planIds) {
    result.set(planId, buildWeekData(sessions, weekStart, planId));
  }
  return result;
}

export function getWeekStart(date: Date = new Date()): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  return d;
}

export function formatPeriodLabel(start: Date, viewMode: 'weekly' | 'yearly'): string {
  if (viewMode === 'yearly') {
    return `${start.getFullYear()}`;
  }
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const months = MONTH_LABELS;
  if (start.getMonth() === end.getMonth()) {
    return `${months[start.getMonth()]} ${start.getDate()} - ${end.getDate()}`;
  }
  return `${months[start.getMonth()]} ${start.getDate()} - ${months[end.getMonth()]} ${end.getDate()}`;
}

export { ACTIVITY_COLORS, PLAN_COLORS, MONTH_LABELS };
