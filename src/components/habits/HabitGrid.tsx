import { Archive, GripVertical, MoreVertical, Pencil } from "lucide-react";
import { AnimatePresence, motion, Reorder, useDragControls } from "motion/react";
import { useMemo } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Habit } from "@/db/schema";
import { useReorderHabits, useToggleCompletion } from "@/hooks/use-habits";
import { getDayAbbreviation, isToday, toDateString } from "@/lib/date-utils";
import { DEFAULT_COLOR, DEFAULT_ICON } from "@/lib/habit-constants";
import { isHabitDueOnDate } from "@/lib/habit-logic";
import { cn } from "@/lib/utils";

interface HabitGridProps {
  habits: Habit[];
  completions: Record<string, string[]>;
  weekDays: Date[];
  hideNonDueToday: boolean;
  reorderMode: boolean;
  onEditHabit: (habit: Habit) => void;
  onArchiveHabit: (habit: Habit) => void;
}

export function HabitGrid({
  habits,
  completions,
  weekDays,
  hideNonDueToday,
  reorderMode,
  onEditHabit,
  onArchiveHabit,
}: HabitGridProps) {
  const toggleCompletion = useToggleCompletion();
  const reorderHabits = useReorderHabits();

  // Filter habits based on hideNonDueToday
  const visibleHabits = useMemo(() => {
    if (!hideNonDueToday) return habits;

    const today = new Date();
    return habits.filter((habit) => isHabitDueOnDate(habit, today));
  }, [habits, hideNonDueToday]);

  const handleReorder = (newOrder: Habit[]) => {
    if (reorderMode) {
      reorderHabits.mutate(newOrder.map((h) => h.id));
    }
  };

  const canReorder = reorderMode;

  if (visibleHabits.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="text-center py-12"
      >
        <p className="text-gray-400 text-lg">
          {hideNonDueToday ? "No habits due today" : "No habits yet. Create your first habit!"}
        </p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Day headers */}
      <div className="flex items-center gap-2 sm:gap-4 pb-2 px-2 sm:px-4">
        {/* Spacer for habit name */}
        <div className="flex-1" />
        {/* Day abbreviations */}
        <div className="flex gap-1 sm:gap-2 shrink-0">
          {weekDays.map((day) => (
            <div
              key={day.toISOString()}
              className={cn(
                "flex items-center justify-center text-[10px] sm:text-xs font-medium text-gray-400 w-5 sm:w-10",
                isToday(day) && "text-white",
              )}
            >
              {getDayAbbreviation(day)}
            </div>
          ))}
        </div>
        {/* Spacer for menu column - only when not in reorder mode */}
        {!reorderMode && <div className="w-8 sm:w-9 shrink-0" />}
      </div>

      {/* Habit rows */}
      <Reorder.Group axis="y" values={visibleHabits} onReorder={handleReorder} as="div" className="space-y-2">
        <AnimatePresence mode="sync">
          {visibleHabits.map((habit, index) => (
            <HabitRow
              key={habit.id}
              habit={habit}
              completions={completions[habit.id] || []}
              weekDays={weekDays}
              index={index}
              reorderMode={canReorder}
              onToggle={(date) =>
                toggleCompletion.mutate({
                  habitId: habit.id,
                  date,
                  habitName: habit.name,
                })
              }
              onEdit={() => onEditHabit(habit)}
              onArchive={() => onArchiveHabit(habit)}
            />
          ))}
        </AnimatePresence>
      </Reorder.Group>
    </div>
  );
}

interface HabitRowProps {
  habit: Habit;
  completions: string[];
  weekDays: Date[];
  index: number;
  reorderMode: boolean;
  onToggle: (date: string) => void;
  onEdit: () => void;
  onArchive: () => void;
}

function HabitRow({ habit, completions, weekDays, index, reorderMode, onToggle, onEdit, onArchive }: HabitRowProps) {
  const color = habit.colorHex || DEFAULT_COLOR;
  const icon = habit.icon || DEFAULT_ICON;
  const dragControls = useDragControls();

  return (
    <Reorder.Item
      value={habit}
      as="div"
      dragListener={false}
      dragControls={dragControls}
      initial={{ opacity: 0, y: 3 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -3 }}
      transition={{ duration: 0.2, delay: index * 0.05 }}
      className="relative bg-zinc-950 rounded-2xl p-2 px-0 sm:p-4"
      style={{ "--habit-color": color } as React.CSSProperties}
    >
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Drag handle - only in reorder mode */}
        {reorderMode && (
          <button
            type="button"
            onPointerDown={(e) => dragControls.start(e)}
            className="touch-none p-1 rounded transition-colors text-gray-500 shrink-0 cursor-grab hover:text-gray-300 hover:bg-zinc-800 active:cursor-grabbing"
            aria-label={`Drag to reorder ${habit.name}`}
          >
            <GripVertical className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        )}

        {/* Habit name */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <span className="text-lg sm:text-2xl shrink-0">{icon}</span>
          <span className="text-white font-medium text-sm sm:text-base truncate">{habit.name}</span>
        </div>

        {/* Completion squares */}
        <div className="flex gap-1 sm:gap-2 shrink-0">
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
                  isTodaySquare &&
                    isDue &&
                    "ring-1 sm:ring-2 ring-zinc-500 ring-offset-1 sm:ring-offset-2 ring-offset-zinc-950",
                  !isDue && "opacity-30 cursor-not-allowed bg-zinc-800 border border-zinc-700",
                  isDue && !isCompleted && "bg-[color-mix(in_srgb,var(--habit-color)_20%,black)] hover:opacity-80",
                  isDue && isCompleted && "bg-(--habit-color) hover:opacity-80",
                )}
                aria-label={`${isCompleted ? "Unmark" : "Mark"} ${habit.name} as complete for ${dateStr}`}
              />
            );
          })}
        </div>

        {/* Options menu - hidden in reorder mode */}
        {!reorderMode && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="p-1.5 rounded-lg hover:bg-zinc-800 transition-colors text-gray-400 hover:text-white shrink-0"
                aria-label={`Options for ${habit.name}`}
              >
                <MoreVertical className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800">
              <DropdownMenuItem onClick={onEdit} className="text-white hover:bg-zinc-800 cursor-pointer">
                <Pencil className="w-4 h-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onArchive} variant="destructive" className="cursor-pointer">
                <Archive className="w-4 h-4" />
                Archive
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </Reorder.Item>
  );
}
