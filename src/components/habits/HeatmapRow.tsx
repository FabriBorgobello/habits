import { format, isAfter, isBefore, startOfDay } from "date-fns";
import { Flame, Trophy } from "lucide-react";
import { useMemo } from "react";
import { CategoryBadge } from "@/components/habits/CategoryBadge";
import { ReportSquare } from "@/components/habits/ReportSquare";
import type { Category, Habit } from "@/db/schema";
import { isToday, type ReportView, toDateString } from "@/lib/date-utils";
import { DEFAULT_COLOR, DEFAULT_ICON } from "@/lib/habit-constants";
import { isHabitDueOnDate } from "@/lib/habit-logic";
import type { SquareState } from "@/lib/habit-square";
import { formatStreak, type HabitStats } from "@/lib/habit-stats";
import { computeCompletionStats, formatRate, getFrequencyLabel } from "@/lib/report-stats";
import { cn } from "@/lib/utils";

const SIZES: Record<ReportView, { square: string; gap: string }> = {
  week: { square: "w-9 h-9 sm:w-11 sm:h-11", gap: "gap-1.5" },
  month: { square: "w-5 h-5 sm:w-6 sm:h-6", gap: "gap-1" },
  year: { square: "w-2.5 h-2.5 sm:w-3 sm:h-3", gap: "gap-[3px]" },
};

interface HeatmapRowProps {
  habit: Habit;
  completions: string[];
  days: Date[];
  periodStart: Date;
  periodEnd: Date;
  view: ReportView;
  category?: Category;
  /** All-time streaks + rolling 30-day rate. Undefined while loading. */
  stats?: HabitStats;
}

export function HeatmapRow({
  habit,
  completions,
  days,
  periodStart,
  periodEnd,
  view,
  category,
  stats,
}: HeatmapRowProps) {
  const color = habit.colorHex || DEFAULT_COLOR;
  const icon = habit.icon || DEFAULT_ICON;
  const size = SIZES[view];

  const periodStats = useMemo(
    () => computeCompletionStats(habit, completions, periodStart, periodEnd),
    [habit, completions, periodStart, periodEnd],
  );

  const squares = useMemo(() => {
    const completedSet = new Set(completions);
    const createdDay = startOfDay(new Date(habit.createdAt));
    const today = startOfDay(new Date());

    return days.map((day) => {
      const dateStr = toDateString(day);
      const isCompleted = completedSet.has(dateStr);
      const inRange = !isBefore(day, createdDay) && !isAfter(startOfDay(day), today);
      const isDue = inRange && isHabitDueOnDate(habit, day);
      const state: SquareState = isCompleted ? "completed" : isDue ? "incomplete" : "notDue";

      return {
        key: dateStr,
        state,
        isToday: isToday(day),
        title: `${format(day, "MMM d, yyyy")}${isCompleted ? " ✓" : ""}`,
      };
    });
  }, [days, completions, habit]);

  return (
    <div
      className="bg-zinc-950 rounded-2xl p-3 sm:p-4 space-y-3"
      style={{ "--habit-color": color } as React.CSSProperties}
    >
      {/* Header: icon, name, frequency, completion rate */}
      <div className="flex items-center gap-2 sm:gap-3">
        <span className="text-lg sm:text-2xl shrink-0">{icon}</span>
        <div className="min-w-0 flex-1">
          <span className="text-white font-medium text-sm sm:text-base truncate line-clamp-1 block">{habit.name}</span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {habit.category && <CategoryBadge name={habit.category} colorHex={category?.colorHex} />}
            <span className="text-[10px] sm:text-xs text-gray-500">{getFrequencyLabel(habit)}</span>
          </div>
        </div>
        <span
          className={cn(
            "text-sm sm:text-base font-semibold tabular-nums shrink-0",
            periodStats.rate === null ? "text-gray-600" : "text-white",
          )}
          title="Completion rate this period"
        >
          {formatRate(periodStats.rate)}
        </span>
      </div>

      {/* Streaks + rolling 30-day rate across all history */}
      {stats && (
        <div className="flex items-center gap-3 text-[10px] sm:text-xs text-gray-400">
          <span
            className={cn("inline-flex items-center gap-1", stats.current > 0 && "text-orange-400 font-medium")}
            title="Current streak"
          >
            <Flame className={cn("w-3.5 h-3.5", stats.current > 0 && "fill-orange-500/30")} />
            {stats.current > 0 ? formatStreak(stats.current, stats.unit) : "No streak"}
          </span>
          <span className="inline-flex items-center gap-1" title="Longest streak">
            <Trophy className="w-3.5 h-3.5" />
            Best {formatStreak(stats.longest, stats.unit)}
          </span>
          <span className="tabular-nums ml-auto" title="Completion rate over the last 30 days">
            {formatRate(stats.rate30)} <span className="text-gray-600">30d</span>
          </span>
        </div>
      )}

      {/* Heatmap: one square per day, wrapping to fill the width */}
      <div className={cn("flex flex-wrap", size.gap)}>
        {squares.map((sq) => (
          <ReportSquare key={sq.key} state={sq.state} isToday={sq.isToday} sizeClass={size.square} title={sq.title} />
        ))}
      </div>
    </div>
  );
}
