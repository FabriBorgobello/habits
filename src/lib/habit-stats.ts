import { addDays, eachWeekOfInterval, isAfter, isBefore, isSameDay, startOfDay, startOfWeek, subDays } from "date-fns";
import type { Habit } from "@/db/schema";
import { toDateString } from "@/lib/date-utils";
import { isHabitDueOnDate } from "@/lib/habit-logic";
import { computeCompletionStats } from "@/lib/report-stats";

export type StreakUnit = "day" | "week";

export interface HabitStreaks {
  /** Ongoing run ending at (or just before) today. */
  current: number;
  /** Best run ever recorded. Always >= current. */
  longest: number;
  /** "day" for daily/specific_days habits, "week" for weekly_count habits. */
  unit: StreakUnit;
}

export interface HabitStats extends HabitStreaks {
  /** Rolling completion rate over the last 30 days (0–1), or null when nothing expected yet. */
  rate30: number | null;
}

const WEEK_OPTS = { weekStartsOn: 1 } as const; // Monday, matching the rest of the app

/**
 * Current and longest streaks for a habit.
 *
 * Daily / specific_days habits streak in *days*, counting only due days: a
 * non-due day neither extends nor breaks the run. weekly_count habits streak in
 * *weeks*: a week counts once its target number of completions is reached.
 *
 * The in-progress unit (today, or the current week) never breaks a streak while
 * still incomplete — it simply doesn't count yet — so a not-yet-done today keeps
 * yesterday's streak alive rather than zeroing it.
 */
export function computeHabitStreaks(habit: Habit, completions: string[], today: Date = new Date()): HabitStreaks {
  const completedSet = new Set(completions);
  const createdDay = startOfDay(new Date(habit.createdAt));
  const todayStart = startOfDay(today);

  const config = habit.frequency === "custom" ? habit.frequencyConfig : null;
  if (config?.type === "weekly_count") {
    return computeWeekStreak(completedSet, createdDay, todayStart, config.count);
  }
  return computeDayStreak(habit, completedSet, createdDay, todayStart);
}

function computeDayStreak(habit: Habit, completedSet: Set<string>, createdDay: Date, today: Date): HabitStreaks {
  // Current: walk backward from today over due days until an unfinished one.
  let current = 0;
  for (let cursor = today; !isBefore(cursor, createdDay); cursor = subDays(cursor, 1)) {
    if (!isHabitDueOnDate(habit, cursor)) continue;
    if (completedSet.has(toDateString(cursor))) {
      current++;
    } else if (isSameDay(cursor, today)) {
      // today isn't done yet — grace, don't break the run
    } else {
      break;
    }
  }

  // Longest: scan forward over every due day, tracking the best run.
  let longest = 0;
  let run = 0;
  for (let cursor = createdDay; !isAfter(cursor, today); cursor = addDays(cursor, 1)) {
    if (!isHabitDueOnDate(habit, cursor)) continue;
    if (completedSet.has(toDateString(cursor))) {
      run++;
      if (run > longest) longest = run;
    } else if (!isSameDay(cursor, today)) {
      run = 0;
    }
  }

  return { current, longest: Math.max(longest, current), unit: "day" };
}

function computeWeekStreak(completedSet: Set<string>, createdDay: Date, today: Date, target: number): HabitStreaks {
  const weeks = eachWeekOfInterval(
    { start: startOfWeek(createdDay, WEEK_OPTS), end: startOfWeek(today, WEEK_OPTS) },
    WEEK_OPTS,
  );

  // Tally completions into their Monday-started week.
  const perWeek = new Map<string, number>();
  for (const dateStr of completedSet) {
    const d = new Date(`${dateStr}T00:00:00`);
    if (isBefore(d, createdDay) || isAfter(d, today)) continue;
    const key = toDateString(startOfWeek(d, WEEK_OPTS));
    perWeek.set(key, (perWeek.get(key) ?? 0) + 1);
  }

  const met = weeks.map((w) => (perWeek.get(toDateString(w)) ?? 0) >= target);

  let longest = 0;
  let run = 0;
  for (const isMet of met) {
    if (isMet) {
      run++;
      if (run > longest) longest = run;
    } else {
      run = 0;
    }
  }

  // Current: from the latest week backward; the in-progress week gets grace.
  let current = 0;
  for (let i = met.length - 1; i >= 0; i--) {
    if (met[i]) current++;
    else if (i === met.length - 1) {
      // current week hasn't hit its target yet — grace, don't break
    } else break;
  }

  return { current, longest: Math.max(longest, current), unit: "week" };
}

/** Short streak label, e.g. "5 days", "1 day", "3 wks", "1 wk". */
export function formatStreak(count: number, unit: StreakUnit): string {
  const noun = unit === "week" ? "wk" : "day";
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}

/**
 * Streaks plus the rolling 30-day completion rate for a habit.
 */
export function computeHabitStats(habit: Habit, completions: string[], today: Date = new Date()): HabitStats {
  const todayStart = startOfDay(today);
  const { rate } = computeCompletionStats(habit, completions, subDays(todayStart, 29), todayStart, todayStart);
  return { ...computeHabitStreaks(habit, completions, todayStart), rate30: rate };
}
