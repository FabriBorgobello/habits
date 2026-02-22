import { test, expect } from "./fixtures/auth";

test.describe("Dashboard", () => {
  test("authenticated user sees the dashboard", async ({ page }) => {
    await page.goto("/dashboard");

    await expect(page.getByLabel("Create new habit")).toBeVisible();
    await expect(page.getByText("Hide not due")).toBeVisible();
  });

  test("can create a habit via the modal", async ({ page }) => {
    await page.goto("/dashboard", { waitUntil: "networkidle" });

    await page.getByLabel("Create new habit").click();

    const nameInput = page.getByPlaceholder("e.g. Morning yoga");
    await expect(nameInput).toBeVisible({ timeout: 5000 });

    await nameInput.fill("E2E Test Habit");
    await page.getByRole("button", { name: "Add" }).click();

    await expect(page.getByText("E2E Test Habit")).toBeVisible({ timeout: 10000 });
  });
});
