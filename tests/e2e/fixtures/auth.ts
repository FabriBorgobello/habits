import { test as base } from "@playwright/test";

interface TestUser {
  id: string;
  email: string;
  name: string;
}

const TEST_PASSWORD = "Test123456!";

async function createTestUserAndLogin(baseURL: string) {
  const email = `test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@e2e.test`;
  const name = "E2E Test User";

  const signUpRes = await fetch(`${baseURL}/api/auth/sign-up/email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      origin: baseURL,
    },
    body: JSON.stringify({ email, password: TEST_PASSWORD, name }),
  });

  if (!signUpRes.ok) {
    const text = await signUpRes.text();
    throw new Error(`Failed to sign up test user: ${signUpRes.status} ${text}`);
  }

  const signUpData = await signUpRes.json();
  const userId = signUpData.user?.id;
  if (!userId) throw new Error("No user ID returned from sign-up");

  const setCookieHeaders = signUpRes.headers.getSetCookie();

  return {
    user: { id: userId, email, name } as TestUser,
    cookies: setCookieHeaders,
  };
}

function parseSetCookieHeaders(setCookieHeaders: string[], baseURL: string) {
  const url = new URL(baseURL);
  return setCookieHeaders.map((header) => {
    const [nameValue, ...attrs] = header.split(";").map((s) => s.trim());
    const [name, ...valueParts] = nameValue.split("=");
    const value = valueParts.join("=");

    const attrMap: Record<string, string> = {};
    for (const attr of attrs) {
      const [key, ...val] = attr.split("=");
      attrMap[key.toLowerCase()] = val.join("=") || "true";
    }

    return {
      name,
      value,
      domain: url.hostname,
      path: attrMap.path || "/",
      httpOnly: "httponly" in attrMap,
      secure: "secure" in attrMap,
      sameSite: (attrMap.samesite as "Strict" | "Lax" | "None") || "Lax",
    };
  });
}

export const test = base.extend<{ testUser: TestUser }>({
  testUser: [
    async ({ page, baseURL }, use) => {
      const url = baseURL || "http://localhost:3001";

      const { user, cookies } = await createTestUserAndLogin(url);

      const parsedCookies = parseSetCookieHeaders(cookies, url);
      await page.context().addCookies(parsedCookies);

      await use(user);

      try {
        await fetch(`${url}/api/auth/delete-user`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            origin: url,
            cookie: cookies.map((c) => c.split(";")[0]).join("; "),
          },
          body: JSON.stringify({ password: TEST_PASSWORD }),
        });
      } catch {
        // Best-effort cleanup
      }
    },
    { auto: true },
  ],
});

export { expect } from "@playwright/test";
