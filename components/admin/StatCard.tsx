"use client";

interface StatCardProps {
  label: string;
  value: string;
  delta: string;
  positive?: boolean;
}

export default function StatCard({
  label,
  value,
  delta,
  positive = true,
}: StatCardProps) {
  const deltaColor = positive
    ? "text-[var(--color-moss)]"
    : "text-[var(--color-ember)]";

  return (
    <div className="bg-[var(--color-bone)] border border-[var(--color-sand)] p-5 flex flex-col gap-2">
      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-stone)]">
        {label}
      </span>
      <span className="font-heading text-3xl tracking-[-0.01em] text-[var(--color-ink)]">
        {value}
      </span>
      <span className={`font-mono text-[11px] uppercase tracking-[0.12em] ${deltaColor}`}>
        {delta}
      </span>
    </div>
  );
}
