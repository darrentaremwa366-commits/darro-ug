"use client";

import { type ReactNode } from "react";

/**
 * Admin providers — kept for compatibility because the previous
 * implementation of the root layout would import this dynamically.
 *
 * Now the root-level RootProviders in app/_providers-root.tsx already
 * handles:
 *   - UIProvider (for sidebar/mobile interactions)
 *   - CartProvider (context is harmless on admin, cart is empty)
 *   - Top-level RootErrorBoundary (shows readable message instead of black screen)
 *
 * And ShopFeaturesIfApplicable conditionally excludes CartDrawer +
 * AnalyticsTracker on /admin/* routes.
 *
 * So this wrapper has no additional work to do — just pass children
 * through. We keep the file so the import chain stays consistent
 * with admin/layout.tsx (which currently doesn't use this module
 * anymore, but keeping the module avoids breakage if any future
 * code path re-imports it).
 */
export default function AdminProviders({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
