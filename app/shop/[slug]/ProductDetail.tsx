"use client";

import { useState } from "react";
import Link from "next/link";
import ProductGallery from "@/components/ProductGallery";
import SizeSelector from "@/components/SizeSelector";
import PriceDisplay from "@/components/PriceDisplay";
import SectionHeader from "@/components/SectionHeader";
import Reveal from "@/components/Reveal";
import RevealGroup from "@/components/RevealGroup";
import RevealItem from "@/components/RevealItem";
import ProductCard, { type Product } from "@/components/ProductCard";
import { useCart, type CartItem } from "@/lib/store";
import { useUI } from "@/lib/ui";
import { buildWhatsAppUrl, buildWhatsAppOrderMessage } from "@/lib/whatsapp";
import brand from "@/data/brand.json";
import offers from "@/data/offers.json";

interface RawProduct {
  id: number;
  slug: string;
  name: string;
  team: string;
  league: string;
  season: string;
  category: string;
  description: string;
  material: string;
  fitInfo: string;
  regularPriceUGX: number;
  memberPriceUGX: number;
  sizesAvailable: string[];
  sizesInStock?: string[];
  stockStatus: string;
  images: string[];
  isBestSeller: boolean;
  unitsSold: number;
  reviewsCount: number;
  avgRating: number;
  customizationAvailable: boolean;
  relatedProducts: string[];
}

interface ProductDetailClientProps {
  product: RawProduct;
  relatedRawProducts: RawProduct[];
}

type TabKey = "details" | "delivery";

