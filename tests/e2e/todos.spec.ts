import { test, expect } from "./fixtures/auth";

test.describe("Tasks", () => {
  test("shows empty state", async ({ page }) => {
    await page.goto("/todo");

    await expect(page.getByRole("heading", { name: "Tasks" })).toBeVisible();
    await expect(page.getByText("No tasks yet. Add one above!")).toBeVisible();
  });

  test("can create a task", async ({ page }) => {
    await page.goto("/todo");
    // Wait for hydration + data load
    await expect(page.getByText("No tasks yet. Add one above!")).toBeVisible();

    await page.getByPlaceholder("Add a task...").fill("My E2E Task");
    await page.getByPlaceholder("Add a task...").press("Enter");

    await expect(page.getByText("My E2E Task")).toBeVisible();
    await expect(page.getByText("Pending (1)")).toBeVisible();
  });

  test("can complete and uncomplete a task", async ({ page }) => {
    await page.goto("/todo");
    await expect(page.getByText("No tasks yet. Add one above!")).toBeVisible();

    await page.getByPlaceholder("Add a task...").fill("Complete Me");
    await page.getByPlaceholder("Add a task...").press("Enter");
    await expect(page.getByText("Complete Me")).toBeVisible();

    await page.getByLabel('Mark "Complete Me" as complete').click({ force: true });
    await expect(page.getByText("Completed (1)")).toBeVisible();

    await page.getByLabel('Unmark "Complete Me" as complete').click({ force: true });
    await expect(page.getByText("Pending (1)")).toBeVisible();
  });

  test("can delete a task", async ({ page }) => {
    await page.goto("/todo");
    await expect(page.getByText("No tasks yet. Add one above!")).toBeVisible();

    await page.getByPlaceholder("Add a task...").fill("Delete Me");
    await page.getByPlaceholder("Add a task...").press("Enter");
    await expect(page.getByText("Delete Me")).toBeVisible();

    await page.getByLabel('Delete "Delete Me"').click();

    await expect(page.getByText("Delete Me")).not.toBeVisible();
  });
});
