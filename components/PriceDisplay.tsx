import Link from "next/link";

interface PriceDisplayProps {
  regularPriceUGX: number;
  memberPriceUGX?: number;
  variant?: "card" | "detail" | "line";
  isBFPromo?: boolean;
}

function formatUGX(amount: number): string {
  return `UGX ${amount.toLocaleString("en-UG", { maximumFractionDigits: 0 })}`;
}

export default function PriceDisplay({
  regularPriceUGX,
  memberPriceUGX,
  variant = "card",
  isBFPromo = true,
}: PriceDisplayProps) {
  const salePrice = memberPriceUGX ?? regularPriceUGX;
  const hasDiscount = regularPriceUGX > salePrice;

  if (variant === "detail") {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-baseline gap-3 flex-wrap">
          <span className="font-heading uppercase tracking-[0.14em] text-3xl text-[#0F0F0F]">
            {formatUGX(salePrice)}
          </span>
          {hasDiscount && (
            <span className="font-mono text-[13px] line-through text-[#8A8680]">
              {formatUGX(regularPriceUGX)}
            </span>
          )}
        </div>
        {isBFPromo && hasDiscount && (
          <span className="inline-flex items-center w-fit px-2.5 py-1 bg-[#A63D2F]/10 text-[#A63D2F] font-mono text-[10px] uppercase tracking-[0.18em]">
            Black Friday Offer
          </span>
        )}
      </div>
    );
  }

  if (variant === "line") {
    return (
      <div className="inline-flex items-baseline gap-2">
        <span className="font-heading uppercase tracking-[0.18em] text-[#0F0F0F]">
          {formatUGX(salePrice)}
        </span>
        {hasDiscount && (
          <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#8A8680] line-through">
            {formatUGX(regularPriceUGX)}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-baseline gap-2">
        <span className="font-heading uppercase tracking-[0.14em] text-sm text-[#0F0F0F]">
          {formatUGX(salePrice)}
        </span>
        {hasDiscount && (
          <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-[#8A8680] line-through">
            {formatUGX(regularPriceUGX)}
          </span>
        )}
      </div>
    </div>
  );
}
