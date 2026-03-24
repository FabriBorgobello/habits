import { test, expect } from "./fixtures/auth";

test.describe("Dashboard", () => {
  test("authenticated user sees the dashboard", async ({ page }) => {
    await page.goto("/dashboard");

    await expect(page.getByLabel("Create new habit")).toBeVisible();
    await expect(page.getByText("Hide not due")).toBeVisible();
  });

  test("can create a habit via the modal", async ({ page }) => {
    await page.goto("/dashboard");

    const nameInput = page.getByPlaceholder("e.g. Morning yoga");
    // Retry click until modal opens (handles SSR hydration timing)
    await expect(async () => {
      await page.getByLabel("Create new habit").click();
      await expect(nameInput).toBeVisible();
    }).toPass({ timeout: 15000 });

    await nameInput.fill("E2E Test Habit");
    await page.getByRole("button", { name: "Add" }).click();

    await expect(page.getByText("E2E Test Habit")).toBeVisible();
  });

  test("can create a habit with custom frequency", async ({ page }) => {
    await page.goto("/dashboard");

    const nameInput = page.getByPlaceholder("e.g. Morning yoga");
    await expect(async () => {
      await page.getByLabel("Create new habit").click();
      await expect(nameInput).toBeVisible();
    }).toPass({ timeout: 15000 });

    await nameInput.fill("Weekly Habit");
    await page.getByRole("button", { name: "X times per week" }).click();
    await page.getByRole("button", { name: "Add" }).click();

    await expect(page.getByText("Weekly Habit")).toBeVisible();
  });

  test("can toggle habit completion", async ({ page }) => {
    await page.goto("/dashboard");

    const nameInput = page.getByPlaceholder("e.g. Morning yoga");
    await expect(async () => {
      await page.getByLabel("Create new habit").click();
      await expect(nameInput).toBeVisible();
    }).toPass({ timeout: 15000 });

    await nameInput.fill("Toggle Habit");
    await page.getByRole("button", { name: "Add" }).click();
    await expect(page.getByText("Toggle Habit")).toBeVisible();

    const today = new Date().toISOString().split("T")[0];
    const markButton = page.getByLabel(`Mark Toggle Habit as complete for ${today}`);
    await markButton.click();

    await expect(page.getByLabel(`Unmark Toggle Habit as complete for ${today}`)).toBeVisible();
  });

  test("can edit a habit", async ({ page }) => {
    await page.goto("/dashboard");

    const nameInput = page.getByPlaceholder("e.g. Morning yoga");
    await expect(async () => {
      await page.getByLabel("Create new habit").click();
      await expect(nameInput).toBeVisible();
    }).toPass({ timeout: 15000 });

    await nameInput.fill("Before Edit");
    await page.getByRole("button", { name: "Add" }).click();
    await expect(page.getByText("Before Edit")).toBeVisible();

    await page.getByLabel("Options for Before Edit").click();
    await page.getByRole("menuitem", { name: "Edit" }).click();

    const editInput = page.getByPlaceholder("e.g. Morning yoga");
    await expect(editInput).toBeVisible();
    await editInput.clear();
    await editInput.fill("After Edit");
    await page.getByRole("button", { name: "Save" }).click();

    await expect(page.getByText("After Edit")).toBeVisible();
    await expect(page.getByText("Before Edit")).not.toBeVisible();
  });

  test("can archive a habit", async ({ page }) => {
    await page.goto("/dashboard");

    const nameInput = page.getByPlaceholder("e.g. Morning yoga");
    await expect(async () => {
      await page.getByLabel("Create new habit").click();
      await expect(nameInput).toBeVisible();
    }).toPass({ timeout: 15000 });

    await nameInput.fill("To Archive");
    await page.getByRole("button", { name: "Add" }).click();
    await expect(page.getByText("To Archive")).toBeVisible();

    await page.getByLabel("Options for To Archive").click();
    await page.getByRole("menuitem", { name: "Archive" }).click();

    await expect(page.getByText("To Archive")).not.toBeVisible();
  });

  test("can navigate between weeks", async ({ page }) => {
    await page.goto("/dashboard");

    // Wait for hydration before interacting
    await expect(async () => {
      await page.getByLabel("Previous week").click();
      await expect(page.getByRole("button", { name: "Today" })).toBeVisible();
    }).toPass({ timeout: 15000 });

    await page.getByRole("button", { name: "Today" }).click();
    await expect(page.getByRole("button", { name: "Today" })).not.toBeVisible();
  });

  test("shows empty state for new user", async ({ page }) => {
    await page.goto("/dashboard");

    await expect(page.getByText("No habits yet. Create your first habit!")).toBeVisible();
  });
});
