"use client";

import { useCart } from "@/lib/store";
import { useUI } from "@/lib/ui";

interface CartIconButtonProps {
  className?: string;
}

export default function CartIconButton({
  className = "",
}: CartIconButtonProps) {
  const { totalQuantity } = useCart();
  const { openCart } = useUI();

  return (
    <button
      type="button"
      aria-label={`Cart with ${totalQuantity} item${totalQuantity === 1 ? "" : "s"}`}
      onClick={openCart}
      className={`relative p-1 hover:opacity-70 transition-opacity ${className}`}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#0F0F0F"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
        <path d="M3 6h18" />
        <path d="M16 10a4 4 0 01-8 0" />
      </svg>
      {totalQuantity > 0 && (
        <span className="absolute -top-0.5 -right-0.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#A63D2F] px-1 font-mono text-[9px] font-medium text-white">
          {totalQuantity > 99 ? "99+" : totalQuantity}
        </span>
      )}
    </button>
  );
}
