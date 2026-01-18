import { AnimatePresence, motion } from "motion/react";
import { useMemo } from "react";
import type { Habit } from "@/db/schema";
import { useToggleCompletion } from "@/hooks/use-habits";
import { getDayAbbreviation, isToday, toDateString } from "@/lib/date-utils";
import { DEFAULT_COLOR, DEFAULT_ICON } from "@/lib/habit-constants";
import { isHabitDueOnDate } from "@/lib/habit-logic";
import { cn } from "@/lib/utils";

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
    <div className="space-y-2">
      {/* Day headers */}
      <div className="grid grid-cols-[1fr_auto] gap-2 sm:gap-4 items-center pb-2 px-2 sm:px-4">
        <div />
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {weekDays.map((day) => (
            <div
              key={day.toISOString()}
              className={cn(
                "shrink-0 flex items-center justify-center text-[10px] sm:text-xs font-medium text-gray-400 w-5 sm:w-10",
                isToday(day) && "text-white",
              )}
            >
              {getDayAbbreviation(day)}
            </div>
          ))}
        </div>
      </div>

      {/* Habit rows */}
      <AnimatePresence mode="sync">
        {visibleHabits.map((habit, index) => (
          <motion.div
            key={habit.id}
            initial={{ opacity: 0, y: 10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            transition={{ duration: 0.2, delay: index * 0.05 }}
          >
            <HabitRow
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
          </motion.div>
        ))}
      </AnimatePresence>
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
    <div
      className="grid grid-cols-[1fr_auto] gap-2 sm:gap-4 items-center bg-zinc-950 rounded-2xl p-2 sm:p-4"
      style={{ "--habit-color": color } as React.CSSProperties}
    >
      {/* Habit name */}
      <button
        type="button"
        onClick={onEdit}
        className="flex items-center gap-2 sm:gap-3 text-left hover:opacity-80 transition-opacity"
      >
        <span className="text-lg sm:text-2xl">{icon}</span>
        <span className="text-white font-medium text-sm sm:text-base">{habit.name}</span>
      </button>

      {/* Completion squares */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {weekDays.map((day) => {
          const dateStr = toDateString(day);
          const isCompleted = completions.includes(dateStr);
          const isDue = isHabitDueOnDate(habit, day);
          const isTodaySquare = isToday(day);

          return (
            <motion.button
              key={day.toISOString()}
              type="button"
              onClick={() => onToggle(dateStr)}
              disabled={!isDue}
              whileTap={isDue ? { scale: 0.9 } : {}}
              whileHover={isDue ? { scale: 1.05 } : {}}
              transition={{ duration: 0.15 }}
              className={cn(
                "w-5 h-5 sm:w-10 sm:h-10 rounded-md transition-all",
                isTodaySquare && isDue && "ring-1 sm:ring-2 ring-white ring-offset-1 sm:ring-offset-2 ring-offset-black",
                !isDue && "opacity-30 cursor-not-allowed bg-zinc-800 border border-zinc-700",
                isDue && !isCompleted && "bg-[color-mix(in_srgb,var(--habit-color)_20%,black)] hover:opacity-80",
                isDue && isCompleted && "bg-[var(--habit-color)] hover:opacity-80",
              )}
              aria-label={`${isCompleted ? "Unmark" : "Mark"} ${habit.name} as complete for ${dateStr}`}
            />
          );
        })}
      </div>
    </div>
  );
}
