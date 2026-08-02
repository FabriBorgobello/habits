import { Flame } from "lucide-react";
import { formatStreak, type StreakUnit } from "@/lib/habit-stats";
import { cn } from "@/lib/utils";

interface StreakBadgeProps {
  current: number;
  unit: StreakUnit;
  className?: string;
}

/**
 * Compact "on fire" indicator for a habit's current streak. Renders nothing when
 * the streak is zero so quiet habits stay uncluttered.
 */
export function StreakBadge({ current, unit, className }: StreakBadgeProps) {
  if (current <= 0) return null;

  return (
    <span
      className={cn("inline-flex items-center gap-0.5 text-[10px] sm:text-xs font-medium text-orange-400", className)}
      title={`Current streak: ${formatStreak(current, unit)}`}
    >
      <Flame className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-orange-500/30" />
      {formatStreak(current, unit)}
    </span>
  );
}
