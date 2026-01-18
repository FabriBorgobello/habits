import { createFileRoute } from "@tanstack/react-router";
import { ArrowUpDown, Check, Plus } from "lucide-react";
import { useState } from "react";
import { HabitGrid } from "@/components/habits/HabitGrid";
import { HabitModal } from "@/components/habits/HabitModal";
import { WeekHeader } from "@/components/habits/WeekHeader";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { Habit } from "@/db/schema";
import { useArchiveHabit, useHabits } from "@/hooks/use-habits";
import { getCurrentWeekView, toDateString } from "@/lib/date-utils";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [hideNonDueToday, setHideNonDueToday] = useState(false);
  const [reorderMode, setReorderMode] = useState(false);

  // Get current week view
  const weekView = getCurrentWeekView();
  const startDateStr = toDateString(weekView.startDate);
  const endDateStr = toDateString(weekView.endDate);

  // Fetch habits and completions
  const { data, isLoading } = useHabits(startDateStr, endDateStr);
  const archiveHabit = useArchiveHabit();

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
          {/* Header with + button */}
          <div className="flex items-start justify-between">
            <WeekHeader startDate={weekView.startDate} endDate={weekView.endDate} />
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
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Switch id="hide-filter" checked={hideNonDueToday} onCheckedChange={setHideNonDueToday} />
              <Label htmlFor="hide-filter" className="text-gray-400 text-xs sm:text-sm cursor-pointer">
                Hide habits not due today
              </Label>
            </div>

            {/* Reorder mode toggle */}
            <button
              type="button"
              onClick={() => setReorderMode(!reorderMode)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
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
        </div>

        {/* Scrollable habit list */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 sm:px-6 pb-4 sm:pb-8">
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-gray-400">Loading...</p>
            </div>
          ) : (
            <HabitGrid
              habits={data?.habits || []}
              completions={data?.completions || {}}
              weekDays={weekView.days}
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
