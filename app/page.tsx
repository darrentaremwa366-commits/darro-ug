"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import productsData from "@/data/products.json";
import brand from "@/data/brand.json";

const products = productsData as Array<{
  id: number;
  slug: string;
  name: string;
  color: string;
  regularPriceUGX: number;
  memberPriceUGX: number;
  currentPriceUGX: number;
  stockCount: number;
  bestSeller?: boolean;
  lowStock?: boolean;
  lowStockBanner?: string | null;
  images: string[];
}>;

function formatUGX(amount: number): string {
  return `UGX ${amount.toLocaleString("en-UG", { maximumFractionDigits: 0 })}`;
}

export default function Home() {
  const bundles = (brand.bundles ?? []) as Array<{
    id: string;
    label: string;
    count: number;
    priceUGX: number;
    wasPriceUGX: number;
    saveUGX: number;
    jerseyEntries: number;
    highlight?: boolean;
  }>;

  const isBF = brand.currentSale?.active ?? false;
  const sale = brand.currentSale;

  const [daysToFriday, setDaysToFriday] = useState(0);

  useEffect(() => {
    const now = new Date();
    const day = now.getDay(); // 0 = Sunday, 5 = Friday
    const daysUntilFriday = (5 - day + 7) % 7 || 7;
    setDaysToFriday(daysUntilFriday);
  }, []);

  const trust = brand.trustStrip;
  const giveaway = brand.jerseyGiveaway;

  return (
    <div className="flex flex-col bg-[#F7F5F2] min-h-screen text-[#0F0F0F]">
      {/* --- TRUST STRIP (always visible, under navbar) --- */}
      <div className="w-full bg-[#0F0F0F] text-[#F7F5F2]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-center gap-3 sm:gap-8 text-[10px] sm:text-[11px] font-mono uppercase tracking-[0.16em]">
          <span className="hidden sm:inline">● {trust?.left}</span>
          <span>● {trust?.middle}</span>
          <span>● {trust?.right}</span>
        </div>
      </div>

      {/* --- SECTION 1: HERO (beach lifestyle, Tamed Psychotic style) --- */}
      <section className="relative w-full bg-[#E8E4DD] overflow-hidden">
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 flex flex-col items-center text-center gap-6 lg:gap-10">
          {/* Hero image + text overlay */}
          <div className="w-full max-w-4xl">
            <div className="relative w-full aspect-[16/9] lg:aspect-[21/9] bg-[#D8D4CC] overflow-hidden">
              <Image
                src="/images/hero-beach.jpg"
                alt="Darro — beach lifestyle, built for those building their future"
                fill
                priority
                sizes="100vw"
                className="object-cover brightness-[0.9] contrast-[1.05]"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-[#0F0F0F]/30 via-[#0F0F0F]/10 to-[#0F0F0F]/70" />
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white px-4">
                <span className="font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.25em] opacity-80 mb-2 sm:mb-3">
                  {sale?.label ?? "NEW DROP"}
                </span>
                <h1 className="font-heading uppercase tracking-[0.18em] text-[clamp(1.4rem,4.8vw,3.2rem)] leading-[0.95] max-w-3xl mx-auto">
                  STYLISH · MINIMAL · DAILY
                  <br />
                  <span className="opacity-90">T-SHIRTS</span>
                </h1>
                <p className="mt-3 sm:mt-4 max-w-md text-xs sm:text-sm text-white/80 leading-relaxed">
                  Unique, not loud. Blend with anything. 100% heavyweight cotton — thick, built to last.
                </p>
              </div>
            </div>
          </div>

          {/* Buttons — Tamed Psychotic: early access + preview drop */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full max-w-md">
            <Link
              href="/membership"
              className="button-style w-full sm:w-auto inline-flex items-center justify-center bg-[#0F0F0F] text-[#F7F5F2] px-6 sm:px-8 py-3 sm:py-3.5 text-[11px] hover:bg-[#2C2C2C] transition-colors"
            >
              JOIN DARRO CLUB
            </Link>
            <Link
              href="#offers"
              className="button-style w-full sm:w-auto inline-flex items-center justify-center border border-[#0F0F0F] text-[#0F0F0F] px-6 sm:px-8 py-3 sm:py-3.5 text-[11px] hover:bg-[#0F0F0F] hover:text-[#F7F5F2] transition-colors"
            >
              SEE THE OFFERS →
            </Link>
          </div>

          {/* Scarcity strip */}
          <div className="w-full max-w-lg text-center font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.18em] text-[#A63D2F]">
            Only 32 t-shirts total across all colors · Updated Nov 26
          </div>
        </div>
      </section>

      {/* --- SECTION 2: BLACK FRIDAY PROJECT — Offer table (Tamed Psychotic style) --- */}
      <section id="offers" className="w-full bg-[#F7F5F2] border-t border-[#E8E4DD]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <div className="mb-8 sm:mb-10 flex items-center justify-between">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#8A8680]">
                BLACK FRIDAY PROJECT
              </span>
              <h2 className="mt-1 font-heading uppercase tracking-[0.14em] text-xl sm:text-2xl text-[#0F0F0F]">
                3 PRICES. PICK YOURS.
              </h2>
            </div>
            <div className="hidden sm:block font-mono text-[10px] uppercase tracking-[0.22em] text-[#8A8680] text-right leading-relaxed">
              Prices valid this week only
            </div>
          </div>

          {/* Offer cards */}
          <div className="grid sm:grid-cols-3 gap-4 sm:gap-5">
            {bundles.map((b) => (
              <div
                key={b.id}
                className={
                  "relative flex flex-col border p-5 sm:p-6 " +
                  (b.highlight
                    ? "border-[#0F0F0F] bg-[#0F0F0F] text-white"
                    : "border-[#D8D4CC] bg-white text-[#0F0F0F]")
                }
              >
                {b.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-[#A63D2F] text-white font-mono text-[9px] uppercase tracking-[0.22em]">
                    BEST FOR THE JERSEY
                  </div>
                )}
                <div
                  className={
                    "font-heading uppercase tracking-[0.14em] text-base sm:text-lg " +
                    (b.highlight ? "text-white" : "text-[#0F0F0F]")
                  }
                >
                  {b.label}
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <span
                    className={
                      "font-heading text-2xl sm:text-3xl tracking-tight " +
                      (b.highlight ? "text-white" : "text-[#0F0F0F]")
                    }
                  >
                    {formatUGX(b.priceUGX)}
                  </span>
                  <span
                    className={
                      "text-[11px] font-mono line-through " +
                      (b.highlight ? "text-white/50" : "text-[#8A8680]")
                    }
                  >
                    {formatUGX(b.wasPriceUGX)}
                  </span>
                </div>
                <div
                  className={
                    "mt-1 text-[11px] font-mono uppercase tracking-[0.18em] " +
                    (b.highlight ? "text-[#FFCC00]" : "text-[#A63D2F]")
                  }
                >
                  Save {formatUGX(b.saveUGX)}
                </div>
                <div
                  className={
                    "mt-4 text-[11px] leading-relaxed " +
                    (b.highlight ? "text-white/80" : "text-[#5C5344]")
                  }
                >
                  {b.count === 1 && "One boxy tee. Pick your color."}
                  {b.count === 2 && "Two boxy tees. Mix and match colors."}
                  {b.count === 3 && "Three boxy tees + you get entries into ALL 10 jersey drawings (not just today's)."}
                </div>
                <Link
                  href="/shop"
                  className={
                    "mt-5 button-style inline-flex items-center justify-center px-4 py-2.5 text-[10px] font-heading uppercase tracking-[0.18em] transition-colors " +
                    (b.highlight
                      ? "bg-[#F7F5F2] text-[#0F0F0F] hover:bg-white"
                      : "bg-[#0F0F0F] text-white hover:bg-[#2C2C2C]")
                  }
                >
                  SHOP {b.count} TEES →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- SECTION 3: BOXY T-SHIRTS — product grid --- */}
      <section className="w-full bg-[#F7F5F2] border-t border-[#E8E4DD]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <div className="mb-8 flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#8A8680]">
              BOXY T-SHIRTS — {products.length} COLORS
            </span>
            <Link
              href="/shop"
              className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#A63D2F] hover:underline underline-offset-4"
            >
              VIEW ALL →
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-5 lg:gap-6">
            {products.map((p) => {
              const isSoldOut = p.stockCount <= 0;
              return (
                <Link
                  key={p.id}
                  href={`/shop/${p.slug}`}
                  className="group relative block"
                >
                  <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#E8E4DD]">
                    <Image
                      src={p.images[0] ?? ""}
                      alt={p.name}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />

                    {/* BESTSELLER tag */}
                    {p.bestSeller && (
                      <div className="absolute top-3 left-3 z-10">
                        <span className="inline-flex items-center px-2.5 py-1 bg-[#0F0F0F]/90 text-white font-mono text-[9px] uppercase tracking-[0.22em]">
                          BESTSELLER
                        </span>
                      </div>
                    )}

                    {/* Low stock banner */}
                    {p.lowStockBanner && !isSoldOut && (
                      <div className="absolute top-3 right-3 z-10">
                        <span className="inline-flex items-center px-2.5 py-1 bg-[#A63D2F] text-white font-mono text-[9px] uppercase tracking-[0.18em]">
                          {p.lowStockBanner}
                        </span>
                      </div>
                    )}

                    {/* Sold Out overlay */}
                    {isSoldOut && (
                      <div className="absolute inset-0 bg-[#0F0F0F]/60 flex items-center justify-center z-10">
                        <span className="bg-white text-[#0F0F0F] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em]">
                          Sold Out
                        </span>
                      </div>
                    )}

                    {/* Quick add on hover */}
                    {!isSoldOut && (
                      <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 z-10">
                        <div className="w-full py-2.5 font-heading text-[10px] uppercase tracking-[0.18em] bg-[#0F0F0F]/95 text-white text-center">
                          Quick View →
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 flex flex-col gap-1">
                    <h3 className="font-heading text-[11px] sm:text-xs uppercase tracking-[0.14em] text-[#0F0F0F] leading-tight">
                      {p.name}
                    </h3>
                    <div className="flex items-baseline gap-2">
                      <span className="font-heading text-[13px] sm:text-sm tracking-[0.14em] text-[#0F0F0F]">
                        {formatUGX(p.currentPriceUGX)}
                      </span>
                      {p.regularPriceUGX > p.currentPriceUGX && (
                        <span className="text-[10px] font-mono line-through text-[#8A8680]">
                          {formatUGX(p.regularPriceUGX)}
                        </span>
                      )}
                    </div>
                    <div className="text-[9px] sm:text-[10px] font-mono uppercase tracking-[0.18em] text-[#8A8680]">
                      {p.stockCount} left · {p.color}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* --- SECTION 4: JERSEY GIVEAWAY --- */}
      {giveaway && (
        <section className="w-full bg-[#0F0F0F] text-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
            <div className="mb-6 flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/60">
                JERSEY GIVEAWAY · {giveaway.days} DAYS
              </span>
              <span className="hidden sm:block font-mono text-[10px] uppercase tracking-[0.22em] text-[#FFCC00]">
                10 jerseys to win
              </span>
            </div>

            <div className="grid md:grid-cols-5 gap-5 lg:gap-6">
              {/* Left: big jersey card */}
              <div className="md:col-span-2 bg-[#1A1A1A] border border-white/10 p-5 sm:p-6 flex flex-col gap-4">
                <div className="aspect-[3/4] bg-[#2C2C2C] flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-3/4 h-3/4 border border-white/15 rounded-sm flex items-center justify-center">
                      <span className="font-heading text-[18px] sm:text-2xl uppercase tracking-[0.2em] text-white/70">
                        JERSEY
                      </span>
                    </div>
                  </div>
                  <div className="absolute bottom-3 right-3 font-heading text-[10px] uppercase tracking-[0.18em] text-white/50">
                    {giveaway.prizePool}
                  </div>
                </div>
                <h3 className="font-heading text-base sm:text-lg uppercase tracking-[0.14em]">
                  Win a football jersey
                  <br />
                  every day for 10 days
                </h3>
                <p className="text-white/60 text-[12px] leading-relaxed">
                  Daily winner announced in the WhatsApp group. Buy tees, join the club — both get you entries.
                </p>
              </div>

              {/* Right: how to enter */}
              <div className="md:col-span-3 flex flex-col gap-5">
                <h4 className="font-heading uppercase tracking-[0.14em] text-sm">
                  HOW YOU GET ENTRIES
                </h4>
                <ul className="flex flex-col gap-4">
                  {(giveaway.howToEnter ?? []).map((line, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="pt-0.5 flex-shrink-0 w-5 h-5 border border-white/30 flex items-center justify-center font-mono text-[10px]">
                        {i + 1}
                      </div>
                      <span className="text-[13px] leading-relaxed text-white/85">
                        {line}
                      </span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/shop"
                  className="mt-1 button-style inline-flex items-center justify-center w-full bg-[#FFCC00] text-[#0F0F0F] px-6 py-3 text-[11px] font-heading uppercase tracking-[0.18em] hover:bg-[#E8B800] transition-colors"
                >
                  SHOP 3 TEES FOR 10 ENTRIES →
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* --- SECTION 5: ABOUT DARRO + Uncle story --- */}
      <section className="w-full bg-[#F7F5F2] border-t border-[#E8E4DD]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#E8E4DD]">
              <Image
                src="/images/about-beach.jpg"
                alt="Darro — beach camping, built in China, worn in Uganda"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
            <div className="flex flex-col gap-5">
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#8A8680]">
                ABOUT DARRO
              </span>
              <h2 className="font-heading uppercase tracking-[0.14em] text-xl sm:text-2xl leading-tight text-[#0F0F0F]">
                Built in China.
                <br />
                Worn in Uganda.
              </h2>
              <p className="text-[#5C5344] text-sm sm:text-base leading-relaxed">
                {brand.uncleStory}
              </p>
              <p className="text-[#5C5344] text-sm sm:text-base leading-relaxed">
                {brand.shortDescription}. That's why we travel. That's why we build. This tee is for the person who gets it.
              </p>
              <Link
                href="/membership"
                className="button-style inline-flex items-center justify-center w-full sm:w-auto border border-[#0F0F0F] text-[#0F0F0F] px-6 py-3 text-[11px] font-heading uppercase tracking-[0.18em] hover:bg-[#0F0F0F] hover:text-[#F7F5F2] transition-colors"
              >
                JOIN DARRO CLUB →
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
