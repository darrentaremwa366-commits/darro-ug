"use client";

import React, { type ReactNode } from "react";
import { UIProvider } from "@/lib/ui";
import { CartProvider } from "@/lib/store";
import CartDrawer from "@/components/CartDrawer";
import AnalyticsTracker from "@/components/AnalyticsTracker";

interface ProvidersProps {
  children: ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <UIProvider>
      <CartProvider>
        <AnalyticsTracker />
        {children}
        <CartDrawer />
      </CartProvider>
    </UIProvider>
  );
}
