import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { authClient } from "@/lib/auth-client";
import { guestMiddleware } from "@/lib/guest-middleware";

export const Route = createFileRoute("/")({
  component: HomePage,
  server: {
    middleware: [guestMiddleware],
  },
});

function HomePage() {
  const handleGoogleSignIn = async () => {
    await authClient.signIn.social({
      provider: "google",
      callbackURL: "/dashboard",
    });
  };

  return (
    <div className="min-h-svh flex flex-col pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]">
      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6">
        <div className="max-w-2xl text-center space-y-4 sm:space-y-6">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="text-3xl sm:text-5xl font-bold tracking-tight"
          >
            Build better habits,
            <br />
            <span className="text-primary">one day at a time</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
            className="text-base sm:text-lg text-muted-foreground max-w-md mx-auto"
          >
            Track your daily habits, build streaks, and become the best version of yourself.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
            className="pt-2 sm:pt-4"
          >
            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="inline-flex h-11 sm:h-12 items-center justify-center gap-3 rounded-lg bg-primary px-6 sm:px-8 text-base font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <title>Google logo</title>
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </button>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
