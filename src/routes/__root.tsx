import type { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext, HeadContent, Link, Scripts } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import appCss from "../styles.css?url";

function NotFound() {
  return (
    <div className="grid min-h-svh place-items-center bg-background text-foreground">
      <div className="text-center">
        <p className="text-8xl font-bold text-primary">404</p>
        <p className="mt-4 text-lg text-muted-foreground">Page not found</p>
        <Button asChild className="mt-6">
          <Link to="/">
            <ChevronLeft />
            Back to home
          </Link>
        </Button>
      </div>
    </div>
  );
}

interface MyRouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  notFoundComponent: NotFound,
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1, viewport-fit=cover",
      },
      { title: "Habits — Daily Habit Tracker & Streak Builder" },
      {
        name: "description",
        content:
          "Track your daily habits, build streaks, and stay consistent. A simple habit tracker to help you become your best self.",
      },
      { name: "theme-color", content: "#1c1917" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      {
        name: "apple-mobile-web-app-status-bar-style",
        content: "black-translucent",
      },
      // Open Graph
      {
        property: "og:title",
        content: "Habits — Daily Habit Tracker & Streak Builder",
      },
      {
        property: "og:description",
        content:
          "Track your daily habits, build streaks, and stay consistent. A simple habit tracker to help you become your best self.",
      },
      { property: "og:url", content: "https://habits.f0.ar" },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "Habits" },
      { property: "og:image", content: "https://habits.f0.ar/og-image.png" },
      // Twitter Card
      { name: "twitter:card", content: "summary_large_image" },
      {
        name: "twitter:title",
        content: "Habits — Daily Habit Tracker & Streak Builder",
      },
      {
        name: "twitter:description",
        content:
          "Track your daily habits, build streaks, and stay consistent. A simple habit tracker to help you become your best self.",
      },
      {
        name: "twitter:image",
        content: "https://habits.f0.ar/og-image.png",
      },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "canonical", href: "https://habits.f0.ar/" },
      { rel: "manifest", href: "/manifest.json" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
      {
        rel: "icon",
        type: "image/png",
        sizes: "32x32",
        href: "/favicon-32x32.png",
      },
      {
        rel: "icon",
        type: "image/png",
        sizes: "16x16",
        href: "/favicon-16x16.png",
      },
    ],
    scripts: [
      {
        children: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', function() {
              navigator.serviceWorker.register('/sw.js').catch(function(err) {
                console.log('ServiceWorker registration failed:', err);
              });
            });
          }
        `,
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "Habits",
          description:
            "Track your daily habits, build streaks, and stay consistent.",
          applicationCategory: "LifestyleApplication",
          operatingSystem: "Web",
          url: "https://habits.f0.ar",
          offers: {
            "@type": "Offer",
            price: "0",
            priceCurrency: "USD",
          },
        }),
      },
    ],
  }),

  shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Toaster />
        <Scripts />
      </body>
    </html>
  );
}
