# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Plan Mode

- Make the plan extremely concise. Sacrifice grammar for the sake of concision.
- At the end of each plan, give me a list of unresolved questions to answer, if any.

This codebase will outlive you. Every shortcut you take becomes
someone else's burden. Every hack compounds into technical debt
that slows the whole team down.

You are not just writing code. You are shaping the future of this
project. The patterns you establish will be copied. The corners
you cut will be cut again.

Fight entropy. Leave the codebase better than you found it.

## Project Overview

This is a personal habit tracking application built with TanStack Start (SSR framework), featuring authentication, database integration, and modern React patterns. The project uses file-based routing and includes both client-side and server-side rendering capabilities.

### Product Vision

**MVP Scope**: Single-user habit tracker focused on simplicity and core tracking functionality.

**Core Features**:
- Daily and frequency-based habit tracking (e.g., 3x per week)
- Category/tag organization (Health, Productivity, etc.)
- Streak tracking and completion rates
- Calendar view with completion history
- Simple progress statistics

**Out of Scope (Post-MVP)**: Notifications, advanced analytics, social features, mobile app, gamification, time-based or quantifiable tracking.

## Development Commands

```bash
# Development
pnpm dev              # Start dev server on port 3000
pnpm build            # Build for production
pnpm preview          # Preview production build

# Testing
pnpm test             # Run tests with Vitest

# Code Quality
pnpm lint             # Lint with Biome
pnpm format           # Format with Biome
pnpm check            # Check linting and formatting

# Database (Drizzle ORM)
pnpm db:generate      # Generate migrations
pnpm db:migrate       # Run migrations
pnpm db:push          # Push schema directly to DB
pnpm db:pull          # Pull schema from DB
pnpm db:studio        # Open Drizzle Studio

# Shadcn Components
pnpm dlx shadcn@latest add <component-name>
```

## Architecture

### TanStack Start + Nitro

This project uses TanStack Start with Nitro for server-side rendering and API routes. Key architectural patterns:

- **File-based routing**: Routes are defined in `src/routes/` with automatic code generation
- **Hybrid rendering**: Supports full SSR, data-only SSR, and SPA mode per route
- **Server functions**: Use `createServerFn()` to define type-safe server functions callable from client code

### Routing Structure

- Routes live in `src/routes/`
- Root layout: `src/routes/__root.tsx` (includes Header and devtools)
- API routes: Use the `server.handlers` pattern (see `src/routes/api/auth/$.ts`)
- Router configuration: `src/router.tsx` integrates QueryClient context

Example API route:

```typescript
export const Route = createFileRoute("/api/path")({
  server: {
    handlers: {
      GET: ({ request }) => {
        /* handler */
      },
      POST: ({ request }) => {
        /* handler */
      },
    },
  },
});
```

Example server function in a route:

```typescript
const myServerFn = createServerFn({ method: "POST" })
  .inputValidator((d: Type) => d)
  .handler(async ({ data }) => {
    /* server-side logic */
  });
```

### State Management & Data Fetching

- **TanStack Query**: Configured with SSR support via `setupRouterSsrQueryIntegration()`
- **Context setup**: Query client is created in `src/integrations/tanstack-query/root-provider.tsx`
- **Router context**: QueryClient is passed to router context for SSR query hydration

Both route loaders (built into TanStack Router) and TanStack Query are available for data fetching.

### Authentication

- **Better Auth**: Google OAuth configured in `src/lib/auth.ts`
- **Provider**: Google OAuth 2.0 (single sign-on)
- **Client**: Auth client setup in `src/lib/auth-client.ts`
- **Routes**: Auth endpoints mounted at `/api/auth/*`
- **Database**: User sessions and accounts stored in PostgreSQL

