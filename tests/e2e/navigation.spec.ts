import { test, expect } from "./fixtures/auth";

test.describe("Navigation", () => {
  test("can navigate from habits to tasks", async ({ page }) => {
    await page.goto("/dashboard");

    // Wait for hydration before interacting
    await expect(async () => {
      await page.locator("button:has-text('E')").first().click();
      await expect(page.getByRole("menuitem", { name: "Tasks" })).toBeVisible();
    }).toPass({ timeout: 15000 });

    await page.getByRole("menuitem", { name: "Tasks" }).click();

    await expect(page).toHaveURL(/\/todo/);
    await expect(page.getByRole("heading", { name: "Tasks" })).toBeVisible();
  });

  test("can navigate from tasks to habits", async ({ page }) => {
    await page.goto("/todo");

    await expect(async () => {
      await page.locator("button:has-text('E')").first().click();
      await expect(page.getByRole("menuitem", { name: "Habits" })).toBeVisible();
    }).toPass({ timeout: 15000 });

    await page.getByRole("menuitem", { name: "Habits" }).click();

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByLabel("Create new habit")).toBeVisible();
  });
});
