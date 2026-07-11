/**
 * Shared visual state for a habit day-square, used by both the interactive
 * dashboard grid and the read-only reports heatmap so the color logic lives
 * in one place. Squares are tinted via the `--habit-color` CSS variable set on
 * an ancestor.
 */
export type SquareState = "completed" | "incomplete" | "notDue";

export function getSquareState(isDue: boolean, isCompleted: boolean): SquareState {
  if (!isDue) return "notDue";
  return isCompleted ? "completed" : "incomplete";
}

/** Base fill classes for a square. Callers layer sizing / interaction on top. */
export function squareColorClasses(state: SquareState): string {
  switch (state) {
    case "completed":
      return "bg-(--habit-color)";
    case "incomplete":
      return "bg-[color-mix(in_srgb,var(--habit-color)_20%,black)]";
    case "notDue":
      return "opacity-30 bg-zinc-800 border border-zinc-700";
  }
}
