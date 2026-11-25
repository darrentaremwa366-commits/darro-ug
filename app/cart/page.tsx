"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart, formatUGX } from "@/lib/store";
import {
  buildWhatsAppOrderMessage,
  buildWhatsAppUrl,
  type WhatsappOrderTotals,
} from "@/lib/whatsapp";
import {
  generateOrderRef,
  buildMoMoWhatsAppMessage,
} from "@/lib/mtn-momo";
import productsData from "@/data/products.json";
import brand from "@/data/brand.json";

const DARRO_WHATSAPP_PHONE = brand.contact.whatsapp;
const MTN_MOMO = brand.mtnMoMo ?? { enabled: false, merchantCode: "", ussdCode: "*165*3#" };

export default function CartPage() {
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
          return sum + (match.regularPriceUGX - match.memberPriceUGX) * item.quantity;
        }, 0),
      )
    : 0;

  const displayTotal = memberDiscountActive ? totalMember : totalRegular;

  // ---- MTN MoMo state ----
  const [mtnExpanded, setMtnExpanded] = useState(false);
  const [mtnOrderRef, setMtnOrderRef] = useState<string | null>(null);
  const [mtnTxnId, setMtnTxnId] = useState("");
  const [mtnCustomerName, setMtnCustomerName] = useState("");
  const [mtnDeliveryCity, setMtnDeliveryCity] = useState("");
  const [mtnChecklist, setMtnChecklist] = useState({
    codeCorrect: false,
    exactAmount: false,
    momoSuccess: false,
  });

  const allChecksChecked =
    mtnChecklist.codeCorrect &&
    mtnChecklist.exactAmount &&
    mtnChecklist.momoSuccess &&
    mtnTxnId.trim().length > 3 &&
    mtnCustomerName.trim().length > 1 &&
    mtnDeliveryCity.trim().length > 1;

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

  const handleOpenMoMoPanel = (): void => {
    if (!mtnOrderRef) setMtnOrderRef(generateOrderRef());
    setMtnExpanded(true);
  };

  const handleMoMoOrder = (): void => {
    if (!mtnOrderRef) return;
    const message = buildMoMoWhatsAppMessage(
      items,
      {
        displayTotal,
        memberDiscountActive,
        bundleDiscountUGX,
        totalSaved,
      },
      {
        orderRef: mtnOrderRef,
        transactionId: mtnTxnId,
        customerName: mtnCustomerName,
        deliveryCity: mtnDeliveryCity,
      },
      MTN_MOMO.merchantCode,
      MTN_MOMO.ussdCode,
    );
    const url = buildWhatsAppUrl(DARRO_WHATSAPP_PHONE, message);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center">
        <div className="mb-8 mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-[#E8E4DD]">
          <svg
            width="40"
            height="40"
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
        <h1 className="mb-3 font-heading text-xl uppercase tracking-[0.18em] text-[#0F0F0F]">
          Your cart is quiet
        </h1>
        <p className="mb-10 text-[#5C5344]">
          Time to browse the collection and find your next jersey.
        </p>
        <Link
          href="/shop"
          className="button-style inline-flex items-center gap-2 bg-[#1A1A1A] px-8 py-4 text-xs text-white hover:bg-[#2C2C2C] transition-colors"
        >
          Browse Shop
          <span aria-hidden>→</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 md:py-16">
      <header className="mb-10 md:mb-12">
        <h1 className="font-heading text-2xl md:text-3xl uppercase tracking-[0.18em] text-[#0F0F0F]">
          Your Cart
        </h1>
        <p className="mt-2 text-sm text-[#5C5344]">
          {items.length} item{items.length === 1 ? "" : "s"} · Ready to checkout
        </p>
      </header>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ul className="flex flex-col gap-6">
            {items.map((item) => {
              const lineTotal = item.priceUGX * item.quantity;
              return (
                <li
                  key={`${item.productId}-${item.size}`}
                  className="flex flex-col gap-4 border-b border-[#E8E4DD] pb-6 sm:flex-row sm:gap-5 last:border-b-0 last:pb-0"
                >
                  <Link
                    href={`/shop/${item.slug}`}
                    className="flex-shrink-0 self-start"
                  >
                    <div className="relative aspect-[5/6] w-[100px] h-[120px] overflow-hidden bg-[#E8E4DD] sm:w-[120px] sm:h-[144px]">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        sizes="(max-width: 640px) 100px, 120px"
                        className="object-cover"
                      />
                    </div>
                  </Link>

                  <div className="flex flex-1 flex-col justify-between gap-4">
                    <div className="flex flex-col gap-1">
                      <Link
                        href={`/shop/${item.slug}`}
                        className="block"
                      >
                        <h3 className="font-heading text-sm uppercase tracking-[0.18em] text-[#0F0F0F] leading-tight">
                          {item.name}
                        </h3>
                      </Link>
                      <p className="font-mono text-[11px] uppercase text-[#8A8680]">
                        Size: {item.size}
                      </p>
                      <p className="font-heading text-xs uppercase tracking-[0.18em] text-[#5C5344]">
                        Unit: {formatUGX(item.priceUGX)}
                        {item.memberApplied && (
                          <span className="ml-2 text-[#A63D2F]">
                            (member)
                          </span>
                        )}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
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
                            className="h-9 w-9 flex items-center justify-center hover:bg-[#E8E4DD] transition-colors text-[#0F0F0F]"
                          >
                            {item.quantity <= 1 ? (
                              <svg
                                width="15"
                                height="15"
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
                              <span className="font-heading text-base leading-none">−</span>
                            )}
                          </button>
                          <span className="min-w-[36px] text-center font-heading text-sm text-[#0F0F0F]">
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
                            className="h-9 w-9 flex items-center justify-center hover:bg-[#E8E4DD] transition-colors text-[#0F0F0F]"
                          >
                            <span className="font-heading text-base leading-none">+</span>
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeFromCart(item.productId, item.size)}
                          className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.18em] font-heading text-[#8A8680] hover:text-[#A63D2F] transition-colors"
                          aria-label={`Remove ${item.name} size ${item.size} from cart`}
                        >
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
                          Remove
                        </button>
                      </div>

                      <span className="font-heading text-sm uppercase tracking-[0.18em] text-[#0F0F0F]">
                        {formatUGX(lineTotal)}
                      </span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="mt-8 pt-6 border-t border-[#E8E4DD]">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] font-heading text-[#5C5344] hover:text-[#0F0F0F] transition-colors"
            >
              <span aria-hidden>←</span>
              Continue shopping
            </Link>
          </div>
        </div>

        <aside className="lg:col-span-1">
          <div className="sticky top-24 border border-[#E8E4DD] bg-[#F0EDE8] p-6 sm:p-8">
            {(() => {
              const totalQty = items.reduce((s, i) => s + i.quantity, 0);
              if (totalQty >= 2) {
                return (
                  <div className="mb-6 -mx-2 border border-[#A63D2F]/20 bg-[#A63D2F]/5 px-4 py-3">
                    <p className="text-center text-xs uppercase tracking-[0.18em] font-heading text-[#A63D2F]">
                      🔥 Bundle &amp; Save · Every extra jersey = −5,000 UGX
                    </p>
                    <p className="mt-1 text-center text-[10.5px] text-[#5C5344]">
                      {totalQty} jerseys · You&apos;re getting −{formatUGX(bundleDiscountUGX)} off
                    </p>
                  </div>
                );
              }
              return (
                <div className="mb-6 -mx-2 border border-[#A63D2F]/20 bg-[#A63D2F]/5 px-4 py-3">
                  <p className="text-center text-xs uppercase tracking-[0.18em] font-heading text-[#A63D2F]">
                    🔥 Bundle &amp; Save
                  </p>
                  <p className="mt-1 text-center text-[10.5px] text-[#5C5344]">
                    Add 2 jerseys · Save 5,000 UGX · 3 saves 10,000 · 4 saves 15,000
                  </p>
                </div>
              );
            })()}

            <h2 className="mb-6 font-heading text-sm uppercase tracking-[0.18em] text-[#0F0F0F]">
              Order Summary
            </h2>

            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#5C5344]">
                  Subtotal
                </span>
                <span className="font-heading text-xs uppercase tracking-[0.18em] text-[#0F0F0F]">
                  {formatUGX(subtotalRegular)}
                </span>
              </div>

              {bundleDiscountUGX > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#A63D2F]">
                    Bundle Discount
                  </span>
                  <span className="font-heading text-xs uppercase tracking-[0.18em] text-[#A63D2F]">
                    −{formatUGX(bundleDiscountUGX)}
                  </span>
                </div>
              )}

              {memberSavings > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#4A5544]">
                    Darro Club Savings
                  </span>
                  <span className="font-heading text-xs uppercase tracking-[0.18em] text-[#4A5544]">
                    −{formatUGX(memberSavings)}
                  </span>
                </div>
              )}

              {totalSaved > 0 && (
                <div className="flex items-center justify-between bg-[#2B6B4A]/10 border border-[#2B6B4A]/15 px-3 py-2 -mx-1 rounded">
                  <span className="text-[11px] uppercase tracking-[0.15em] font-heading text-[#2B6B4A]">
                    ▼ Total Saved
                  </span>
                  <span className="font-heading text-[12px] uppercase tracking-[0.18em] text-[#2B6B4A]">
                    {formatUGX(totalSaved)}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-sm text-[#5C5344]">
                  Shipping
                </span>
                <span className="text-xs text-[#5C5344] font-heading uppercase tracking-[0.18em]">
                  Calculated on WhatsApp
                </span>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between border-t border-[#8A8680]/20 pt-5">
              <span className="font-heading text-base uppercase tracking-[0.18em] text-[#0F0F0F]">
                TOTAL
              </span>
              <span className="font-heading text-xl uppercase tracking-[0.18em] text-[#0F0F0F]">
                {formatUGX(displayTotal)}
              </span>
            </div>

            {/* --- Darro Club member checkbox + incentives --- */}
            <div className="mt-6 border border-[#2B6B4A]/25 bg-white/60 px-4 py-4 -mx-1 relative overflow-hidden">
              {/* Savings preview header */}
              {!memberDiscountActive && (() => {
                // Calculate what they would save if they were a member
                const potentialMember = items.reduce((sum, item) => {
                  const match = productsData.find((p) => p.id === item.productId);
                  if (!match?.memberPriceUGX) return sum;
                  return sum + (match.regularPriceUGX - match.memberPriceUGX) * item.quantity;
                }, 0);
                if (potentialMember <= 0) return null;
                const totalPotential = potentialMember + bundleDiscountUGX;
                return (
                  <div className="mb-4 pb-3 border-b border-[#2B6B4A]/15">
                    <p className="text-[10.5px] uppercase tracking-[0.16em] font-mono text-[#2B6B4A]">
                      You could save an extra
                    </p>
                    <p className="mt-1 font-heading text-xl leading-none tracking-[0.04em] text-[#2B6B4A]">
                      {formatUGX(totalPotential)}
                    </p>
                    <p className="mt-1 text-[11px] text-[#5C5344]">
                      Darro Club members pay up to 10,000 UGX less per jersey.
                    </p>
                  </div>
                );
              })()}

              <div className="flex items-start gap-3 relative">
                {/* Arrow decoration pointing to the checkbox */}
                {!memberDiscountActive && (
                  <div
                    aria-hidden
                    className="hidden sm:block absolute -left-1 -top-7 text-[#A63D2F] z-0 pointer-events-none"
                  >
                    <svg
                      width="54"
                      height="48"
                      viewBox="0 0 54 48"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M4 4 C 14 14, 24 20, 34 30" />
                      <path d="M34 30 L 28 27 M 34 30 L 30 36" />
                    </svg>
                    <span className="absolute -top-5 left-6 font-mono text-[9px] uppercase tracking-[0.16em] whitespace-nowrap">
                      Click here ↓
                    </span>
                  </div>
                )}

                <label className="contents cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={memberDiscountActive}
                    onChange={(e) => toggleMemberPrices(e.target.checked)}
                    className="mt-0.5 h-5 w-5 flex-shrink-0 rounded-none border-2 border-[#2B6B4A] text-[#128C7E] focus:ring-0 focus:ring-offset-0 accent-[#2B6B4A] z-10 relative"
                    aria-label="I'm a Darro Club member — apply member pricing"
                  />
                </label>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-heading uppercase tracking-[0.16em] text-[#0F0F0F] leading-tight">
                    I&apos;m a Darro Club member
                    <span className="ml-1 normal-case font-body text-[#11px] text-[#5C5344]">
                      (I will verify your membership before checkout — to join,
                      {" "}
                      <Link
                        href="/membership"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline decoration-dotted underline-offset-2 text-[#A63D2F] hover:text-[#128C7E] transition-colors"
                      >
                        click here
                      </Link>
                      )
                    </span>
                  </p>
                  {!memberDiscountActive ? (
                    <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
                      <Link
                        href="/membership"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0F0F0F] text-white text-[10px] uppercase tracking-[0.18em] font-heading hover:bg-[#2C2C2C] transition-colors"
                      >
                        Join Darro Club here
                        <svg
                          width="11"
                          height="11"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden
                        >
                          <path d="M7 17L17 7M7 7h10v10" />
                        </svg>
                      </Link>
                      <span className="text-[10.5px] text-[#5C5344]">
                        Enjoy member pricing on every jersey.
                      </span>
                    </div>
                  ) : (
                    <p className="mt-2 text-[10.5px] text-[#2B6B4A] font-heading uppercase tracking-[0.16em]">
                      ✓ Member pricing applied — savings added above.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleWhatsAppOrder}
              disabled={items.length === 0}
              className="button-style mt-6 w-full bg-[#1A1A1A] px-6 py-4 text-xs text-white hover:bg-[#2C2C2C] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Order via WhatsApp
            </button>

            {/* --- OR divider + MTN MoMo secondary button --- */}
            {MTN_MOMO.enabled && (
              <>
                <div className="my-5 flex items-center gap-3">
                  <div className="h-px flex-1 bg-[#8A8680]/25" aria-hidden />
                  <span className="font-heading text-[10.5px] uppercase tracking-[0.18em] text-[#8A8680]">
                    or
                  </span>
                  <div className="h-px flex-1 bg-[#8A8680]/25" aria-hidden />
                </div>

                <button
                  type="button"
                  onClick={handleOpenMoMoPanel}
                  disabled={items.length === 0}
                  className="button-style w-full border border-[#1A1A1A] bg-white px-6 py-4 text-xs font-heading uppercase tracking-[0.18em] text-[#1A1A1A] hover:bg-[#E8E4DD] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {/* MTN logo dot */}
                  <span
                    aria-hidden
                    className="inline-flex h-4 w-4 items-center justify-center bg-[#FFCC00] text-[7px] font-black text-[#00205B] rounded-sm"
                  >
                    M
                  </span>
                  Pay with MTN MoMo
                </button>
              </>
            )}

            {/* --- MTN MoMo expanded panel --- */}
            {MTN_MOMO.enabled && mtnExpanded && mtnOrderRef && (
              <div className="mt-5 border border-[#FFCC00]/40 bg-[#FFFBEA] px-4 py-4 -mx-1 relative">
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="font-heading text-[11px] uppercase tracking-[0.18em] text-[#00205B]">
                      MTN Mobile Money
                    </p>
                    <p className="mt-1 text-[10.5px] text-[#5C5344]">
                      Follow these steps exactly, then paste your details below.
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label="Collapse MTN MoMo payment section"
                    onClick={() => setMtnExpanded(false)}
                    className="text-[#8A8680] hover:text-[#1A1A1A] transition-colors"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* USSD Instructions card */}
                <div className="mb-3 border border-[#00205B]/15 bg-white -mx-1 px-3 py-3">
                  <ol className="space-y-2 text-[11.5px] text-[#0F0F0F] list-decimal list-inside font-mono leading-relaxed">
                    <li>
                      Dial{" "}
                      <span className="font-bold text-[#00205B]">
                        {MTN_MOMO.ussdCode}
                      </span>{" "}
                      on your MTN number
                    </li>
                    <li>
                      Enter merchant code:{" "}
                      <span className="font-bold text-[#00205B]">
                        {MTN_MOMO.merchantCode}
                      </span>
                    </li>
                    <li>
                      Enter exact amount:{" "}
                      <span className="font-bold text-[#A63D2F]">
                        {formatUGX(displayTotal)}
                      </span>
                    </li>
                    <li>Confirm with your MoMo PIN</li>
                  </ol>
                </div>

                {/* Order reference — locked, must stay intact */}
                <div className="mb-4 -mx-1 border border-dashed border-[#8A8680]/40 px-3 py-2 bg-white">
                  <p className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-[#8A8680]">
                    Order Reference
                  </p>
                  <p className="mt-0.5 font-heading text-[12px] tracking-[0.06em] text-[#0F0F0F] select-all">
                    {mtnOrderRef}
                  </p>
                  <p className="mt-0.5 text-[9.5px] text-[#8A8680]">
                    Keep this — Darro will match your payment using this.
                  </p>
                </div>

                {/* Input fields */}
                <div className="space-y-3 mb-4">
                  <label className="block">
                    <span className="font-heading text-[10.5px] uppercase tracking-[0.18em] text-[#0F0F0F]">
                      Transaction ID
                    </span>
                    <input
                      type="text"
                      value={mtnTxnId}
                      onChange={(e) => setMtnTxnId(e.target.value)}
                      placeholder="e.g. TXN847293"
                      className="mt-1 w-full border border-[#8A8680]/40 bg-white px-3 py-2 text-sm text-[#0F0F0F] placeholder:text-[#8A8680] focus:border-[#00205B] focus:outline-none transition-colors"
                      aria-label="Transaction ID from MoMo confirmation"
                    />
                  </label>

                  <div className="grid grid-cols-2 gap-3">
                    <label className="block">
                      <span className="font-heading text-[10.5px] uppercase tracking-[0.18em] text-[#0F0F0F]">
                        Your name
                      </span>
                      <input
                        type="text"
                        value={mtnCustomerName}
                        onChange={(e) => setMtnCustomerName(e.target.value)}
                        placeholder="John Doe"
                        className="mt-1 w-full border border-[#8A8680]/40 bg-white px-3 py-2 text-sm text-[#0F0F0F] placeholder:text-[#8A8680] focus:border-[#00205B] focus:outline-none transition-colors"
                        aria-label="Your full name"
                      />
                    </label>
                    <label className="block">
                      <span className="font-heading text-[10.5px] uppercase tracking-[0.18em] text-[#0F0F0F]">
                        Delivery city
                      </span>
                      <input
                        type="text"
                        value={mtnDeliveryCity}
                        onChange={(e) => setMtnDeliveryCity(e.target.value)}
                        placeholder="Makerere"
                        className="mt-1 w-full border border-[#8A8680]/40 bg-white px-3 py-2 text-sm text-[#0F0F0F] placeholder:text-[#8A8680] focus:border-[#00205B] focus:outline-none transition-colors"
                        aria-label="Your delivery city or area"
                      />
                    </label>
                  </div>
                </div>

                {/* Verification checklist — must all check before send */}
                <div className="mb-4 border-t border-[#8A8680]/25 pt-3 space-y-2">
                  <label className="flex items-start gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={mtnChecklist.codeCorrect}
                      onChange={(e) =>
                        setMtnChecklist((c) => ({ ...c, codeCorrect: e.target.checked }))
                      }
                      className="mt-0.5 h-4 w-4 flex-shrink-0 rounded-none border-2 border-[#00205B] accent-[#00205B] focus:ring-0"
                    />
                    <span className="text-[11px] text-[#0F0F0F] leading-tight">
                      I entered merchant code{" "}
                      <span className="font-bold text-[#00205B]">
                        {MTN_MOMO.merchantCode}
                      </span>{" "}
                      correctly
                    </span>
                  </label>
                  <label className="flex items-start gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={mtnChecklist.exactAmount}
                      onChange={(e) =>
                        setMtnChecklist((c) => ({ ...c, exactAmount: e.target.checked }))
                      }
                      className="mt-0.5 h-4 w-4 flex-shrink-0 rounded-none border-2 border-[#A63D2F] accent-[#A63D2F] focus:ring-0"
                    />
                    <span className="text-[11px] text-[#0F0F0F] leading-tight">
                      I paid exactly{" "}
                      <span className="font-bold text-[#A63D2F]">
                        {formatUGX(displayTotal)}
                      </span>
                    </span>
                  </label>
                  <label className="flex items-start gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={mtnChecklist.momoSuccess}
                      onChange={(e) =>
                        setMtnChecklist((c) => ({ ...c, momoSuccess: e.target.checked }))
                      }
                      className="mt-0.5 h-4 w-4 flex-shrink-0 rounded-none border-2 border-[#2B6B4A] accent-[#2B6B4A] focus:ring-0"
                    />
                    <span className="text-[11px] text-[#0F0F0F] leading-tight">
                      My MoMo screen showed success and gave me a transaction ID
                    </span>
                  </label>
                </div>

                {/* Final send button */}
                <button
                  type="button"
                  onClick={handleMoMoOrder}
                  disabled={!allChecksChecked}
                  className="button-style w-full bg-[#00205B] px-4 py-3.5 text-[11px] font-heading uppercase tracking-[0.18em] text-white hover:bg-[#0a2d70] transition-colors disabled:bg-[#8A8680]/40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <span
                    aria-hidden
                    className="inline-flex h-3 w-3 items-center justify-center bg-[#FFCC00] text-[6px] font-black text-[#00205B] rounded-sm"
                  >
                    M
                  </span>
                  {allChecksChecked
                    ? "Send MoMo order to Darro"
                    : "Complete checklist to continue"}
                </button>

                {!allChecksChecked &&
                  (mtnTxnId.trim().length <= 3 ||
                    mtnCustomerName.trim().length <= 1 ||
                    mtnDeliveryCity.trim().length <= 1) && (
                    <p className="mt-2 text-center text-[10px] text-[#A63D2F]">
                      Fill all fields and confirm the steps above.
                    </p>
                  )}
              </div>
            )}

            <p className="mt-4 text-center text-[11px] text-[#8A8680] leading-relaxed">
              Orders processed via WhatsApp &middot; 3&ndash;5 working days delivery
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
