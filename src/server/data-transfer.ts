import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { eq, inArray } from "drizzle-orm";
import invariant from "tiny-invariant";
import { z } from "zod";
import { db } from "@/db";
import { categories, frequencyConfigSchema, habitCompletions, habits, todos } from "@/db/schema";
import { auth } from "@/lib/auth";

/**
 * Get current user from session, throws if not authenticated
 */
async function requireUser() {
  const request = getRequest();
  const session = await auth.api.getSession({ headers: request.headers });
  invariant(session?.user, "User not authenticated");
  return session.user;
}

export const EXPORT_VERSION = 1;

/**
 * Zod schemas for validating imported backup files.
 *
 * These describe the on-disk export shape (a superset of the DB row shape),
 * independent of the drizzle-zod insert schemas which strip server-managed
 * fields. Timestamps arrive as ISO strings after JSON round-tripping.
 */
const isoDateTime = z.string().datetime();
const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD");

const exportCategorySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  colorHex: z.string().nullable().optional(),
  sortOrder: z.number().int().default(0),
  isDefault: z.boolean().default(false),
});

const exportHabitSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  category: z.string().default(""),
  colorHex: z.string().nullable().optional(),
  icon: z.string().nullable().optional(),
  frequency: z.enum(["daily", "custom"]).default("daily"),
  frequencyConfig: frequencyConfigSchema.nullable().optional(),
  sortOrder: z.number().int().default(0),
  isArchived: z.boolean().default(false),
});

const exportCompletionSchema = z.object({
  habitId: z.string().uuid(),
  completedDate: dateOnly,
});

const exportTodoSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  completed: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
});

export const backupSchema = z.object({
  version: z.literal(EXPORT_VERSION),
  exportedAt: isoDateTime.optional(),
  categories: z.array(exportCategorySchema).default([]),
  habits: z.array(exportHabitSchema).default([]),
  completions: z.array(exportCompletionSchema).default([]),
  todos: z.array(exportTodoSchema).default([]),
});

export type Backup = z.infer<typeof backupSchema>;

/**
 * Export the current user's entire account as a portable JSON backup.
 * Includes archived habits and all completion history.
 */
export const exportDataFn = createServerFn({ method: "GET" }).handler(async () => {
  const user = await requireUser();

  const [userCategories, userHabits, userTodos] = await Promise.all([
    db.query.categories.findMany({
      where: eq(categories.userId, user.id),
      orderBy: (c, { asc }) => [asc(c.sortOrder), asc(c.createdAt)],
    }),
    db.query.habits.findMany({
      where: eq(habits.userId, user.id),
      orderBy: (h, { asc }) => [asc(h.sortOrder), asc(h.createdAt)],
    }),
    db.query.todos.findMany({
      where: eq(todos.userId, user.id),
      orderBy: (t, { asc }) => [asc(t.sortOrder), asc(t.createdAt)],
    }),
  ]);

  const habitIds = userHabits.map((h) => h.id);
  const userCompletions = habitIds.length
    ? await db.query.habitCompletions.findMany({
        where: inArray(habitCompletions.habitId, habitIds),
      })
    : [];

  const backup: Backup = {
    version: EXPORT_VERSION,
    categories: userCategories.map((c) => ({
      id: c.id,
      name: c.name,
      colorHex: c.colorHex,
      sortOrder: c.sortOrder,
      isDefault: c.isDefault,
    })),
    habits: userHabits.map((h) => ({
      id: h.id,
      name: h.name,
      description: h.description,
      category: h.category,
      colorHex: h.colorHex,
      icon: h.icon,
      frequency: h.frequency,
      frequencyConfig: h.frequencyConfig,
      sortOrder: h.sortOrder,
      isArchived: h.isArchived,
    })),
    completions: userCompletions.map((c) => ({
      habitId: c.habitId,
      completedDate: c.completedDate,
    })),
    todos: userTodos.map((t) => ({
      id: t.id,
      title: t.title,
      completed: t.completed,
      sortOrder: t.sortOrder,
    })),
  };

  return backup;
});

/**
 * Import a backup into the current user's account.
 *
 * Additive and idempotent: original IDs are preserved and inserts skip
 * conflicts, so importing the same file twice (or into a live account) never
 * duplicates or destroys existing data. Categories are matched by name.
 */
export const importDataFn = createServerFn({ method: "POST" })
  .inputValidator((data) => backupSchema.parse(data))
  .handler(async ({ data }) => {
    const user = await requireUser();

    const summary = { categories: 0, habits: 0, completions: 0, todos: 0 };

    // Categories: match by name (habits reference categories by name, not FK).
    if (data.categories.length > 0) {
      const existing = await db.query.categories.findMany({
        where: eq(categories.userId, user.id),
        columns: { name: true },
      });
      const existingNames = new Set(existing.map((c) => c.name));
      const newCategories = data.categories.filter((c) => !existingNames.has(c.name));
      if (newCategories.length > 0) {
        const inserted = await db
          .insert(categories)
          .values(
            newCategories.map((c) => ({
              userId: user.id,
              name: c.name,
              colorHex: c.colorHex ?? null,
              sortOrder: c.sortOrder,
              isDefault: c.isDefault,
            })),
          )
          .returning({ id: categories.id });
        summary.categories = inserted.length;
      }
    }

    // Habits: preserve original IDs so completions map correctly; skip on ID conflict.
    if (data.habits.length > 0) {
      const inserted = await db
        .insert(habits)
        .values(
          data.habits.map((h) => ({
            id: h.id,
            userId: user.id,
            name: h.name,
            description: h.description ?? null,
            category: h.category,
            colorHex: h.colorHex ?? null,
            icon: h.icon ?? null,
            frequency: h.frequency,
            frequencyConfig: h.frequencyConfig ?? null,
            sortOrder: h.sortOrder,
            isArchived: h.isArchived,
          })),
        )
        .onConflictDoNothing({ target: habits.id })
        .returning({ id: habits.id });
      summary.habits = inserted.length;
    }

    // Completions: only attach to habits confirmed to belong to this user.
    if (data.completions.length > 0) {
      const ownedHabits = await db.query.habits.findMany({
        where: eq(habits.userId, user.id),
        columns: { id: true },
      });
      const ownedIds = new Set(ownedHabits.map((h) => h.id));
      const validCompletions = data.completions.filter((c) => ownedIds.has(c.habitId));
      if (validCompletions.length > 0) {
        const inserted = await db
          .insert(habitCompletions)
          .values(
            validCompletions.map((c) => ({
              habitId: c.habitId,
              completedDate: c.completedDate,
            })),
          )
          .onConflictDoNothing({ target: [habitCompletions.habitId, habitCompletions.completedDate] })
          .returning({ id: habitCompletions.id });
        summary.completions = inserted.length;
      }
    }

    // Todos: preserve original IDs; skip on ID conflict.
    if (data.todos.length > 0) {
      const inserted = await db
        .insert(todos)
        .values(
          data.todos.map((t) => ({
            id: t.id,
            userId: user.id,
            title: t.title,
            completed: t.completed,
            sortOrder: t.sortOrder,
          })),
        )
        .onConflictDoNothing({ target: todos.id })
        .returning({ id: todos.id });
      summary.todos = inserted.length;
    }

    return summary;
  });
