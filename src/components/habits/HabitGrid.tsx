import confetti from "canvas-confetti";
import { Archive, GripVertical, MoreVertical, Pencil } from "lucide-react";
import { AnimatePresence, motion, Reorder, useDragControls } from "motion/react";
import { useMemo } from "react";
import { useWebHaptics } from "web-haptics/react";
import { CategoryBadge } from "@/components/habits/CategoryBadge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Category, Habit } from "@/db/schema";
import { useReorderHabits, useToggleCompletion } from "@/hooks/use-habits";
import { getDayAbbreviation, isToday, toDateString } from "@/lib/date-utils";
import { DEFAULT_COLOR, DEFAULT_ICON } from "@/lib/habit-constants";
import { getWeeklyProgress, isHabitDueOnDate } from "@/lib/habit-logic";
import { getSquareState, squareColorClasses } from "@/lib/habit-square";
import { cn } from "@/lib/utils";

interface HabitGridProps {
  habits: Habit[];
  completions: Record<string, string[]>;
  weekDays: Date[];
  categories: Category[];
  hideNonDueToday: boolean;
  reorderMode: boolean;
  onEditHabit: (habit: Habit) => void;
  onArchiveHabit: (habit: Habit) => void;
}

export function HabitGrid({
  habits,
  completions,
  weekDays,
  categories,
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

  const categoryMap = useMemo(() => {
    const map = new Map<string, Category>();
    for (const cat of categories) {
      map.set(cat.name, cat);
    }
    return map;
  }, [categories]);

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
      <div className="flex items-center gap-2 sm:gap-4 px-2 sm:px-4">
        {/* Spacer for drag handle column */}
        <motion.div
          initial={false}
          animate={{ width: reorderMode ? 28 : 0, opacity: reorderMode ? 1 : 0 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="shrink-0 overflow-hidden"
        />
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
        {/* Spacer for menu column */}
        <motion.div
          initial={false}
          animate={{ width: reorderMode ? 0 : 32, opacity: reorderMode ? 0 : 1 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="shrink-0 overflow-hidden"
        />
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
              category={categoryMap.get(habit.category)}
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
  category?: Category;
  index: number;
  reorderMode: boolean;
  onToggle: (date: string) => void;
  onEdit: () => void;
  onArchive: () => void;
}

function HabitRow({
  habit,
  completions,
  weekDays,
  category,
  index,
  reorderMode,
  onToggle,
  onEdit,
  onArchive,
}: HabitRowProps) {
  const color = habit.colorHex || DEFAULT_COLOR;
  const icon = habit.icon || DEFAULT_ICON;
  const dragControls = useDragControls();
  const weeklyProgress = getWeeklyProgress(habit, completions, weekDays);
  const { trigger } = useWebHaptics();

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
      className="relative bg-zinc-950 rounded-2xl p-2 sm:p-4"
      style={{ "--habit-color": color } as React.CSSProperties}
    >
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Drag handle */}
        <motion.div
          initial={false}
          animate={{ width: reorderMode ? "auto" : 0, opacity: reorderMode ? 1 : 0 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="shrink-0 overflow-hidden"
        >
          <button
            type="button"
            onPointerDown={(e) => {
              trigger(30);
              dragControls.start(e);
            }}
            className="touch-none p-1 rounded transition-colors text-gray-500 shrink-0 cursor-grab hover:text-gray-300 hover:bg-zinc-800 active:cursor-grabbing"
            aria-label={`Drag to reorder ${habit.name}`}
          >
            <GripVertical className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </motion.div>

        {/* Habit name */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <span className="text-lg sm:text-2xl shrink-0">{icon}</span>
          <div className="min-w-0 flex-1">
            <span className="text-white font-medium text-sm sm:text-base truncate line-clamp-1 block">
              {habit.name}
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {habit.category && <CategoryBadge name={habit.category} colorHex={category?.colorHex} />}
              {weeklyProgress && (
                <span
                  className={cn(
                    "text-[10px] sm:text-xs font-medium",
                    weeklyProgress.isMet ? "text-(--habit-color)" : "text-gray-500",
                  )}
                >
                  {weeklyProgress.completed}/{weeklyProgress.target} this week{weeklyProgress.isMet && " 🎉"}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Completion squares */}
        <div className="flex gap-1 sm:gap-2 shrink-0">
          {weekDays.map((day) => {
            const dateStr = toDateString(day);
            const isCompleted = completions.includes(dateStr);
            const isDue = isHabitDueOnDate(habit, day);
            const isTodaySquare = isToday(day);
            const squareState = getSquareState(isDue, isCompleted);

            return (
              <motion.button
                key={day.toISOString()}
                type="button"
                onClick={() => {
                  if (!isCompleted && weeklyProgress && weeklyProgress.completed + 1 === weeklyProgress.target) {
                    trigger([{ duration: 30 }, { delay: 60, duration: 40, intensity: 1 }]);
                    confetti();
                  } else {
                    trigger(20);
                  }
                  onToggle(dateStr);
                }}
                disabled={!isDue}
                whileTap={isDue ? { scale: 0.9 } : {}}
                whileHover={isDue ? { scale: 1.05 } : {}}
                transition={{ duration: 0.15 }}
                className={cn(
                  "w-5 h-5 sm:w-10 sm:h-10 rounded-md transition-all",
                  isTodaySquare &&
                    isDue &&
                    "ring-1 sm:ring-2 ring-zinc-500 ring-offset-1 sm:ring-offset-2 ring-offset-zinc-950",
                  squareColorClasses(squareState),
                  isDue ? "hover:opacity-80" : "cursor-not-allowed",
                )}
                aria-label={`${isCompleted ? "Unmark" : "Mark"} ${habit.name} as complete for ${dateStr}`}
              />
            );
          })}
        </div>

        {/* Options menu */}
        <motion.div
          initial={false}
          animate={{ width: reorderMode ? 0 : "auto", opacity: reorderMode ? 0 : 1 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="shrink-0 overflow-hidden"
        >
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
              <DropdownMenuItem
                onClick={() => {
                  trigger([{ duration: 40 }, { delay: 40, duration: 40 }, { delay: 40, duration: 40 }], {
                    intensity: 0.9,
                  });
                  onArchive();
                }}
                variant="destructive"
                className="cursor-pointer"
              >
                <Archive className="w-4 h-4" />
                Archive
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </motion.div>
      </div>
    </Reorder.Item>
  );
}
