"use client";

import { useEffect, useRef } from "react";

type EventName =
  | "page_view"
  | "product_view"
  | "add_to_cart"
  | "remove_from_cart"
  | "begin_checkout"
  | "purchase"
  | "search";

interface EventPayload {
  event_id: string;
  event_name: EventName;
  page_path: string;
  referrer: string;
  consent_state: ConsentState;
  schema_version: 1;
  visitor_id?: string;
  session_id?: string;
  props: Record<string, unknown>;
}

interface CartStoredItem {
  productId: number;
  slug: string;
  name: string;
  priceUGX: number;
  size: string;
  quantity: number;
  image: string;
  memberApplied?: boolean;
}

const CART_KEY = "darro_cart";
const VISITOR_COOKIE = "darro_visitor";
const SESSION_COOKIE = "darro_session";
const CONSENT_KEY = "darro_cookie_consent";

type ConsentState = "granted" | "denied" | "pending";

function readConsent(): ConsentState {
  if (typeof localStorage === "undefined") return "pending";
  try {
    const v = localStorage.getItem(CONSENT_KEY);
    if (v === "granted") return "granted";
    if (v === "denied") return "denied";
  } catch {
    /* ignore */
  }
  return "pending";
}

function currentConsent(): ConsentState {
  if (typeof window !== "undefined" && (window as any).__darroAnalyticsConsent) {
    return (window as any).__darroAnalyticsConsent;
  }
  return readConsent();
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp("(^|; )" + name.replace(/([.$?*|{}()[\]\\/+^])/g, "\\$1") + "=([^;]*)")
  );
  return match ? decodeURIComponent(match[2]) : null;
}

function setCookie(name: string, value: string, days: number): void {
  if (typeof document === "undefined") return;
  // Never write tracking cookies unless consent is explicitly granted.
  if (currentConsent() !== "granted") return;
  const expires = new Date(Date.now() + days * 86400000).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function sendEvent(payload: EventPayload): void {
  if (typeof navigator === "undefined") return;

  // Respect consent: Deny = skip entirely. Pending = still send but tagged
  // "pending" so the server can drop or retain them per your policy (we
  // keep pending but don't set cookies).
  const consent = currentConsent();
  if (consent === "denied") return;
  payload.consent_state = consent;

  const body = JSON.stringify(payload);
  try {
    if (typeof navigator.sendBeacon === "function") {
      const ok = navigator.sendBeacon("/api/analytics/event", body);
      if (ok) return;
    }
  } catch {
    // fallthrough
  }
  try {
    void fetch("/api/analytics/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
      credentials: "same-origin",
    });
  } catch {
    // swallow
  }
}

function makeEvent(eventName: EventName, props: Record<string, unknown> = {}): EventPayload {
  const visitorId = getCookie(VISITOR_COOKIE) || undefined;
  const sessionId = getCookie(SESSION_COOKIE) || undefined;
  const page_path =
    typeof window !== "undefined"
      ? window.location.pathname + window.location.search
      : "";
  const referrer = typeof document !== "undefined" ? document.referrer : "";
  return {
    event_id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : String(Date.now()) + "-" + Math.random().toString(36).slice(2),
    event_name: eventName,
    page_path,
    referrer,
    consent_state: currentConsent(),
    schema_version: 1,
    visitor_id: visitorId,
    session_id: sessionId,
    props,
  };
}

function cartKey(it: CartStoredItem): string {
  return `${it.productId}|${it.size}`;
}

