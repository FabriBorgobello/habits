import { createFileRoute, Outlet } from "@tanstack/react-router";
import { authClient } from "@/lib/auth-client";
import { authMiddleware } from "@/lib/auth-middleware";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
  server: {
    middleware: [authMiddleware],
  },
});

function AuthenticatedLayout() {
  const { data: session } = authClient.useSession();
  const user = session?.user;

  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          window.location.href = "/";
        },
      },
    });
  };

  return (
    <div className="h-dvh flex flex-col pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] bg-card">
      <header className="shrink-0 border-b border-border bg-card">
        <div className="flex h-14 items-center justify-end px-6">
          <div className="flex items-center gap-4">
            {user && (
              <div className="flex items-center gap-3">
                {user.image && <img src={user.image} alt={user.name} className="h-8 w-8 rounded-full" />}
                <span className="text-sm text-foreground hidden sm:block">{user.name}</span>
              </div>
            )}
            <button
              type="button"
              onClick={handleSignOut}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 min-h-0">
        <Outlet />
      </main>
    </div>
  );
}
