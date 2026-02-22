import { test as base, expect } from "@playwright/test";

base.describe("Authentication", () => {
  base("unauthenticated user is redirected to landing page", async ({ page }) => {
    await page.goto("http://localhost:3001/dashboard");

    await expect(page).toHaveURL("http://localhost:3001/", { timeout: 10000 });
    await expect(page.getByRole("button", { name: "Continue with Google" })).toBeVisible();
  });

  base("landing page renders for guests", async ({ page }) => {
    await page.goto("http://localhost:3001/");

    await expect(page.getByText("Build better habits,")).toBeVisible();
    await expect(page.getByText("one day at a time")).toBeVisible();
    await expect(page.getByRole("button", { name: "Continue with Google" })).toBeVisible();
  });
});
