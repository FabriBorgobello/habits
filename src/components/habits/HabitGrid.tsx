import { useMemo } from "react";
import type { Habit } from "@/db/schema";
import { useToggleCompletion } from "@/hooks/use-habits";
import { getDayAbbreviation, isToday, toDateString } from "@/lib/date-utils";
import { DEFAULT_COLOR, DEFAULT_ICON } from "@/lib/habit-constants";
import { isHabitDueOnDate } from "@/lib/habit-logic";

interface HabitGridProps {
  habits: Habit[];
  completions: Record<string, string[]>;
  weekDays: Date[];
  hideNonDueToday: boolean;
  onEditHabit: (habit: Habit) => void;
}

export function HabitGrid({ habits, completions, weekDays, hideNonDueToday, onEditHabit }: HabitGridProps) {
  const toggleCompletion = useToggleCompletion();

  // Filter habits based on hideNonDueToday
  const visibleHabits = useMemo(() => {
    if (!hideNonDueToday) return habits;

    const today = new Date();
    return habits.filter((habit) => isHabitDueOnDate(habit, today));
  }, [habits, hideNonDueToday]);

  if (visibleHabits.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400 text-lg">
          {hideNonDueToday ? "No habits due today" : "No habits yet. Create your first habit!"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Day headers */}
      <div className="grid grid-cols-[1fr_auto] gap-4 items-center pb-2">
        <div />
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day) => (
            <div key={day.toISOString()} className="text-center text-xs font-medium text-gray-400 w-10">
              {getDayAbbreviation(day)}
            </div>
          ))}
        </div>
      </div>

      {/* Habit rows */}
      {visibleHabits.map((habit) => (
        <HabitRow
          key={habit.id}
          habit={habit}
          completions={completions[habit.id] || []}
          weekDays={weekDays}
          onToggle={(date) =>
            toggleCompletion.mutate({
              habitId: habit.id,
              date,
              habitName: habit.name,
            })
          }
          onEdit={() => onEditHabit(habit)}
        />
      ))}
    </div>
  );
}

interface HabitRowProps {
  habit: Habit;
  completions: string[];
  weekDays: Date[];
  onToggle: (date: string) => void;
  onEdit: () => void;
}

function HabitRow({ habit, completions, weekDays, onToggle, onEdit }: HabitRowProps) {
  const color = habit.colorHex || DEFAULT_COLOR;
  const icon = habit.icon || DEFAULT_ICON;

  return (
    <div className="grid grid-cols-[1fr_auto] gap-4 items-center bg-zinc-900 rounded-2xl p-4">
      {/* Habit name */}
      <button
        type="button"
        onClick={onEdit}
        className="flex items-center gap-3 text-left hover:opacity-80 transition-opacity"
      >
        <span className="text-2xl">{icon}</span>
        <span className="text-white font-medium">{habit.name}</span>
      </button>

      {/* Completion squares */}
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((day) => {
          const dateStr = toDateString(day);
          const isCompleted = completions.includes(dateStr);
          const isDue = isHabitDueOnDate(habit, day);
          const isTodaySquare = isToday(day);

          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => onToggle(dateStr)}
              disabled={!isDue}
              className={`
								w-10 h-10 rounded-lg transition-all
								${isCompleted ? "opacity-100" : "opacity-100"}
								${isTodaySquare ? "ring-2 ring-white ring-offset-2 ring-offset-black" : ""}
								${!isDue ? "opacity-30 cursor-not-allowed" : "hover:opacity-80"}
							`}
              style={{
                backgroundColor: isCompleted ? color : "#27272a",
                border: isCompleted ? "none" : "1px solid #3f3f46",
              }}
              aria-label={`${isCompleted ? "Unmark" : "Mark"} ${habit.name} as complete for ${dateStr}`}
            />
          );
        })}
      </div>
    </div>
  );
}
