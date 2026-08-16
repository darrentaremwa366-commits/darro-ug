"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useCart, formatUGX } from "@/lib/store";
import { useUI } from "@/lib/ui";
import {
  buildWhatsAppOrderMessage,
  buildWhatsAppUrl,
  type WhatsappOrderTotals,
} from "@/lib/whatsapp";
import productsData from "@/data/products.json";
import brand from "@/data/brand.json";

const DARRO_WHATSAPP_PHONE = brand.contact.whatsapp;

export default function CartDrawer() {
  const {
    items,
    totalRegular,
    totalMember,
    totalSaved,
    memberDiscountActive,
    bundleDiscountUGX,
    removeFromCart,
    updateQty,
    toggleMemberPrices,
  } = useCart();

  const { cartOpen, closeCart } = useUI();

  const subtotalRegular = items.reduce(
    (sum, item) => sum + item.priceUGX * item.quantity,
    0,
  );

  const memberSavings = memberDiscountActive
    ? Math.max(
        0,
        items.reduce((sum, item) => {
          if (!item.memberApplied) return sum;
          const match = productsData.find((p) => p.id === item.productId);
          if (!match?.memberPriceUGX) return sum;
          return (
            sum +
            (match.regularPriceUGX - match.memberPriceUGX) * item.quantity
          );
        }, 0),
      )
    : 0;

  const handleWhatsAppOrder = (): void => {
    const totals: WhatsappOrderTotals = {
      subtotalRegular,
      bundleDiscountUGX,
      memberTotal: totalMember,
      totalSaved,
    };

    const message = buildWhatsAppOrderMessage(
      items,
      totals,
      memberDiscountActive,
    );

    const url = buildWhatsAppUrl(DARRO_WHATSAPP_PHONE, message);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const displayTotal = memberDiscountActive ? totalMember : totalRegular;

  return (
    <AnimatePresence>
      {cartOpen && (
        <>
          <motion.div
            key="cart-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-[#0F0F0F]/50"
            onClick={closeCart}
            aria-hidden
          />
          <motion.aside
            key="cart-drawer"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="fixed right-0 top-0 z-50 flex h-full w-full flex-col bg-[#F7F5F2] shadow-2xl sm:w-[420px]"
            aria-label="Shopping cart"
            role="dialog"
            aria-modal="true"
          >
            <header className="flex items-center justify-between border-b border-[#E8E4DD] px-6 py-5">
              <h2 className="font-heading text-sm uppercase tracking-[0.18em] text-[#0F0F0F]">
                YOUR CART
              </h2>
              <button
                type="button"
                aria-label="Close cart"
                onClick={closeCart}
                className="p-1 hover:opacity-70 transition-opacity"
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#0F0F0F"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </header>

            {items.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#E8E4DD]">
                  <svg
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#8A8680"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                    <path d="M3 6h18" />
                    <path d="M16 10a4 4 0 01-8 0" />
                  </svg>
                </div>
                <p className="mb-2 font-heading text-sm uppercase tracking-[0.18em] text-[#0F0F0F]">
                  Your cart is quiet
                </p>
                <p className="mb-8 text-sm text-[#8A8680]">
                  Time to find your next jersey.
                </p>
                <Link
                  href="/shop"
                  onClick={closeCart}
                  className="button-style inline-flex items-center gap-2 bg-[#1A1A1A] px-6 py-3 text-xs text-white hover:bg-[#2C2C2C] transition-colors"
                >
                  Browse Shop
                  <span aria-hidden>→</span>
                </Link>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto px-6 py-4">
                  <ul className="flex flex-col gap-5">
                    {items.map((item) => {
                      const lineTotal = item.priceUGX * item.quantity;
                      return (
                        <li
                          key={`${item.productId}-${item.size}`}
                          className="flex gap-4 border-b border-[#E8E4DD]/70 pb-5 last:border-b-0 last:pb-0"
                        >
                          <Link
                            href={`/shop/${item.slug}`}
                            onClick={closeCart}
                            className="flex-shrink-0"
                          >
                            <div className="relative aspect-[3/4] w-[72px] overflow-hidden bg-[#E8E4DD]">
                              <Image
                                src={item.image}
                                alt={item.name}
                                fill
                                sizes="72px"
                                className="object-cover"
                              />
                            </div>
                          </Link>
                          <div className="flex flex-1 flex-col justify-between">
                            <div>
                              <Link
                                href={`/shop/${item.slug}`}
                                onClick={closeCart}
                                className="block"
                              >
                                <h3 className="font-heading text-xs uppercase tracking-[0.18em] text-[#0F0F0F] leading-tight line-clamp-2">
                                  {item.name}
                                </h3>
                              </Link>
                              <p className="mt-1 font-mono text-[11px] uppercase text-[#8A8680]">
                                Size: {item.size}
                              </p>
                              <p className="mt-1 font-heading text-[11px] uppercase tracking-[0.18em] text-[#5C5344]">
                                {formatUGX(item.priceUGX)}
                              </p>
                            </div>
                            <div className="mt-3 flex items-center justify-between">
                              <div className="flex items-center border border-[#8A8680]/30">
                                <button
                                  type="button"
                                  aria-label={`Decrease quantity of ${item.name} size ${item.size}`}
                                  onClick={() =>
                                    item.quantity <= 1
                                      ? removeFromCart(item.productId, item.size)
                                      : updateQty(
                                          item.productId,
                                          item.size,
                                          item.quantity - 1,
                                        )
                                  }
                                  className="h-7 w-7 flex items-center justify-center hover:bg-[#E8E4DD] transition-colors text-[#0F0F0F]"
                                >
                                  {item.quantity <= 1 ? (
                                    <svg
                                      width="14"
                                      height="14"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="1.5"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      aria-hidden
                                    >
                                      <path d="M3 6h18" />
                                      <path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                                      <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                                    </svg>
                                  ) : (
                                    <span className="font-heading text-sm leading-none">−</span>
                                  )}
                                </button>
                                <span className="min-w-[28px] text-center font-heading text-xs text-[#0F0F0F]">
                                  {item.quantity}
                                </span>
                                <button
                                  type="button"
                                  aria-label={`Increase quantity of ${item.name} size ${item.size}`}
                                  onClick={() =>
                                    updateQty(
                                      item.productId,
                                      item.size,
                                      item.quantity + 1,
                                    )
                                  }
                                  className="h-7 w-7 flex items-center justify-center hover:bg-[#E8E4DD] transition-colors text-[#0F0F0F]"
                                >
                                  <span className="font-heading text-sm leading-none">+</span>
                                </button>
                              </div>
                              <span className="font-heading text-xs uppercase tracking-[0.18em] text-[#0F0F0F]">
                                {formatUGX(lineTotal)}
                              </span>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                <footer className="border-t border-[#E8E4DD] px-6 py-5">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#5C5344]">
                        Items subtotal
                      </span>
                      <span className="font-heading text-xs uppercase tracking-[0.18em] text-[#0F0F0F]">
                        {formatUGX(subtotalRegular)}
                      </span>
                    </div>
                    {bundleDiscountUGX > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-[#A63D2F]">
                          Bundle Discount
                        </span>
                        <span className="font-heading text-xs uppercase tracking-[0.18em] text-[#A63D2F]">
                          -{formatUGX(bundleDiscountUGX)}
                        </span>
                      </div>
                    )}
                    {memberSavings > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-[#4A5544]">
                          Darro Club savings
                        </span>
                        <span className="font-heading text-xs uppercase tracking-[0.18em] text-[#4A5544]">
                          -{formatUGX(memberSavings)}
                        </span>
                      </div>
                    )}
                    <div className="mt-2 flex items-center justify-between border-t border-[#E8E4DD]/70 pt-3">
                      <span className="font-heading text-sm uppercase tracking-[0.18em] text-[#0F0F0F]">
                        TOTAL
                      </span>
                      <span className="font-heading text-lg uppercase tracking-[0.18em] text-[#0F0F0F]">
                        {formatUGX(displayTotal)}
                      </span>
                    </div>
                    {totalSaved > 0 && (
                      <p className="text-center text-[11px] text-[#A63D2F] font-heading uppercase tracking-[0.18em]">
                        You saved {formatUGX(totalSaved)} 🎉
                      </p>
                    )}
                  </div>

                  <label className="mt-5 flex items-start gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={memberDiscountActive}
                      onChange={(e) => toggleMemberPrices(e.target.checked)}
                      className="mt-0.5 h-4 w-4 flex-shrink-0 rounded-none border border-[#8A8680]/50 text-[#1A1A1A] focus:ring-0 focus:ring-offset-0"
                      aria-label="I'm a Darro Club member"
                    />
                    <span className="text-xs text-[#5C5344] leading-relaxed">
                      I&apos;m a Darro Club member
                    </span>
                  </label>

                  <button
                    type="button"
                    onClick={handleWhatsAppOrder}
                    className="button-style mt-5 w-full bg-[#2C2C2C] px-6 py-4 text-xs text-white hover:bg-[#1A1A1A] transition-colors"
                  >
                    Order via WhatsApp
                  </button>

                  <Link
                    href="/cart"
                    onClick={closeCart}
                    className="mt-3 block text-center text-xs text-[#5C5344] uppercase tracking-[0.18em] font-heading hover:text-[#0F0F0F] transition-colors"
                  >
                    View Full Cart →
                  </Link>
                </footer>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
