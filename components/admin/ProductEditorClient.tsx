"use client";

import { useState } from "react";
import StatusBadge from "@/components/admin/StatusBadge";
import products from "@/data/products.json";

function formatUGX(amount: number): string {
  return `UGX ${Intl.NumberFormat("en-UG").format(amount)}`;
}

const ALL_SIZES = ["S", "M", "L", "XL", "XXL"] as const;

interface EditableProduct {
  id: number;
  slug: string;
  name: string;
  team: string;
  league: string;
  collection?: string;
  season: string;
  description: string;
  material: string;
  fitInfo: string;
  regularPriceUGX: number;
  memberPriceUGX: number;
  sizesAvailable: string[];
  sizesInStock: string[];
  stockStatus: string;
  stockQuantity: number;
  images: string[];
}

const initial: EditableProduct[] = products.map((p) => ({
  id: Number(p.id),
  slug: p.slug,
  name: p.name,
  team: p.team,
  league: p.league,
  collection: (p as { collection?: string }).collection,
  season: p.season,
  description: p.description,
  material: p.material,
  fitInfo: p.fitInfo,
  regularPriceUGX: p.regularPriceUGX,
  memberPriceUGX: p.memberPriceUGX,
  sizesAvailable: p.sizesAvailable,
  sizesInStock: (p as { sizesInStock?: string[] }).sizesInStock ?? p.sizesAvailable.slice(),
  stockStatus: p.stockStatus,
  stockQuantity: (() => {
    let qty = 25;
    if (p.stockStatus === "soldOut") qty = 0;
    if (p.stockStatus === "lowStock") qty = 3;
    return qty;
  })(),
  images: p.images,
}));

