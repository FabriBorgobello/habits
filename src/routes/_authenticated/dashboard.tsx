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
		<div className="px-6 py-8">
			<div className="max-w-3xl mx-auto space-y-8">
				{/* Header */}
				<div>
					<h1 className="text-2xl font-bold">Today</h1>
					<p className="text-sm text-muted-foreground mt-1">{today}</p>
				</div>

				{/* Empty State */}
				<div className="rounded-xl border border-border bg-card p-12">
					<div className="flex flex-col items-center justify-center text-center space-y-4">
						<div className="rounded-full bg-secondary p-4">
							<svg
								className="h-8 w-8 text-primary"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<title>Plus icon</title>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={1.5}
									d="M12 4v16m8-8H4"
								/>
							</svg>
						</div>
						<div className="space-y-2">
							<h2 className="text-lg font-semibold">No habits yet</h2>
							<p className="text-sm text-muted-foreground max-w-xs">
								Start building better habits. Create your first habit to begin
								tracking.
							</p>
						</div>
						<button
							type="button"
							className="mt-2 inline-flex h-10 items-center justify-center rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/90"
						>
							Create your first habit
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
