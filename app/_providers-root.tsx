"use client";

import React, { Component, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { UIProvider } from "@/lib/ui";
import { CartProvider } from "@/lib/store";
import PublicChrome from "@/components/PublicChrome";
import CartDrawer from "@/components/CartDrawer";
import AnalyticsTracker from "@/components/AnalyticsTracker";

/**
 * Top-level error boundary. Catches ANY client-side render error
 * on either the public shop pages OR the admin dashboard and shows
 * a readable panel instead of a blank (black) screen.
 *
 * Replaces the pattern that caused React error #441:
 *   `next/dynamic(..., { ssr: false })` wrapped in Suspense causes
 *   a hydration mismatch when the server sends the "Loading…" fallback
 *   HTML but the client resolves the dynamic module during hydration
 *   itself → React sees two different DOM trees in the same commit
 *   and throws error 441 ("Suspense boundary updated during
 *   hydration").
 *
 * By using a plain static provider tree, both the server and the
 * client walk the exact same component hierarchy → identical DOM
 * → hydration matches → no #441.
 */
class RootErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; message: string }
> {
  state = { hasError: false, message: "" };

  static getDerivedStateFromError(err: Error) {
    return { hasError: true, message: err?.message || String(err) };
  }

  componentDidCatch(err: Error, info: unknown) {
    // eslint-disable-next-line no-console
    console.error("[root] error boundary caught:", err, info);
  }

  private handleReload = () => {
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100vh",
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#F7F5F2",
            color: "#1A1A1A",
            padding: 24,
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <div
            style={{
              maxWidth: 560,
              width: "100%",
              border: "1px solid #E8E4DD",
              background: "#FFFFFF",
              padding: 32,
            }}
          >
            <h1
              style={{
                fontSize: 16,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                margin: "0 0 16px",
              }}
            >
              Something went wrong
            </h1>
            <p
              style={{
                fontSize: 13,
                lineHeight: 1.6,
                color: "#5C5344",
                margin: "0 0 20px",
                fontFamily: "'JetBrains Mono', monospace",
                wordBreak: "break-word",
              }}
            >
              {this.state.message || "Unknown client-side error."}
            </p>
            <button
              onClick={this.handleReload}
              style={{
                background: "#A63D2F",
                color: "white",
                border: "none",
                padding: "12px 20px",
                fontSize: 12,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                cursor: "pointer",
              }}
            >
              Reload site
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

/**
 * Conditionally renders the cart-drawer and analytics tracker only
 * when the current pathname is NOT an admin route.
 *
 * Admin pages never need the cart drawer to be present (they have
 * their own sidebar). Keeping these components out of the admin
 * render tree avoids any chance they throw during hydration.
 */
function ShopFeaturesIfApplicable() {
  const pathname = usePathname() ?? "/";
  const isPublic = !pathname.startsWith("/admin") && pathname !== "/simulator";

  if (!isPublic) return null;

  return (
    <>
      <AnalyticsTracker />
      <CartDrawer />
    </>
  );
}

export default function RootProviders({ children }: { children: ReactNode }) {
  return (
    <RootErrorBoundary>
      <UIProvider>
        <CartProvider>
          <ShopFeaturesIfApplicable />
          <PublicChrome>{children}</PublicChrome>
        </CartProvider>
      </UIProvider>
    </RootErrorBoundary>
  );
}
