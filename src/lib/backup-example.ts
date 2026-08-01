import type { Backup } from "@/server/data-transfer";

/**
 * A minimal, valid backup file used in the import documentation and as the
 * downloadable template. Kept in sync with `backupSchema` in
 * `@/server/data-transfer` — if that schema changes, update this example.
 */
export const EXAMPLE_BACKUP: Backup = {
  version: 1,
  exportedAt: "2026-08-01T09:00:00.000Z",
  categories: [
    {
      id: "11111111-1111-4111-8111-111111111111",
      name: "Health",
      colorHex: "#22c55e",
      sortOrder: 0,
      isDefault: true,
    },
  ],
  habits: [
    {
      id: "22222222-2222-4222-8222-222222222222",
      name: "Drink water",
      description: "8 glasses a day",
      category: "Health",
      colorHex: "#3b82f6",
      icon: "💧",
      frequency: "daily",
      frequencyConfig: null,
      sortOrder: 0,
      isArchived: false,
    },
    {
      id: "33333333-3333-4333-8333-333333333333",
      name: "Gym",
      description: null,
      category: "Health",
      colorHex: "#ef4444",
      icon: "🏋️",
      frequency: "custom",
      frequencyConfig: { type: "weekly_count", count: 3 },
      sortOrder: 1,
      isArchived: false,
    },
  ],
  completions: [
    { habitId: "22222222-2222-4222-8222-222222222222", completedDate: "2026-07-30" },
    { habitId: "22222222-2222-4222-8222-222222222222", completedDate: "2026-07-31" },
    { habitId: "33333333-3333-4333-8333-333333333333", completedDate: "2026-07-31" },
  ],
  todos: [
    {
      id: "44444444-4444-4444-8444-444444444444",
      title: "Buy a water bottle",
      completed: false,
      sortOrder: 0,
    },
  ],
};

export const EXAMPLE_BACKUP_JSON = JSON.stringify(EXAMPLE_BACKUP, null, 2);
