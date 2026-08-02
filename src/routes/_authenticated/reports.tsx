import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo } from "react";
import { useWebHaptics } from "web-haptics/react";
import { HeatmapRow } from "@/components/habits/HeatmapRow";
import type { Category } from "@/db/schema";
import { useCategories } from "@/hooks/use-categories";
import { useHabitStats, useHabits } from "@/hooks/use-habits";
import { getPeriodRange, type ReportView, shiftAnchor, toDateString } from "@/lib/date-utils";
import { cn } from "@/lib/utils";

const VIEWS: { value: ReportView; label: string }[] = [
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "year", label: "Year" },
];

function parseAnchor(date: string | undefined): Date {
  if (date) {
    const parsed = new Date(`${date}T00:00:00`);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return new Date();
}

export const Route = createFileRoute("/_authenticated/reports")({
  component: ReportsPage,
  head: () => ({
    meta: [{ title: "Reports | Habits" }, { name: "robots", content: "noindex" }],
  }),
  validateSearch: (search: Record<string, unknown>) => {
    const rawView = search.view;
    const view: ReportView = rawView === "week" || rawView === "year" ? rawView : "month";
    return {
      view,
      date: typeof search.date === "string" ? search.date : undefined,
    };
  },
});

function ReportsPage() {
  const { view, date } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const { trigger } = useWebHaptics();

  const anchor = useMemo(() => parseAnchor(date), [date]);
  const period = useMemo(() => getPeriodRange(view, anchor), [view, anchor]);

  const isCurrentPeriod = toDateString(getPeriodRange(view, new Date()).start) === toDateString(period.start);

  const { data, isLoading, isPlaceholderData } = useHabits(toDateString(period.start), toDateString(period.end));
  const { data: categoriesData } = useCategories();
  const { data: statsData } = useHabitStats();

  const categoryMap = useMemo(() => {
    const map = new Map<string, Category>();
    for (const cat of categoriesData || []) map.set(cat.name, cat);
    return map;
  }, [categoriesData]);

  const setView = (nextView: ReportView) => {
    trigger(15);
    navigate({ search: { view: nextView, date } });
  };

  const navigatePeriod = (direction: "prev" | "next") => {
    trigger(20);
    const nextAnchor = shiftAnchor(view, anchor, direction);
    navigate({ search: { view, date: toDateString(nextAnchor) } });
  };

  const navigateToday = () => {
    trigger(20);
    navigate({ search: { view, date: undefined } });
  };

  const habits = data?.habits || [];

  return (
    <div className="h-full flex flex-col bg-black text-white">
      <div className="max-w-4xl mx-auto w-full flex flex-col flex-1 min-h-0">
        {/* Fixed header */}
        <div className="shrink-0 px-3 sm:px-6 pt-4 sm:pt-8 pb-4 space-y-4">
          <h1 className="text-2xl sm:text-4xl font-bold text-white">Reports</h1>

          {/* View segmented control */}
          <div className="flex gap-1 p-1 bg-zinc-900 rounded-xl w-fit">
            {VIEWS.map((v) => (
              <button
                key={v.value}
                type="button"
                onClick={() => setView(v.value)}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-sm font-medium transition-colors",
                  view === v.value ? "bg-white text-black" : "text-gray-400 hover:text-white",
                )}
              >
                {v.label}
              </button>
            ))}
          </div>

          {/* Period navigation */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => navigatePeriod("prev")}
                className="p-1.5 rounded-lg hover:bg-zinc-800 transition-colors text-gray-400 hover:text-white"
                aria-label="Previous period"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => navigatePeriod("next")}
                className="p-1.5 rounded-lg hover:bg-zinc-800 transition-colors text-gray-400 hover:text-white"
                aria-label="Next period"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            <span className="text-sm sm:text-base font-medium text-gray-200">{period.label}</span>
            {!isCurrentPeriod && (
              <button
                type="button"
                onClick={navigateToday}
                className="px-2.5 py-1 rounded-lg text-xs font-medium bg-zinc-800 text-gray-300 hover:bg-zinc-700 hover:text-white transition-colors"
              >
                Today
              </button>
            )}
          </div>
        </div>

        {/* Scrollable habit list */}
        <div
          className={cn(
            "flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 sm:px-6 pb-4 sm:pb-8 space-y-3 transition-opacity",
            isPlaceholderData && "opacity-60",
          )}
        >
          {isLoading && !data ? (
            <div className="text-center py-12">
              <p className="text-gray-400">Loading...</p>
            </div>
          ) : habits.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 text-lg">No habits yet. Create your first habit!</p>
            </div>
          ) : (
            habits.map((habit) => (
              <HeatmapRow
                key={habit.id}
                habit={habit}
                completions={data?.completions[habit.id] || []}
                days={period.days}
                periodStart={period.start}
                periodEnd={period.end}
                view={view}
                category={categoryMap.get(habit.category)}
                stats={statsData?.[habit.id]}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
