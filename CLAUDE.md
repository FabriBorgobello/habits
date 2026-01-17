# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Plan Mode

- Make the plan extremely concise. Sacrifice grammar for the sake of concision.
- At the end of each plan, give me a list of unresolved questions to answer, if any.

## Project Overview

This is a full-stack React application built with TanStack Start (SSR framework), featuring authentication, database integration, and modern React patterns. The project uses file-based routing and includes both client-side and server-side rendering capabilities.

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

- **Better Auth**: Email/password auth configured in `src/lib/auth.ts`
- **Setup**: Requires `BETTER_AUTH_SECRET` in `.env.local` (generate with `npx @better-auth/cli secret`)
- **Client**: Auth client setup in `src/lib/auth-client.ts`
- **Routes**: Auth endpoints mounted at `/api/auth/*`

Currently runs in stateless mode. To persist users, add a database connection to the Better Auth config and run migrations.

### Database

- **ORM**: Drizzle ORM with PostgreSQL
- **Schema**: Defined in `src/db/schema.ts`
- **Config**: `drizzle.config.ts` reads from `DATABASE_URL` in `.env.local`
- **Connection**: Database client exported from `src/db/index.ts`

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
