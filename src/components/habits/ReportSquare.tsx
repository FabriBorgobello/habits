import { type SquareState, squareColorClasses } from "@/lib/habit-square";
import { cn } from "@/lib/utils";

interface ReportSquareProps {
  state: SquareState;
  isToday: boolean;
  /** Tailwind width/height classes controlling the square size for the view. */
  sizeClass: string;
  /** Native tooltip, e.g. "Jul 4, 2025 ✓". */
  title: string;
}

/** A read-only day cell in the reports heatmap. */
export function ReportSquare({ state, isToday, sizeClass, title }: ReportSquareProps) {
  return (
    <div
      title={title}
      className={cn(sizeClass, "rounded-[3px] shrink-0", squareColorClasses(state), isToday && "ring-1 ring-white/70")}
    />
  );
}
