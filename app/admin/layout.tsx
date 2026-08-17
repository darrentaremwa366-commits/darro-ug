import type { ReactNode } from "react";

/**
 * Admin route layout wrapper.
 *
 * Auth enforcement remains on each individual admin page
 * (overview/products/orders/etc. each call `getAdminUserFromRequest()`
 * and redirect to /admin/login when no session exists).
 *
 * We intentionally do NOT check auth here because this layout also
 * wraps /admin/login itself — and the login page MUST be reachable by
 * anonymous users so they can actually sign in.
 */
export default function AdminLayoutRoot({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}
