import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { z } from "zod";
import type { insertHabitSchema } from "@/db/schema";
import {
  archiveHabitFn,
  createHabitFn,
  getHabitsWithCompletionsFn,
  reorderHabitsFn,
  toggleHabitCompletionFn,
  updateHabitFn,
} from "@/server/habits";

type InsertHabit = z.infer<typeof insertHabitSchema>;

/**
 * Fetch habits and completions for a date range
 */
export function useHabits(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ["habits", startDate, endDate],
    queryFn: () => getHabitsWithCompletionsFn({ data: { startDate, endDate } }),
  });
}

/**
 * Create a new habit
 */
export function useCreateHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: InsertHabit) => createHabitFn({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits"] });
      toast.success("Habit created successfully");
    },
    onError: (error) => {
      console.error("Failed to create habit:", error);
      toast.error("Failed to create habit");
    },
  });
}

/**
 * Update an existing habit
 */
export function useUpdateHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: InsertHabit & { id: string }) => updateHabitFn({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits"] });
      toast.success("Habit updated successfully");
    },
    onError: (error) => {
      console.error("Failed to update habit:", error);
      toast.error("Failed to update habit");
    },
  });
}

/**
 * Toggle habit completion for a specific date
 */
export function useToggleCompletion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { habitId: string; date: string; habitName: string }) =>
      toggleHabitCompletionFn({ data: { habitId: data.habitId, date: data.date } }),
    onMutate: async ({ habitId, date }) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ["habits"] });

      // Snapshot previous value
      const previousData = queryClient.getQueriesData({ queryKey: ["habits"] });

      // Optimistically update
      queryClient.setQueriesData({ queryKey: ["habits"] }, (old: unknown) => {
        if (!old || typeof old !== "object") return old;

        const typedOld = old as { habits: unknown[]; completions: Record<string, string[]> };
        const completions = { ...typedOld.completions };
        const habitCompletions = completions[habitId] || [];

        if (habitCompletions.includes(date)) {
          // Remove completion
          completions[habitId] = habitCompletions.filter((d: string) => d !== date);
        } else {
          // Add completion
          completions[habitId] = [...habitCompletions, date];
        }

        return { ...typedOld, completions };
      });

      return { previousData };
    },
    onError: (error, _variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        for (const [queryKey, data] of context.previousData) {
          queryClient.setQueryData(queryKey, data);
        }
      }
      console.error("Failed to toggle completion:", error);
      toast.error("Failed to update completion");
    },
    onSettled: () => {
      // Refetch to sync with server
      queryClient.invalidateQueries({ queryKey: ["habits"] });
    },
  });
}

/**
 * Archive a habit
 */
export function useArchiveHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { id: string }) => archiveHabitFn({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits"] });
      toast.success("Habit archived");
    },
    onError: (error) => {
      console.error("Failed to archive habit:", error);
      toast.error("Failed to archive habit");
    },
  });
}

/**
 * Reorder habits
 */
export function useReorderHabits() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderedIds: string[]) => reorderHabitsFn({ data: { orderedIds } }),
    onMutate: async (orderedIds) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ["habits"] });

      // Snapshot previous data
      const previousData = queryClient.getQueriesData({ queryKey: ["habits"] });

      // Optimistically update
      queryClient.setQueriesData({ queryKey: ["habits"] }, (old: unknown) => {
        if (!old || typeof old !== "object") return old;

        const typedOld = old as { habits: Array<{ id: string }>; completions: Record<string, string[]> };
        const orderedHabits = orderedIds.map((id) => typedOld.habits.find((h) => h.id === id)).filter(Boolean);

        return { ...typedOld, habits: orderedHabits };
      });

      return { previousData };
    },
    onError: (error, _variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        for (const [queryKey, data] of context.previousData) {
          queryClient.setQueryData(queryKey, data);
        }
      }
      console.error("Failed to reorder habits:", error);
      toast.error("Failed to reorder habits");
    },
    onSettled: () => {
      // Refetch to sync with server
      queryClient.invalidateQueries({ queryKey: ["habits"] });
    },
  });
}
