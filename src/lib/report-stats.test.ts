import { eachDayOfInterval } from "date-fns";
import { describe, expect, it } from "vitest";
import type { Habit } from "@/db/schema";
import { toDateString } from "@/lib/date-utils";
import { computeCompletionStats, formatRate, getFrequencyLabel } from "@/lib/report-stats";

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

const JUNE_START = new Date("2025-06-01T00:00:00");
const JUNE_END = new Date("2025-06-30T00:00:00");
// Whole of June has elapsed relative to this "today".
const TODAY = new Date("2025-07-11T12:00:00");

describe("computeCompletionStats", () => {
  it("daily habit fully completed → 100%", () => {
    const habit = makeHabit();
    const completions = datesInRange("2025-06-01", "2025-06-30"); // 30 days
    const stats = computeCompletionStats(habit, completions, JUNE_START, JUNE_END, TODAY);
    expect(stats).toEqual({ expected: 30, completed: 30, rate: 1 });
  });

  it("daily habit half completed → 50%", () => {
    const habit = makeHabit();
    const completions = datesInRange("2025-06-01", "2025-06-15"); // 15 of 30
    const stats = computeCompletionStats(habit, completions, JUNE_START, JUNE_END, TODAY);
    expect(stats.expected).toBe(30);
    expect(stats.completed).toBe(15);
    expect(stats.rate).toBe(0.5);
  });

  it("excludes days before the habit was created", () => {
    const habit = makeHabit({ createdAt: new Date("2025-06-16T09:00:00") });
    const completions = datesInRange("2025-06-01", "2025-06-30");
    const stats = computeCompletionStats(habit, completions, JUNE_START, JUNE_END, TODAY);
    // Only Jun 16–30 counts: 15 days.
    expect(stats.expected).toBe(15);
    expect(stats.completed).toBe(15);
    expect(stats.rate).toBe(1);
  });

  it("clamps the expected range to today for the current period", () => {
    const habit = makeHabit();
    const julyStart = new Date("2025-07-01T00:00:00");
    const julyEnd = new Date("2025-07-31T00:00:00");
    const stats = computeCompletionStats(habit, [], julyStart, julyEnd, TODAY);
    // Jul 1–11 elapsed = 11 days.
    expect(stats.expected).toBe(11);
    expect(stats.rate).toBe(0);
  });

  it("returns rate null for a fully-future period", () => {
    const habit = makeHabit();
    const augStart = new Date("2025-08-01T00:00:00");
    const augEnd = new Date("2025-08-31T00:00:00");
    const stats = computeCompletionStats(habit, [], augStart, augEnd, TODAY);
    expect(stats).toEqual({ expected: 0, completed: 0, rate: null });
  });

  it("specific_days counts only matching weekdays", () => {
    const habit = makeHabit({
      frequency: "custom",
      frequencyConfig: { type: "specific_days", days: [1, 3, 5] }, // Mon, Wed, Fri
    });
    const stats = computeCompletionStats(habit, [], JUNE_START, JUNE_END, TODAY);
    // June 2025: 5 Mondays + 4 Wednesdays + 4 Fridays = 13.
    expect(stats.expected).toBe(13);
  });

  it("weekly_count expects target × weeks touched", () => {
    const habit = makeHabit({
      frequency: "custom",
      frequencyConfig: { type: "weekly_count", count: 3 },
    });
    const stats = computeCompletionStats(habit, [], JUNE_START, JUNE_END, TODAY);
    // June spans 6 Monday-started weeks → 3 × 6 = 18.
    expect(stats.expected).toBe(18);
  });

  it("caps rate at 100% when over-completed", () => {
    const habit = makeHabit({
      frequency: "custom",
      frequencyConfig: { type: "weekly_count", count: 3 },
    });
    const completions = datesInRange("2025-06-01", "2025-06-25"); // 25 completions
    const stats = computeCompletionStats(habit, completions, JUNE_START, JUNE_END, TODAY);
    expect(stats.rate).toBe(1);
  });
});

describe("getFrequencyLabel", () => {
  it("labels daily habits", () => {
    expect(getFrequencyLabel(makeHabit())).toBe("Every day");
  });

  it("labels weekly_count habits", () => {
    expect(
      getFrequencyLabel(makeHabit({ frequency: "custom", frequencyConfig: { type: "weekly_count", count: 3 } })),
    ).toBe("3× per week");
  });

  it("labels specific_days habits in weekday order", () => {
    expect(
      getFrequencyLabel(
        makeHabit({ frequency: "custom", frequencyConfig: { type: "specific_days", days: [5, 1, 3] } }),
      ),
    ).toBe("Mon, Wed, Fri");
  });
});

describe("formatRate", () => {
  it("formats a rate as a percentage", () => {
    expect(formatRate(0.856)).toBe("86%");
  });

  it("shows an em dash for null", () => {
    expect(formatRate(null)).toBe("—");
  });
});
