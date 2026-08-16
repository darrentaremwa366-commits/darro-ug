import { redirect } from "next/navigation";
import { getAdminUserFromRequest } from "@/lib/auth";
import {
  getOverviewKpis,
  getSalesTimeline,
  getTrafficSources,
  getRevenueByCollection,
  getTopPages,
  getFunnel,
} from "@/lib/admin/queries";
import AdminLayout from "@/components/admin/AdminLayout";
import StatCard from "@/components/admin/StatCard";

function formatUGX(amount: number): string {
  return `UGX ${Intl.NumberFormat("en-UG").format(amount)}`;
}

function compactUGX(amount: number): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}K`;
  return String(amount);
}

export default async function AdminOverview() {
  const user = await getAdminUserFromRequest();
  if (!user) redirect("/admin/login");

  const kpis = getOverviewKpis();
  const timeline = getSalesTimeline({ granularity: "day" });
  const traffic = getTrafficSources();
  const revenueByCol = getRevenueByCollection();
  const topPages = getTopPages({ limit: 10 });
  const funnel = getFunnel();

  const maxRevenue = Math.max(...timeline.map((d) => d.revenue), 1);
  const maxVisits = Math.max(...timeline.map((d) => d.visits), 1);
  const totalRev = timeline.reduce((s, d) => s + d.revenue, 0);
  const totalOrders = timeline.reduce((s, d) => s + d.orders, 0);

  const maxTrafficPct = Math.max(...traffic.map((t) => t.pct), 1);
  const maxColRev = Math.max(...revenueByCol.map((c) => c.revenue), 1);
  const maxPageViews = Math.max(...topPages.map((p) => p.views), 1);
  const funnelMax = Math.max(...funnel.steps.map((s) => s.value), 1);

  return (
    <AdminLayout title="Dashboard Overview" subtitle={`Store analytics · Last 30 days · ${user.role}`}>
      <section className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4 mb-10">
        <StatCard label="Sessions" value={Intl.NumberFormat("en-UG").format(kpis.sessions)} delta={`${kpis.visitors} visitors`} positive />
        <StatCard label="Visitors" value={Intl.NumberFormat("en-UG").format(kpis.visitors)} delta={`${kpis.newVisitors} new`} positive />
        <StatCard label="Orders" value={Intl.NumberFormat("en-UG").format(kpis.orders)} delta={`${kpis.orders} purchases`} positive />
        <StatCard label="Conversion Rate" value={`${kpis.conversionRatePct}%`} delta="sessions → orders" positive={kpis.conversionRatePct >= 1} />
        <StatCard label="Pageviews" value={Intl.NumberFormat("en-UG").format(kpis.pageviews)} delta={`${kpis.sessions} sessions`} positive />

        <StatCard label="Gross Sales" value={formatUGX(kpis.grossSalesUGX)} delta="total listed" positive />
        <StatCard label="Net Sales" value={formatUGX(kpis.netSalesUGX)} delta="after discounts" positive />
        <StatCard label="Discounts" value={formatUGX(kpis.discountsUGX)} delta="applied" positive={false} />
        <StatCard label="Refunds" value={formatUGX(kpis.refundsUGX)} delta="issued" positive={false} />
        <StatCard label="AOV" value={formatUGX(kpis.avgOrderValueUGX)} delta={`${kpis.unitsPerOrder} units/order`} positive />

        <StatCard label="COGS" value={formatUGX(kpis.cogsUGX)} delta="inventory cost" positive={false} />
        <StatCard label="Gross Profit" value={formatUGX(kpis.grossProfitUGX)} delta={`${kpis.grossMarginPct}% margin`} positive={kpis.grossMarginPct >= 30} />
        <StatCard label="Gross Margin" value={`${kpis.grossMarginPct}%`} delta="profit / net" positive={kpis.grossMarginPct >= 30} />
        <StatCard label="Marketing Spend" value={formatUGX(kpis.marketingSpendUGX)} delta="ROAS tracked" positive />
        <StatCard label="ROAS" value={`${kpis.roas}x`} delta={`CAC ${formatUGX(kpis.cacUGX)}`} positive={kpis.roas >= 2} />

        <StatCard label="Add to Carts" value={Intl.NumberFormat("en-UG").format(kpis.addToCarts)} delta="ATC events" positive />
        <StatCard label="Checkouts Started" value={Intl.NumberFormat("en-UG").format(kpis.checkoutStarts)} delta="begin_checkout" positive />
        <StatCard label="Purchases" value={Intl.NumberFormat("en-UG").format(kpis.purchases)} delta="purchase events" positive />
        <StatCard label="New Customers" value={Intl.NumberFormat("en-UG").format(kpis.newCustomers)} delta="first-time buyers" positive />
        <StatCard label="Returning" value={Intl.NumberFormat("en-UG").format(kpis.returningCustomers)} delta="repeat buyers" positive />
      </section>

      <section className="mb-10">
        <h2 className="font-heading text-sm uppercase tracking-[0.18em] text-[var(--color-ink)] mb-5">
          Revenue &amp; Orders Timeline · Last 30 Days
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-[var(--color-bone)] border border-[var(--color-sand)] p-5 lg:col-span-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-stone)]">
                Revenue per day
              </span>
              <span className="font-mono text-[10px] text-[var(--color-stone)]">
                Total: {formatUGX(totalRev)} · {totalOrders} orders
              </span>
            </div>
            <div className="flex items-end gap-[2px] h-52 border-b border-l border-[var(--color-sand)] pl-3 pb-3 overflow-x-auto">
              {timeline.map((day) => {
                const heightPct = (day.revenue / maxRevenue) * 100;
                return (
                  <div
                    key={day.date}
                    className="flex flex-col items-center justify-end shrink-0 w-5 group relative"
                    title={`${day.date}: ${formatUGX(day.revenue)} · ${day.orders} orders`}
                  >
                    <div
                      className="w-full bg-[var(--color-moss)] min-h-[3px] opacity-80 hover:opacity-100 transition-opacity"
                      style={{ height: `${heightPct}%` }}
                    />
                  </div>
                );
              })}
            </div>
            <div className="grid grid-cols-5 sm:grid-cols-7 md:grid-cols-10 gap-1 mt-3 pl-3 text-center">
              {timeline
                .filter((_, i) => i % 3 === 0)
                .map((d) => (
                  <span
                    key={d.date}
                    className="font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--color-stone)] truncate"
                  >
                    {d.date.slice(5)}
                  </span>
                ))}
            </div>
            <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-[var(--color-stone)] text-center pt-2 pl-3">
              each bar = 1 day · visits overlaid via line chart next iteration
            </p>
          </div>

          <div className="space-y-4">
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
                        {src.pct}% · {src.sessions}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-[var(--color-sand)]">
                      <div
                        className="h-full bg-[var(--color-earth)]"
                        style={{ width: `${(src.pct / maxTrafficPct) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
                {traffic.length === 0 && (
                  <p className="font-mono text-[10px] text-[var(--color-stone)]">No traffic data yet</p>
                )}
              </div>
            </div>

            <div className="bg-[var(--color-bone)] border border-[var(--color-sand)] p-5">
              <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-stone)] mb-4">
                Revenue by Collection
              </h3>
              <div className="space-y-3">
                {revenueByCol.map((col) => (
                  <div key={col.collection} className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--color-charcoal)]">
                        {col.collection}
                      </span>
                      <span className="font-mono text-[10px] text-[var(--color-stone)]">
                        {compactUGX(col.revenue)} · {col.units}u
                      </span>
                    </div>
                    <div className="w-full h-2 bg-[var(--color-sand)]">
                      <div
                        className="h-full bg-[var(--color-moss)]"
                        style={{ width: `${(col.revenue / maxColRev) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
                {revenueByCol.length === 0 && (
                  <p className="font-mono text-[10px] text-[var(--color-stone)]">No collection data</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-10">
        <div className="bg-[var(--color-bone)] border border-[var(--color-sand)] p-5">
          <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-stone)] mb-4">
            Top Pages by Views
          </h3>
          <div className="space-y-3">
            {topPages.map((p) => (
              <div key={p.page_path} className="space-y-1.5">
                <div className="flex justify-between items-start gap-2">
                  <span className="text-[11px] text-[var(--color-charcoal)] truncate font-mono">
                    {p.page_path}
                  </span>
                  <span className="font-mono text-[10px] text-[var(--color-stone)] shrink-0 ml-2">
                    {Intl.NumberFormat("en-UG").format(p.views)}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-[var(--color-sand)]">
                  <div
                    className="h-full bg-[var(--color-charcoal)]"
                    style={{ width: `${(p.views / maxPageViews) * 100}%` }}
                  />
                </div>
              </div>
            ))}
            {topPages.length === 0 && (
              <p className="font-mono text-[10px] text-[var(--color-stone)]">No page data yet</p>
            )}
          </div>
        </div>

        <div className="bg-[var(--color-bone)] border border-[var(--color-sand)] p-5">
          <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-stone)] mb-4">
            Purchase Funnel Summary
          </h3>
          <div className="space-y-3">
            {funnel.steps.map((f, idx) => {
              const isLast = idx === funnel.steps.length - 1;
              const widthPct = funnelMax > 0 ? (f.value / funnelMax) * 100 : 0;
              return (
                <div key={f.name} className="space-y-1.5">
                  <div className="flex justify-between items-center gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono text-[9px] w-5 h-5 shrink-0 bg-[var(--color-sand)] text-[var(--color-stone)] flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="text-xs text-[var(--color-charcoal)] truncate">
                        {f.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {f.dropFromPrev > 0 && (
                        <span className="font-mono text-[9px] uppercase tracking-wider text-[var(--color-ember)]">
                          -{f.dropFromPrev}%
                        </span>
                      )}
                      {f.convRate > 0 && (
                        <span className="font-mono text-[9px] text-[var(--color-moss)]">
                          {f.convRate}% conv
                        </span>
                      )}
                      <span className="font-mono text-[10px] text-[var(--color-stone)]">
                        {Intl.NumberFormat("en-UG").format(f.value)}
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-2.5 bg-[var(--color-sand)]">
                    <div
                      className={`h-full ${isLast ? "bg-[var(--color-moss)]" : "bg-[var(--color-charcoal)] opacity-80"}`}
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          {funnel.productViews > 0 && (
            <div className="mt-5 pt-4 border-t border-[var(--color-sand)] grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--color-stone)]">
                  Overall Conv
                </span>
                <span className="font-heading text-lg text-[var(--color-moss)]">
                  {Math.round((funnel.purchases / funnel.productViews) * 1000) / 10}%
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--color-stone)]">
                  ATC → Purchase
                </span>
                <span className="font-heading text-lg text-[var(--color-ink)]">
                  {funnel.addToCarts > 0 ? Math.round((funnel.purchases / funnel.addToCarts) * 1000) / 10 : 0}%
                </span>
              </div>
            </div>
          )}
        </div>
      </section>
    </AdminLayout>
  );
}
