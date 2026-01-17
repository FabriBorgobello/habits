import { createFileRoute, Link } from "@tanstack/react-router";
import { guestMiddleware } from "@/lib/guest-middleware";

export const Route = createFileRoute("/")({
	component: HomePage,
	server: {
		middleware: [guestMiddleware],
	},
});

function HomePage() {
	return (
		<div className="min-h-screen flex flex-col items-center justify-center px-4">
			<div className="text-center space-y-6">
				<h1 className="text-4xl font-semibold tracking-tight">Habits</h1>
				<Link
					to="/sign-in"
					className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors"
				>
					Sign in
				</Link>
			</div>
		</div>
	);
}
