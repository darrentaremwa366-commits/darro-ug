"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { type Product } from "@/components/ProductCard";
import Reveal from "@/components/Reveal";
import RevealGroup from "@/components/RevealGroup";
import RevealItem from "@/components/RevealItem";
import SectionHeader from "@/components/SectionHeader";
import OfferBadge from "@/components/OfferBadge";
import productsData from "@/data/products.json";
import brand from "@/data/brand.json";

type CollectionKey = "2026/27" | "World Cup";

const products: Product[] = productsData.map((p) => ({
  id: String(p.id),
  slug: p.slug,
  name: p.name,
  league: p.league,
  collection: (p as { collection?: string }).collection,
  team: p.team,
  images: p.images.map((src) => ({ src })),
  regularPriceUGX: p.regularPriceUGX,
  memberPriceUGX: p.memberPriceUGX,
  soldOut: p.stockStatus === "soldOut",
}));

const collection2026 = products.filter((p) => p.collection === "2026/27");
const worldCupProducts = products.filter((p) => p.collection === "World Cup");

// Only 2 jerseys each. 2026: in-stock first, then sold out
const featured2026 = collection2026
  .slice()
  .sort((a, b) => Number(a.soldOut) - Number(b.soldOut))
  .slice(0, 2);

// World Cup: Portugal + Argentina first — all sold out
const featuredWorldCup = worldCupProducts
  .slice()
  .sort((a, _b) => {
    if (a.slug === "portugal-world-cup") return -1;
    if (a.slug === "argentina-world-cup") return -2;
    return 0;
  })
  .slice(0, 2);

