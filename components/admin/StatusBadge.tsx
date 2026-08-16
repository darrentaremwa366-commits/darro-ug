"use client";

type OrderStatus =
  | "NEW"
  | "CONFIRMED"
  | "PROCESSING"
  | "OUT FOR DELIVERY"
  | "COMPLETED";

type ProductStatus = "inStock" | "lowStock" | "soldOut";

type StatusBadgeProps =
  | { status: OrderStatus; variant: "order" }
  | { status: ProductStatus; variant: "product" };

const orderStyles: Record<OrderStatus, string> = {
  NEW: "bg-[var(--color-ember)] text-white",
  CONFIRMED: "bg-[var(--color-earth)] text-white",
  PROCESSING: "bg-[var(--color-stone)] text-white",
  "OUT FOR DELIVERY": "bg-[var(--color-moss)] text-white",
  COMPLETED: "bg-[var(--color-ink)] text-white",
};

const productStyles: Record<ProductStatus, string> = {
  inStock: "bg-[var(--color-moss)] text-white",
  lowStock: "bg-[var(--color-ember)] text-white opacity-80",
  soldOut: "bg-[var(--color-stone)] text-white opacity-65",
};

export default function StatusBadge({ status, variant }: StatusBadgeProps) {
  const styles =
    variant === "order"
      ? orderStyles[status as OrderStatus]
      : productStyles[status as ProductStatus];

  const label =
    variant === "product"
      ? status === "inStock"
        ? "IN STOCK"
        : status === "lowStock"
          ? "LOW STOCK"
          : "SOLD OUT"
      : status;

  return (
    <span
      className={`inline-flex items-center font-mono text-[10px] uppercase tracking-[0.18em] px-2.5 py-1 ${styles}`}
    >
      {label}
    </span>
  );
}