export default function ProductDetailClient({
  product,
  relatedRawProducts,
}: ProductDetailClientProps) {
  const { addToCart, memberDiscountActive } = useCart();
  const { openCart } = useUI();

  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<TabKey>("details");
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [customizeEnabled, setCustomizeEnabled] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [jerseyNumber, setJerseyNumber] = useState("");

  const soldOut = product.stockStatus === "soldOut";

  const showBundleOffer =
    product.league === "Premier League" || product.league === "La Liga";
  const bundleOffer = offers.bundles.find((b) => b.id === "bundle-1");

  const relatedProductsCard: Product[] = relatedRawProducts.map((p) => ({
    id: String(p.id),
    slug: p.slug,
    name: p.name,
    league: p.league,
    team: p.team,
    images: p.images.map((src) => ({ src })),
    regularPriceUGX: p.regularPriceUGX,
    memberPriceUGX: p.memberPriceUGX,
    soldOut: p.stockStatus === "soldOut",
  }));

  const handleIncrement = () => setQuantity((q) => Math.min(99, q + 1));
  const handleDecrement = () => setQuantity((q) => Math.max(1, q - 1));

  const priceToUse =
    memberDiscountActive && product.memberPriceUGX
      ? product.memberPriceUGX
      : product.regularPriceUGX;

  const customizationFeeUGX = 10000;

  const buildCartItem = (): CartItem => {
    const finalPrice =
      priceToUse + (customizeEnabled ? customizationFeeUGX : 0);
    return {
      productId: product.id,
      slug: product.slug,
      name: product.name,
      priceUGX: finalPrice,
      size: selectedSize || "OS",
      quantity,
      image: product.images[0] || "/placeholder.svg",
      memberApplied: memberDiscountActive,
    };
  };

  const handleAddToCart = () => {
    if (soldOut) return;
    const item = buildCartItem();
    addToCart(item);
    openCart();
  };

  const handleBuyNowWhatsApp = () => {
    const cartItem = buildCartItem();
    const items = [cartItem];
    const subtotalRegular = product.regularPriceUGX * quantity + (customizeEnabled ? customizationFeeUGX * quantity : 0);
    const memberTotal = product.memberPriceUGX * quantity + (customizeEnabled ? customizationFeeUGX * quantity : 0);
    const totals = {
      subtotalRegular,
      bundleDiscountUGX: 0,
      memberTotal,
      totalSaved: memberDiscountActive
        ? subtotalRegular - memberTotal
        : 0,
    };
    const customizations = customizeEnabled
      ? {
          jerseyBackName: playerName || undefined,
          jerseyNumber: jerseyNumber || undefined,
        }
      : undefined;
    const message = buildWhatsAppOrderMessage(
      items,
      totals,
      memberDiscountActive,
      undefined,
      undefined,
      customizations
    );
    const url = buildWhatsAppUrl(brand.contact.whatsapp, message);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const stockStatusLine = () => {
    if (product.stockStatus === "inStock") {
      return (
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-moss">
          AVAILABLE
        </span>
      );
    }
    if (product.stockStatus === "lowStock") {
      return (
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-ember">
          LOW STOCK — ORDER SOON
        </span>
      );
    }
    return (
      <div className="flex flex-col gap-1">
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-stone">
          SOLD OUT
        </span>
        <Link
          href="/membership"
          className="text-[11px] font-heading uppercase tracking-[0.18em] text-ember hover:underline underline-offset-4"
        >
          Join Darro Club for restock alerts →
        </Link>
      </div>
    );
  };

  return (
    <div className="flex flex-col">
      <section className="w-full max-w-6xl mx-auto px-6 pt-16 pb-12 sm:pt-20 sm:pb-16">
        <nav className="mb-8 sm:mb-10" aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-1 font-mono text-[11px] uppercase tracking-[0.18em] text-stone">
            <li>
              <Link href="/" className="hover:text-foreground transition-colors">
                HOME
              </Link>
            </li>
            <li aria-hidden className="mx-1 text-foreground/30">/</li>
            <li>
              <Link href="/shop" className="hover:text-foreground transition-colors">
                SHOP
              </Link>
            </li>
            <li aria-hidden className="mx-1 text-foreground/30">/</li>
            <li className="text-foreground truncate max-w-[240px]">
              {product.name.toUpperCase()}
            </li>
          </ol>
        </nav>

        <div className="grid lg:grid-cols-12 lg:gap-12 gap-10 lg:gap-12">
          <div className="lg:col-span-7">
            <ProductGallery
              images={product.images}
              name={product.name}
              priority
            />
          </div>

          <div className="lg:col-span-5 lg:sticky lg:top-24 lg:self-start flex flex-col gap-6">
            <div className="flex flex-col gap-3">
              <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-stone">
                {product.team}
              </span>
              <h1 className="font-heading uppercase tracking-heading text-2xl sm:text-3xl leading-tight text-foreground">
                {product.name}
              </h1>
            </div>

            <PriceDisplay
              regularPriceUGX={product.regularPriceUGX}
              memberPriceUGX={product.memberPriceUGX}
              variant="detail"
            />

            <div className="pt-1">{stockStatusLine()}</div>

            {showBundleOffer && bundleOffer && bundleOffer.active && (
              <div className="bg-sand border border-sand p-4 flex flex-col gap-2">
                <span className="font-heading uppercase tracking-[0.18em] text-[11px] text-ink">
                  {bundleOffer.tagline}
                </span>
                <p className="text-sm text-ink/80 leading-relaxed">
                  Buy this jersey + get a FREE World Cup jersey. Join Darro Club to claim.
                </p>
                <Link
                  href="/membership"
                  className="font-heading uppercase tracking-[0.18em] text-[11px] text-ember hover:underline underline-offset-4 mt-1"
                >
                  Join Darro Club →
                </Link>
              </div>
            )}

            <div className="flex flex-col gap-3 pt-2">
              <label className="font-mono text-[11px] uppercase tracking-[0.18em] text-stone">
                SIZE
              </label>
              <SizeSelector
                sizesAvailable={product.sizesAvailable}
                sizesInStock={product.sizesInStock}
                selectedSize={selectedSize}
                onSelect={setSelectedSize}
                soldOut={soldOut}
              />
            </div>

            {product.customizationAvailable && (
              <div className="flex flex-col pt-2">
                <button
                  type="button"
                  onClick={() => setCustomizeOpen((o) => !o)}
                  className="flex items-center justify-between py-3 border-t border-foreground/10 text-left"
                  aria-expanded={customizeOpen}
                >
                  <span className="font-heading uppercase tracking-[0.18em] text-[11px] text-foreground">
                    ADD NAME + NUMBER (+UGX 10,000)
                  </span>
                  <svg
                    className={`w-4 h-4 text-stone transition-transform duration-200 ${
                      customizeOpen ? "rotate-45" : ""
                    }`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </button>
                <div
                  className={`grid transition-all duration-300 ease-out ${
                    customizeOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="pt-3 pb-1 flex flex-col gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={customizeEnabled}
                          onChange={(e) => setCustomizeEnabled(e.target.checked)}
                          className="w-4 h-4 rounded-none accent-ink"
                        />
                        <span className="text-xs font-mono uppercase tracking-[0.18em] text-stone">
                          Apply customization
                        </span>
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1.5">
                          <label className="font-mono text-[10px] uppercase tracking-[0.18em] text-stone">
                            Player Name
                          </label>
                          <input
                            type="text"
                            value={playerName}
                            onChange={(e) => setPlayerName(e.target.value)}
                            disabled={!customizeEnabled}
                            placeholder="e.g. SALAH"
                            className="w-full px-3 py-2.5 bg-bone border border-foreground/10 text-foreground placeholder:text-stone/60 focus:outline-none focus:border-ink text-sm transition-colors disabled:opacity-50"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="font-mono text-[10px] uppercase tracking-[0.18em] text-stone">
                            Jersey Number
                          </label>
                          <input
                            type="text"
                            value={jerseyNumber}
                            onChange={(e) => setJerseyNumber(e.target.value)}
                            disabled={!customizeEnabled}
                            placeholder="e.g. 11"
                            maxLength={2}
                            className="w-full px-3 py-2.5 bg-bone border border-foreground/10 text-foreground placeholder:text-stone/60 focus:outline-none focus:border-ink text-sm transition-colors disabled:opacity-50"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3 pt-2">
              <div className="flex items-center border border-foreground/20 w-fit">
                <button
                  type="button"
                  onClick={handleDecrement}
                  disabled={soldOut}
                  className="w-12 h-12 flex items-center justify-center text-foreground hover:bg-foreground hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="Decrease quantity"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                    <path d="M5 12h14" />
                  </svg>
                </button>
                <span className="w-14 h-12 flex items-center justify-center font-heading uppercase tracking-[0.18em] text-foreground text-sm select-none">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={handleIncrement}
                  disabled={soldOut}
                  className="w-12 h-12 flex items-center justify-center text-foreground hover:bg-foreground hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="Increase quantity"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </button>
              </div>

              <button
                type="button"
                onClick={handleAddToCart}
                disabled={soldOut}
                className="button-style w-full py-4 bg-charcoal text-white text-[11px] hover:bg-ink transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ADD TO CART
              </button>

              <button
                type="button"
                onClick={handleBuyNowWhatsApp}
                disabled={soldOut}
                className="button-style w-full py-4 border border-ink bg-transparent text-ink text-[11px] hover:bg-ink hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                BUY NOW · ORDER VIA WHATSAPP
              </button>
            </div>

            <div className="bg-bone border border-bone p-5 mt-6 flex flex-col gap-3">
              <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink">
                DELIVERY · UGANDA 🇺🇬
              </div>
              <ul className="flex flex-col gap-1.5 text-sm text-ink/80 leading-relaxed">
                <li>· Processed via WhatsApp</li>
                <li>· Est. 3-5 working days after confirmation</li>
                <li>· Free delivery around Makerere University</li>
                <li>· Delivery fees apply based on location</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full max-w-6xl mx-auto px-6 pb-16 sm:pb-20">
        <div className="border-t border-foreground/10 pt-10 flex flex-col gap-8">
          <div className="flex flex-wrap gap-6 sm:gap-10 border-b border-foreground/10">
            {(["details", "delivery"] as TabKey[]).map((tab) => {
              const isActive = activeTab === tab;
              const label =
                tab === "details" ? "PRODUCT DETAILS" : "DELIVERY";
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`pb-5 font-heading uppercase tracking-[0.18em] text-xs transition-colors border-b -mb-px ${
                    isActive
                      ? "text-ink border-ink"
                      : "text-stone border-transparent hover:text-foreground"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {activeTab === "details" && (
            <div className="flex flex-col gap-5 max-w-3xl">
              <div className="flex flex-col gap-3">
                <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-stone">
                  DESCRIPTION
                </div>
                <p className="text-foreground/85 leading-relaxed">
                  {product.description}
                </p>
              </div>
              <div className="grid sm:grid-cols-2 gap-5 pt-2">
                <div className="flex flex-col gap-1.5">
                  <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-stone">
                    MATERIAL
                  </div>
                  <div className="text-sm text-foreground/85">{product.material}</div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-stone">
                    FIT
                  </div>
                  <div className="text-sm text-foreground/85">{product.fitInfo}</div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-stone">
                    SEASON
                  </div>
                  <div className="text-sm text-foreground/85">{product.season}</div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-stone">
                    LEAGUE
                  </div>
                  <div className="text-sm text-foreground/85">{product.league}</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "delivery" && (
            <div className="flex flex-col gap-5 max-w-3xl">
              <div className="bg-bone border border-bone p-6 flex flex-col gap-3">
                <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink">
                  DELIVERY · UGANDA 🇺🇬
                </div>
                <ul className="flex flex-col gap-2 text-sm text-ink/80 leading-relaxed">
                  <li>· All orders are processed via WhatsApp</li>
                  <li>· Estimated 3-5 working days after order confirmation</li>
                  <li>· Free delivery around Makerere University</li>
                  <li>· Delivery fees apply based on your location</li>
                  <li>· Nationwide delivery across Uganda</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="w-full max-w-6xl mx-auto px-6 pb-24 sm:pb-28">
        <Reveal className="flex flex-col gap-10">
          <SectionHeader
            eyebrow="RELATED"
            title="YOU MAY ALSO LIKE"
            align="left"
          />
          <RevealGroup className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {relatedProductsCard.slice(0, 4).map((rp) => (
              <RevealItem key={rp.id}>
                <ProductCard product={rp} showMemberPrice />
              </RevealItem>
            ))}
          </RevealGroup>
        </Reveal>
      </section>
    </div>
  );
}
