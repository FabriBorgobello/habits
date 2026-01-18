import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { HabitGrid } from "@/components/habits/HabitGrid";
import { HabitModal } from "@/components/habits/HabitModal";
import { WeekHeader } from "@/components/habits/WeekHeader";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { Habit } from "@/db/schema";
import { useHabits } from "@/hooks/use-habits";
import { getCurrentWeekView, toDateString } from "@/lib/date-utils";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [hideNonDueToday, setHideNonDueToday] = useState(false);

  // Get current week view
  const weekView = getCurrentWeekView();
  const startDateStr = toDateString(weekView.startDate);
  const endDateStr = toDateString(weekView.endDate);

  // Fetch habits and completions
  const { data, isLoading } = useHabits(startDateStr, endDateStr);

  const handleOpenModal = (habit?: Habit) => {
    setEditingHabit(habit || null);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingHabit(null);
  };

  return (
    <div className="min-h-screen bg-black text-white px-3 sm:px-6 py-4 sm:py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header with + button */}
        <div className="flex items-start justify-between mb-4 sm:mb-8">
          <WeekHeader startDate={weekView.startDate} endDate={weekView.endDate} />
          <button
            type="button"
            onClick={() => handleOpenModal()}
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center transition-colors"
            aria-label="Create new habit"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <title>Plus</title>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        {/* Hide filter toggle */}
        <div className="flex items-center space-x-2 mb-4 sm:mb-6">
          <Switch id="hide-filter" checked={hideNonDueToday} onCheckedChange={setHideNonDueToday} />
          <Label htmlFor="hide-filter" className="text-gray-400 text-xs sm:text-sm cursor-pointer">
            Hide habits not due today
          </Label>
        </div>

        {/* Content */}
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
            onEditHabit={handleOpenModal}
          />
        )}

        {/* Modal */}
        <HabitModal open={modalOpen} onClose={handleCloseModal} editingHabit={editingHabit} />
      </div>
    </div>
  );
}