export default function AnalyticsTracker() {
  const lastPathRef = useRef<string>("");
  const lastCartRef = useRef<Map<string, CartStoredItem>>(new Map());
  const lastProductRef = useRef<string>("");
  const lastCheckoutFiredRef = useRef<string>("");
  const lastPurchaseFiredRef = useRef<number>(0);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let mounted = true;

    const firePageView = () => {
      const path = window.location.pathname + window.location.search;
      if (lastPathRef.current === path) return;
      lastPathRef.current = path;
      sendEvent(makeEvent("page_view"));

      const productMatch = window.location.pathname.match(/^\/shop\/([^/?#]+)/);
      if (productMatch) {
        const slug = productMatch[1];
        if (lastProductRef.current !== slug) {
          lastProductRef.current = slug;
          sendEvent(makeEvent("product_view", { product_slug: slug }));
        }
      } else {
        lastProductRef.current = "";
      }

      if (window.location.pathname === "/cart") {
        try {
          const raw = window.localStorage.getItem(CART_KEY);
          if (raw) {
            const parsed = JSON.parse(raw) as { items?: CartStoredItem[] };
            if (parsed.items && parsed.items.length > 0) {
              const sig = parsed.items
                .map((i) => `${i.productId}-${i.size}-${i.quantity}`)
                .join("|");
              if (lastCheckoutFiredRef.current !== sig) {
                lastCheckoutFiredRef.current = sig;
                sendEvent(
                  makeEvent("begin_checkout", {
                    cart_id: "cart_" + sig.slice(0, 32),
                    items: parsed.items.map((i) => ({
                      product_id: String(i.productId),
                      product_slug: i.slug,
                      product_name: i.name,
                      variant_name: i.size,
                      qty: i.quantity,
                      unit_price_cents: i.priceUGX,
                    })),
                  })
                );
              }
            }
          }
        } catch {
          // ignore
        }
      }
    };

    firePageView();

    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    history.pushState = function (...args: Parameters<typeof originalPushState>) {
      originalPushState.apply(this, args);
      window.dispatchEvent(new Event("analytics:routechange"));
    };
    history.replaceState = function (...args: Parameters<typeof originalReplaceState>) {
      originalReplaceState.apply(this, args);
      window.dispatchEvent(new Event("analytics:routechange"));
    };

    const onPopState = () => window.dispatchEvent(new Event("analytics:routechange"));
    window.addEventListener("popstate", onPopState);
    window.addEventListener("analytics:routechange", firePageView);
    window.addEventListener("hashchange", firePageView);

    const cartPoll = setInterval(() => {
      if (!mounted) return;
      try {
        const raw = window.localStorage.getItem(CART_KEY);
        if (!raw) {
          if (lastCartRef.current.size > 0) {
            for (const [key, it] of lastCartRef.current) {
              sendEvent(
                makeEvent("remove_from_cart", {
                  product_id: String(it.productId),
                  product_slug: it.slug,
                  product_name: it.name,
                  qty: it.quantity,
                  unit_price_cents: it.priceUGX,
                  variant_name: it.size,
                  image: it.image,
                })
              );
            }
            lastCartRef.current = new Map();
          }
          return;
        }
        const parsed = JSON.parse(raw) as { items?: CartStoredItem[] };
        const items = Array.isArray(parsed.items) ? parsed.items : [];
        const currentMap = new Map<string, CartStoredItem>();
        for (const it of items) {
          currentMap.set(cartKey(it), it);
        }

        for (const [key, it] of currentMap) {
          const prev = lastCartRef.current.get(key);
          if (!prev) {
            sendEvent(
              makeEvent("add_to_cart", {
                product_id: String(it.productId),
                product_slug: it.slug,
                product_name: it.name,
                qty: it.quantity,
                unit_price_cents: it.priceUGX,
                variant_name: it.size,
                image: it.image,
                cart: {
                  id: "cart_" + window.location.hostname.slice(0, 8),
                  items: items.map((i) => ({
                    product_id: String(i.productId),
                    product_slug: i.slug,
                    product_name: i.name,
                    variant_name: i.size,
                    qty: i.quantity,
                    unit_price_cents: i.priceUGX,
                    cogs_cents: Math.floor(i.priceUGX * 0.45),
                  })),
                },
                item: {
                  product_id: String(it.productId),
                  product_slug: it.slug,
                  product_name: it.name,
                  variant_name: it.size,
                  qty: it.quantity,
                  unit_price_cents: it.priceUGX,
                  cogs_cents: Math.floor(it.priceUGX * 0.45),
                },
              })
            );
          } else if (prev.quantity !== it.quantity) {
            const qtyDiff = it.quantity - prev.quantity;
            if (qtyDiff > 0) {
              sendEvent(
                makeEvent("add_to_cart", {
                  product_id: String(it.productId),
                  product_slug: it.slug,
                  product_name: it.name,
                  qty: qtyDiff,
                  unit_price_cents: it.priceUGX,
                  variant_name: it.size,
                  image: it.image,
                  cart: {
                    id: "cart_" + window.location.hostname.slice(0, 8),
                    items: items.map((i) => ({
                      product_id: String(i.productId),
                      product_slug: i.slug,
                      product_name: i.name,
                      variant_name: i.size,
                      qty: i.quantity,
                      unit_price_cents: i.priceUGX,
                    })),
                  },
                })
              );
            } else {
              sendEvent(
                makeEvent("remove_from_cart", {
                  product_id: String(it.productId),
                  product_slug: it.slug,
                  product_name: it.name,
                  qty: Math.abs(qtyDiff),
                  unit_price_cents: it.priceUGX,
                  variant_name: it.size,
                  image: it.image,
                })
              );
            }
          }
        }

        for (const [key, prev] of lastCartRef.current) {
          if (!currentMap.has(key)) {
            sendEvent(
              makeEvent("remove_from_cart", {
                product_id: String(prev.productId),
                product_slug: prev.slug,
                product_name: prev.name,
                qty: prev.quantity,
                unit_price_cents: prev.priceUGX,
                variant_name: prev.size,
                image: prev.image,
              })
            );
          }
        }

        lastCartRef.current = currentMap;
      } catch {
        // ignore parse errors
      }
    }, 500);

    const onDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const anchor = target.closest("a") as HTMLAnchorElement | null;
      if (!anchor || !anchor.href) return;
      if (anchor.href.includes("wa.me")) {
        if (Date.now() - lastPurchaseFiredRef.current < 2000) return;
        try {
          const raw = window.localStorage.getItem(CART_KEY);
          if (raw) {
            const parsed = JSON.parse(raw) as { items?: CartStoredItem[]; memberDiscountActive?: boolean };
            const items = Array.isArray(parsed.items) ? parsed.items : [];
            if (items.length > 0) {
              lastPurchaseFiredRef.current = Date.now();
              let gross = 0;
              let discount = 0;
              for (const i of items) {
                gross += i.priceUGX * i.quantity;
              }
              sendEvent(
                makeEvent("purchase", {
                  order_number: `DRR-${String(Date.now()).slice(-6)}`,
                  cart: {
                    id: "cart_" + window.location.hostname.slice(0, 8),
                    items: items.map((i) => ({
                      product_id: String(i.productId),
                      product_slug: i.slug,
                      product_name: i.name,
                      variant_name: i.size,
                      qty: i.quantity,
                      unit_price_cents: i.priceUGX,
                      cogs_cents: Math.floor(i.priceUGX * 0.45),
                    })),
                    total_regular: gross,
                    total_member: gross,
                  },
                  discount_cents: discount,
                  total_items: items.reduce((s, i) => s + i.quantity, 0),
                  payment_method: "whatsapp",
                })
              );
            }
          }
        } catch {
          // ignore
        }
      }
    };

    const onSearchSubmit = (e: Event) => {
      const form = e.target as HTMLFormElement;
      if (!form || !(form instanceof HTMLFormElement)) return;
      const input = form.querySelector("input[type='text'], input:not([type])") as HTMLInputElement | null;
      if (!input || !input.value) return;
      const pagePath = window.location.pathname + window.location.search;
      const onShop = pagePath.startsWith("/shop");
      const formAncestor = form.closest("header, nav");
      const isNavbarForm = !!formAncestor;
      if (onShop || isNavbarForm) {
        sendEvent(makeEvent("search", { search_query: input.value.trim() }));
      }
    };

    const onDarroPurchase = (e: Event) => {
      const ce = e as CustomEvent<Record<string, unknown>>;
      const props = (ce.detail && typeof ce.detail === "object" ? ce.detail : {}) as Record<string, unknown>;
      sendEvent(makeEvent("purchase", props));
    };

    document.addEventListener("click", onDocumentClick, true);
    document.addEventListener("submit", onSearchSubmit, true);
    document.addEventListener("darro:purchase", onDarroPurchase as EventListener);

    return () => {
      mounted = false;
      clearInterval(cartPoll);
      window.removeEventListener("popstate", onPopState);
      window.removeEventListener("analytics:routechange", firePageView);
      window.removeEventListener("hashchange", firePageView);
      document.removeEventListener("click", onDocumentClick, true);
      document.removeEventListener("submit", onSearchSubmit, true);
      document.removeEventListener("darro:purchase", onDarroPurchase as EventListener);
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
    };
  }, []);

  return null;
}
