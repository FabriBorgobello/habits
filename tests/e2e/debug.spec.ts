import { test, expect } from "./fixtures/auth";

test("debug: check dashboard interactivity", async ({ page }) => {
  const errors: string[] = [];
  const consoleLogs: string[] = [];

  page.on("pageerror", (err) => errors.push(err.message));
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleLogs.push(msg.text());
  });

  await page.goto("/dashboard");

  // Wait for the button to exist
  const btn = page.getByLabel("Create new habit");
  await expect(btn).toBeVisible({ timeout: 15000 });

  // Check if React has hydrated by looking for React internal properties
  const isHydrated = await page.evaluate(() => {
    const el = document.querySelector('[aria-label="Create new habit"]');
    if (!el) return "button not found";
    const keys = Object.keys(el);
    const reactKey = keys.find(
      (k) => k.startsWith("__reactFiber") || k.startsWith("__reactInternalInstance"),
    );
    return reactKey ? `hydrated (${reactKey})` : `NOT hydrated (keys: ${keys.join(", ")})`;
  });

  console.log("Hydration status:", isHydrated);
  console.log("Page errors:", errors);
  console.log("Console errors:", consoleLogs);

  // Try clicking via Playwright
  await btn.click();
  await page.waitForTimeout(2000);

  // Check if modal appeared in DOM
  const modalCheck = await page.evaluate(() => {
    const overlay = document.querySelector("[data-vaul-overlay]");
    const drawer = document.querySelector("[data-vaul-drawer]");
    const input = document.querySelector('input[placeholder="e.g. Morning yoga"]');
    return {
      hasOverlay: !!overlay,
      hasDrawer: !!drawer,
      hasInput: !!input,
      bodyChildren: document.body.children.length,
      bodyHTML: document.body.innerHTML.substring(0, 500),
    };
  });

  console.log("Modal check after click:", JSON.stringify(modalCheck, null, 2));

  // Try dispatching click via JS
  await page.evaluate(() => {
    const el = document.querySelector('[aria-label="Create new habit"]');
    el?.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
  });
  await page.waitForTimeout(2000);

  const modalCheck2 = await page.evaluate(() => {
    const drawer = document.querySelector("[data-vaul-drawer]");
    const input = document.querySelector('input[placeholder="e.g. Morning yoga"]');
    return { hasDrawer: !!drawer, hasInput: !!input };
  });

  console.log("Modal check after JS click:", JSON.stringify(modalCheck2, null, 2));

  // This will fail with useful info if modal doesn't open
  expect(
    modalCheck.hasInput || modalCheck2.hasInput,
    `Modal never opened. Hydration: ${isHydrated}, Errors: ${errors.join("; ")}, Console: ${consoleLogs.join("; ")}`,
  ).toBe(true);
});
