"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  startTransition,
  type ReactNode,
} from "react";
import productsData from "@/data/products.json";

export interface CartItem {
  productId: number;
  slug: string;
  name: string;
  priceUGX: number;
  size: string;
  quantity: number;
  image: string;
  memberApplied?: boolean;
}

export interface CartState {
  items: CartItem[];
  totalRegular: number;
  totalMember: number;
  totalSaved: number;
  memberDiscountActive: boolean;
  bundleDiscountUGX: number;
}

export interface CartContextValue extends CartState {
  totalQuantity: number;
  addToCart: (item: CartItem) => void;
  removeFromCart: (productId: number, size: string) => void;
  updateQty: (productId: number, size: string, qty: number) => void;
  clearCart: () => void;
  toggleMemberPrices: (isMember: boolean) => void;
}

const STORAGE_KEY = "darro_cart";

export function formatUGX(amount: number): string {
  return `UGX ${Intl.NumberFormat("en-UG").format(Math.round(amount))}`;
}

export interface CartTotals {
  totalRegular: number;
  totalMember: number;
  totalSaved: number;
  bundleDiscountUGX: number;
}

function findMemberPrice(productId: number): number | null {
  const product = productsData.find(
    (p: { id: number; memberPriceUGX?: number }) => p.id === productId
  );
  return product?.memberPriceUGX ?? null;
}

export function calculateCartTotals(items: CartItem[]): CartTotals {
  let totalRegular = 0;
  let totalMember = 0;
  let totalSaved = 0;

  for (const item of items) {
    const itemSubtotal = item.priceUGX * item.quantity;
    totalRegular += itemSubtotal;

    if (item.memberApplied) {
      const memberPrice = findMemberPrice(item.productId) ?? item.priceUGX;
      const memberSubtotal = memberPrice * item.quantity;
      totalMember += memberSubtotal;
      totalSaved += itemSubtotal - memberSubtotal;
    }
  }

  // Bundle discount: UGX 5,000 per extra jersey beyond the first.
  // Works for any combination: same jersey, different jerseys, mixed sizes.
  // 1 jersey: 0, 2 jerseys: 5,000, 3 jerseys: 10,000, 4 jerseys: 15,000, ...
  // Formula: 5,000 × (total_quantity − 1)  when total_quantity ≥ 2
  const BUNDLE_STEP_UGX = 5_000;
  const totalQty = items.reduce((sum, item) => sum + item.quantity, 0);
  let bundleDiscountUGX = 0;
  if (totalQty >= 2) {
    bundleDiscountUGX = BUNDLE_STEP_UGX * (totalQty - 1);
    totalSaved += bundleDiscountUGX;
  }

  if (totalMember === 0) {
    totalMember = totalRegular;
  }

  totalMember = Math.max(0, totalMember - bundleDiscountUGX);
  totalRegular = Math.max(0, totalRegular - bundleDiscountUGX);

  return {
    totalRegular,
    totalMember,
    totalSaved,
    bundleDiscountUGX,
  };
}

function getInitialMemberApplied(items: CartItem[], memberActive: boolean): CartItem[] {
  if (!memberActive) return items;
  return items.map((item) => ({
    ...item,
    memberApplied: findMemberPrice(item.productId) !== null ? true : item.memberApplied,
  }));
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

interface CartProviderProps {
  children: ReactNode;
}

export function CartProvider({ children }: CartProviderProps) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [memberDiscountActive, setMemberDiscountActive] = useState<boolean>(false);
  const [hydrated, setHydrated] = useState<boolean>(false);

  useEffect(() => {
    let restoredItems: CartItem[] = [];
    let restoredMember = false;

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as {
          items?: CartItem[];
          memberDiscountActive?: boolean;
        };
        if (Array.isArray(parsed.items)) {
          const validItems = parsed.items.filter(
            (it): it is CartItem =>
              typeof it === "object" &&
              it !== null &&
              typeof it.productId === "number" &&
              typeof it.size === "string" &&
              typeof it.quantity === "number" &&
              it.quantity > 0,
          );
          restoredItems = getInitialMemberApplied(validItems, !!parsed.memberDiscountActive);
        }
        if (typeof parsed.memberDiscountActive === "boolean") {
          restoredMember = parsed.memberDiscountActive;
        }
      }
    } catch {
      // ignore parse errors
    }

    startTransition(() => {
      if (restoredItems.length > 0) setItems(restoredItems);
      setMemberDiscountActive(restoredMember);
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ items, memberDiscountActive }),
      );
    } catch {
      // ignore quota errors
    }
  }, [items, memberDiscountActive, hydrated]);

  const totals = useMemo(() => calculateCartTotals(items), [items]);

  const totalQuantity = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items],
  );

  const addToCart = (incoming: CartItem): void => {
    setItems((prev) => {
      const existingIndex = prev.findIndex(
        (it) => it.productId === incoming.productId && it.size === incoming.size,
      );
      if (existingIndex >= 0) {
        const next = prev.slice();
        const existing = next[existingIndex]!;
        next[existingIndex] = {
          ...existing,
          quantity: existing.quantity + incoming.quantity,
        };
        return next;
      }
      return [...prev, { ...incoming, memberApplied: incoming.memberApplied ?? memberDiscountActive }];
    });
  };

  const removeFromCart = (productId: number, size: string): void => {
    setItems((prev) =>
      prev.filter((it) => !(it.productId === productId && it.size === size)),
    );
  };

  const updateQty = (productId: number, size: string, qty: number): void => {
    const clampedQty = Math.max(1, Math.floor(qty));
    setItems((prev) =>
      prev.map((it) =>
        it.productId === productId && it.size === size
          ? { ...it, quantity: clampedQty }
          : it,
      ),
    );
  };

  const clearCart = (): void => {
    setItems([]);
  };

  const toggleMemberPrices = (isMember: boolean): void => {
    setMemberDiscountActive(isMember);
    setItems((prev) =>
      prev.map((item) => {
        const hasMemberPrice = findMemberPrice(item.productId) !== null;
        return {
          ...item,
          memberApplied: isMember && hasMemberPrice ? true : false,
        };
      }),
    );
  };

  const value: CartContextValue = {
    items,
    totalRegular: totals.totalRegular,
    totalMember: totals.totalMember,
    totalSaved: totals.totalSaved,
    memberDiscountActive,
    bundleDiscountUGX: totals.bundleDiscountUGX,
    totalQuantity,
    addToCart,
    removeFromCart,
    updateQty,
    clearCart,
    toggleMemberPrices,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return ctx;
}