export default function ProductEditorClient() {
  const [search, setSearch] = useState("");
  const [filterCollection, setFilterCollection] = useState("All");
  const [rows, setRows] = useState<EditableProduct[]>(initial);
  const [editingId, setEditingId] = useState<number | null>(null);

  const collections = [
    "All",
    ...Array.from(new Set(rows.map((p) => p.collection).filter(Boolean) as string[])),
  ];

  const filtered = rows.filter((p) => {
    const matchSearch =
      search === "" ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.team.toLowerCase().includes(search.toLowerCase());
    const matchCol = filterCollection === "All" || p.collection === filterCollection;
    return matchSearch && matchCol;
  });

  const setQty = (id: number, next: number) => {
    setRows((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, stockQuantity: Math.max(0, Math.round(next)) }
          : r,
      ),
    );
  };

  const patchRow = (id: number, patch: Partial<EditableProduct>) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    );
  };

  const toggleSize = (id: number, size: string) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const has = r.sizesInStock.includes(size);
        return {
          ...r,
          sizesInStock: has
            ? r.sizesInStock.filter((s) => s !== size)
            : [...r.sizesInStock, size],
        };
      }),
    );
  };

  const derivedStatusFor = (p: EditableProduct): "inStock" | "lowStock" | "soldOut" => {
    if (p.stockQuantity === 0) return "soldOut";
    if (p.stockQuantity <= 5) return "lowStock";
    return "inStock";
  };

  return (
    <section>
      <h2 className="font-heading text-sm uppercase tracking-[0.18em] text-[var(--color-ink)] mb-5">
        Product Editor · Inventory &amp; Details
      </h2>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex gap-3">
          <button
            type="button"
            className="inline-flex items-center justify-center font-mono text-[11px] uppercase tracking-[0.18em] px-6 py-3 bg-[var(--color-charcoal)] text-white hover:bg-[var(--color-ink)] transition-colors w-fit"
          >
            + Add Product
          </button>
          <button
            type="button"
            className="inline-flex items-center justify-center font-mono text-[11px] uppercase tracking-[0.18em] px-5 py-3 border border-[var(--color-sand)] text-[var(--color-charcoal)] hover:bg-[var(--color-bone)] transition-colors w-fit"
          >
            Import CSV
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 flex-1 sm:max-w-xl sm:ml-auto">
          <div className="relative flex-1">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--color-stone)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.3-4.3" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
              className="w-full pl-10 pr-4 py-2.5 bg-[var(--color-bone)] border border-[var(--color-sand)] font-mono text-xs tracking-wide placeholder:text-[var(--color-stone)] focus:outline-none focus:border-[var(--color-charcoal)]"
            />
          </div>
          <select
            value={filterCollection}
            onChange={(e) => setFilterCollection(e.target.value)}
            className="px-4 py-2.5 bg-[var(--color-bone)] border border-[var(--color-sand)] font-mono text-xs uppercase tracking-[0.12em] focus:outline-none focus:border-[var(--color-charcoal)]"
          >
            {collections.map((col) => (
              <option key={col} value={col}>
                {col === "All" ? "ALL COLLECTIONS" : col.toUpperCase()}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto border border-[var(--color-sand)] bg-[var(--color-bone)]">
        <table className="w-full text-sm min-w-[1100px]">
          <thead className="border-b border-[var(--color-sand)] bg-[var(--color-sand)]/40">
            <tr>
              <th className="text-left px-4 py-3 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-stone)] font-normal">
                Image
              </th>
              <th className="text-left px-4 py-3 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-stone)] font-normal">
                Product
              </th>
              <th className="text-left px-4 py-3 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-stone)] font-normal">
                Prices
              </th>
              <th className="text-left px-4 py-3 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-stone)] font-normal">
                Sizes In Stock
              </th>
              <th className="text-left px-4 py-3 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-stone)] font-normal">
                Stock Qty
              </th>
              <th className="text-left px-4 py-3 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-stone)] font-normal">
                Status
              </th>
              <th className="text-right px-4 py-3 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-stone)] font-normal">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => {
              const derived = derivedStatusFor(p);
              const isEditing = editingId === p.id;
              return (
                <tr
                  key={p.id}
                  className="border-b border-[var(--color-sand)]/50 last:border-b-0 align-middle"
                >
                  <td className="px-4 py-4">
                    <div className="relative w-14 h-14 bg-[var(--color-sand)] overflow-hidden">
                      <img
                        src={p.images[0]}
                        alt={p.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display = "none";
                        }}
                      />
                    </div>
                  </td>
                  <td className="px-4 py-4 pr-6 min-w-[260px]">
                    {isEditing ? (
                      <div className="flex flex-col gap-2">
                        <label className="flex flex-col gap-1">
                          <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--color-stone)]">
                            Name
                          </span>
                          <input
                            type="text"
                            value={p.name}
                            onChange={(e) => patchRow(p.id, { name: e.target.value })}
                            className="px-2.5 py-1.5 bg-white border border-[var(--color-sand)] text-[12px] focus:outline-none focus:border-[var(--color-charcoal)]"
                          />
                        </label>
                        <label className="flex flex-col gap-1">
                          <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--color-stone)]">
                            Description
                          </span>
                          <textarea
                            value={p.description}
                            onChange={(e) => patchRow(p.id, { description: e.target.value })}
                            rows={2}
                            className="px-2.5 py-1.5 bg-white border border-[var(--color-sand)] text-[12px] focus:outline-none focus:border-[var(--color-charcoal)] resize-y"
                          />
                        </label>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-0.5">
                        <span className="font-heading text-xs uppercase tracking-[0.12em] text-[var(--color-ink)]">
                          {p.name}
                        </span>
                        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--color-stone)]">
                          {p.team} · {p.season} · {p.collection || "—"}
                        </span>
                        <span className="font-mono text-[10px] tracking-wide text-[var(--color-stone)]">
                          slug: {p.slug}
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    {isEditing ? (
                      <div className="flex flex-col gap-1.5 w-[140px]">
                        <label className="flex flex-col gap-1">
                          <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--color-stone)]">
                            Regular (UGX)
                          </span>
                          <input
                            type="number"
                            value={p.regularPriceUGX}
                            onChange={(e) =>
                              patchRow(p.id, {
                                regularPriceUGX: Number(e.target.value) || 0,
                              })
                            }
                            className="px-2.5 py-1.5 bg-white border border-[var(--color-sand)] text-[12px] font-mono focus:outline-none focus:border-[var(--color-charcoal)]"
                          />
                        </label>
                        <label className="flex flex-col gap-1">
                          <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--color-stone)]">
                            Member (UGX)
                          </span>
                          <input
                            type="number"
                            value={p.memberPriceUGX}
                            onChange={(e) =>
                              patchRow(p.id, {
                                memberPriceUGX: Number(e.target.value) || 0,
                              })
                            }
                            className="px-2.5 py-1.5 bg-white border border-[var(--color-sand)] text-[12px] font-mono focus:outline-none focus:border-[var(--color-charcoal)]"
                          />
                        </label>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-0.5">
                        <span className="font-mono text-[11px] text-[var(--color-charcoal)]">
                          {formatUGX(p.regularPriceUGX)}
                        </span>
                        <span className="font-mono text-[10px] text-[var(--color-moss)]">
                          {formatUGX(p.memberPriceUGX)} (club)
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex flex-wrap gap-1.5">
                        {ALL_SIZES.map((sz) => {
                          const on = p.sizesInStock.includes(sz);
                          return (
                            <button
                              key={sz}
                              type="button"
                              onClick={() => toggleSize(p.id, sz)}
                              title={
                                on
                                  ? `Click to mark ${sz} out of stock`
                                  : `Click to mark ${sz} in stock`
                              }
                              className={`
                                relative min-w-[36px] px-2 py-1 font-heading uppercase tracking-[0.14em] text-[10.5px] border transition-colors
                                ${
                                  on
                                    ? "bg-[var(--color-ink)] text-white border-[var(--color-ink)]"
                                    : "bg-transparent text-[var(--color-stone)] border-[var(--color-sand)]"
                                }
                              `}
                            >
                              {on ? sz : (
                                <span className="relative inline-block">
                                  <span
                                    aria-hidden
                                    className="pointer-events-none absolute inset-x-0 top-1/2 h-px bg-[var(--color-stone)]/70"
                                  />
                                  {sz}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                      <span className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-[var(--color-stone)]">
                        {p.sizesInStock.length === 0
                          ? "NO SIZES IN STOCK"
                          : `${p.sizesInStock.length}/5 size${p.sizesInStock.length === 1 ? "" : "s"} live`}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="inline-flex items-stretch border border-[var(--color-sand)] bg-white">
                      <button
                        type="button"
                        onClick={() => setQty(p.id, p.stockQuantity - 1)}
                        className="w-8 h-9 hover:bg-[var(--color-sand)] transition-colors text-[var(--color-charcoal)] font-heading text-sm flex items-center justify-center"
                        aria-label="Decrease stock"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        min={0}
                        step={1}
                        value={p.stockQuantity}
                        onChange={(e) => setQty(p.id, Number(e.target.value))}
                        className="w-14 h-9 text-center font-mono text-xs bg-transparent border-x border-[var(--color-sand)] focus:outline-none text-[var(--color-ink)]"
                      />
                      <button
                        type="button"
                        onClick={() => setQty(p.id, p.stockQuantity + 1)}
                        className="w-8 h-9 hover:bg-[var(--color-sand)] transition-colors text-[var(--color-charcoal)] font-heading text-sm flex items-center justify-center"
                        aria-label="Increase stock"
                      >
                        +
                      </button>
                      <div className="w-px bg-[var(--color-sand)]" />
                      <button
                        type="button"
                        onClick={() => setQty(p.id, 0)}
                        className="px-2.5 h-9 hover:bg-[var(--color-ember)]/10 transition-colors text-[var(--color-ember)] font-mono text-[10px] uppercase tracking-[0.15em]"
                      >
                        Zero
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <StatusBadge status={derived} variant="product" />
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-end gap-4">
                      <button
                        type="button"
                        onClick={() => setEditingId(isEditing ? null : p.id)}
                        className={`font-mono text-[10px] uppercase tracking-[0.18em] hover:underline ${
                          isEditing ? "text-[var(--color-ember)]" : "text-[var(--color-moss)]"
                        }`}
                      >
                        {isEditing ? "Done ✓" : "Edit"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setQty(p.id, 0)}
                        className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-ember)] hover:underline"
                      >
                        Sold Out
                      </button>
                      <button
                        type="button"
                        className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-stone)] hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 font-mono text-[10px] text-[var(--color-stone)] uppercase tracking-[0.15em]">
        <span>Showing {filtered.length} of {rows.length} products</span>
        <div className="flex flex-wrap gap-4">
          <span>Total in stock: {rows.reduce((s, r) => s + r.stockQuantity, 0)} units</span>
          <span>
            In stock SKUs:{" "}
            {rows.filter((r) => derivedStatusFor(r) !== "soldOut").length} / {rows.length}
          </span>
          <span>
            Avg. sizes / SKU:{" "}
            {(rows.reduce((s, r) => s + r.sizesInStock.length, 0) / rows.length).toFixed(1)}
          </span>
        </div>
      </div>
    </section>
  );
}
