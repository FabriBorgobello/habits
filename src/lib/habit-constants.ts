export const HABIT_COLORS = [
  { name: "red", value: "#ff6b6b" },
  { name: "blue", value: "#4dabf7" },
  { name: "teal", value: "#38d9a9" },
  { name: "orange", value: "#ffa94d" },
  { name: "pink", value: "#f783ac" },
  { name: "green", value: "#51cf66" },
  { name: "yellow", value: "#ffd43b" },
  { name: "purple", value: "#b197fc" },
] as const;

export const HABIT_ICONS = [
  "🧘",
  "💊",
  "✏️",
  "☀️",
  "🏃",
  "💧",
  "🚶",
  "🍽️",
  "📚",
  "🛏️",
  "🏋️",
  "☕",
  "🧠",
  "❤️",
  "🍃",
] as const;

export const DEFAULT_COLOR = HABIT_COLORS[0].value;
export const DEFAULT_ICON = HABIT_ICONS[0];
