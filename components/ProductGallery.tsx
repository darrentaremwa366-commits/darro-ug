"use client";

import Image from "next/image";
import { useState } from "react";
import ProductPhotoFrame from "@/components/ProductPhotoFrame";

interface ProductGalleryProps {
  images: string[];
  name: string;
  priority?: boolean;
}

const SLOT_LABELS = ["Front", "Back", "Details", "Avatar"];

export default function ProductGallery({
  images,
  name,
  priority = false,
}: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const safeImages = images.length > 0 ? images : ["/placeholder.svg"];
  const displayImages = safeImages.slice(0, 5);

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#E8E4DD]">
        <ProductPhotoFrame warmth={0.7}>
          <Image
            src={displayImages[activeIndex]}
            alt={`${name} - view ${activeIndex + 1}`}
            fill
            priority={priority}
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
          />
        </ProductPhotoFrame>
        {displayImages[activeIndex]?.includes("/avatar") && (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 px-2.5 py-1 bg-[var(--color-ink)]/85 backdrop-blur-sm text-white font-mono text-[9px] uppercase tracking-[0.18em] z-10">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-ember)] animate-pulse" />
            Darro Club Look
          </span>
        )}
      </div>
      {displayImages.length > 1 && (
        <div
          className="grid gap-2"
          style={{
            gridTemplateColumns: `repeat(${Math.min(
              displayImages.length,
              4
            )}, minmax(0, 1fr))`,
          }}
        >
          {displayImages.map((src, index) => {
            const label = SLOT_LABELS[index] ?? `View ${index + 1}`;
            const isAvatar = src.includes("/avatar");
            return (
              <button
                key={src + index}
                type="button"
                onClick={() => setActiveIndex(index)}
                aria-label={`Show ${label}`}
                className={`
                  relative aspect-square overflow-hidden bg-[#E8E4DD] transition-all duration-200 group
                  ${
                    activeIndex === index
                      ? "ring-2 ring-[#1A1A1A] ring-offset-2 ring-offset-[#F7F5F2]"
                      : "opacity-85 hover:opacity-100"
                  }
                `}
              >
                <ProductPhotoFrame warmth={0.5} hideBanner>
                  <Image
                    src={src}
                    alt={`${name} ${label.toLowerCase()}`}
                    fill
                    sizes="(max-width: 768px) 25vw, 120px"
                    className="object-cover"
                  />
                </ProductPhotoFrame>
                <span
                  className={`
                    absolute inset-x-0 bottom-0 py-1 px-1 font-mono text-[9px] uppercase tracking-[0.16em] text-white text-center z-10
                    ${isAvatar ? "bg-[var(--color-ember)]/90" : "bg-[#0F0F0F]/70"}
                  `}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
