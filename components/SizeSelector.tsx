"use client";

interface SizeSelectorProps {
  sizesAvailable: string[];
  sizesInStock?: string[];
  selectedSize: string | null;
  onSelect: (size: string) => void;
  soldOut?: boolean;
}

export default function SizeSelector({
  sizesAvailable,
  sizesInStock,
  selectedSize,
  onSelect,
  soldOut = false,
}: SizeSelectorProps) {
  const hasExplicitStock = Array.isArray(sizesInStock) && sizesInStock.length > 0;
  return (
    <div className="flex flex-wrap gap-2">
      {sizesAvailable.map((size) => {
        const isSelected = selectedSize === size;
        const sizeInStock = !hasExplicitStock || sizesInStock!.includes(size);
        const disabled = soldOut || !sizeInStock;
        return (
          <button
            key={size}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(size)}
            aria-pressed={isSelected}
            aria-disabled={disabled}
            title={!sizeInStock && !soldOut ? `${size} currently out of stock` : undefined}
            className={`
              relative min-w-[48px] px-4 py-2 font-heading uppercase tracking-[0.18em] text-xs
              transition-colors duration-200
              ${
                isSelected
                  ? "bg-[#1A1A1A] text-white border border-[#1A1A1A]"
                  : "bg-transparent text-[#0F0F0F] border border-[#8A8680]/30 hover:border-[#1A1A1A]"
              }
              ${
                disabled
                  ? "opacity-40 cursor-not-allowed hover:border-[#8A8680]/30"
                  : "cursor-pointer"
              }
            `}
          >
            {sizeInStock ? (
              size
            ) : (
              <span className="relative inline-block">
                <span aria-hidden className="pointer-events-none absolute inset-x-0 top-1/2 h-px bg-[#8A8680]/80" />
                <span aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center -rotate-[12deg]">
                  <span className="h-px w-[110%] bg-[#8A8680]/60" />
                </span>
                <span>{size}</span>
              </span>
            )}
          </button>
        );
      })}
      {hasExplicitStock && sizesInStock!.length < sizesAvailable.length && !soldOut && (
        <p className="w-full mt-1 font-mono text-[9.5px] uppercase tracking-[0.16em] text-[#8A8680]">
          Only {sizesInStock!.join(" / ")} available right now
        </p>
      )}
    </div>
  );
}
