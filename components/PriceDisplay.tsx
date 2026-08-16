import Link from "next/link";

interface PriceDisplayProps {
  regularPriceUGX: number;
  memberPriceUGX?: number;
  variant?: "card" | "detail" | "line";
}

function formatUGX(amount: number): string {
  return `UGX ${amount.toLocaleString("en-UG", { maximumFractionDigits: 0 })}`;
}

export default function PriceDisplay({
  regularPriceUGX,
  memberPriceUGX,
  variant = "card",
}: PriceDisplayProps) {
  const hasMemberPrice = typeof memberPriceUGX === "number";

  if (variant === "line") {
    return (
      <div className="inline-flex items-baseline gap-2">
        <span className="font-heading uppercase tracking-[0.18em] text-[#0F0F0F]">
          {formatUGX(regularPriceUGX)}
        </span>
        {hasMemberPrice && (
          <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#8A8680]">
            🔥 Member: {formatUGX(memberPriceUGX)}
          </span>
        )}
      </div>
    );
  }

  if (variant === "detail") {
    return (
      <div className="flex flex-col gap-2">
        <span className="font-heading uppercase tracking-[0.18em] text-3xl text-[#0F0F0F]">
          {formatUGX(regularPriceUGX)}
        </span>
        {hasMemberPrice && (
          <div className="flex flex-col gap-1">
            <span className="font-mono text-xs uppercase tracking-[0.15em] text-[#8A8680]">
              🔥 Darro Club Member: {formatUGX(memberPriceUGX)}
            </span>
            <Link
              href="/membership"
              className="inline-flex items-center gap-1 text-[11px] text-[#A63D2F] uppercase tracking-[0.18em] font-heading hover:underline underline-offset-4"
            >
              Join Darro Club to unlock member pricing
              <span aria-hidden>→</span>
            </Link>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-heading uppercase tracking-[0.18em] text-sm text-[#0F0F0F]">
        {formatUGX(regularPriceUGX)}
      </span>
      {hasMemberPrice && (
        <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#8A8680]">
          🔥 Member: {formatUGX(memberPriceUGX)}
        </span>
      )}
    </div>
  );
}
