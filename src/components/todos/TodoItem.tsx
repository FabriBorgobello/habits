import { GripVertical, X } from "lucide-react";
import { motion, Reorder, useDragControls } from "motion/react";
import type { Todo } from "@/db/schema";
import { cn } from "@/lib/utils";

interface TodoItemProps {
  todo: Todo;
  reorderMode: boolean;
  onToggle: () => void;
  onDelete: () => void;
}

export function TodoItem({ todo, reorderMode, onToggle, onDelete }: TodoItemProps) {
  const dragControls = useDragControls();

  return (
    <Reorder.Item
      value={todo}
      as="div"
      layoutId={todo.id}
      dragListener={false}
      dragControls={dragControls}
      transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
      className="relative bg-zinc-950 rounded-2xl p-3 sm:p-4"
    >
      {/* biome-ignore lint/a11y/noStaticElementInteractions: row click delegates to inner checkbox */}
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: keyboard handled by inner checkbox */}
      <div className="flex items-center gap-3 cursor-pointer" onClick={onToggle}>
        <input
          type="checkbox"
          checked={todo.completed}
          onChange={onToggle}
          onClick={(e) => e.stopPropagation()}
          className="sr-only"
          aria-label={`${todo.completed ? "Unmark" : "Mark"} "${todo.title}" as complete`}
        />
        {/* Drag handle */}
        <motion.div
          initial={false}
          animate={{ width: reorderMode ? "auto" : 0, opacity: reorderMode ? 1 : 0 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="shrink-0 overflow-hidden"
        >
          <button
            type="button"
            onPointerDown={(e) => dragControls.start(e)}
            onClick={(e) => e.stopPropagation()}
            className="touch-none p-1 rounded transition-colors text-gray-500 cursor-grab hover:text-gray-300 hover:bg-zinc-800 active:cursor-grabbing"
            aria-label={`Drag to reorder ${todo.title}`}
          >
            <GripVertical className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </motion.div>

        {/* Checkbox indicator */}
        <div
          className={cn(
            "w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 shrink-0 transition-all flex items-center justify-center",
            todo.completed ? "bg-white border-white" : "border-zinc-600",
          )}
        >
          {todo.completed && (
            <svg
              className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-black"
              viewBox="0 0 12 12"
              fill="none"
              role="img"
              aria-label="Checkmark"
            >
              <path
                d="M2.5 6L5 8.5L9.5 3.5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>

        {/* Title */}
        <span
          className={cn(
            "flex-1 text-sm sm:text-base transition-all min-w-0 truncate",
            todo.completed ? "line-through text-gray-500" : "text-white",
          )}
        >
          {todo.title}
        </span>

        {/* Delete button */}
        <motion.div
          initial={false}
          animate={{ width: reorderMode ? 0 : "auto", opacity: reorderMode ? 0 : 1 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="shrink-0 overflow-hidden"
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1.5 rounded-lg hover:bg-zinc-800 transition-colors text-gray-500 hover:text-red-400"
            aria-label={`Delete "${todo.title}"`}
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      </div>
    </Reorder.Item>
  );
}
