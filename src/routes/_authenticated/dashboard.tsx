import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/dashboard")({
	component: DashboardPage,
});

function DashboardPage() {
	const today = new Date().toLocaleDateString("en-US", {
		weekday: "long",
		month: "long",
		day: "numeric",
	});

	return (
		<div className="container max-w-4xl px-4 py-8">
			<div className="space-y-8">
				<div>
					<h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
					<p className="text-sm text-muted-foreground mt-1">{today}</p>
				</div>

				<div className="rounded-lg border border-dashed p-12">
					<div className="flex flex-col items-center justify-center text-center space-y-4">
						<div className="rounded-full bg-muted p-3">
							<svg
								className="h-6 w-6 text-muted-foreground"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<title>Plus icon</title>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M12 4v16m8-8H4"
								/>
							</svg>
						</div>
						<div className="space-y-2">
							<h2 className="text-xl font-semibold">No habits yet</h2>
							<p className="text-sm text-muted-foreground max-w-sm">
								Get started by creating your first habit to track
							</p>
						</div>
						<button
							type="button"
							className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors"
						>
							Create habit
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