**Required Secrets** (managed via Infisical at https://infisical.f0.ar):
- `GOOGLE_CLIENT_ID`: OAuth client ID from Google Cloud Console
- `GOOGLE_CLIENT_SECRET`: OAuth client secret from Google Cloud Console
- `BETTER_AUTH_SECRET`: Session secret (generate with `npx @better-auth/cli secret`)
- `DATABASE_URL`: PostgreSQL connection string

**OAuth Redirect URIs** (configure in Google Cloud Console):
- Development: `http://localhost:3000/api/auth/callback/google`
- Production: `https://habits.f0.ar/api/auth/callback/google`

### Database

- **ORM**: Drizzle ORM with PostgreSQL
- **Schema**: Defined in `src/db/schema.ts`
- **Config**: `drizzle.config.ts` reads from `DATABASE_URL` in `.env.local`
- **Connection**: Database client exported from `src/db/index.ts`

**Data Model**:

```typescript
// habits table
{
  id: uuid (PK)
  userId: uuid (FK -> users)
  name: string
  description: string?
  category: string
  colorHex: string?
  icon: string?
  frequency: 'daily' | 'custom'
  frequencyConfig: json? // { type: 'weekly', count: 3 }
  isArchived: boolean
  createdAt: timestamp
  updatedAt: timestamp
}

// habit_completions table
{
  id: uuid (PK)
  habitId: uuid (FK -> habits)
  completedDate: date // date only, not timestamp
  createdAt: timestamp
}

// Indexes: userId, habitId+completedDate (unique constraint)
```

### Environment Variables

- **Type-safe env**: T3 Env library in `src/env.ts`
- **Client vars**: Must be prefixed with `VITE_`
- **Files**: Load from `.env.local` or `.env`

### UI & Styling

- **Tailwind CSS v4**: Configured via `@tailwindcss/vite` plugin
- **Shadcn**: UI components in `src/components/ui/`
- **Path alias**: `@/` maps to `src/`

### Devtools

Unified TanStack Devtools panel (bottom-right) includes:

- TanStack Router Devtools
- TanStack Query Devtools
- Configured in `__root.tsx`

## Demo Files

Files prefixed with `demo.` or in `src/routes/demo/` can be safely deleted. They demonstrate:

- TanStack Form usage
- Better Auth integration
- Drizzle ORM queries
- Server functions
- SSR modes (full SSR, data-only, SPA)
- TanStack Query patterns

## Key Files to Understand

- `vite.config.ts`: Vite plugins including Nitro, TanStack Start, Tailwind
- `src/router.tsx`: Router creation with QueryClient integration
- `src/routes/__root.tsx`: Shell component with layout and devtools
- `src/integrations/tanstack-query/root-provider.tsx`: QueryClient setup
- `drizzle.config.ts`: Database configuration

## Conventions

- Use Biome for linting and formatting (not ESLint/Prettier)
- Database schema changes require running `pnpm db:generate` to create migrations
- Server-side code can use Node.js APIs (fs, path, etc.)
- Client-side code must use `VITE_` prefixed env vars

## Code Patterns

### Type Safety with Drizzle Zod

Use `drizzle-zod` to extract Zod schemas from Drizzle table definitions for type-safe validation:

```typescript
// src/db/schema.ts
import { pgTable, uuid, text, boolean, timestamp } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

export const habits = pgTable('habits', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  // ... columns
});

// Export Zod schemas (single source of truth)
export const insertHabitSchema = createInsertSchema(habits);
export const selectHabitSchema = createSelectSchema(habits);

// Export TypeScript types
export type Habit = typeof habits.$inferSelect;
export type NewHabit = typeof habits.$inferInsert;
```

Use in server functions:

```typescript
const createHabitFn = createServerFn({ method: 'POST' })
  .validator((data: unknown) => insertHabitSchema.parse(data))
  .handler(async ({ data }) => {
    // data is fully typed and validated
  });
```

### Runtime Assertions with Tiny Invariant

Use `tiny-invariant` for cleaner runtime type assertions and error handling:

```typescript
import invariant from 'tiny-invariant';

// Instead of:
if (!user) throw new Error('User not found');

// Use:
invariant(user, 'User not found');
// TypeScript now knows user is non-null below this line

// Works great with database queries:
const habit = await db.query.habits.findFirst({ where: eq(habits.id, id) });
invariant(habit, 'Habit not found');
// habit is now typed as non-null
```

Benefits:
- ✅ Single source of truth for data types (Drizzle schema)
- ✅ Automatic validation on server functions
- ✅ Type safety between DB, server, and client
- ✅ Cleaner runtime assertions and type narrowing
