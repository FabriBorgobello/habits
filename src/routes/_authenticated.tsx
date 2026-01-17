import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
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
		<div className="min-h-screen">
			<header className="border-b">
				<div className="container flex h-16 items-center justify-between px-4">
					<Link to="/dashboard" className="font-semibold">
						Habits
					</Link>

					<div className="flex items-center gap-4">
						{user && (
							<div className="flex items-center gap-2">
								<span className="text-sm text-muted-foreground">
									{user.name}
								</span>
							</div>
						)}
						<button
							type="button"
							onClick={handleSignOut}
							className="text-sm text-muted-foreground hover:text-foreground transition-colors"
						>
							Sign out
						</button>
					</div>
				</div>
			</header>

			<main>
				<Outlet />
			</main>
		</div>
	);
}
