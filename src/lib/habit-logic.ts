import type { Habit } from "@/db/schema";
import { toDateString } from "@/lib/date-utils";

/**
 * Returns weekly progress for weekly_count habits, or null for other types.
 */
export function getWeeklyProgress(
  habit: Habit,
  completions: string[],
  weekDays: Date[],
): { completed: number; target: number; isMet: boolean } | null {
  if (habit.frequency !== "custom" || !habit.frequencyConfig) return null;

  const config = habit.frequencyConfig as
    | { type: "weekly_count"; count: number }
    | { type: "specific_days"; days: number[] };

  if (config.type !== "weekly_count") return null;

  const weekDateStrings = new Set(weekDays.map(toDateString));
  const completed = completions.filter((d) => weekDateStrings.has(d)).length;

  return { completed, target: config.count, isMet: completed >= config.count };
}

/**
 * Checks if a habit is due on a specific date based on its frequency configuration
 */
export function isHabitDueOnDate(habit: Habit, date: Date): boolean {
  // Daily habits are always due
  if (habit.frequency === "daily") {
    return true;
  }

  // Custom frequency habits
  if (habit.frequency === "custom" && habit.frequencyConfig) {
    const config = habit.frequencyConfig as
      | { type: "weekly_count"; count: number }
      | { type: "specific_days"; days: number[] };

    // Weekly count habits (e.g., "3 times per week") - can complete any day
    if (config.type === "weekly_count") {
      return true;
    }

    // Specific days habits (e.g., "Monday, Wednesday, Friday")
    if (config.type === "specific_days") {
      const dayOfWeek = date.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
      return config.days.includes(dayOfWeek);
    }
  }

  // Default to false if frequency config is invalid
  return false;
}
