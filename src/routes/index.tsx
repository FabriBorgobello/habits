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
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 sm:px-6 py-4">
        <span className="text-lg font-semibold text-primary">Habits</span>
        <Link to="/sign-in" className="text-sm text-muted-foreground hover:text-foreground">
          Sign in
        </Link>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6">
        <div className="max-w-2xl text-center space-y-4 sm:space-y-6">
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight">
            Build better habits,
            <br />
            <span className="text-primary">one day at a time</span>
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-md mx-auto">
            Track your daily habits, build streaks, and become the best version of yourself.
          </p>
          <div className="pt-2 sm:pt-4">
            <Link
              to="/sign-in"
              className="inline-flex h-11 sm:h-12 items-center justify-center rounded-lg bg-primary px-6 sm:px-8 text-base font-medium text-primary-foreground hover:bg-primary/90"
            >
              Get started
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-4 sm:px-6 py-4 text-center text-xs sm:text-sm text-muted-foreground">
        <p>Simple habit tracking for a better life.</p>
      </footer>
    </div>
  );
}
