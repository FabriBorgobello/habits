import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { and, asc, eq } from "drizzle-orm";
import invariant from "tiny-invariant";
import { z } from "zod";
import { db } from "@/db";
import { insertTodoSchema, todos } from "@/db/schema";
import { auth } from "@/lib/auth";

async function requireUser() {
  const request = getRequest();
  const session = await auth.api.getSession({ headers: request.headers });
  invariant(session?.user, "User not authenticated");
  return session.user;
}

export const getTodosFn = createServerFn({ method: "GET" }).handler(async () => {
  const user = await requireUser();

  return db.query.todos.findMany({
    where: eq(todos.userId, user.id),
    orderBy: [asc(todos.completed), asc(todos.sortOrder), asc(todos.createdAt)],
  });
});

export const createTodoFn = createServerFn({ method: "POST" })
  .inputValidator((data) => insertTodoSchema.parse(data))
  .handler(async ({ data }) => {
    const user = await requireUser();

    const [newTodo] = await db
      .insert(todos)
      .values({
        ...data,
        userId: user.id,
      })
      .returning();

    invariant(newTodo, "Failed to create todo");
    return newTodo;
  });

export const toggleTodoFn = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        id: z.string().uuid(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const user = await requireUser();

    const todo = await db.query.todos.findFirst({
      where: and(eq(todos.id, data.id), eq(todos.userId, user.id)),
    });

    invariant(todo, "Todo not found or unauthorized");

    const [updated] = await db
      .update(todos)
      .set({
        completed: !todo.completed,
        updatedAt: new Date(),
      })
      .where(eq(todos.id, data.id))
      .returning();

    invariant(updated, "Failed to toggle todo");
    return updated;
  });

export const deleteTodoFn = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        id: z.string().uuid(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const user = await requireUser();

    const todo = await db.query.todos.findFirst({
      where: and(eq(todos.id, data.id), eq(todos.userId, user.id)),
    });

    invariant(todo, "Todo not found or unauthorized");

    await db.delete(todos).where(eq(todos.id, data.id));

    return { success: true };
  });

export const reorderTodosFn = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        orderedIds: z.array(z.string().uuid()),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const user = await requireUser();

    const userTodos = await db.query.todos.findMany({
      where: eq(todos.userId, user.id),
    });

    const userTodoIds = new Set(userTodos.map((t) => t.id));
    const allBelongToUser = data.orderedIds.every((id) => userTodoIds.has(id));

    invariant(allBelongToUser, "Some todos not found or unauthorized");

    await Promise.all(
      data.orderedIds.map((id, index) =>
        db.update(todos).set({ sortOrder: index, updatedAt: new Date() }).where(eq(todos.id, id)),
      ),
    );

    return { success: true };
  });
