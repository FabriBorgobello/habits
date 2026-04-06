// Nitro middleware that injects security headers into every response.
// Enabled via `serverDir: true` in the nitro() vite plugin (vite.config.ts).
//
// References:
//   - TanStack Start + Nitro middleware: https://github.com/TanStack/router/discussions/3028
//   - OWASP Secure Headers: https://owasp.org/www-project-secure-headers/
//   - CSP reference: https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP
//
// Note: CSP uses 'unsafe-inline' for scripts/styles because TanStack Start
// injects inline content. A nonce-based approach would be stricter but requires
// changes to the SSR shell.

import { defineMiddleware } from "h3";

const securityHeaders: Record<string, string> = {
  "Strict-Transport-Security":
    "max-age=63072000; includeSubDomains; preload",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy":
    "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  "X-DNS-Prefetch-Control": "on",
  "Content-Security-Policy":
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://accounts.google.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
};

export default defineMiddleware((event) => {
  for (const [name, value] of Object.entries(securityHeaders)) {
    event.res.headers.set(name, value);
  }
});
