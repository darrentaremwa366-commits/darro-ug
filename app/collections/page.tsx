"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import ProductCard, { type Product } from "@/components/ProductCard";
import Reveal from "@/components/Reveal";
import RevealGroup from "@/components/RevealGroup";
import RevealItem from "@/components/RevealItem";
import productsData from "@/data/products.json";

const allProducts: Product[] = productsData.map((p) => ({
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

const collections = [
  {
    title: "2026/27 Collection",
    slug: "2026/27",
    href: "/shop?collection=2026%2F27",
    image:
      "https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&q=80&w=800&h=1000",
    gradient: "from-moss/70 via-charcoal/40 to-transparent",
    description: "The new season's home kits across Europe's top clubs.",
  },
  {
    title: "World Cup Jerseys",
    slug: "World Cup",
    href: "/shop?collection=World%20Cup",
    image:
      "https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&q=80&w=800&h=1000",
    gradient: "from-earth/70 via-charcoal/40 to-transparent",
    description: "International glory. Champions editions and national kits.",
  },
];

const COLLECTION_TABS = ["All", "2026/27", "World Cup"];

const PAGE_SIZE = 8;

export default function CollectionsPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const filteredProducts = useMemo(() => {
    if (activeCategory === "All") return allProducts;
    return allProducts.filter((p) => p.collection === activeCategory);
  }, [activeCategory]);

  const visibleProducts = filteredProducts.slice(0, visibleCount);
  const hasMore = visibleCount < filteredProducts.length;

  const handleCategory = (cat: string) => {
    setActiveCategory(cat);
    setVisibleCount(PAGE_SIZE);
  };

  return (
    <div className="flex flex-col">
      {/* COLLECTIONS HERO */}
      <section className="relative w-full pt-20 pb-8 sm:pt-28 sm:pb-12 bg-background">
        <div className="max-w-6xl mx-auto px-6 flex flex-col gap-4">
          <Reveal>
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-stone">
              CURATED DROPS
            </span>
          </Reveal>
          <Reveal delay={0.05}>
            <h1 className="font-heading uppercase tracking-[0.18em] text-3xl sm:text-4xl md:text-5xl text-foreground leading-tight">
              COLLECTIONS
            </h1>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="max-w-xl text-stone leading-relaxed text-sm sm:text-base">
              Shop jersey collections grouped by league, era, and drop. Find
              your builder uniform.
            </p>
          </Reveal>
        </div>
      </section>

      {/* FEATURED COLLECTION CARDS */}
      <section className="w-full py-10 sm:py-14 bg-bone/40">
        <div className="max-w-6xl mx-auto px-6">
          <RevealGroup className="grid sm:grid-cols-2 gap-4 sm:gap-6">
            {collections.map((col) => {
              const productCount = allProducts.filter(
                (p) => p.collection === col.slug
              ).length;
              return (
                <RevealItem key={col.title}>
                  <Link
                    href={col.href}
                    className="group relative block w-full aspect-[4/5] overflow-hidden bg-sand text-left"
                  >
                    <div className="absolute inset-0">
                      <Image
                        src={col.image}
                        alt={col.title}
                        fill
                        sizes="(max-width: 640px) 100vw, 50vw"
                        className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
                      />
                    </div>
                    <div className={`absolute inset-0 bg-gradient-to-t ${col.gradient}`} />
                    <div className="absolute inset-0 flex flex-col justify-end p-5 sm:p-6 text-left">
                      <span className="inline-flex self-start px-2.5 py-1 bg-bone/90 text-ink font-mono text-[10px] uppercase tracking-[0.18em] mb-3">
                        {productCount} ITEMS
                      </span>
                      <h3 className="font-heading uppercase tracking-[0.18em] text-white text-lg sm:text-xl leading-tight mb-2">
                        {col.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-white/75 leading-relaxed mb-3">
                        {col.description}
                      </p>
                      <span className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.15em] text-white/80 group-hover:text-white transition-colors">
                        Shop collection
                        <span aria-hidden>→</span>
                      </span>
                    </div>
                  </Link>
                </RevealItem>
              );
            })}
          </RevealGroup>
        </div>
      </section>

      {/* CATEGORY TABS + FULL CATALOG */}
      <section className="w-full max-w-6xl mx-auto px-6 py-14 sm:py-20">
        <Reveal>
          <div className="flex flex-col gap-2 mb-8">
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-stone">
              FULL CATALOG
            </span>
            <h2 className="font-heading uppercase tracking-[0.18em] text-2xl sm:text-3xl text-foreground">
              BROWSE ALL
            </h2>
          </div>
        </Reveal>

        <Reveal delay={0.05}>
          <div className="flex flex-wrap gap-2 mb-8 pb-4 border-b border-foreground/10">
            {COLLECTION_TABS.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => handleCategory(cat)}
                className={`
                  px-4 py-2 font-mono text-[11px] uppercase tracking-[0.18em]
                  border transition-colors
                  ${
                    activeCategory === cat
                      ? "bg-charcoal text-white border-charcoal"
                      : "bg-transparent text-foreground border-foreground/20 hover:border-ink"
                  }
                `}
              >
                {cat}
                <span className="ml-2 opacity-60">
                  ({cat === "All" ? allProducts.length : allProducts.filter((p) => p.collection === cat).length})
                </span>
              </button>
            ))}
          </div>
        </Reveal>

        {filteredProducts.length === 0 ? (
          <Reveal>
            <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
              <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-stone">
                EMPTY
              </span>
              <h3 className="font-heading uppercase tracking-[0.18em] text-xl text-foreground">
                No jerseys in this collection yet
              </h3>
              <button
                type="button"
                onClick={() => handleCategory("All")}
                className="button-style inline-flex items-center justify-center border border-foreground/30 text-foreground px-6 py-3 text-[11px] hover:border-ink hover:bg-ink hover:text-white transition-colors mt-2"
              >
                VIEW ALL JERSEYS
              </button>
            </div>
          </Reveal>
        ) : (
          <>
            <RevealGroup className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 pb-8">
              {visibleProducts.map((p) => (
                <RevealItem key={p.id}>
                  <ProductCard product={p} showMemberPrice />
                </RevealItem>
              ))}
            </RevealGroup>

            {hasMore && (
              <Reveal>
                <div className="flex justify-center pt-4">
                  <button
                    type="button"
                    onClick={() =>
                      setVisibleCount((prev) => prev + PAGE_SIZE)
                    }
                    className="button-style inline-flex items-center justify-center border border-foreground/30 text-foreground px-8 py-4 text-[11px] hover:border-ink hover:bg-ink hover:text-white transition-colors"
                  >
                    LOAD MORE ({filteredProducts.length - visibleCount} left)
                  </button>
                </div>
              </Reveal>
            )}
          </>
        )}
      </section>
    </div>
  );
}
