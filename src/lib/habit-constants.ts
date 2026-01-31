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
  // Original
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
  // Health
  "🩺",
  "🧴",
  "🧼",
  "🪥",
  // Fitness
  "🚴",
  "🏊",
  "🧗",
  "🤸",
  // Mind
  "🎨",
  "🎵",
  "🎭",
  "🧩",
  // Nature
  "🌱",
  "🌻",
  "🌳",
  "♻️",
  "🌍",
  // Productivity
  "⏰",
  "📝",
  "💻",
  "📊",
  "🎯",
  // Social
  "👥",
  "📞",
  "💌",
  "🤝",
] as const;

export const DEFAULT_COLOR = HABIT_COLORS[0].value;
export const DEFAULT_ICON = HABIT_ICONS[0];

export const DEFAULT_CATEGORIES = [
  { name: "Self Care", colorHex: "#f783ac" },
  { name: "Sleep", colorHex: "#b197fc" },
  { name: "Food", colorHex: "#ffa94d" },
  { name: "Exercise", colorHex: "#51cf66" },
  { name: "Pets", colorHex: "#ffd43b" },
  { name: "Cleaning", colorHex: "#4dabf7" },
] as const;
