import { eachDayOfInterval, endOfWeek, format, startOfDay, startOfWeek } from "date-fns";

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
