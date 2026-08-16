import { redirect } from "next/navigation";
import { getAdminUserFromRequest } from "@/lib/auth";
import {
  getCustomerStats,
  getOverviewKpis,
} from "@/lib/admin/queries";
import AdminLayout from "@/components/admin/AdminLayout";
import StatCard from "@/components/admin/StatCard";

function formatUGX(amount: number): string {
  return `UGX ${Intl.NumberFormat("en-UG").format(amount)}`;
}

export default async function AdminCustomers() {
  const user = await getAdminUserFromRequest();
  if (!user) redirect("/admin/login");

  const [stats, kpis] = await Promise.all([
    getCustomerStats(),
    getOverviewKpis(),
  ]);

  return (
    <AdminLayout title="Customers" subtitle={`Customer insights · Last 30 days`}>
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-10">
        <StatCard
          label="New Customers"
          value={Intl.NumberFormat("en-UG").format(stats.newCustomers)}
          delta="first-time buyers"
          positive
        />
        <StatCard
          label="Returning"
          value={Intl.NumberFormat("en-UG").format(stats.returningCustomers)}
          delta="repeat buyers"
          positive={stats.returningCustomers > stats.newCustomers}
        />
        <StatCard
          label="Repeat Purchase Rate"
          value={`${stats.repeatPurchaseRatePct}%`}
          delta="2+ orders / total"
          positive={stats.repeatPurchaseRatePct >= 20}
        />
        <StatCard
          label="Lifetime Value"
          value={formatUGX(stats.lifetimeRevenuePerCustomerUGX)}
          delta="avg revenue / cust"
          positive
        />
        <StatCard
          label="Median → 2nd Order"
          value={`${stats.medianTimeToSecondOrderHours}h`}
          delta="time between 1st → 2nd"
          positive={stats.medianTimeToSecondOrderHours < 168}
        />
        <StatCard
          label="Total Orders"
          value={Intl.NumberFormat("en-UG").format(kpis.orders)}
          delta={`${kpis.newCustomers} new buyers`}
          positive
        />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-10">
        <div className="bg-[var(--color-bone)] border border-[var(--color-sand)] p-5 lg:col-span-1">
          <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-stone)] mb-4">
            New vs Returning · 30d
          </h3>
          <div className="space-y-5">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="font-heading text-xs uppercase tracking-[0.12em] text-[var(--color-ink)]">
                  New Customers
                </span>
                <span className="font-heading text-xl text-[var(--color-ink)]">
                  {stats.newCustomers}
                </span>
              </div>
              <div className="w-full h-3 bg-[var(--color-sand)]">
                <div
                  className="h-full bg-[var(--color-earth)]"
                  style={{
                    width: `${(stats.newCustomers / Math.max(1, stats.newCustomers + stats.returningCustomers)) * 100}%`,
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="font-heading text-xs uppercase tracking-[0.12em] text-[var(--color-ink)]">
                  Returning
                </span>
                <span className="font-heading text-xl text-[var(--color-moss)]">
                  {stats.returningCustomers}
                </span>
              </div>
              <div className="w-full h-3 bg-[var(--color-sand)]">
                <div
                  className="h-full bg-[var(--color-moss)]"
                  style={{
                    width: `${(stats.returningCustomers / Math.max(1, stats.newCustomers + stats.returningCustomers)) * 100}%`,
                  }}
                />
              </div>
            </div>
            <div className="pt-4 border-t border-[var(--color-sand)] grid grid-cols-2 gap-4">
              <div>
                <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--color-stone)] block mb-1">
                  New buyer ratio
                </span>
                <span className="font-heading text-lg text-[var(--color-charcoal)]">
                  {stats.newCustomers + stats.returningCustomers > 0
                    ? Math.round((stats.newCustomers / (stats.newCustomers + stats.returningCustomers)) * 100)
                    : 0}%
                </span>
              </div>
              <div>
                <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--color-stone)] block mb-1">
                  Loyalty score
                </span>
                <span className="font-heading text-lg text-[var(--color-moss)]">
                  {stats.repeatPurchaseRatePct >= 30
                    ? "A"
                    : stats.repeatPurchaseRatePct >= 15
                    ? "B"
                    : stats.repeatPurchaseRatePct >= 5
                    ? "C"
                    : "D"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[var(--color-bone)] border border-[var(--color-sand)] p-5 lg:col-span-2">
          <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-stone)] mb-5">
            Cohort Retention · Last 6 months
          </h3>
          <div className="space-y-4">
            {stats.cohorts.length === 0 && (
              <p className="font-mono text-[10px] text-[var(--color-stone)]">
                No cohort data yet — new customers will build cohorts over time
              </p>
            )}
            {stats.cohorts.map((cohort) => {
              const r1 = cohort.retained[0]?.m1 ?? 0;
              const r2 = cohort.retained[1]?.m2 ?? 0;
              const r3 = cohort.retained[2]?.m3 ?? 0;
              const pct1 = cohort.size > 0 ? Math.round((r1 / cohort.size) * 100) : 0;
              const pct2 = cohort.size > 0 ? Math.round((r2 / cohort.size) * 100) : 0;
              const pct3 = cohort.size > 0 ? Math.round((r3 / cohort.size) * 100) : 0;
              return (
                <div key={cohort.month} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <span className="font-heading text-xs uppercase tracking-[0.12em] text-[var(--color-ink)]">
                        {cohort.month}
                      </span>
                      <span className="font-mono text-[10px] text-[var(--color-stone)]">
                        {cohort.size} acquired
                      </span>
                    </div>
                    <div className="flex items-center gap-4 font-mono text-[10px]">
                      <span className="text-[var(--color-stone)]">M1: {pct1}%</span>
                      <span className="text-[var(--color-earth)]">M2: {pct2}%</span>
                      <span className="text-[var(--color-moss)]">M3: {pct3}%</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="h-2 bg-[var(--color-sand)]">
                      <div className="h-full bg-[var(--color-stone)]/60" style={{ width: `${pct1}%` }} />
                    </div>
                    <div className="h-2 bg-[var(--color-sand)]">
                      <div className="h-full bg-[var(--color-earth)]" style={{ width: `${pct2}%` }} />
                    </div>
                    <div className="h-2 bg-[var(--color-sand)]">
                      <div className="h-full bg-[var(--color-moss)]" style={{ width: `${pct3}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mb-10">
        <h2 className="font-heading text-sm uppercase tracking-[0.18em] text-[var(--color-ink)] mb-5">
          Top Customers · by Total Spend
        </h2>
        <div className="overflow-x-auto border border-[var(--color-sand)] bg-[var(--color-bone)]">
          <table className="w-full text-sm min-w-[800px]">
            <thead className="border-b border-[var(--color-sand)] bg-[var(--color-sand)]/40">
              <tr>
                <th className="text-left px-5 py-3 font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--color-stone)] font-normal">
                  Rank
                </th>
                <th className="text-left px-5 py-3 font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--color-stone)] font-normal">
                  Customer
                </th>
                <th className="text-left px-5 py-3 font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--color-stone)] font-normal">
                  Email
                </th>
                <th className="text-left px-5 py-3 font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--color-stone)] font-normal">
                  Phone
                </th>
                <th className="text-right px-5 py-3 font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--color-stone)] font-normal">
                  Orders
                </th>
                <th className="text-right px-5 py-3 font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--color-stone)] font-normal">
                  Total Spent
                </th>
                <th className="text-left px-5 py-3 font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--color-stone)] font-normal">
                  Last Order
                </th>
              </tr>
            </thead>
            <tbody>
              {stats.topCustomers.map((c, idx) => (
                <tr
                  key={c.id}
                  className="border-b border-[var(--color-sand)]/50 last:border-b-0 hover:bg-[var(--color-sand)]/30"
                >
                  <td className="px-5 py-4">
                    <span className="font-mono text-[10px] w-6 h-6 inline-flex items-center justify-center bg-[var(--color-sand)] text-[var(--color-stone)]">
                      {idx + 1}
                    </span>
                  </td>
                  <td className="px-5 py-4 pr-6">
                    <span className="font-heading text-xs uppercase tracking-[0.12em] text-[var(--color-ink)]">
                      {c.name}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="font-mono text-[11px] text-[var(--color-charcoal)]">
                      {c.email || "—"}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="font-mono text-[11px] text-[var(--color-charcoal)]">
                      {c.phone || "—"}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <span className="font-mono text-xs text-[var(--color-charcoal)]">
                      {Intl.NumberFormat("en-UG").format(c.totalOrders)}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <span className="font-heading text-xs text-[var(--color-ink)]">
                      {formatUGX(c.totalSpentUGX)}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="font-mono text-[11px] text-[var(--color-stone)]">
                      {c.lastOrderAt
                        ? new Date(c.lastOrderAt).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : "—"}
                    </span>
                  </td>
                </tr>
              ))}
              {stats.topCustomers.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-8 text-center font-mono text-[10px] text-[var(--color-stone)]"
                  >
                    No customers yet — first purchases will populate this table
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </AdminLayout>
  );
}
