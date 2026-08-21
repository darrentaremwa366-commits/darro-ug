"use client";

import { useState, useMemo, Suspense, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import ProductCard, { type Product } from "@/components/ProductCard";
import PageHero from "@/components/PageHero";
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

const COLLECTIONS: Array<"All" | "2026/27" | "World Cup"> = ["All", "2026/27", "World Cup"];

const PAGE_SIZE = 8;

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F7F5F2]" />}>
      <ShopContent />
    </Suspense>
  );
}

function buildHref(
  pathname: string,
  current: URLSearchParams,
  changes: Partial<{ collection: string | null; q: string | null }>
) {
  const params = new URLSearchParams(current.toString());
  params.delete("page");
  if ("collection" in changes) {
    if (changes.collection === null || changes.collection === undefined || changes.collection === "All")
      params.delete("collection");
    else params.set("collection", changes.collection);
  }
  if ("q" in changes) {
    if (changes.q === null || changes.q === undefined || !changes.q.trim())
      params.delete("q");
    else params.set("q", changes.q.trim());
  }
  const qs = params.toString();
  return `${pathname}${qs ? `?${qs}` : ""}`;
}

function ShopContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // URL is the SINGLE SOURCE OF TRUTH — filter values are derived, never stored
  // locally as state. This eliminates the "works on refresh only" race where
  // local state + useEffect + router.replace desync in Suspense boundaries.
  const activeCategory = (searchParams.get("collection") ?? "All") as "All" | "2026/27" | "World Cup";
  const searchQuery = searchParams.get("q") ?? "";

  // Only transient UX state: input while typing, and Load More paginator.
  const [inputValue, setInputValue] = useState<string>(searchQuery);
  const [visibleCount, setVisibleCount] = useState<number>(PAGE_SIZE);

  // Sync search input when URL ?q changes (back/forward, deep links, clear).
  useEffect(() => {
    setInputValue(searchParams.get("q") ?? "");
  }, [searchParams]);

  // Reset paginator when the effective filter changes.
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [activeCategory, searchQuery]);

  const filteredProducts = useMemo(() => {
    let result = allProducts;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.team?.toLowerCase().includes(q)) ||
          (p.league?.toLowerCase().includes(q))
      );
    }

    if (activeCategory !== "All") {
      result = result.filter((p) => p.collection === activeCategory);
    }

    return result;
  }, [searchQuery, activeCategory]);

  const visibleProducts = filteredProducts.slice(0, visibleCount);
  const hasMore = visibleCount < filteredProducts.length;

  const commitSearch = (val: string) => {
    const href = buildHref(pathname, searchParams, {
      q: val.trim() || null,
    });
    // router.replace + router.refresh guarantees the nested Suspense boundary
    // reads the fresh searchParams, no stale values.
    router.replace(href, { scroll: false });
    router.refresh();
  };

  const clearFilters = () => {
    const href = buildHref(pathname, searchParams, {
      collection: null,
      q: null,
    });
    setInputValue("");
    router.replace(href, { scroll: false });
    router.refresh();
  };

  return (
    <div className="flex flex-col">
      <PageHero
        eyebrow="CATALOG"
        title="SHOP ALL"
        description="Premium football jerseys from the world's top leagues. Delivered across Uganda."
        count={filteredProducts.length}
        countLabel="Jerseys"
        align="left"
      />

      <section className="w-full max-w-6xl mx-auto px-6 pb-20 sm:pb-28">
        <Reveal className="flex flex-col gap-8 sm:gap-10">
          <div className="flex flex-col gap-6">
            <form
              className="relative w-full max-w-xl"
              onSubmit={(e) => {
                e.preventDefault();
                commitSearch(inputValue);
              }}
            >
              <svg
                className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="text"
                placeholder="Search jerseys, teams, leagues..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onBlur={(e) => {
                  if (e.target.value !== searchQuery) commitSearch(e.target.value);
                }}
                className="w-full pl-11 pr-4 py-3 bg-bone border border-foreground/10 text-foreground placeholder:text-stone focus:outline-none focus:border-ink font-body text-sm transition-colors"
              />
            </form>

            {/* Filter tabs use native <Link> (not onClick + router.replace) so
                Next.js's Link component owns the navigation. This is the ONLY
                reliable way to propagate new searchParams through a Suspense
                boundary on every click without requiring a refresh. */}
            <div className="flex flex-wrap gap-2" role="tablist" aria-label="Collection filter">
              {COLLECTIONS.map((cat) => {
                const isActive = activeCategory === cat;
                const href = buildHref(pathname, searchParams, {
                  collection: cat === "All" ? null : cat,
                });
                return (
                  <Link
                    key={cat}
                    href={href}
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => {
                      // Hard refresh defense: guarantees router updates
                      // the Suspense boundary even if Next.js soft-nav
                      // decides to bail out of a transition.
                      setTimeout(() => router.refresh(), 0);
                    }}
                    className={`
                      inline-flex items-center px-4 py-2 font-mono text-[11px] uppercase tracking-[0.18em]
                      border transition-colors
                      ${
                        isActive
                          ? "bg-charcoal text-white border-charcoal"
                          : "bg-transparent text-foreground border-foreground/20 hover:border-ink"
                      }
                    `}
                  >
                    {cat}
                  </Link>
                );
              })}
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
              <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-stone">
                NO RESULTS
              </span>
              <h3 className="font-heading uppercase tracking-[0.18em] text-xl text-foreground">
                No jerseys match your search
              </h3>
              <p className="max-w-md text-stone text-sm">
                Collection filter: <strong>{activeCategory}</strong>
                {" · "}Products in data: <strong>{allProducts.length}</strong>
                {" · "}Matches in this collection: <strong>{allProducts.filter(p => p.collection === activeCategory).length}</strong>
                {"\n"}
                Try a different search term or clear filters below.
              </p>
              <button
                type="button"
                onClick={clearFilters}
                className="button-style inline-flex items-center justify-center border border-foreground/30 text-foreground px-6 py-3 text-[11px] hover:border-ink hover:bg-ink hover:text-white transition-colors mt-2"
              >
                CLEAR FILTERS
              </button>
            </div>
          ) : (
            <>
              <RevealGroup
                key={`grid-${activeCategory}-${searchQuery}-${visibleCount}`}
                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 py-8"
              >
                {visibleProducts.map((p) => (
                  <RevealItem key={p.id}>
                    <ProductCard product={p} showMemberPrice />
                  </RevealItem>
                ))}
              </RevealGroup>

              {hasMore && (
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
              )}
            </>
          )}
        </Reveal>
      </section>
    </div>
  );
}
