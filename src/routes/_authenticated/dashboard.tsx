import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { addWeeks, startOfWeek, subWeeks } from "date-fns";
import { ArrowUpDown, Check, ChevronLeft, ChevronRight, Filter, Plus } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { useWebHaptics } from "web-haptics/react";
import { HabitGrid } from "@/components/habits/HabitGrid";
import { HabitModal } from "@/components/habits/HabitModal";
import { WeekHeader } from "@/components/habits/WeekHeader";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { Habit } from "@/db/schema";
import { useCategories } from "@/hooks/use-categories";
import { useArchiveHabit, useHabitStats, useHabits } from "@/hooks/use-habits";
import { getCurrentWeekView, toDateString } from "@/lib/date-utils";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
  head: () => ({
    meta: [{ title: "Dashboard | Habits" }, { name: "robots", content: "noindex" }],
  }),
  validateSearch: (search: Record<string, unknown>) => ({
    week: (search.week as string) || undefined,
  }),
});

function DashboardPage() {
  const { week } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  const [modalOpen, setModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [hideNonDueToday, setHideNonDueToday] = useState(false);
  const [reorderMode, setReorderMode] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const weekDirection = useRef<"prev" | "next">("next");
  const { trigger } = useWebHaptics();

  // Get week view from URL param or current week
  const weekView = useMemo(() => {
    if (week) {
      const date = new Date(`${week}T00:00:00`);
      if (!Number.isNaN(date.getTime())) {
        return getCurrentWeekView(date);
      }
    }
    return getCurrentWeekView();
  }, [week]);

  const currentWeekView = getCurrentWeekView();
  const isCurrentWeek = toDateString(weekView.startDate) === toDateString(currentWeekView.startDate);

  const startDateStr = toDateString(weekView.startDate);
  const endDateStr = toDateString(weekView.endDate);

  // Fetch data
  const { data, isLoading, isPlaceholderData } = useHabits(startDateStr, endDateStr);
  const { data: categoriesData } = useCategories();
  const { data: statsData } = useHabitStats();
  const archiveHabit = useArchiveHabit();

  // Filter habits by category
  const filteredHabits = useMemo(() => {
    const habits = data?.habits || [];
    if (categoryFilter === "all") return habits;
    return habits.filter((h) => h.category === categoryFilter);
  }, [data?.habits, categoryFilter]);

  // Category counts for filter
  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const habit of data?.habits || []) {
      if (habit.category) {
        counts.set(habit.category, (counts.get(habit.category) || 0) + 1);
      }
    }
    return counts;
  }, [data?.habits]);

  const navigateWeek = (direction: "prev" | "next") => {
    weekDirection.current = direction;
    const newStart = direction === "prev" ? subWeeks(weekView.startDate, 1) : addWeeks(weekView.startDate, 1);
    const mondayStart = startOfWeek(newStart, { weekStartsOn: 1 });
    navigate({ search: { week: toDateString(mondayStart) } });
  };

  const navigateToday = () => {
    weekDirection.current = "next";
    navigate({ search: { week: undefined } });
  };

  const handleOpenModal = (habit?: Habit) => {
    setEditingHabit(habit || null);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingHabit(null);
  };

  const handleArchiveHabit = async (habit: Habit) => {
    try {
      await archiveHabit.mutateAsync({ id: habit.id });
    } catch (error) {
      console.error("Failed to archive habit:", error);
    }
  };

  return (
    <div className="h-full flex flex-col bg-black text-white">
      <div className="max-w-4xl mx-auto w-full flex flex-col flex-1 min-h-0">
        {/* Fixed header section */}
        <div className="shrink-0 px-3 sm:px-6 pt-4 sm:pt-8 pb-4 space-y-4 sm:space-y-6">
          {/* Header with week nav + add button */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    trigger(20);
                    navigateWeek("prev");
                  }}
                  className="p-1.5 rounded-lg hover:bg-zinc-800 transition-colors text-gray-400 hover:text-white"
                  aria-label="Previous week"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    trigger(20);
                    navigateWeek("next");
                  }}
                  className="p-1.5 rounded-lg hover:bg-zinc-800 transition-colors text-gray-400 hover:text-white"
                  aria-label="Next week"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
              <WeekHeader startDate={weekView.startDate} endDate={weekView.endDate} direction={weekDirection.current} />
              {!isCurrentWeek && (
                <button
                  type="button"
                  onClick={navigateToday}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium bg-zinc-800 text-gray-300 hover:bg-zinc-700 hover:text-white transition-colors"
                >
                  Today
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => handleOpenModal()}
              className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center transition-colors"
              aria-label="Create new habit"
            >
              <Plus className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </button>
          </div>

          {/* Controls row */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <Switch id="hide-filter" checked={hideNonDueToday} onCheckedChange={setHideNonDueToday} />
                <Label htmlFor="hide-filter" className="text-gray-400 text-xs sm:text-sm cursor-pointer">
                  Hide not due
                </Label>
              </div>

              {/* Reorder mode toggle */}
              <button
                type="button"
                onClick={() => {
                  trigger([
                    { duration: 80, intensity: 0.8 },
                    { delay: 80, duration: 50, intensity: 0.3 },
                  ]);
                  setReorderMode(!reorderMode);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors shrink-0 ${
                  reorderMode ? "bg-white text-black" : "bg-zinc-800 text-gray-400 hover:text-white hover:bg-zinc-700"
                }`}
              >
                {reorderMode ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    Done
                  </>
                ) : (
                  <>
                    <ArrowUpDown className="w-3.5 h-3.5" />
                    Reorder
                  </>
                )}
              </button>
            </div>

            {/* Category filter */}
            {categoryCounts.size > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-gray-500" />
                <button
                  type="button"
                  onClick={() => {
                    trigger(15);
                    setCategoryFilter("all");
                  }}
                  className={`px-2 py-1 rounded-md text-xs transition-colors ${
                    categoryFilter === "all" ? "bg-zinc-700 text-white" : "text-gray-500 hover:text-gray-300"
                  }`}
                >
                  All
                </button>
                {Array.from(categoryCounts.entries()).map(([name, count]) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => {
                      trigger(15);
                      setCategoryFilter(categoryFilter === name ? "all" : name);
                    }}
                    className={`px-2 py-1 rounded-md text-xs transition-colors ${
                      categoryFilter === name ? "bg-zinc-700 text-white" : "text-gray-500 hover:text-gray-300"
                    }`}
                  >
                    {name} ({count})
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Scrollable habit list */}
        <div
          className={`flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 sm:px-6 pb-4 sm:pb-8 transition-opacity ${isPlaceholderData ? "opacity-60" : ""}`}
        >
          {isLoading && !data ? (
            <div className="text-center py-12">
              <p className="text-gray-400">Loading...</p>
            </div>
          ) : (
            <HabitGrid
              habits={filteredHabits}
              completions={data?.completions || {}}
              stats={statsData || {}}
              weekDays={weekView.days}
              categories={categoriesData || []}
              hideNonDueToday={hideNonDueToday}
              reorderMode={reorderMode}
              onEditHabit={handleOpenModal}
              onArchiveHabit={handleArchiveHabit}
            />
          )}
        </div>
      </div>

      {/* Modal */}
      <HabitModal open={modalOpen} onClose={handleCloseModal} editingHabit={editingHabit} />
    </div>
  );
}
