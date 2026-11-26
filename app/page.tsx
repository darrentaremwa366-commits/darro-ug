"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import productsData from "@/data/products.json";
import brand from "@/data/brand.json";

const products = productsData as Array<{
  id: number; slug: string; name: string; color: string;
  regularPriceUGX: number; memberPriceUGX: number; currentPriceUGX: number;
  stockCount: number; bestSeller?: boolean; lowStock?: boolean;
  lowStockBanner?: string | null; images: string[];
}>;

function formatUGX(amount: number): string {
  return `UGX ${amount.toLocaleString("en-UG", { maximumFractionDigits: 0 })}`;
}

export default function Home() {
  const bundles = (brand.bundles ?? []) as Array<{
    id: string; label: string; count: number; priceUGX: number;
    wasPriceUGX: number; saveUGX: number; image?: string;
    subtitle?: string; highlight?: boolean;
  }>;
  const bfDates = (brand.bfDates ?? []) as Array<{ date: string; label: string }>;
  const giveaway = brand.jerseyGiveaway;
  const router = useRouter();

  function addToCartDirect(slug: string, qty: number) {
    // Redirect to cart with a direct add (simulate by going to shop then adding via URL)
    router.push(`/shop/${slug}?add=${qty}`);
  }

  // Find the black product slug
  const blackSlug = products.find((p) => p.color.toLowerCase().includes("black"))?.slug ?? "boxy-tshirt-black";

  return (
    <div className="flex flex-col bg-[#F7F5F2] min-h-screen text-[#0F0F0F]">

      {/* --- SECTION 1: HERO --- */}
      <section className="relative w-full bg-[#0F0F0F] overflow-hidden">
        <picture className="absolute inset-0">
          <source media="(max-width: 768px)" srcSet="/images/tee-black-front.png" />
          <Image
            src="/images/hero-beach.jpg"
            alt="DARRO — World of a Builder"
            fill priority sizes="100vw"
            className="object-cover object-center md:object-top brightness-[0.65] contrast-[1.05]"
          />
        </picture>
        <div className="absolute inset-0 bg-gradient-to-b from-[#0F0F0F]/40 via-[#0F0F0F]/20 to-[#0F0F0F]/85" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-36 flex flex-col items-center text-center gap-6 text-white">
          <span className="font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.3em] text-white/70">
            BLACK FRIDAY 2026
          </span>
          <h1 className="font-heading uppercase tracking-[0.14em] text-[clamp(1.8rem,6vw,4rem)] leading-[0.9] max-w-4xl">
            World of a Builder
          </h1>
          <p className="max-w-lg text-xs sm:text-sm text-white/70 leading-relaxed">
            Black Friday drop starts Nov 27. Every Friday until Dec 25.
            <br className="hidden sm:block" />
            UGX 34,000 · was UGX 54,000 — only on drop days.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full max-w-md mt-2">
            <Link href="/shop" className="button-style w-full sm:w-auto inline-flex items-center justify-center bg-[#F7F5F2] text-[#0F0F0F] px-6 sm:px-8 py-3 sm:py-3.5 text-[11px] font-heading uppercase tracking-[0.18em] hover:bg-white transition-colors">
              Shop T-Shirts
            </Link>
            <Link href="/membership" className="button-style w-full sm:w-auto inline-flex items-center justify-center border border-white text-white px-6 sm:px-8 py-3 sm:py-3.5 text-[11px] font-heading uppercase tracking-[0.18em] hover:bg-white hover:text-[#0F0F0F] transition-colors">
              Join Darro Club
            </Link>
          </div>
        </div>
      </section>

      {/* --- SECTION 2: BLACK FRIDAY PRICING CARDS --- */}
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
            <div className="hidden sm:block font-mono text-[10px] uppercase tracking-[0.22em] text-[#A63D2F] text-right">
              Valid Black Friday drop day only
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4 sm:gap-5">
            {bundles.map((b) => {
              const isBlack = b.highlight;
              return (
                <div key={b.id} className={
                  "relative flex flex-col border overflow-hidden " +
                  (isBlack
                    ? "border-[#0F0F0F] bg-[#0F0F0F] text-white"
                    : "border-[#D8D4CC] bg-white text-[#0F0F0F]")
                }>
                  {isBlack && (
                    <div className="absolute top-3 right-3 z-10 px-2.5 py-1 bg-[#A63D2F] text-white font-mono text-[9px] uppercase tracking-[0.2em]">
                      BEST VALUE
                    </div>
                  )}

                  {/* Small product image */}
                  {b.image && (
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#E8E4DD] border-b border-[#E8E4DD]">
                      <Image
                        src={b.image}
                        alt={b.label}
                        fill
                        sizes="(max-width: 640px) 50vw, 33vw"
                        className="object-cover"
                      />
                    </div>
                  )}

                  <div className="flex flex-col p-5 sm:p-5 flex-1">
                    <div className={"font-heading uppercase tracking-[0.14em] text-base sm:text-lg " + (isBlack ? "text-white" : "text-[#0F0F0F]")}>
                      {b.label}
                    </div>
                    <div className={"mt-1 text-[11px] font-mono uppercase tracking-[0.18em] " + (isBlack ? "text-white/60" : "text-[#8A8680]")}>
                      {b.subtitle}
                    </div>

                    <div className="mt-4 flex items-baseline gap-2">
                      <span className={"font-heading text-2xl sm:text-3xl tracking-tight " + (isBlack ? "text-white" : "text-[#0F0F0F]")}>
                        {formatUGX(b.priceUGX)}
                      </span>
                      <span className={"text-[11px] font-mono line-through " + (isBlack ? "text-white/50" : "text-[#8A8680]")}>
                        {formatUGX(b.wasPriceUGX)}
                      </span>
                    </div>
                    <div className={"mt-1 text-[11px] font-mono uppercase tracking-[0.18em] " + (isBlack ? "text-[#FFCC00]" : "text-[#A63D2F]")}>
                      Save {formatUGX(b.saveUGX)}
                    </div>

                    {/* Direct add-to-cart CTA */}
                    <button
                      onClick={() => addToCartDirect(blackSlug, b.count)}
                      className={
                        "mt-5 w-full py-2.5 text-[10px] font-heading uppercase tracking-[0.18em] transition-colors cursor-pointer " +
                        (isBlack
                          ? "bg-[#F7F5F2] text-[#0F0F0F] hover:bg-white"
                          : "bg-[#0F0F0F] text-white hover:bg-[#2C2C2C]")
                      }
                    >
                      Shop {b.count} T-Shirt{b.count > 1 ? "s" : ""}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* --- SECTION 3: BLACK FRIDAY CALENDAR (SIMPLIFIED — just dates) --- */}
      <section className="w-full bg-[#F7F5F2] border-t border-[#E8E4DD]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-12">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#8A8680]">
                BLACK FRIDAY 2026
              </span>
              <h2 className="mt-1 font-heading uppercase tracking-[0.14em] text-lg sm:text-xl text-[#0F0F0F]">
                Drop Calendar
              </h2>
            </div>
            <div className="hidden sm:block font-mono text-[10px] uppercase tracking-[0.22em] text-[#8A8680] text-right">
              UGX 34,000 · was 54,000 · valid on drop day only
            </div>
          </div>

          {/* Simple horizontal date list — no big boxes */}
          <div className="flex flex-wrap gap-x-6 gap-y-3 sm:gap-x-10 items-center">
            {bfDates.map((d, i) => (
              <div key={d.date} className="flex items-center gap-2 sm:gap-3">
                <div className="font-heading text-sm sm:text-base uppercase tracking-[0.1em] text-[#0F0F0F]">
                  {d.date}
                </div>
                <div className="font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.18em] text-[#A63D2F]">
                  {d.label}
                </div>
                {i < bfDates.length - 1 && (
                  <div className="hidden sm:block w-6 h-px bg-[#D8D4CC] ml-2" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- SECTION 4: BOXY T-SHIRTS --- */}
      <section className="w-full bg-[#F7F5F2] border-t border-[#E8E4DD]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <div className="mb-8 flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#8A8680]">
              BOXY T-SHIRTS — {products.length} COLORS
            </span>
            <Link href="/shop" className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#A63D2F] hover:underline underline-offset-4">
              View All
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-5 lg:gap-6">
            {products.map((p) => {
              const isSoldOut = p.stockCount <= 0;
              return (
                <Link key={p.id} href={`/shop/${p.slug}`} className="group relative block">
                  <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#E8E4DD]">
                    <Image src={p.images[0] ?? ""} alt={p.name} fill sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
                    {p.bestSeller && (
                      <div className="absolute top-3 left-3 z-10">
                        <span className="inline-flex items-center px-2.5 py-1 bg-[#0F0F0F]/90 text-white font-mono text-[9px] uppercase tracking-[0.22em]">BESTSELLER</span>
                      </div>
                    )}
                    {p.lowStockBanner && !isSoldOut && (
                      <div className="absolute top-3 right-3 z-10">
                        <span className="inline-flex items-center px-2.5 py-1 bg-[#A63D2F] text-white font-mono text-[9px] uppercase tracking-[0.18em]">{p.lowStockBanner}</span>
                      </div>
                    )}
                    {isSoldOut && (
                      <div className="absolute inset-0 bg-[#0F0F0F]/60 flex items-center justify-center z-10">
                        <span className="bg-white text-[#0F0F0F] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em]">Sold Out</span>
                      </div>
                    )}
                    {!isSoldOut && (
                      <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 z-10">
                        <div className="w-full py-2.5 font-heading text-[10px] uppercase tracking-[0.18em] bg-[#0F0F0F]/95 text-white text-center">Quick View</div>
                      </div>
                    )}
                  </div>
                  <div className="pt-3 flex flex-col gap-1">
                    <h3 className="font-heading text-[11px] sm:text-xs uppercase tracking-[0.14em] text-[#0F0F0F] leading-tight">{p.name}</h3>
                    <div className="flex items-baseline gap-2">
                      <span className="font-heading text-[13px] sm:text-sm tracking-[0.14em] text-[#0F0F0F]">{formatUGX(p.currentPriceUGX)}</span>
                      {p.regularPriceUGX > p.currentPriceUGX && (
                        <span className="text-[10px] font-mono line-through text-[#8A8680]">{formatUGX(p.regularPriceUGX)}</span>
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

      {/* --- SECTION 5: JERSEY GIVEAWAY --- */}
      {giveaway && (
        <section id="giveaway" className="w-full bg-[#0F0F0F] text-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
            <div className="mb-6 flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/60">
                JERSEY GIVEAWAY · {giveaway.days} DAYS
              </span>
              <span className="hidden sm:block font-mono text-[10px] uppercase tracking-[0.22em] text-[#FFCC00]">
                First {giveaway.firstNBuyers ?? 10} buyers win
              </span>
            </div>

            <div className="grid md:grid-cols-5 gap-5 lg:gap-6">
              <div className="md:col-span-2 bg-[#1A1A1A] border border-white/10 p-5 sm:p-6 flex flex-col gap-4">
                <div className="aspect-[3/4] bg-[#2C2C2C] flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 grid grid-rows-[2fr_1fr] gap-1 p-1">
                    <Image src="/images/products/arsenal-home-2026/front.jpg" alt="Arsenal home" fill sizes="50vw" className="object-cover" />
                    <div className="grid grid-cols-2 gap-1">
                      <Image src="/images/products/man-utd-home-2026/front.jpg" alt="Manchester United" fill sizes="25vw" className="object-cover" />
                      <Image src="/images/products/chelsea-home-2026/front.jpg" alt="Chelsea" fill sizes="25vw" className="object-cover" />
                    </div>
                  </div>
                  <div className="absolute bottom-3 right-3 font-heading text-[10px] uppercase tracking-[0.18em] text-white/70 bg-[#0F0F0F]/60 px-2 py-1">
                    5 jerseys · 10 days
                  </div>
                </div>
                <h3 className="font-heading text-base sm:text-lg uppercase tracking-[0.14em]">
                  Buy any t-shirt.
                  <br />Be first. Win a jersey.
                </h3>
                <p className="text-white/60 text-[12px] leading-relaxed">
                  First {giveaway.firstNBuyers ?? 10} people to buy any order through darro-ug.vercel.app — each gets a football jersey free. All 5 jerseys shown below.
                </p>
              </div>

              <div className="md:col-span-3 flex flex-col gap-5">
                <h4 className="font-heading uppercase tracking-[0.14em] text-sm">HOW IT WORKS</h4>
                <ul className="flex flex-col gap-4">
                  {(giveaway.howToEnter ?? []).map((line, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="pt-0.5 flex-shrink-0 w-5 h-5 border border-white/30 flex items-center justify-center font-mono text-[10px]">{i + 1}</div>
                      <span className="text-[13px] leading-relaxed text-white/85">{line}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/shop" className="mt-1 button-style inline-flex items-center justify-center w-full bg-[#FFCC00] text-[#0F0F0F] px-6 py-3 text-[11px] font-heading uppercase tracking-[0.18em] hover:bg-[#E8B800] transition-colors">
                  Shop T-Shirts · Be First
                </Link>
              </div>
            </div>

            {/* Jersey strip — all 5 */}
            <div className="mt-6 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {[
                { src: "/images/products/arsenal-home-2026/front.jpg", alt: "Arsenal" },
                { src: "/images/products/man-utd-home-2026/front.jpg", alt: "Manchester United" },
                { src: "/images/products/chelsea-home-2026/front.jpg", alt: "Chelsea" },
                { src: "/images/products/argentina-world-cup/front.jpg", alt: "Argentina World Cup" },
                { src: "/images/products/portugal-world-cup/front.jpg", alt: "Portugal World Cup" },
              ].map((j) => (
                <div key={j.src} className="flex-shrink-0 w-20 h-24 sm:w-24 sm:h-28 bg-[#2C2C2C] border border-white/10 relative overflow-hidden group">
                  <Image src={j.src} alt={j.alt} fill sizes="96px" className="object-cover" />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0F0F0F]/85 to-transparent pt-3 pb-1 px-1.5">
                    <span className="font-heading text-[8px] sm:text-[9px] uppercase tracking-[0.14em] text-white/85">{j.alt}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* --- SECTION 6: ABOUT DARRO --- */}
      <section className="w-full bg-[#F7F5F2] border-t border-[#E8E4DD]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#E8E4DD]">
              <Image src="/images/about-beach.jpg" alt="DARRO — built in China, worn in Uganda" fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
            </div>
            <div className="flex flex-col gap-5">
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#8A8680]">
                ABOUT DARRO
              </span>
              <h2 className="font-heading uppercase tracking-[0.14em] text-xl sm:text-2xl leading-tight text-[#0F0F0F]">
                Built in China.
                <br />Worn in Uganda.
              </h2>
              <p className="text-[#5C5344] text-sm sm:text-base leading-relaxed">
                {brand.uncleStory}
              </p>
              <p className="text-[#5C5344] text-sm sm:text-base leading-relaxed">
                {brand.shortDescription}. That&apos;s why we travel. That&apos;s why we build. This t-shirt is for the person who gets it.
              </p>
              <Link href="/membership" className="button-style inline-flex items-center justify-center w-full sm:w-auto border border-[#0F0F0F] text-[#0F0F0F] px-6 py-3 text-[11px] font-heading uppercase tracking-[0.18em] hover:bg-[#0F0F0F] hover:text-[#F7F5F2] transition-colors">
                Join Darro Club
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
