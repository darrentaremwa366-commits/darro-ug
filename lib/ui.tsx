"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export interface UIContextValue {
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  openCart: () => void;
  closeCart: () => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  openMobileMenu: () => void;
  closeMobileMenu: () => void;
}

const UIContext = createContext<UIContextValue | undefined>(undefined);

interface UIProviderProps {
  children: ReactNode;
}

export function UIProvider({ children }: UIProviderProps) {
  const [cartOpen, setCartOpenState] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpenState] = useState<boolean>(false);

  useEffect(() => {
    if (cartOpen || mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [cartOpen, mobileMenuOpen]);

  const setCartOpen = useCallback((open: boolean): void => {
    setCartOpenState(open);
  }, []);

  const openCart = useCallback((): void => {
    setCartOpenState(true);
  }, []);

  const closeCart = useCallback((): void => {
    setCartOpenState(false);
  }, []);

  const setMobileMenuOpen = useCallback((open: boolean): void => {
    setMobileMenuOpenState(open);
  }, []);

  const openMobileMenu = useCallback((): void => {
    setMobileMenuOpenState(true);
  }, []);

  const closeMobileMenu = useCallback((): void => {
    setMobileMenuOpenState(false);
  }, []);

  const value: UIContextValue = {
    cartOpen,
    setCartOpen,
    openCart,
    closeCart,
    mobileMenuOpen,
    setMobileMenuOpen,
    openMobileMenu,
    closeMobileMenu,
  };

  return (
    <UIContext.Provider value={value}>{children}</UIContext.Provider>
  );
}

export function useUI(): UIContextValue {
  const ctx = useContext(UIContext);
  if (!ctx) {
    throw new Error("useUI must be used within a UIProvider");
  }
  return ctx;
}
