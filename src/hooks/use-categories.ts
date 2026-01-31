import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createCategoryFn, getCategoriesFn } from "@/server/categories";

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: () => getCategoriesFn(),
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { name: string; colorHex?: string }) => createCategoryFn({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (error) => {
      console.error("Failed to create category:", error);
      toast.error("Failed to create category");
    },
  });
}
