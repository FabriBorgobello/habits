import type { Habit } from "@/db/schema";

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
