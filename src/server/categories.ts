import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { eq } from "drizzle-orm";
import invariant from "tiny-invariant";
import { z } from "zod";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { auth } from "@/lib/auth";
import { DEFAULT_CATEGORIES } from "@/lib/habit-constants";

async function requireUser() {
  const request = getRequest();
  const session = await auth.api.getSession({ headers: request.headers });
  invariant(session?.user, "User not authenticated");
  return session.user;
}

/**
 * Get user's categories, seeding defaults on first access
 */
export const getCategoriesFn = createServerFn({ method: "GET" }).handler(async () => {
  const user = await requireUser();

  const userCategories = await db.query.categories.findMany({
    where: eq(categories.userId, user.id),
    orderBy: (categories, { asc }) => [asc(categories.sortOrder), asc(categories.createdAt)],
  });

  // Seed defaults if user has no categories
  if (userCategories.length === 0) {
    const seeded = await db
      .insert(categories)
      .values(
        DEFAULT_CATEGORIES.map((cat, index) => ({
          userId: user.id,
          name: cat.name,
          colorHex: cat.colorHex,
          sortOrder: index,
          isDefault: true,
        })),
      )
      .returning();

    return seeded;
  }

  return userCategories;
});

/**
 * Create a custom category
 */
export const createCategoryFn = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        name: z.string().min(1).max(50),
        colorHex: z.string().optional(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const user = await requireUser();

    const [newCategory] = await db
      .insert(categories)
      .values({
        userId: user.id,
        name: data.name,
        colorHex: data.colorHex ?? null,
        isDefault: false,
      })
      .returning();

    invariant(newCategory, "Failed to create category");
    return newCategory;
  });
