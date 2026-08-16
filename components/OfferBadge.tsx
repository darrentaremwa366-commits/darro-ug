interface OfferBadgeProps {
  text: string;
  variant?: "ember" | "ink" | "moss";
  compact?: boolean;
}

export default function OfferBadge({
  text,
  variant = "ember",
  compact = false,
}: OfferBadgeProps) {
  const variantStyles = {
    ember: "bg-[#A63D2F] text-white",
    ink: "bg-[#1A1A1A] text-white",
    moss: "bg-[#4A5544] text-white",
  };

  return (
    <span
      className={`
        inline-flex items-center gap-1 uppercase tracking-[0.18em] text-[11px]
        ${variantStyles[variant]}
        ${compact ? "px-2 py-0.5" : "px-3 py-1.5"}
      `}
    >
      <span aria-hidden>🔥</span>
      <span>{text}</span>
    </span>
  );
}
