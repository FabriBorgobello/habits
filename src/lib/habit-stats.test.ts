import { eachDayOfInterval } from "date-fns";
import { describe, expect, it } from "vitest";
import type { Habit } from "@/db/schema";
import { toDateString } from "@/lib/date-utils";
import { computeHabitStats, computeHabitStreaks } from "@/lib/habit-stats";

function makeHabit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: "h1",
    userId: "u1",
    name: "Test",
    description: null,
    category: "",
    colorHex: null,
    icon: null,
    frequency: "daily",
    frequencyConfig: null,
    sortOrder: 0,
    isArchived: false,
    createdAt: new Date("2025-01-01T00:00:00"),
    updatedAt: new Date("2025-01-01T00:00:00"),
    ...overrides,
  };
}

function datesInRange(start: string, end: string): string[] {
  return eachDayOfInterval({ start: new Date(`${start}T00:00:00`), end: new Date(`${end}T00:00:00`) }).map(
    toDateString,
  );
}

// A Friday. The prior week (Mon Jun 9 – Sun Jun 15) is fully in the past.
const TODAY = new Date("2025-06-20T12:00:00");

describe("computeHabitStreaks — daily", () => {
  it("counts consecutive completed days ending today", () => {
    const habit = makeHabit();
    const completions = datesInRange("2025-06-16", "2025-06-20"); // 5 days incl. today
    const { current, longest, unit } = computeHabitStreaks(habit, completions, TODAY);
    expect(unit).toBe("day");
    expect(current).toBe(5);
    expect(longest).toBe(5);
  });

  it("keeps the streak alive when today is not yet done (grace)", () => {
    const habit = makeHabit();
    const completions = datesInRange("2025-06-16", "2025-06-19"); // through yesterday only
    const { current } = computeHabitStreaks(habit, completions, TODAY);
    expect(current).toBe(4);
  });

  it("breaks the current streak on a missed past day", () => {
    const habit = makeHabit();
    // Missing Jun 18: run ending today is Jun 19–20 = 2.
    const completions = ["2025-06-16", "2025-06-17", "2025-06-19", "2025-06-20"];
    const { current, longest } = computeHabitStreaks(habit, completions, TODAY);
    expect(current).toBe(2);
    expect(longest).toBe(2);
  });

  it("reports the longest historical run even after a break", () => {
    const habit = makeHabit();
    // 4-day run (Jun 8–11), gap, then 2-day run ending today.
    const completions = [...datesInRange("2025-06-08", "2025-06-11"), "2025-06-19", "2025-06-20"];
    const { current, longest } = computeHabitStreaks(habit, completions, TODAY);
    expect(current).toBe(2);
    expect(longest).toBe(4);
  });

  it("is zero when nothing is completed", () => {
    const { current, longest } = computeHabitStreaks(makeHabit(), [], TODAY);
    expect(current).toBe(0);
    expect(longest).toBe(0);
  });
});

describe("computeHabitStreaks — specific_days", () => {
  const habit = makeHabit({
    frequency: "custom",
    frequencyConfig: { type: "specific_days", days: [1, 3, 5] }, // Mon, Wed, Fri
  });

  it("counts only due days and ignores non-due days between them", () => {
    // Due days up to Fri Jun 20: Jun 13(F), 16(M), 18(W), 20(F).
    const completions = ["2025-06-13", "2025-06-16", "2025-06-18", "2025-06-20"];
    const { current, unit } = computeHabitStreaks(habit, completions, TODAY);
    expect(unit).toBe("day");
    expect(current).toBe(4);
  });

  it("breaks on a missed due day", () => {
    // Missing Wed Jun 18: run is Jun 20 only (today).
    const completions = ["2025-06-13", "2025-06-16", "2025-06-20"];
    const { current } = computeHabitStreaks(habit, completions, TODAY);
    expect(current).toBe(1);
  });
});

describe("computeHabitStreaks — weekly_count", () => {
  const habit = makeHabit({
    createdAt: new Date("2025-05-01T00:00:00"),
    frequency: "custom",
    frequencyConfig: { type: "weekly_count", count: 3 },
  });

  it("streaks in weeks once the target is met", () => {
    // Week Jun 9–15: 3 completions (met). Week Jun 16–20 (current): 3 completions (met).
    const completions = ["2025-06-09", "2025-06-10", "2025-06-11", "2025-06-16", "2025-06-17", "2025-06-18"];
    const { current, unit } = computeHabitStreaks(habit, completions, TODAY);
    expect(unit).toBe("week");
    expect(current).toBe(2);
  });

  it("grants grace to the in-progress week below target", () => {
    // Prior week met (3), current week only 1 so far → grace keeps streak at 1.
    const completions = ["2025-06-09", "2025-06-10", "2025-06-11", "2025-06-16"];
    const { current } = computeHabitStreaks(habit, completions, TODAY);
    expect(current).toBe(1);
  });

  it("does not count a prior week that missed target", () => {
    // Prior week only 2 (miss), current week 3 (met) → current streak 1.
    const completions = ["2025-06-09", "2025-06-10", "2025-06-16", "2025-06-17", "2025-06-18"];
    const { current } = computeHabitStreaks(habit, completions, TODAY);
    expect(current).toBe(1);
  });
});

describe("computeHabitStats", () => {
  it("includes a rolling 30-day rate alongside streaks", () => {
    const habit = makeHabit({ createdAt: new Date("2025-01-01T00:00:00") });
    // 30-day window is May 22 – Jun 20 (30 days). Complete every day in it.
    const completions = datesInRange("2025-05-22", "2025-06-20");
    const stats = computeHabitStats(habit, completions, TODAY);
    expect(stats.rate30).toBe(1);
    expect(stats.current).toBe(30);
  });
});
