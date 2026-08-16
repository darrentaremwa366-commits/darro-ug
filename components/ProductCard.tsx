"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart, type CartItem } from "@/lib/store";
import { useUI } from "@/lib/ui";
import ProductPhotoFrame from "@/components/ProductPhotoFrame";

interface ProductImage {
  src: string;
  alt?: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  league?: string;
  collection?: string;
  team?: string;
  images: ProductImage[];
  regularPriceUGX: number;
  memberPriceUGX?: number;
  soldOut?: boolean;
}

interface ProductCardProps {
  product: Product;
  showMemberPrice?: boolean;
  priority?: boolean;
}

function formatUGX(amount: number): string {
  return `UGX ${amount.toLocaleString("en-UG", { maximumFractionDigits: 0 })}`;
}

export default function ProductCard({
  product,
  showMemberPrice = false,
  priority = false,
}: ProductCardProps) {
  const { addToCart } = useCart();
  const { openCart } = useUI();

  const {
    slug,
    name,
    league,
    team,
    images,
    regularPriceUGX,
    memberPriceUGX,
    soldOut = false,
  } = product;

  const mainImage = images[0]?.src || "/placeholder.svg";
  const hasMemberPrice = showMemberPrice && typeof memberPriceUGX === "number";

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (soldOut) return;
    const item: CartItem = {
      productId: Number(product.id),
      slug,
      name,
      priceUGX: regularPriceUGX,
      size: "M",
      quantity: 1,
      image: mainImage,
      memberApplied: false,
    };
    addToCart(item);
    openCart();
  };

  return (
    <Link
      href={`/shop/${slug}`}
      className="group block w-full focus:outline-none"
    >
      <div className="flex flex-col w-full">
        <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#E8E4DD]">
          <ProductPhotoFrame warmth={0.65}>
            <Image
              src={mainImage}
              alt={name}
              fill
              priority={priority}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02]"
            />
          </ProductPhotoFrame>

          <div className="absolute inset-x-3 top-3 flex items-start justify-between z-10">
            <div className="flex flex-col items-start gap-1.5">
              {soldOut && (
                <span className="inline-flex items-center uppercase tracking-[0.18em] text-[11px] px-3 py-1.5 bg-[#EFEFEF] text-black/65">
                  Sold Out
                </span>
              )}
            </div>
          </div>

          {hasMemberPrice && !soldOut && (
            <div className="absolute bottom-3 right-3 z-10">
              <span className="inline-flex items-center gap-1 uppercase tracking-[0.18em] text-[10px] px-2.5 py-1 bg-[#1A1A1A]/90 text-white backdrop-blur-sm">
                Member Price
              </span>
            </div>
          )}

          {!soldOut && (
            <div className="absolute inset-x-0 bottom-0 translate-y-full transition-transform duration-300 ease-out group-hover:translate-y-0 z-10">
              <button
                type="button"
                onClick={handleAddToCart}
                className="w-full py-3 font-heading text-[11px] uppercase tracking-[0.18em] bg-[#1A1A1A]/95 text-white hover:bg-[#2C2C2C] transition-colors"
              >
                Add to Cart
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 pt-4">
          <div className="flex flex-col gap-1">
            <h3
              className="font-heading text-xs uppercase tracking-[0.18em] text-[#0F0F0F] line-clamp-2 leading-tight"
              style={{
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {name}
            </h3>
            {(league || team) && (
              <p className="font-mono text-[11px] uppercase text-[#8A8680] tracking-wide">
                {[league, team].filter(Boolean).join(" · ")}
              </p>
            )}
          </div>

          <div className="pt-1 flex flex-col gap-0.5">
            {!soldOut ? (
              <>
                <span className="font-heading uppercase tracking-[0.18em] text-sm text-[#0F0F0F]">
                  {formatUGX(regularPriceUGX)}
                </span>
                {hasMemberPrice && (
                  <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#8A8680]">
                    🔥 Member: {formatUGX(memberPriceUGX!)}
                  </span>
                )}
              </>
            ) : (
              <>
                <span className="font-heading uppercase tracking-[0.18em] text-sm text-[#8A8680]">
                  {formatUGX(regularPriceUGX)}
                </span>
                <span className="text-[10px] uppercase tracking-[0.18em] text-[#A63D2F] font-heading">
                  Join Darro Club for restock alerts
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
