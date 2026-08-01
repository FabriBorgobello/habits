import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { type Backup, backupSchema, exportDataFn, importDataFn } from "@/server/data-transfer";

function toDateStamp(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Export the account to a downloaded JSON file.
 */
export function useExportData() {
  return useMutation({
    mutationFn: async () => {
      const backup = await exportDataFn();
      const stamped: Backup = { ...backup, exportedAt: new Date().toISOString() };
      const blob = new Blob([JSON.stringify(stamped, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `habits-backup-${toDateStamp(new Date())}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      return backup;
    },
    onSuccess: () => {
      toast.success("Backup downloaded");
    },
    onError: (error) => {
      console.error("Failed to export data:", error);
      toast.error("Failed to export data");
    },
  });
}

/**
 * Import a backup file into the account.
 */
export function useImportData() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      const text = await file.text();
      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        throw new Error("File is not valid JSON");
      }
      const backup = backupSchema.parse(parsed);
      return importDataFn({ data: backup });
    },
    onSuccess: (summary) => {
      queryClient.invalidateQueries({ queryKey: ["habits"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["todos"] });
      const parts = [
        summary.habits && `${summary.habits} habit${summary.habits === 1 ? "" : "s"}`,
        summary.completions && `${summary.completions} completion${summary.completions === 1 ? "" : "s"}`,
        summary.categories && `${summary.categories} categor${summary.categories === 1 ? "y" : "ies"}`,
        summary.todos && `${summary.todos} task${summary.todos === 1 ? "" : "s"}`,
      ].filter(Boolean);
      toast.success(parts.length ? `Imported ${parts.join(", ")}` : "Nothing new to import");
    },
    onError: (error) => {
      console.error("Failed to import data:", error);
      const message = error instanceof Error ? error.message : "Failed to import data";
      toast.error(message.startsWith("File is not") ? message : "Import failed — is this a valid backup file?");
    },
  });
}
