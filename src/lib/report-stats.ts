import { eachDayOfInterval, eachWeekOfInterval, isAfter, max, min, startOfDay } from "date-fns";
import type { Habit } from "@/db/schema";
import { toDateString } from "@/lib/date-utils";
import { isHabitDueOnDate } from "@/lib/habit-logic";

export interface CompletionStats {
  /** Number of applicable completions expected in the elapsed range. */
  expected: number;
  /** Number of completions recorded in the elapsed range. */
  completed: number;
  /** completed / expected, capped at 1. `null` when nothing is expected yet. */
  rate: number | null;
}

/** Target count for a "N times per week" habit, or null for other types. */
function getWeeklyCountTarget(habit: Habit): number | null {
  if (habit.frequency !== "custom" || !habit.frequencyConfig) return null;
  return habit.frequencyConfig.type === "weekly_count" ? habit.frequencyConfig.count : null;
}

/**
 * Completion statistics for a habit within [periodStart, periodEnd].
 *
 * "Expected" counts only elapsed, applicable days: the range is clamped to
 * [max(periodStart, habit creation day), min(periodEnd, today)]. Days before the
 * habit existed and days still in the future are never counted against it.
 *
 * Returns `rate: null` when nothing is expected (a fully-future period, or a
 * habit created after the period) so the UI can show "—" rather than 0%.
 */
export function computeCompletionStats(
  habit: Habit,
  completions: string[],
  periodStart: Date,
  periodEnd: Date,
  today: Date = new Date(),
): CompletionStats {
  const createdDay = startOfDay(new Date(habit.createdAt));
  const effectiveStart = max([startOfDay(periodStart), createdDay]);
  const effectiveEnd = min([startOfDay(periodEnd), startOfDay(today)]);

  // Nothing has elapsed for this habit within the period.
  if (isAfter(effectiveStart, effectiveEnd)) {
    return { expected: 0, completed: 0, rate: null };
  }

  const elapsedDays = eachDayOfInterval({ start: effectiveStart, end: effectiveEnd });
  const rangeSet = new Set(elapsedDays.map(toDateString));
  const completed = completions.filter((d) => rangeSet.has(d)).length;

  const weeklyTarget = getWeeklyCountTarget(habit);
  let expected: number;
  if (weeklyTarget !== null) {
    // "N times per week" — full target for every week the elapsed range touches.
    const weeks = eachWeekOfInterval({ start: effectiveStart, end: effectiveEnd }, { weekStartsOn: 1 }).length;
    expected = weeklyTarget * weeks;
  } else {
    // daily / specific_days — count due days in the elapsed range.
    expected = elapsedDays.filter((day) => isHabitDueOnDate(habit, day)).length;
  }

  if (expected === 0) {
    return { expected: 0, completed, rate: null };
  }

  return { expected, completed, rate: Math.min(1, completed / expected) };
}

const DAY_ABBREVIATIONS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Human-readable frequency label, e.g. "Every day", "3× per week", "Mon, Wed, Fri". */
export function getFrequencyLabel(habit: Habit): string {
  if (habit.frequency === "daily") return "Every day";

  const config = habit.frequencyConfig;
  if (!config) return "Custom";

  if (config.type === "weekly_count") {
    return `${config.count}× per week`;
  }

  return [...config.days]
    .sort((a, b) => a - b)
    .map((d) => DAY_ABBREVIATIONS[d])
    .join(", ");
}

/** Format a rate (0–1) as a whole-number percentage, or "—" when not applicable. */
export function formatRate(rate: number | null): string {
  if (rate === null) return "—";
  return `${Math.round(rate * 100)}%`;
}
