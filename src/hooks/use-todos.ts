import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Todo } from "@/db/schema";
import { createTodoFn, deleteTodoFn, getTodosFn, reorderTodosFn, toggleTodoFn } from "@/server/todos";

export function useTodos() {
  return useQuery({
    queryKey: ["todos"],
    queryFn: () => getTodosFn(),
  });
}

export function useCreateTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { title: string; sortOrder?: number }) => createTodoFn({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todos"] });
    },
    onError: (error) => {
      console.error("Failed to create todo:", error);
      toast.error("Failed to create task");
    },
  });
}

export function useToggleTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { id: string }) => toggleTodoFn({ data }),
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: ["todos"] });

      const previousTodos = queryClient.getQueryData<Todo[]>(["todos"]);

      queryClient.setQueryData<Todo[]>(["todos"], (old) => {
        if (!old) return old;
        const updated = old.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t));
        return updated.sort((a, b) => {
          if (a.completed !== b.completed) return a.completed ? 1 : -1;
          if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        });
      });

      return { previousTodos };
    },
    onError: (error, _variables, context) => {
      if (context?.previousTodos) {
        queryClient.setQueryData(["todos"], context.previousTodos);
      }
      console.error("Failed to toggle todo:", error);
      toast.error("Failed to update task");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["todos"] });
    },
  });
}

export function useDeleteTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { id: string }) => deleteTodoFn({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todos"] });
    },
    onError: (error) => {
      console.error("Failed to delete todo:", error);
      toast.error("Failed to delete task");
    },
  });
}

export function useReorderTodos() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderedIds: string[]) => reorderTodosFn({ data: { orderedIds } }),
    onMutate: async (orderedIds) => {
      await queryClient.cancelQueries({ queryKey: ["todos"] });

      const previousTodos = queryClient.getQueryData<Todo[]>(["todos"]);

      queryClient.setQueryData<Todo[]>(["todos"], (old) => {
        if (!old) return old;
        const ordered = orderedIds.map((id) => old.find((t) => t.id === id)).filter(Boolean) as Todo[];
        const remaining = old.filter((t) => !orderedIds.includes(t.id));
        return [...ordered, ...remaining];
      });

      return { previousTodos };
    },
    onError: (error, _variables, context) => {
      if (context?.previousTodos) {
        queryClient.setQueryData(["todos"], context.previousTodos);
      }
      console.error("Failed to reorder todos:", error);
      toast.error("Failed to reorder tasks");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["todos"] });
    },
  });
}
