import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { BarChart3, CheckSquare, Download, LayoutDashboard, LogOut, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useExportData, useImportData } from "@/hooks/use-data-transfer";
import { authClient } from "@/lib/auth-client";
import { authMiddleware } from "@/lib/auth-middleware";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
  server: {
    middleware: [authMiddleware],
  },
});

function AuthenticatedLayout() {
  const { data: session } = authClient.useSession();
  const user = session?.user;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const exportData = useExportData();
  const importData = useImportData();

  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          window.location.href = "/";
        },
      },
    });
  };

  const closeImport = () => {
    if (importData.isPending) return;
    setImportOpen(false);
    setPendingFile(null);
  };

  const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Reset so selecting the same file again re-triggers change.
    event.target.value = "";
    if (file) setPendingFile(file);
  };

  const handleConfirmImport = () => {
    if (!pendingFile) return;
    importData.mutate(pendingFile, {
      onSuccess: () => {
        setImportOpen(false);
        setPendingFile(null);
      },
    });
  };

  return (
    <div className="h-dvh flex flex-col pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] bg-background">
      <header className="shrink-0 border-b border-border">
        <div className="flex h-14 items-center justify-end px-3 sm:px-6">
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="h-8 w-8 rounded-full overflow-hidden focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
                >
                  {user.image ? (
                    <img src={user.image} alt={user.name || "Profile"} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full bg-muted flex items-center justify-center text-muted-foreground text-sm font-medium">
                      {user.name?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link to="/dashboard" search={{ week: undefined }}>
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Habits
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/todo">
                    <CheckSquare className="mr-2 h-4 w-4" />
                    Tasks
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/reports" search={{ view: "month", date: undefined }}>
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Reports
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={(event) => {
                    event.preventDefault();
                    exportData.mutate();
                  }}
                  disabled={exportData.isPending}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export data
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setImportOpen(true)}>
                  <Upload className="mr-2 h-4 w-4" />
                  Import data
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </header>

      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={handleFileSelected}
      />

      <Dialog open={importOpen} onOpenChange={(open) => !open && closeImport()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import a backup</DialogTitle>
            <DialogDescription>
              Select a <span className="font-medium text-foreground">.json</span> backup file to add its habits,
              completions, categories, and tasks to your account. Existing data is kept — anything already present is
              skipped, so nothing is overwritten.{" "}
              <Link
                to="/import-guide"
                onClick={() => setImportOpen(false)}
                className="font-medium text-foreground underline underline-offset-2"
              >
                What does a valid file look like?
              </Link>
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center gap-3 rounded-lg border border-border p-3">
            <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={importData.isPending}>
              Choose file
            </Button>
            <span className={cn("truncate text-sm", pendingFile ? "text-foreground" : "text-muted-foreground")}>
              {pendingFile ? pendingFile.name : "No file selected"}
            </span>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeImport} disabled={importData.isPending}>
              Cancel
            </Button>
            <Button onClick={handleConfirmImport} disabled={!pendingFile || importData.isPending}>
              {importData.isPending ? "Importing…" : "Import"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <main className="flex-1 min-h-0">
        <Outlet />
      </main>
    </div>
  );
}
