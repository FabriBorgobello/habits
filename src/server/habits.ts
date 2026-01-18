import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { and, eq, gte, inArray, lte } from "drizzle-orm";
import invariant from "tiny-invariant";
import { z } from "zod";
import { db } from "@/db";
import { habitCompletions, habits, insertHabitSchema } from "@/db/schema";
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

/**
 * Get habits and completions for a date range
 */
export const getHabitsWithCompletionsFn = createServerFn({ method: "GET" })
  .inputValidator((data) =>
    z
      .object({
        startDate: z.string(),
        endDate: z.string(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const user = await requireUser();

    // Fetch user's non-archived habits
    const userHabits = await db.query.habits.findMany({
      where: and(eq(habits.userId, user.id), eq(habits.isArchived, false)),
      orderBy: (habits, { asc }) => [asc(habits.sortOrder), asc(habits.createdAt)],
    });

    if (userHabits.length === 0) {
      return { habits: [], completions: {} };
    }

    const habitIds = userHabits.map((h) => h.id);

    // Fetch completions for the date range
    const completionsData = await db.query.habitCompletions.findMany({
      where: and(
        inArray(habitCompletions.habitId, habitIds),
        gte(habitCompletions.completedDate, data.startDate),
        lte(habitCompletions.completedDate, data.endDate),
      ),
    });

    // Group completions by habit ID
    const completionsByHabit: Record<string, string[]> = {};
    for (const completion of completionsData) {
      if (!completionsByHabit[completion.habitId]) {
        completionsByHabit[completion.habitId] = [];
      }
      completionsByHabit[completion.habitId].push(completion.completedDate);
    }

    return {
      habits: userHabits,
      completions: completionsByHabit,
    };
  });

/**
 * Create a new habit
 */
export const createHabitFn = createServerFn({ method: "POST" })
  .inputValidator((data) => insertHabitSchema.parse(data))
  .handler(async ({ data }) => {
    const user = await requireUser();

    const [newHabit] = await db
      .insert(habits)
      .values({
        ...data,
        userId: user.id,
      })
      .returning();

    invariant(newHabit, "Failed to create habit");
    return newHabit;
  });

/**
 * Update an existing habit
 */
export const updateHabitFn = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    insertHabitSchema
      .extend({
        id: z.string().uuid(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const user = await requireUser();

    // Verify ownership
    const habit = await db.query.habits.findFirst({
      where: and(eq(habits.id, data.id), eq(habits.userId, user.id)),
    });

    invariant(habit, "Habit not found or unauthorized");

    const [updatedHabit] = await db
      .update(habits)
      .set({
        name: data.name,
        description: data.description,
        category: data.category,
        colorHex: data.colorHex,
        icon: data.icon,
        frequency: data.frequency,
        frequencyConfig: data.frequencyConfig,
        updatedAt: new Date(),
      })
      .where(eq(habits.id, data.id))
      .returning();

    invariant(updatedHabit, "Failed to update habit");
    return updatedHabit;
  });

/**
 * Toggle habit completion for a specific date
 */
export const toggleHabitCompletionFn = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        habitId: z.string().uuid(),
        date: z.string(), // YYYY-MM-DD format
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const user = await requireUser();

    // Verify habit ownership
    const habit = await db.query.habits.findFirst({
      where: and(eq(habits.id, data.habitId), eq(habits.userId, user.id)),
    });

    invariant(habit, "Habit not found or unauthorized");

    // Check if completion already exists
    const existing = await db.query.habitCompletions.findFirst({
      where: and(eq(habitCompletions.habitId, data.habitId), eq(habitCompletions.completedDate, data.date)),
    });

    if (existing) {
      // Delete completion
      await db.delete(habitCompletions).where(eq(habitCompletions.id, existing.id));
      return { completed: false };
    }

    // Create completion
    await db.insert(habitCompletions).values({
      habitId: data.habitId,
      completedDate: data.date,
    });

    return { completed: true };
  });

/**
 * Reorder habits
 */
export const reorderHabitsFn = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        orderedIds: z.array(z.string().uuid()),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const user = await requireUser();

    // Verify all habits belong to the user
    const userHabits = await db.query.habits.findMany({
      where: and(eq(habits.userId, user.id), eq(habits.isArchived, false)),
    });

    const userHabitIds = new Set(userHabits.map((h) => h.id));
    const allBelongToUser = data.orderedIds.every((id) => userHabitIds.has(id));

    invariant(allBelongToUser, "Some habits not found or unauthorized");

    // Update sort order for each habit
    await Promise.all(
      data.orderedIds.map((id, index) =>
        db.update(habits).set({ sortOrder: index, updatedAt: new Date() }).where(eq(habits.id, id)),
      ),
    );

    return { success: true };
  });

/**
 * Archive a habit (soft delete)
 */
export const archiveHabitFn = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        id: z.string().uuid(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const user = await requireUser();

    // Verify ownership
    const habit = await db.query.habits.findFirst({
      where: and(eq(habits.id, data.id), eq(habits.userId, user.id)),
    });

    invariant(habit, "Habit not found or unauthorized");

    await db
      .update(habits)
      .set({
        isArchived: true,
        updatedAt: new Date(),
      })
      .where(eq(habits.id, data.id));

    return { success: true };
  });
