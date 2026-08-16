import { redirect } from "next/navigation";
import { getAdminUserFromRequest } from "@/lib/auth";
import {
  getFunnel,
  getProductStats,
  getOverviewKpis,
  getTrafficSources,
} from "@/lib/admin/queries";
import AdminLayout from "@/components/admin/AdminLayout";
import StatCard from "@/components/admin/StatCard";

function formatUGX(amount: number): string {
  return `UGX ${Intl.NumberFormat("en-UG").format(amount)}`;
}

export default async function AdminAnalytics({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const user = await getAdminUserFromRequest();
  if (!user) redirect("/admin/login");

  const [kpis, funnel, products, traffic] = await Promise.all([
    getOverviewKpis(),
    getFunnel(),
    getProductStats({ topN: 10 }),
    getTrafficSources(),
  ]);

  const funnelMax = Math.max(...funnel.steps.map((s) => s.value), 1);

  return (
    <AdminLayout title="Analytics" subtitle={`Funnel & behaviour insights · Last 30 days`}>
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-10">
        <StatCard label="Product Views" value={Intl.NumberFormat("en-UG").format(funnel.productViews)} delta="top of funnel" positive />
        <StatCard label="Add to Carts" value={Intl.NumberFormat("en-UG").format(funnel.addToCarts)} delta={`${funnel.steps[1].convRate}% conv`} positive />
        <StatCard label="Checkout Starts" value={Intl.NumberFormat("en-UG").format(funnel.checkoutStarts)} delta={`${funnel.steps[2].convRate}% of ATC`} positive />
        <StatCard label="Purchases" value={Intl.NumberFormat("en-UG").format(funnel.purchases)} delta="final conversion" positive />
      </section>

      <section className="mb-10">
        <h2 className="font-heading text-sm uppercase tracking-[0.18em] text-[var(--color-ink)] mb-5">
          Conversion Funnel
        </h2>
        <div className="bg-[var(--color-bone)] border border-[var(--color-sand)] p-6">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-8">
            {funnel.steps.map((step, idx) => {
              const heightPct = Math.max(20, (step.value / funnelMax) * 100);
              const prev = idx > 0 ? funnel.steps[idx - 1].value : 0;
              const overallConv = funnel.productViews > 0
                ? Math.round((step.value / funnel.productViews) * 1000) / 10
                : 0;
              return (
                <div key={step.name} className="flex flex-col items-center gap-3">
                  <div className="w-full flex flex-col items-center justify-end h-56 border-b border-[var(--color-sand)] pb-2">
                    <span className="font-mono text-[10px] text-[var(--color-stone)] mb-2">
                      {Intl.NumberFormat("en-UG").format(step.value)}
                    </span>
                    <div
                      className={`w-full transition-all ${
                        idx === 4
                          ? "bg-[var(--color-moss)]"
                          : idx === 0
                          ? "bg-[var(--color-charcoal)]"
                          : "bg-[var(--color-earth)]"
                      } opacity-90`}
                      style={{ height: `${heightPct}%`, minHeight: "24px" }}
                    />
                  </div>
                  <div className="flex flex-col items-center gap-1 text-center">
                    <span className="font-mono text-[9px] w-6 h-6 bg-[var(--color-sand)] text-[var(--color-stone)] flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="font-heading text-xs uppercase tracking-[0.12em] text-[var(--color-ink)]">
                      {step.name}
                    </span>
                    <span className="font-mono text-[10px] text-[var(--color-moss)]">
                      {overallConv}% of top
                    </span>
                    {idx > 0 && step.dropFromPrev > 0 && (
                      <span className="font-mono text-[9px] uppercase tracking-wider text-[var(--color-ember)]">
                        -{step.dropFromPrev}% drop vs prev
                      </span>
                    )}
                    {idx > 0 && step.convRate > 0 && (
                      <span className="font-mono text-[9px] text-[var(--color-stone)]">
                        step conv: {step.convRate}%
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-6 border-t border-[var(--color-sand)] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex flex-col gap-2">
              <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--color-stone)]">
                Product → ATC Drop
              </span>
              <span className="font-heading text-2xl text-[var(--color-ember)]">
                {funnel.steps[1].dropFromPrev}%
              </span>
              <span className="font-mono text-[10px] text-[var(--color-stone)]">
                users leave before adding to cart
              </span>
            </div>
            <div className="flex flex-col gap-2">
              <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--color-stone)]">
                ATC → Checkout Drop
              </span>
              <span className="font-heading text-2xl text-[var(--color-ember)]">
                {funnel.steps[2].dropFromPrev}%
              </span>
              <span className="font-mono text-[10px] text-[var(--color-stone)]">
                drop between cart and checkout
              </span>
            </div>
            <div className="flex flex-col gap-2">
              <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--color-stone)]">
                Checkout → Purchase
              </span>
              <span className="font-heading text-2xl text-[var(--color-moss)]">
                {funnel.steps[4].convRate + funnel.steps[3].convRate > 0
                  ? Math.round(((funnel.steps[3].convRate || 0) / 100) * ((funnel.steps[4].convRate || 0) / 100) * 1000) / 10
                  : 0}%
              </span>
              <span className="font-mono text-[10px] text-[var(--color-stone)]">
                who start checkout complete purchase
              </span>
            </div>
            <div className="flex flex-col gap-2">
              <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--color-stone)]">
                Overall Conversion
              </span>
              <span className="font-heading text-2xl text-[var(--color-ink)]">
                {funnel.productViews > 0
                  ? Math.round((funnel.purchases / funnel.productViews) * 1000) / 10
                  : 0}%
              </span>
              <span className="font-mono text-[10px] text-[var(--color-stone)]">
                product_view → purchase
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-10">
        <div className="bg-[var(--color-bone)] border border-[var(--color-sand)] p-5 lg:col-span-2">
          <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-stone)] mb-5">
            Product Performance · Top 10
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[800px]">
              <thead className="border-b border-[var(--color-sand)] bg-[var(--color-sand)]/40">
                <tr>
                  <th className="text-left px-3 py-3 font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--color-stone)] font-normal">
                    Product
                  </th>
                  <th className="text-right px-3 py-3 font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--color-stone)] font-normal">
                    Views
                  </th>
                  <th className="text-right px-3 py-3 font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--color-stone)] font-normal">
                    ATC
                  </th>
                  <th className="text-right px-3 py-3 font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--color-stone)] font-normal">
                    ATC Rate
                  </th>
                  <th className="text-right px-3 py-3 font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--color-stone)] font-normal">
                    Units
                  </th>
                  <th className="text-right px-3 py-3 font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--color-stone)] font-normal">
                    Revenue
                  </th>
                  <th className="text-right px-3 py-3 font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--color-stone)] font-normal">
                    Profit
                  </th>
                  <th className="text-right px-3 py-3 font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--color-stone)] font-normal">
                    Margin
                  </th>
                  <th className="text-right px-3 py-3 font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--color-stone)] font-normal">
                    Velocity
                  </th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr
                    key={p.product_id}
                    className="border-b border-[var(--color-sand)]/50 last:border-b-0 hover:bg-[var(--color-sand)]/30"
                  >
                    <td className="px-3 py-3 pr-6 min-w-[220px]">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-heading text-xs uppercase tracking-[0.12em] text-[var(--color-ink)]">
                          {p.product_name}
                        </span>
                        <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--color-stone)]">
                          {p.collection || "—"}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-xs text-[var(--color-charcoal)]">
                      {Intl.NumberFormat("en-UG").format(p.productViews)}
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-xs text-[var(--color-charcoal)]">
                      {Intl.NumberFormat("en-UG").format(p.addToCarts)}
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-xs text-[var(--color-moss)]">
                      {p.atcRatePct}%
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-xs text-[var(--color-charcoal)]">
                      {Intl.NumberFormat("en-UG").format(p.unitsSold)}
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-xs text-[var(--color-ink)]">
                      {formatUGX(p.netSalesUGX)}
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-xs text-[var(--color-moss)]">
                      {formatUGX(p.grossProfitUGX)}
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-xs">
                      <span className={p.grossMarginPct >= 30 ? "text-[var(--color-moss)]" : "text-[var(--color-ember)]"}>
                        {p.grossMarginPct}%
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-xs text-[var(--color-stone)]">
                      {p.inventoryVelocity}/d
                    </td>
                  </tr>
                ))}
                {products.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-3 py-8 text-center font-mono text-[10px] text-[var(--color-stone)]">
                      No product data yet — events will populate once products are viewed and purchased
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-[var(--color-bone)] border border-[var(--color-sand)] p-5">
            <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-stone)] mb-4">
              Session-level Behaviour
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-[var(--color-charcoal)]">Sessions</span>
                <span className="font-heading text-lg text-[var(--color-ink)]">{kpis.sessions}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-[var(--color-charcoal)]">Unique Visitors</span>
                <span className="font-heading text-lg text-[var(--color-ink)]">{kpis.visitors}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-[var(--color-charcoal)]">Pageviews</span>
                <span className="font-heading text-lg text-[var(--color-ink)]">{kpis.pageviews}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-[var(--color-charcoal)]">Pages / Session</span>
                <span className="font-heading text-lg text-[var(--color-ink)]">
                  {kpis.sessions > 0 ? Math.round((kpis.pageviews / kpis.sessions) * 10) / 10 : 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-[var(--color-charcoal)]">Add to Carts</span>
                <span className="font-heading text-lg text-[var(--color-earth)]">{kpis.addToCarts}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-[var(--color-charcoal)]">ATC / 100 Visitors</span>
                <span className="font-heading text-lg text-[var(--color-earth)]">
                  {kpis.visitors > 0 ? Math.round((kpis.addToCarts / kpis.visitors) * 1000) / 10 : 0}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-[var(--color-bone)] border border-[var(--color-sand)] p-5">
            <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-stone)] mb-4">
              Traffic Sources
            </h3>
            <div className="space-y-3">
              {traffic.map((src) => (
                <div key={src.source_class} className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--color-charcoal)]">
                      {src.source_class.replace("_", " ")}
                    </span>
                    <span className="font-mono text-[10px] text-[var(--color-stone)]">
                      {src.pct}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-[var(--color-sand)]">
                    <div
                      className="h-full bg-[var(--color-earth)]"
                      style={{ width: `${src.pct}%` }}
                    />
                  </div>
                </div>
              ))}
              {traffic.length === 0 && (
                <p className="font-mono text-[10px] text-[var(--color-stone)]">No traffic data yet</p>
              )}
            </div>
          </div>
        </div>
      </section>
    </AdminLayout>
  );
}
