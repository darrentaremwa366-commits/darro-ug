import { redirect } from "next/navigation";
import { getAdminUserFromRequest } from "@/lib/auth";
import {
  getProductStats,
  getOverviewKpis,
} from "@/lib/admin/queries";
import AdminLayout from "@/components/admin/AdminLayout";
import ProductEditorClient from "@/components/admin/ProductEditorClient";

function formatUGX(amount: number): string {
  return `UGX ${Intl.NumberFormat("en-UG").format(amount)}`;
}

export default async function AdminProducts() {
  const user = await getAdminUserFromRequest();
  if (!user) redirect("/admin/login");

  const [productStats, kpis] = await Promise.all([
    getProductStats({ topN: 50 }),
    getOverviewKpis(),
  ]);

  const totalViews = productStats.reduce((s, r) => s + r.productViews, 0);
  const totalATC = productStats.reduce((s, r) => s + r.addToCarts, 0);
  const totalUnits = productStats.reduce((s, r) => s + r.unitsSold, 0);
  const totalRev = productStats.reduce((s, r) => s + r.netSalesUGX, 0);
  const totalProfit = productStats.reduce((s, r) => s + r.grossProfitUGX, 0);
  const avgMargin = productStats.length > 0
    ? Math.round((productStats.reduce((s, r) => s + r.grossMarginPct, 0) / productStats.length) * 10) / 10
    : 0;
  const atcRate = totalViews > 0 ? Math.round((totalATC / totalViews) * 1000) / 10 : 0;

  return (
    <AdminLayout title="Products" subtitle={`Catalog stats & management · ${productStats.length} SKUs tracked`}>
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        <div className="bg-[var(--color-bone)] border border-[var(--color-sand)] p-4 flex flex-col gap-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-stone)]">
            Product Views
          </span>
          <span className="font-heading text-2xl text-[var(--color-ink)]">
            {Intl.NumberFormat("en-UG").format(totalViews)}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--color-moss)]">
            last 30 days
          </span>
        </div>
        <div className="bg-[var(--color-bone)] border border-[var(--color-sand)] p-4 flex flex-col gap-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-stone)]">
            Add to Carts
          </span>
          <span className="font-heading text-2xl text-[var(--color-ink)]">
            {Intl.NumberFormat("en-UG").format(totalATC)}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--color-earth)]">
            {atcRate}% ATC rate
          </span>
        </div>
        <div className="bg-[var(--color-bone)] border border-[var(--color-sand)] p-4 flex flex-col gap-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-stone)]">
            Units Sold
          </span>
          <span className="font-heading text-2xl text-[var(--color-ink)]">
            {Intl.NumberFormat("en-UG").format(totalUnits)}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--color-stone)]">
            across all products
          </span>
        </div>
        <div className="bg-[var(--color-bone)] border border-[var(--color-sand)] p-4 flex flex-col gap-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-stone)]">
            Revenue
          </span>
          <span className="font-heading text-2xl text-[var(--color-ink)]">
            {formatUGX(totalRev)}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--color-moss)]">
            net sales
          </span>
        </div>
        <div className="bg-[var(--color-bone)] border border-[var(--color-sand)] p-4 flex flex-col gap-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-stone)]">
            Gross Profit
          </span>
          <span className="font-heading text-2xl text-[var(--color-ink)]">
            {formatUGX(totalProfit)}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--color-ember)]">
            COGS excluded
          </span>
        </div>
        <div className="bg-[var(--color-bone)] border border-[var(--color-sand)] p-4 flex flex-col gap-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-stone)]">
            Avg Margin
          </span>
          <span className="font-heading text-2xl text-[var(--color-ink)]">
            {avgMargin}%
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--color-stone)]">
            mean across SKUs
          </span>
        </div>
      </section>

      <section className="mb-10">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-heading text-sm uppercase tracking-[0.18em] text-[var(--color-ink)]">
            Product Performance · Stats View
          </h2>
          <span className="font-mono text-[10px] text-[var(--color-stone)]">
            {kpis.addToCarts} ATC events · {kpis.purchases} purchases captured
          </span>
        </div>
        <div className="overflow-x-auto border border-[var(--color-sand)] bg-[var(--color-bone)] mb-4">
          <table className="w-full text-sm min-w-[900px]">
            <thead className="border-b border-[var(--color-sand)] bg-[var(--color-sand)]/40">
              <tr>
                <th className="text-left px-4 py-3 font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--color-stone)] font-normal">
                  Product
                </th>
                <th className="text-right px-4 py-3 font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--color-stone)] font-normal">
                  Views
                </th>
                <th className="text-right px-4 py-3 font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--color-stone)] font-normal">
                  ATC
                </th>
                <th className="text-right px-4 py-3 font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--color-stone)] font-normal">
                  ATC Rate
                </th>
                <th className="text-right px-4 py-3 font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--color-stone)] font-normal">
                  Units
                </th>
                <th className="text-right px-4 py-3 font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--color-stone)] font-normal">
                  Revenue
                </th>
                <th className="text-right px-4 py-3 font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--color-stone)] font-normal">
                  Profit
                </th>
                <th className="text-right px-4 py-3 font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--color-stone)] font-normal">
                  Margin
                </th>
                <th className="text-right px-4 py-3 font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--color-stone)] font-normal">
                  Velocity
                </th>
              </tr>
            </thead>
            <tbody>
              {productStats.map((p) => (
                <tr
                  key={p.product_id}
                  className="border-b border-[var(--color-sand)]/50 last:border-b-0 hover:bg-[var(--color-sand)]/30"
                >
                  <td className="px-4 py-3 pr-6 min-w-[240px]">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-heading text-xs uppercase tracking-[0.12em] text-[var(--color-ink)]">
                        {p.product_name}
                      </span>
                      <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--color-stone)]">
                        {p.collection || "—"} · slug: {p.product_slug}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-xs text-[var(--color-charcoal)]">
                    {Intl.NumberFormat("en-UG").format(p.productViews)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-xs text-[var(--color-charcoal)]">
                    {Intl.NumberFormat("en-UG").format(p.addToCarts)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-xs text-[var(--color-moss)]">
                    {p.atcRatePct}%
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-xs text-[var(--color-charcoal)]">
                    {Intl.NumberFormat("en-UG").format(p.unitsSold)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-xs text-[var(--color-ink)]">
                    {formatUGX(p.netSalesUGX)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-xs text-[var(--color-moss)]">
                    {formatUGX(p.grossProfitUGX)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-xs">
                    <span
                      className={
                        p.grossMarginPct >= 30
                          ? "text-[var(--color-moss)]"
                          : "text-[var(--color-ember)]"
                      }
                    >
                      {p.grossMarginPct}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-xs text-[var(--color-stone)]">
                    {p.inventoryVelocity}/d
                  </td>
                </tr>
              ))}
              {productStats.length === 0 && (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-8 text-center font-mono text-[10px] text-[var(--color-stone)]"
                  >
                    No product data yet — events will populate as products are viewed, added to cart, and purchased
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div className="border-t-2 border-dashed border-[var(--color-sand)] my-10" />

      <ProductEditorClient />
    </AdminLayout>
  );
}
