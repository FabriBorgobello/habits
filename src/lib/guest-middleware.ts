import { redirect } from "@tanstack/react-router";
import { createMiddleware } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { auth } from "@/lib/auth";

/**
 * Middleware for guest-only routes (e.g., landing page, sign-in).
 * Redirects authenticated users to the dashboard.
 */
export const guestMiddleware = createMiddleware().server(async ({ next }) => {
  const headers = getRequestHeaders();
  const session = await auth.api.getSession({ headers });

  if (session) {
    throw redirect({ to: "/dashboard" });
  }

  return await next();
});
