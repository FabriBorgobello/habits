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

### Access the test user when needed

```ts
test("example", async ({ page, testUser }) => {
  // testUser has: id, email, name
});
```

### Structure

- One `.spec.ts` file per feature/page (e.g., `dashboard.spec.ts`, `settings.spec.ts`)
- Group related tests with `test.describe`
- Use descriptive test names that read as user actions: `"can create a habit via the modal"`

### Selectors (priority order)

1. `getByRole` - buttons, links, headings (`getByRole("button", { name: "Add" })`)
2. `getByLabel` - form fields, labeled elements (`getByLabel("Create new habit")`)
3. `getByPlaceholder` - inputs with placeholder text
4. `getByText` - visible text content
5. `getByTestId` - last resort, requires adding `data-testid` to the component

Avoid CSS selectors and XPath. They break when markup changes.

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

### Keep tests independent

- Don't rely on state from other tests
- Don't rely on specific data existing in the database
- Each test creates its own data and the fixture cleans up the user (cascade deletes all related data)

## CI

Tests run on every push/PR to `main` via `.github/workflows/e2e.yml`. The workflow:

1. Spins up a Postgres service container
2. Pushes the DB schema
3. Installs Playwright browsers
4. Runs all e2e tests
5. Uploads the Playwright HTML report as an artifact (available for 14 days)
