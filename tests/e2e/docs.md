# E2E Testing Guide

## Setup

- **Framework**: Playwright (Chromium only)
- **Port**: 3001 (avoids conflicts with dev server on 3000)
- **Auth**: Each test gets a fresh user via `tests/e2e/fixtures/auth.ts`
- **Cleanup**: Test users are auto-deleted after each test

## Running Tests

```bash
pnpm test:e2e        # headless
pnpm test:e2e:ui     # interactive UI mode
```

## Writing Tests

### Always import from the auth fixture

```ts
import { test, expect } from "./fixtures/auth";
```

This gives you automatic authentication. Every test starts with a logged-in user and clean state.

For tests that need an unauthenticated user (e.g., landing page, redirects), import directly from Playwright:

```ts
import { test as base, expect } from "@playwright/test";
```

### Access the test user when needed

```ts
test("example", async ({ page, testUser }) => {
  // testUser has: id, email, name
});
```

### Structure

- One `.spec.ts` file per feature/page (e.g., `dashboard.spec.ts`, `todos.spec.ts`)
- Group related tests with `test.describe`
- Use descriptive test names that read as user actions: `"can create a habit via the modal"`

### Selectors (priority order)

1. `getByRole` - buttons, links, headings, menu items (`getByRole("button", { name: "Add" })`)
2. `getByLabel` - form fields, labeled elements (`getByLabel("Create new habit")`)
3. `getByPlaceholder` - inputs with placeholder text
4. `getByText` - visible text content
5. `getByTestId` - last resort, requires adding `data-testid` to the component

Avoid CSS selectors and XPath. They break when markup changes.

### Gotchas

**Dropdown menu items vs text**: When a habit name contains "Edit" or "Archive", `getByText("Edit")` will match both the habit name and the menu item. Always use `getByRole("menuitem", { name: "Edit" })` for dropdown actions.

**Hidden checkboxes**: Some checkboxes (e.g., todo items) use `sr-only` with click delegation to a parent div. Playwright can't click them normally. Use `{ force: true }`:

```ts
await page.getByLabel('Mark "My Task" as complete').click({ force: true });
```

**Test user has no avatar image**: The auth fixture creates users via email/password, not Google OAuth. The profile menu trigger renders a letter initial (div), not an img tag.

### Wait for hydration before interacting

TanStack Start uses SSR + hydration. Interactive elements may be visible before they're functional.

```ts
// Use networkidle for pages where you need to interact immediately
await page.goto("/dashboard", { waitUntil: "networkidle" });
```

### Use timeouts for async UI

```ts
await expect(page.getByText("New item")).toBeVisible({ timeout: 10000 });
```

Default timeout is 5s. Increase for actions that trigger server mutations.

### Each test creates its own data

- Don't rely on state from other tests
- Don't rely on specific data existing in the database
- Each test creates its own data and the fixture cleans up the user (cascade deletes all related data)
- For tests that need a habit, create it at the start of the test via the UI

## Test Coverage

| Feature | File | Tests |
|---------|------|-------|
| Auth redirects & landing page | `auth.spec.ts` | Guest redirect, landing page render |
| Dashboard & habits | `dashboard.spec.ts` | Empty state, create habit, custom frequency, toggle completion, edit, archive, week navigation |
| Tasks | `todos.spec.ts` | Empty state, create task, complete/uncomplete, delete |
| Navigation | `navigation.spec.ts` | Habits <-> Tasks via dropdown menu |

## CI

Tests run on every push/PR to `main` via `.github/workflows/e2e.yml`. The workflow:

1. Spins up a Postgres service container
2. Pushes the DB schema
3. Installs Playwright browsers
4. Runs all e2e tests
5. Uploads the Playwright HTML report as an artifact (available for 14 days)
