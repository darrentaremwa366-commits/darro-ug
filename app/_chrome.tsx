"use client";

import React, { type ReactNode } from "react";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";

// Public (shop) providers — loaded only on public routes
const PublicProviders = dynamic(
  () => import("@/app/providers").then((m) => m.default),
  { ssr: false }
);
const PublicChrome = dynamic(
  () => import("@/components/PublicChrome").then((m) => m.default),
  { ssr: false }
);

// Admin providers — minimal set, loaded only on /admin/*
const AdminProviders = dynamic(
  () => import("@/app/admin/_providers").then((m) => m.default),
  { ssr: false }
);

/**
 * Route-aware chrome wrapper.
 *
 * Why this exists (as a client component with usePathname):
 *  - The Next.js root layout cannot reliably tell which segment is being
 *    rendered without reading headers that are not present on all Vercel
 *    runtime edges (x-next-pathname / x-invoke-path are not stable).
 *  - By using usePathname() inside a client component, we always know the
 *    exact URL path the browser is showing.
 *  - Using next/dynamic with ssr:false avoids rendering either provider
 *    tree on the server, so there's zero risk of cart/analytics code
 *    causing SSR errors on admin pages or vice versa.
 */
export default function RouteAwareChrome({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname() ?? "/";
  const isAdmin = pathname.startsWith("/admin") || pathname === "/simulator";

  if (isAdmin) {
    return (
      <SuspenseFallback>
        <AdminProviders>{children}</AdminProviders>
      </SuspenseFallback>
    );
  }

  return (
    <SuspenseFallback>
      <PublicProviders>
        <PublicChrome>{children}</PublicChrome>
      </PublicProviders>
    </SuspenseFallback>
  );
}

function SuspenseFallback({ children }: { children: ReactNode }) {
  return (
    <React.Suspense
      fallback={
        <div
          style={{
            minHeight: "100vh",
            width: "100%",
            background: "#F7F5F2",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "#5C5344",
          }}
        >
          Loading…
        </div>
      }
    >
      {children}
    </React.Suspense>
  );
}
