import {
  addMonths,
  addWeeks,
  addYears,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
  subMonths,
  subWeeks,
  subYears,
} from "date-fns";

export interface WeekView {
  startDate: Date;
  endDate: Date;
  days: Date[];
}

/**
 * Get the current week view starting from Monday
 */
export function getCurrentWeekView(date: Date = new Date()): WeekView {
  const startDate = startOfWeek(date, { weekStartsOn: 1 }); // 1 = Monday
  const endDate = endOfWeek(date, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  return { startDate, endDate, days };
}

/**
 * Format week range as "Jan 12 – Jan 18"
 */
export function formatWeekRange(startDate: Date, endDate: Date): string {
  const start = format(startDate, "MMM d");
  const end = format(endDate, "MMM d");
  return `${start} – ${end}`;
}

/**
 * Format month name as "January"
 */
export function formatMonthName(date: Date): string {
  return format(date, "MMMM");
}

/**
 * Convert Date to "YYYY-MM-DD" string for database storage
 */
export function toDateString(date: Date): string {
  return format(startOfDay(date), "yyyy-MM-dd");
}

/**
 * Get day of week abbreviation (M, T, W, T, F, S, S)
 */
export function getDayAbbreviation(date: Date): string {
  return format(date, "EEEEE"); // Single letter day
}

/**
 * Check if date is today
 */
export function isToday(date: Date): boolean {
  const today = startOfDay(new Date());
  const checkDate = startOfDay(date);
  return today.getTime() === checkDate.getTime();
}

// ============================================================================
// Report period views (week / month / year)
// ============================================================================

export type ReportView = "week" | "month" | "year";

export interface PeriodRange {
  start: Date;
  end: Date;
  days: Date[];
  /** Header label, e.g. "Jul 7 – Jul 13", "July 2025", "2025". */
  label: string;
}

/**
 * Resolve the inclusive date range, day list, and label for a report period
 * anchored on `anchor`. Weeks start on Monday, matching the dashboard.
 */
export function getPeriodRange(view: ReportView, anchor: Date = new Date()): PeriodRange {
  let start: Date;
  let end: Date;
  let label: string;

  if (view === "week") {
    start = startOfWeek(anchor, { weekStartsOn: 1 });
    end = endOfWeek(anchor, { weekStartsOn: 1 });
    label = formatWeekRange(start, end);
  } else if (view === "month") {
    start = startOfMonth(anchor);
    end = endOfMonth(anchor);
    label = format(anchor, "MMMM yyyy");
  } else {
    start = startOfYear(anchor);
    end = endOfYear(anchor);
    label = format(anchor, "yyyy");
  }

  return { start, end, days: eachDayOfInterval({ start, end }), label };
}

/** Shift an anchor date by one period in the given direction. */
export function shiftAnchor(view: ReportView, anchor: Date, direction: "prev" | "next"): Date {
  const step = direction === "next" ? 1 : -1;
  if (view === "week") return step > 0 ? addWeeks(anchor, 1) : subWeeks(anchor, 1);
  if (view === "month") return step > 0 ? addMonths(anchor, 1) : subMonths(anchor, 1);
  return step > 0 ? addYears(anchor, 1) : subYears(anchor, 1);
}
