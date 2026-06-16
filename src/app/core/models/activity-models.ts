export interface ContributionDay {
  date: Date;
  count: number;
  intensity: 0 | 1 | 2 | 3 | 4;
}

export interface WeekDayEntry {
  date: Date;
  dayLabel: string;
  value: string | number;
  isActive: boolean;
}

export interface PlanWeekData {
  planId: string;
  days: WeekDayEntry[];
  streak: number;
  totalActiveDays: number;
}

export interface PlanYearData {
  planId: string;
  contributions: ContributionDay[];
  streak: number;
  totalActiveDays: number;
}