export default function Home() {
  const [activeCollection, setActiveCollection] = useState<CollectionKey>("2026/27");

  const activeJerseys =
    activeCollection === "2026/27" ? featured2026 : featuredWorldCup;
  const viewAllHref =
    activeCollection === "2026/27"
      ? "/shop?collection=2026%2F27"
      : "/shop?collection=World%20Cup";
  return (
    <div className="flex flex-col">
      {/* SECTION 1: HERO — full landscape, centered */}
      <section className="relative w-full min-h-[60vh] sm:min-h-[80vh] lg:min-h-screen bg-[#0F0F0F] overflow-hidden">
        {/* Background image */}
        <div className="absolute inset-0">
          <Image
            src="/images/hero-brand.jpg"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#0F0F0F]/80 via-[#0F0F0F]/50 to-[#0F0F0F]/80" />
        </div>

        <div className="relative max-w-4xl mx-auto px-6 py-16 sm:py-20 lg:py-28 flex flex-col items-center justify-center text-center min-h-[60vh] sm:min-h-[80vh] lg:min-h-screen gap-6 sm:gap-8">
          <RevealGroup className="flex flex-col items-center gap-6 sm:gap-8 w-full">
            <RevealItem>
              <span className="inline-flex font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.18em] text-[#8A8680]">
                NEW DROP · SEASON 2026/27
              </span>
            </RevealItem>
            <RevealItem>
              <h1 className="font-heading uppercase tracking-[0.18em] leading-[0.9] text-[#F7F5F2] text-[clamp(2rem,8vw,5rem)]">
                <span className="block">THE WORLD</span>
                <span className="block">OF THE BUILDER</span>
              </h1>
            </RevealItem>
            <RevealItem>
              <p className="max-w-lg sm:max-w-xl text-[#8A8680] leading-relaxed text-sm sm:text-base lg:text-lg">
                Premium football jerseys for those who put in the work.
                Delivered across Uganda.
              </p>
            </RevealItem>
            <RevealItem>
              <div className="flex flex-col sm:flex-row gap-4 pt-2 sm:pt-4 w-full sm:w-auto">
                <Link
                  href="/shop"
                  className="button-style inline-flex items-center justify-center bg-[#F7F5F2] text-[#0F0F0F] px-8 py-4 text-[11px] hover:bg-white transition-colors"
                >
                  SHOP COLLECTION
                </Link>
                <Link
                  href="/membership"
                  className="button-style inline-flex items-center justify-center border border-[#F7F5F2]/30 text-[#F7F5F2] px-8 py-4 text-[11px] hover:border-[#F7F5F2] hover:bg-[#F7F5F2] hover:text-[#0F0F0F] transition-colors"
                >
                  JOIN DARRO CLUB
                </Link>
              </div>
            </RevealItem>
          </RevealGroup>
        </div>
      </section>

      {/* SECTION 2: JERSEYS — tab switcher + grid */}
      <section className="w-full py-12 sm:py-16 lg:py-20 bg-[#0F0F0F]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <RevealGroup className="flex flex-col gap-6 sm:gap-8">
            {/* Tab switcher — client-side toggle, shows only 3 jerseys per tab */}
            <RevealItem>
              <div className="flex items-center gap-6 border-b border-[#F7F5F2]/10 pb-4">
                <button
                  type="button"
                  onClick={() => setActiveCollection("2026/27")}
                  className={
                    "button-style relative font-heading text-[11px] sm:text-[12px] pb-2 transition-colors " +
                    (activeCollection === "2026/27"
                      ? "text-[#F7F5F2]"
                      : "text-[#8A8680] hover:text-[#F7F5F2]")
                  }
                >
                  2026/27
                  {activeCollection === "2026/27" && (
                    <span className="absolute bottom-0 left-0 w-full h-px bg-[#F7F5F2]" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveCollection("World Cup")}
                  className={
                    "button-style relative font-heading text-[11px] sm:text-[12px] pb-2 transition-colors uppercase " +
                    (activeCollection === "World Cup"
                      ? "text-[#F7F5F2]"
                      : "text-[#8A8680] hover:text-[#F7F5F2]")
                  }
                >
                  World Cup
                  {activeCollection === "World Cup" && (
                    <span className="absolute bottom-0 left-0 w-full h-px bg-[#F7F5F2]" />
                  )}
                </button>
              </div>
            </RevealItem>

            {/* Jersey grid — shows ONLY 2 jerseys matching the active tab (no mixing) */}
            <RevealItem>
              <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:gap-6 max-w-3xl mx-auto w-full">
                {activeJerseys.map((p) => (
                  <Link
                    key={p.id}
                    href={`/shop/${p.slug}`}
                    className="group relative aspect-[3/4] bg-[#1A1A1A] overflow-hidden"
                  >
                    <Image
                      src={p.images[0]?.src || ""}
                      alt={p.name}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0F0F0F]/60 via-transparent to-transparent" />
                    {p.soldOut && (
                      <div className="absolute inset-0 bg-[#0F0F0F]/50 flex items-center justify-center">
                        <span className="inline-flex px-2 py-1 font-mono text-[8px] sm:text-[9px] uppercase tracking-[0.16em] bg-[#0F0F0F]/80 text-white">
                          Sold Out
                        </span>
                      </div>
                    )}
                    <div className="absolute bottom-2 left-2 right-2">
                      <p className="font-heading text-[9px] sm:text-[10px] uppercase tracking-[0.15em] text-white/90 line-clamp-2 leading-tight">
                        {p.team || p.name}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </RevealItem>

            <RevealItem>
              <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.15em] text-[#8A8680]">
                <span>DISCOVER →</span>
                <Link href={viewAllHref} className="hover:text-[#F7F5F2] transition-colors">
                  VIEW ALL
                </Link>
              </div>
            </RevealItem>
          </RevealGroup>
        </div>
      </section>

      {/* SECTION 3: LIMITED BUNDLE OFFER — centered, no side images, no bullets */}
      <section className="w-full py-16 sm:py-20 lg:py-24 bg-[#F7F5F2]">
        <div className="max-w-2xl mx-auto px-6 flex flex-col items-center text-center gap-6 sm:gap-8">
          <RevealGroup className="flex flex-col items-center gap-6 sm:gap-8 w-full">
            <RevealItem>
              <OfferBadge text="Limited Bundle Offer" variant="ember" />
            </RevealItem>
            <RevealItem>
              <h2 className="font-heading uppercase tracking-[0.18em] text-2xl sm:text-3xl lg:text-4xl text-[#0F0F0F] leading-tight">
                2026/27 Jerseys Offer
                <br />
                <span className="text-[#A63D2F]">BUY 1 GET 1 FREE</span>
              </h2>
            </RevealItem>
            <RevealItem>
              <p className="text-[#8A8680] leading-relaxed max-w-lg text-sm sm:text-base">
                Pick a 2026/27 season jersey. Pair it with a World Cup jersey.
                Two jerseys shipped together — Arsenal and Man Utd in stock now.
              </p>
            </RevealItem>
            <RevealItem>
              <p className="font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.16em] text-[#1A1A1A]">
                You must be in the Darro Club
              </p>
            </RevealItem>
            <RevealItem>
              <Link
                href="/shop"
                className="button-style inline-flex items-center justify-center w-full sm:w-auto bg-[#2C2C2C] text-white px-8 py-4 text-[11px] hover:bg-[#1A1A1A] transition-colors"
              >
                SHOP BUNDLES →
              </Link>
            </RevealItem>
          </RevealGroup>
        </div>
      </section>

      {/* SECTION 4: COLLECTIONS — simple buttons, no images */}
      <section className="w-full py-12 sm:py-16 bg-[#F7F5F2] border-t border-[#E8E4DD]">
        <div className="max-w-4xl mx-auto px-6 flex flex-col items-center gap-6 sm:gap-8">
          <Reveal>
            <SectionHeader
              eyebrow="COLLECTIONS"
              title="BROWSE COLLECTIONS"
              align="center"
            />
          </Reveal>
          <RevealGroup className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <RevealItem>
              <Link
                href="/shop?collection=2026%2F27"
                className="button-style inline-flex items-center justify-center w-full sm:w-auto border border-[#0F0F0F] text-[#0F0F0F] px-8 py-4 text-[11px] hover:bg-[#0F0F0F] hover:text-white transition-colors"
              >
                2026/27 COLLECTION →
              </Link>
            </RevealItem>
            <RevealItem>
              <Link
                href="/shop?collection=World%20Cup"
                className="button-style inline-flex items-center justify-center w-full sm:w-auto border border-[#0F0F0F] text-[#0F0F0F] px-8 py-4 text-[11px] hover:bg-[#0F0F0F] hover:text-white transition-colors"
              >
                WORLD CUP JERSEYS →
              </Link>
            </RevealItem>
          </RevealGroup>
        </div>
      </section>

      {/* SECTION 5: DARRO CLUB MEMBERSHIP CTA */}
      <section className="w-full bg-[#2C2C2C] text-white py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center">
            <RevealGroup className="flex flex-col gap-6 order-2 md:order-1">
              <RevealItem>
                <span className="font-mono text-xs uppercase tracking-[0.18em] text-white/60">
                  MEMBERSHIP
                </span>
              </RevealItem>
              <RevealItem>
                <h2 className="font-heading uppercase tracking-[0.18em] text-2xl sm:text-3xl lg:text-4xl leading-tight">
                  JOIN UGANDA&apos;S FOOTBALL JERSEY COMMUNITY
                </h2>
              </RevealItem>
              <RevealItem>
                <p className="text-white/70 leading-relaxed">
                  {brand.club.headline}. Built for those who put in the work —
                  early mornings, quiet discipline, progress unseen.
                </p>
              </RevealItem>
              <RevealItem>
                <ul className="flex flex-col gap-3 pt-2">
                  {brand.club.benefits.map((b) => (
                    <li key={b} className="flex items-start gap-3">
                      <svg
                        className="h-4 w-4 mt-0.5 text-[#4A5544] flex-shrink-0"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span className="text-sm text-white/80 leading-relaxed">
                        {b}
                      </span>
                    </li>
                  ))}
                </ul>
              </RevealItem>
              <RevealItem>
                <div className="flex flex-col gap-3 pt-4">
                  <a
                    href={brand.contact.whatsappGroup}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="button-style inline-flex items-center justify-center sm:w-auto w-full bg-[#F0EDE8] text-[#1A1A1A] px-8 py-4 text-[11px] hover:bg-white transition-colors"
                  >
                    JOIN DARRO CLUB
                  </a>
                  <p className="font-mono text-[10px] uppercase leading-relaxed text-white/50 max-w-md tracking-wide">
                    {brand.club.consentText}
                  </p>
                </div>
              </RevealItem>
            </RevealGroup>

            <Reveal delay={0.15} className="order-1 md:order-2">
              <div className="relative bg-white/5 border border-white/10 p-6 sm:p-8">
                <div className="absolute top-4 right-4 inline-flex items-center gap-1 px-2.5 py-1 bg-[#4A5544] text-white font-mono text-[9px] uppercase tracking-[0.18em]">
                  FREE {brand.club.freeDeliveryZone.toUpperCase()} DELIVERY
                </div>

                <div className="flex flex-col gap-6 pt-8">
                  <div className="flex flex-col gap-1">
                    <span className="font-signature text-5xl sm:text-6xl text-white/90 leading-none">
                      Darro
                    </span>
                    <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/50 mt-2">
                      EARNED · NOT BOUGHT
                    </span>
                  </div>

                  <div className="w-full h-px bg-white/10" />

                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: "Member Pricing", icon: "UGX" },
                      { label: "Early Access", icon: "★" },
                      { label: "Limited Drops", icon: "◆" },
                      { label: "Free Delivery", icon: "↻" },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="flex flex-col gap-2 p-3 bg-white/5 border border-white/5"
                      >
                        <span className="text-lg text-[#4A5544]">{item.icon}</span>
                        <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/70">
                          {item.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </div>
  );
}
