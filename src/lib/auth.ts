import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { testUtils } from "better-auth/plugins";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { db } from "@/db/index.ts";
import * as schema from "@/db/schema.ts";
import { env } from "@/env.ts";

const isTest = process.env.NODE_ENV === "test";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
  },
  ...(isTest
    ? {
        emailAndPassword: { enabled: true },
        user: { deleteUser: { enabled: true } },
      }
    : {}),
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  trustedOrigins:
    process.env.NODE_ENV === "production"
      ? ["https://habits.f0.ar"]
      : ["http://localhost:3000", "http://localhost:3001", "https://habits.f0.ar"],
  plugins: [...(isTest ? [testUtils()] : []), tanstackStartCookies()],
});
