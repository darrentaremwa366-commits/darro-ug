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
    wasPriceUGX: number; saveUGX: number; highlight?: boolean;
  }>;
  const bfDates = (brand.bfDates ?? []) as Array<{ date: string }>;
  const giveaway = brand.jerseyGiveaway;
  const router = useRouter();
  const blackSlug = products.find((p) => p.color.toLowerCase().includes("black"))?.slug ?? "boxy-tshirt-black";

  // --- Pop-up ---
  const [showPopup, setShowPopup] = useState(false);
  useEffect(() => {
    const KEY = "darro-popup-shown";
    if (typeof window !== "undefined" && !localStorage.getItem(KEY)) {
      const t = setTimeout(() => setShowPopup(true), 1200);
      return () => clearTimeout(t);
    }
  }, []);
  const dismissPopup = () => {
    setShowPopup(false);
    localStorage.setItem("darro-popup-shown", "1");
  };

  // --- Buyer tracker ---
  const [buyerCount, setBuyerCount] = useState(0);
  useEffect(() => {
    const KEY = "darro-jersey-buyers";
    const saved = parseInt(localStorage.getItem(KEY) ?? "0", 10);
    setBuyerCount(saved);
  }, []);
  const maxBuyers = giveaway.firstNBuyers ?? 10;

  return (
    <div className="flex flex-col bg-[#F5F3EE] min-h-screen text-[#0F0F0F]">

      {/* ============== POP-UP ============== */}
      {showPopup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/70 backdrop-blur-sm" onClick={dismissPopup}>
          <div className="relative max-w-sm w-full bg-[#F5F3EE] text-[#0F0F0F] p-5 sm:p-6" onClick={(e) => e.stopPropagation()}>
            <button onClick={dismissPopup} className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center font-mono text-xs text-[#0F0F0F]/60 hover:text-[#0F0F0F]" aria-label="Close">✕</button>

            <div className="flex flex-col gap-3 text-center">
              <span className="font-mono text-[9px] uppercase tracking-[0.28em] text-[#A63D2F]">BLACK FRIDAY DROP · LIVE</span>
              <h3 className="font-heading uppercase tracking-[0.1em] text-xl sm:text-2xl leading-[0.95]">Get Your Free Jersey</h3>
              <p className="text-[13px] leading-relaxed text-[#3D3529]">
                If you&apos;re seeing this, you can still be one of the first <span className="font-heading text-[#0F0F0F]">{maxBuyers} buyers</span> to get a free football jersey.
              </p>
              <div className="grid grid-cols-3 gap-2 text-[11px] font-mono uppercase tracking-[0.1em] border-t border-[#E8E4DD] pt-3">
                <div className="flex flex-col">
                  <span className="font-heading text-[#0F0F0F] text-sm">{formatUGX(34000).replace("UGX ","")}</span>
                  <span className="text-[#8A8680] text-[9px]">1 T-SHIRT</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-heading text-[#0F0F0F] text-sm">{formatUGX(54000).replace("UGX ","")}</span>
                  <span className="text-[#8A8680] text-[9px]">2 T-SHIRTS</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-heading text-[#0F0F0F] text-sm">{formatUGX(74000).replace("UGX ","")}</span>
                  <span className="text-[#8A8680] text-[9px]">3 T-SHIRTS</span>
                </div>
              </div>
              <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-[#A63D2F] mt-1">
                Only {maxBuyers - buyerCount} spots left
              </div>
              <div className="h-1.5 bg-[#E8E4DD] w-full">
                <div className="h-full bg-[#A63D2F]" style={{ width: `${Math.min(100, (buyerCount/maxBuyers)*100)}%` }} />
              </div>
              <Link href="/shop" onClick={dismissPopup} className="mt-2 w-full py-3 bg-[#0F0F0F] text-[#F5F3EE] text-[10px] font-heading uppercase tracking-[0.2em] text-center hover:bg-[#2C2C2C] transition-colors">
                Shop T-Shirts Now
              </Link>
              <button onClick={dismissPopup} className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#8A8680] hover:text-[#0F0F0F] transition-colors">No thanks</button>
            </div>
          </div>
        </div>
      )}

      {/* ============== HERO ============== */}
      <section className="relative w-full bg-[#0F0F0F] overflow-hidden">
        <picture className="absolute inset-0">
          <source media="(max-width: 768px)" srcSet="/images/tee-black-front.png" />
          <Image src="/images/hero-beach.jpg" alt="DARRO — World of a Builder" fill priority sizes="100vw" className="object-cover object-center md:object-top brightness-[0.65] contrast-[1.05]" />
        </picture>
        <div className="absolute inset-0 bg-gradient-to-b from-[#0F0F0F]/40 via-[#0F0F0F]/20 to-[#0F0F0F]/85" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-36 flex flex-col items-center text-center gap-6 text-white">
          <span className="font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.3em] text-white/70">BLACK FRIDAY 2026</span>
          <h1 className="font-heading uppercase tracking-[0.14em] text-[clamp(1.8rem,6vw,4rem)] leading-[0.9] max-w-4xl">World of a Builder</h1>
          <p className="max-w-lg text-xs sm:text-sm text-white/70 leading-relaxed">
            Black Friday drop starts Nov 27. Every Friday until Dec 25.
            <br className="hidden sm:block" />
            UGX 34,000 · was UGX 54,000 — only on drop days.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full max-w-md mt-2">
            <Link href="/shop" className="w-full sm:w-auto inline-flex items-center justify-center bg-[#F5F3EE] text-[#0F0F0F] px-6 sm:px-8 py-3 sm:py-3.5 text-[11px] font-heading uppercase tracking-[0.18em] hover:bg-white transition-colors">Shop T-Shirts</Link>
            <Link href="/membership" className="w-full sm:w-auto inline-flex items-center justify-center border border-white text-white px-6 sm:px-8 py-3 sm:py-3.5 text-[11px] font-heading uppercase tracking-[0.18em] hover:bg-white hover:text-[#0F0F0F] transition-colors">Join Darro Club</Link>
          </div>
        </div>
      </section>

      {/* ============== BLACK FRIDAY PROJECT (Tim Psychotic style) ============== */}
      <section id="offers" className="w-full bg-[#F5F3EE] border-t border-[#E8E4DD]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          {/* Title — "BLACK FRIDAY PROJECT" is BIGGER */}
          <div className="mb-6 sm:mb-8">
            <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-[#8A8680]">BLACK FRIDAY 2026</span>
            <h2 className="mt-1 font-heading uppercase tracking-[0.08em] text-2xl sm:text-4xl text-[#0F0F0F] leading-none">BLACK FRIDAY PROJECT</h2>
            <p className="mt-2 text-[12px] sm:text-[13px] text-[#5C5344]">
              The bigger the bundle, the bigger the save. Prices valid on Black Friday drop days only — Nov 27 through Dec 25.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 md:gap-10 items-start">
            {/* LEFT / TOP: PODIUM IMAGE (responsive) */}
            <div className="relative bg-[#F5F3EE] border border-[#E8E4DD] overflow-hidden">
              <picture className="block w-full">
                <source media="(max-width: 768px)" srcSet="/images/podium-portrait.png" />
                <Image src="/images/podium-landscape.png" alt="1, 2, and 3 black t-shirt bundles" fill sizes="(max-width: 768px) 100vw, 50vw" className="object-contain bg-[#F5F3EE]" />
              </picture>
            </div>

            {/* RIGHT / BOTTOM: TIER TABLE */}
            <div className="flex flex-col">
              {/* Header row */}
              <div className="grid grid-cols-[auto_1fr_auto_auto] gap-3 px-1 py-2 text-[9px] font-mono uppercase tracking-[0.22em] text-[#8A8680] border-b border-[#0F0F0F]">
                <span className="w-16 sm:w-20">QUANTITY</span>
                <span className="hidden sm:block text-center">—</span>
                <span className="text-right">PRICE</span>
                <span className="text-right">SAVE</span>
              </div>

              {bundles.map((b) => {
                const isMid = b.highlight;
                return (
                  <button
                    key={b.id}
                    onClick={() => router.push(`/shop/${blackSlug}?add=${b.count}`)}
                    className={
                      "grid grid-cols-[auto_1fr_auto_auto] gap-3 items-center px-1 py-3 border-b border-[#E8E4DD] text-left transition-colors cursor-pointer " +
                      (isMid ? "bg-[#0F0F0F] text-[#F5F3EE]" : "hover:bg-[#E8E4DD]/40")
                    }
                  >
                    <span className={"font-heading uppercase tracking-[0.12em] text-sm w-16 sm:w-20 " + (isMid ? "text-[#F5F3EE]" : "text-[#0F0F0F]")}>
                      {b.label}
                    </span>
                    <span className={"hidden sm:flex text-[10px] font-mono uppercase tracking-[0.14em] items-center gap-2 " + (isMid ? "text-[#FFCC00]" : "text-[#8A8680]")}>
                      {isMid && "★ BEST VALUE"}
                    </span>
                    <span className={"text-right font-heading text-base sm:text-lg tabular-nums " + (isMid ? "text-[#F5F3EE]" : "text-[#0F0F0F]")}>
                      {formatUGX(b.priceUGX)}
                    </span>
                    <span className={"text-right " + (isMid ? "text-[#FFCC00]" : "text-[#A63D2F]")}>
                      <span className="font-mono text-[10px] uppercase tracking-[0.14em] line-through block sm:inline opacity-60 mr-1">
                        {formatUGX(b.wasPriceUGX).replace("UGX ", "")}
                      </span>
                      <span className="font-mono text-[10px] uppercase tracking-[0.14em]">
                        Save {formatUGX(b.saveUGX).replace("UGX ", "")}
                      </span>
                    </span>
                  </button>
                );
              })}

              <div className="pt-4 flex flex-col gap-3">
                <Link href="/shop" className="w-full py-3 bg-[#0F0F0F] text-[#F5F3EE] text-[10px] font-heading uppercase tracking-[0.2em] text-center hover:bg-[#2C2C2C] transition-colors">
                  Shop T-Shirts Now
                </Link>
                <div className="text-center font-mono text-[9px] uppercase tracking-[0.18em] text-[#8A8680]">
                  Free delivery · 3-5 working days
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============== DROP CALENDAR (small actual calendar) ============== */}
      <section className="w-full bg-[#F5F3EE] border-t border-[#E8E4DD]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
          <div className="grid md:grid-cols-[auto_1fr] gap-6 md:gap-10 items-start">
            {/* Sentence */}
            <div>
              <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-[#8A8680]">BLACK FRIDAY 2026</span>
              <h2 className="mt-1 font-heading uppercase tracking-[0.14em] text-base sm:text-lg text-[#0F0F0F]">Drop Calendar</h2>
              <p className="mt-2 text-[12px] text-[#5C5344] max-w-xs leading-relaxed">
                BF prices are valid on <span className="font-heading text-[#0F0F0F]">drop days only</span> — Nov 27 through Dec 25.
                <br />Other days → regular pricing.
              </p>
            </div>
            {/* Small calendar grid — 5 cells */}
            <div className="bg-white border border-[#E8E4DD] p-4">
              <div className="grid grid-cols-5 gap-2 text-center">
                {bfDates.map((d, i) => {
                  const isLive = i === 0;
                  const parts = d.date.split(" ");
                  return (
                    <div key={d.date} className={
                      "flex flex-col items-center gap-1 py-2 px-1 border " +
                      (isLive
                        ? "border-[#0F0F0F] bg-[#0F0F0F] text-[#F5F3EE]"
                        : "border-[#E8E4DD] bg-[#F5F3EE] text-[#0F0F0F]")
                    }>
                      <span className={"font-mono text-[8px] uppercase tracking-[0.2em] " + (isLive ? "text-white/60" : "text-[#8A8680]")}>
                        Fri
                      </span>
                      <span className="font-heading text-[13px] sm:text-sm leading-tight">
                        {parts[0]}
                      </span>
                      <span className={"font-heading text-[15px] sm:text-lg leading-none " + (isLive ? "text-[#FFCC00]" : "")}>
                        {parts[1]}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 flex items-center gap-3 text-[10px] font-mono uppercase tracking-[0.14em] text-[#8A8680]">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 bg-[#0F0F0F]" />
                  LIVE NOW
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 border border-[#E8E4DD] bg-[#F5F3EE]" />
                  UPCOMING
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============== BOXY T-SHIRTS GRID ============== */}
      <section className="w-full bg-[#F5F3EE] border-t border-[#E8E4DD]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <div className="mb-8 flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#8A8680]">BOXY T-SHIRTS — {products.length} COLORS</span>
            <Link href="/shop" className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#A63D2F] hover:underline underline-offset-4">View All</Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-5 lg:gap-6">
            {products.map((p) => {
              const isSoldOut = p.stockCount <= 0;
              return (
                <Link key={p.id} href={`/shop/${p.slug}`} className="group relative block">
                  <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#E8E4DD]">
                    <Image src={p.images[0] ?? ""} alt={p.name} fill sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
                    {p.bestSeller && <div className="absolute top-3 left-3 z-10"><span className="inline-flex items-center px-2.5 py-1 bg-[#0F0F0F]/90 text-white font-mono text-[9px] uppercase tracking-[0.22em]">BESTSELLER</span></div>}
                    {p.lowStockBanner && !isSoldOut && <div className="absolute top-3 right-3 z-10"><span className="inline-flex items-center px-2.5 py-1 bg-[#A63D2F] text-white font-mono text-[9px] uppercase tracking-[0.18em]">{p.lowStockBanner}</span></div>}
                    {isSoldOut && <div className="absolute inset-0 bg-[#0F0F0F]/60 flex items-center justify-center z-10"><span className="bg-white text-[#0F0F0F] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em]">Sold Out</span></div>}
                  </div>
                  <div className="pt-3 flex flex-col gap-1">
                    <h3 className="font-heading text-[11px] sm:text-xs uppercase tracking-[0.14em] text-[#0F0F0F] leading-tight">{p.name}</h3>
                    <div className="flex items-baseline gap-2">
                      <span className="font-heading text-[13px] sm:text-sm tracking-[0.14em] text-[#0F0F0F]">{formatUGX(p.currentPriceUGX)}</span>
                      {p.regularPriceUGX > p.currentPriceUGX && <span className="text-[10px] font-mono line-through text-[#8A8680]">{formatUGX(p.regularPriceUGX)}</span>}
                    </div>
                    <div className="text-[9px] sm:text-[10px] font-mono uppercase tracking-[0.18em] text-[#8A8680]">{p.stockCount} left · {p.color}</div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============== JERSEY GIVEAWAY ============== */}
      {giveaway && (
        <section id="giveaway" className="w-full bg-[#0F0F0F] text-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
            <div className="mb-8 bg-[#1A1A1A] border border-white/10 p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="font-mono text-[9px] uppercase tracking-[0.22em] text-white/50">Buyers entered · {maxBuyers} total</div>
                <div className="font-heading text-sm text-[#FFCC00] tabular-nums">{Math.min(buyerCount, maxBuyers)} / {maxBuyers}</div>
              </div>
              <div className="h-1.5 bg-white/10 w-full">
                <div className="h-full bg-[#FFCC00] transition-all duration-500" style={{ width: `${Math.min(100, (buyerCount/maxBuyers)*100)}%` }} />
              </div>
              <div className="mt-2 font-mono text-[9px] uppercase tracking-[0.2em] text-white/40">
                {buyerCount >= maxBuyers ? "All jerseys claimed" : `${maxBuyers - buyerCount} spots left · buy now`}
              </div>
            </div>

            <div className="grid md:grid-cols-5 gap-5 lg:gap-6">
              <div className="md:col-span-2 bg-[#1A1A1A] border border-white/10 p-5 sm:p-6 flex flex-col gap-4">
                <div className="aspect-[3/4] bg-[#2C2C2C] relative overflow-hidden">
                  <div className="absolute inset-0 grid grid-rows-[2fr_1fr] gap-1 p-1">
                    <Image src="/images/products/arsenal-home-2026/front.jpg" alt="Arsenal home" fill sizes="50vw" className="object-cover" />
                    <div className="grid grid-cols-2 gap-1">
                      <Image src="/images/products/man-utd-home-2026/front.jpg" alt="Manchester United" fill sizes="25vw" className="object-cover" />
                      <Image src="/images/products/chelsea-home-2026/front.jpg" alt="Chelsea" fill sizes="25vw" className="object-cover" />
                    </div>
                  </div>
                  <div className="absolute bottom-3 right-3 font-heading text-[10px] uppercase tracking-[0.18em] text-white/70 bg-[#0F0F0F]/60 px-2 py-1">5 jerseys</div>
                </div>
                <h3 className="font-heading text-base sm:text-lg uppercase tracking-[0.14em]">Buy any t-shirt. Be first. Win a jersey.</h3>
                <p className="text-white/60 text-[12px] leading-relaxed">
                  First {maxBuyers} people to buy any order through darro-ug.vercel.app — each gets a football jersey free.
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
                <Link href="/shop" className="mt-1 inline-flex items-center justify-center w-full bg-[#FFCC00] text-[#0F0F0F] px-6 py-3 text-[11px] font-heading uppercase tracking-[0.18em] hover:bg-[#E8B800] transition-colors">Shop T-Shirts · Be First</Link>
              </div>
            </div>

            <div className="mt-6 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {[
                { src: "/images/products/arsenal-home-2026/front.jpg", alt: "Arsenal" },
                { src: "/images/products/man-utd-home-2026/front.jpg", alt: "Manchester United" },
                { src: "/images/products/chelsea-home-2026/front.jpg", alt: "Chelsea" },
                { src: "/images/products/argentina-world-cup/front.jpg", alt: "Argentina" },
                { src: "/images/products/portugal-world-cup/front.jpg", alt: "Portugal" },
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

      {/* ============== ABOUT DARRO ============== */}
      <section className="w-full bg-[#F5F3EE] border-t border-[#E8E4DD]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#E8E4DD]">
              <Image src="/images/about-beach.jpg" alt="DARRO — built in China, worn in Uganda" fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
            </div>
            <div className="flex flex-col gap-5">
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#8A8680]">ABOUT DARRO</span>
              <h2 className="font-heading uppercase tracking-[0.14em] text-xl sm:text-2xl leading-tight text-[#0F0F0F]">Built in China.<br />Worn in Uganda.</h2>
              <p className="text-[#5C5344] text-sm sm:text-base leading-relaxed">{brand.uncleStory}</p>
              <p className="text-[#5C5344] text-sm sm:text-base leading-relaxed">{brand.shortDescription}. That&apos;s why we travel. That&apos;s why we build.</p>
              <Link href="/membership" className="inline-flex items-center justify-center w-full sm:w-auto border border-[#0F0F0F] text-[#0F0F0F] px-6 py-3 text-[11px] font-heading uppercase tracking-[0.18em] hover:bg-[#0F0F0F] hover:text-[#F5F3EE] transition-colors">Join Darro Club</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
