"use client";

import React, { Component, type ReactNode } from "react";
import { UIProvider } from "@/lib/ui";

/**
 * Top-level error boundary that catches any client-side render error
 * inside the admin area and shows a readable message instead of a blank
 * (black) screen. This is critical on Vercel where hydration mismatches
 * or third-party provider issues would otherwise eat the whole page.
 */
class AdminErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; message: string }
> {
  state = { hasError: false, message: "" };

  static getDerivedStateFromError(err: Error) {
    return { hasError: true, message: err?.message || String(err) };
  }

  componentDidCatch(err: Error, info: unknown) {
    // eslint-disable-next-line no-console
    console.error("[admin] error boundary caught:", err, info);
  }

  private handleReload = () => {
    window.location.href = "/admin/login";
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
              maxWidth: 520,
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
              Back to Admin Login
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

/**
 * Minimal providers for admin routes.
 *
 * Intentionally does NOT include:
 *  - CartProvider (shop-only, depends on products JSON + localStorage)
 *  - CartDrawer
 *  - AnalyticsTracker
 *  - PublicChrome / Navbar / Footer
 *
 * These shop-only components previously loaded on every admin page and
 * were the most likely source of the black screen after the post-login
 * client-side redirect.
 */
export default function AdminProviders({ children }: { children: ReactNode }) {
  return (
    <AdminErrorBoundary>
      <UIProvider>{children}</UIProvider>
    </AdminErrorBoundary>
  );
}
