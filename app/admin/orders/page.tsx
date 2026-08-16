import { redirect } from "next/navigation";
import { getAdminUserFromRequest } from "@/lib/auth";
import {
  getAbandonmentStats,
  getOverviewKpis,
  getSalesTimeline,
} from "@/lib/admin/queries";
import AdminLayout from "@/components/admin/AdminLayout";
import StatCard from "@/components/admin/StatCard";
import db, { STORE_ID } from "@/lib/db";

function formatUGX(amount: number): string {
  return `UGX ${Intl.NumberFormat("en-UG").format(amount)}`;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

interface OrderRow {
  id: string;
  order_number: string;
  status: string;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  gross_sales_cents: number;
  discount_cents: number;
  net_sales_cents: number;
  total_cogs_cents: number;
  gross_profit_cents: number;
  currency: string;
  created_at: string;
  source_class: string | null;
  items_count: number;
  units_count: number;
}

function getRecentOrders(limit = 50): OrderRow[] {
  const rows = db
    .prepare(
      `SELECT
         o.id, o.order_number, o.status,
         o.customer_name, o.customer_email, o.customer_phone,
         o.gross_sales_cents, o.discount_cents, o.net_sales_cents,
         o.total_cogs_cents, o.gross_profit_cents, o.currency,
         o.created_at, o.source_class,
         COUNT(DISTINCT oi.id) AS items_count,
         COALESCE(SUM(oi.qty), 0) AS units_count
       FROM orders o
       LEFT JOIN order_items oi ON oi.order_id = o.id
       WHERE o.store_id = ?
       GROUP BY o.id
       ORDER BY o.created_at DESC
       LIMIT ?`
    )
    .all(STORE_ID, limit) as OrderRow[];
  return rows;
}

const STATUS_STYLES: Record<string, string> = {
  new: "bg-[var(--color-ember)]/15 text-[var(--color-ember)] border-[var(--color-ember)]/40",
  confirmed: "bg-[var(--color-earth)]/20 text-[var(--color-earth)] border-[var(--color-earth)]/40",
  processing: "bg-[var(--color-earth)]/15 text-[var(--color-earth)] border-[var(--color-earth)]/40",
  out_for_delivery: "bg-[var(--color-charcoal)]/15 text-[var(--color-ink)] border-[var(--color-sand)]",
  completed: "bg-[var(--color-moss)]/15 text-[var(--color-moss)] border-[var(--color-moss)]/40",
  refunded: "bg-[var(--color-ember)]/20 text-[var(--color-ember)] border-[var(--color-ember)]/40",
  cancelled: "bg-[var(--color-stone)]/30 text-[var(--color-stone)] border-[var(--color-sand)]",
};

const STATUS_LABEL: Record<string, string> = {
  new: "NEW",
  confirmed: "CONFIRMED",
  processing: "PROCESSING",
  out_for_delivery: "OUT FOR DELIVERY",
  completed: "COMPLETED",
  refunded: "REFUNDED",
  cancelled: "CANCELLED",
};

export default async function AdminOrders() {
  const user = await getAdminUserFromRequest();
  if (!user) redirect("/admin/login");

  const abandonment = getAbandonmentStats();
  const kpis = getOverviewKpis();
  const timeline = getSalesTimeline({ granularity: "day" });
  const orders = getRecentOrders(60);

  const totalRevenue = orders.reduce((s, o) => s + (o.net_sales_cents || 0), 0);
  const totalUnits = orders.reduce((s, o) => s + (o.units_count || 0), 0);
  const recoveryRate = abandonment.abandonedCarts > 0
    ? Math.round((abandonment.recoveredOrders / abandonment.abandonedCarts) * 1000) / 10
    : 0;

  return (
    <AdminLayout title="Orders" subtitle={`Order flow · abandonment · ${orders.length} recent`}>
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-10">
        <StatCard
          label="Total Orders"
          value={Intl.NumberFormat("en-UG").format(kpis.orders)}
          delta={`${kpis.netSalesUGX > 0 ? formatUGX(kpis.netSalesUGX) : '—'} net`}
          positive
        />
        <StatCard
          label="AOV"
          value={formatUGX(kpis.avgOrderValueUGX)}
          delta={`${kpis.unitsPerOrder} units/order`}
          positive
        />
        <StatCard
          label="Gross Profit"
          value={formatUGX(kpis.grossProfitUGX)}
          delta={`${kpis.grossMarginPct}% margin`}
          positive={kpis.grossMarginPct >= 30}
        />
        <StatCard
          label="Units Sold"
          value={Intl.NumberFormat("en-UG").format(totalUnits)}
          delta={`${orders.length} recent lines`}
          positive
        />
        <StatCard
          label="Net Revenue (30d)"
          value={formatUGX(kpis.netSalesUGX)}
          delta={`${timeline.length} day timeline`}
          positive
        />
      </section>

      <section className="mb-10">
        <h2 className="font-heading text-sm uppercase tracking-[0.18em] text-[var(--color-ink)] mb-5">
          Abandonment &amp; Recovery
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[var(--color-bone)] border border-[var(--color-sand)] p-5 flex flex-col gap-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-stone)]">
              Active Carts
            </span>
            <span className="font-heading text-3xl text-[var(--color-ink)]">
              {Intl.NumberFormat("en-UG").format(abandonment.activeCarts)}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--color-moss)]">
              carts open right now
            </span>
          </div>

          <div className="bg-[var(--color-bone)] border border-[var(--color-ember)]/30 p-5 flex flex-col gap-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-ember)]">
              Abandoned Carts
            </span>
            <span className="font-heading text-3xl text-[var(--color-ember)]">
              {Intl.NumberFormat("en-UG").format(abandonment.abandonedCarts)}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--color-stone)]">
              {abandonment.abandonedCheckouts} abandoned checkouts
            </span>
          </div>

          <div className="bg-[var(--color-bone)] border border-[var(--color-moss)]/40 p-5 flex flex-col gap-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-moss)]">
              Recovered Orders
            </span>
            <span className="font-heading text-3xl text-[var(--color-moss)]">
              {Intl.NumberFormat("en-UG").format(abandonment.recoveredOrders)}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--color-moss)]">
              {formatUGX(abandonment.recoveredRevenueUGX)} recovered
            </span>
          </div>

          <div className="bg-[var(--color-bone)] border border-[var(--color-sand)] p-5 flex flex-col gap-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-stone)]">
              Recovery Funnel
            </span>
            <div className="space-y-2">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="font-mono text-[10px] text-[var(--color-charcoal)]">Recovery Rate</span>
                  <span className="font-heading text-lg text-[var(--color-moss)]">{recoveryRate}%</span>
                </div>
                <div className="w-full h-2 bg-[var(--color-sand)]">
                  <div
                    className="h-full bg-[var(--color-moss)]"
                    style={{ width: `${Math.min(100, recoveryRate)}%` }}
                  />
                </div>
              </div>
              <div className="pt-2 border-t border-[var(--color-sand)] grid grid-cols-2 gap-3 font-mono text-[10px]">
                <div>
                  <span className="text-[var(--color-stone)] block uppercase tracking-[0.14em] mb-1">Msgs Sent</span>
                  <span className="text-[var(--color-ink)]">{abandonment.recoveryMessagesSent}</span>
                </div>
                <div>
                  <span className="text-[var(--color-stone)] block uppercase tracking-[0.14em] mb-1">Opt-outs</span>
                  <span className="text-[var(--color-ember)]">{abandonment.unsubscribedCount + abandonment.suppressionCount}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mb-10">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-heading text-sm uppercase tracking-[0.18em] text-[var(--color-ink)]">
            Recent Orders
          </h2>
          <div className="flex items-center gap-4 font-mono text-[10px] text-[var(--color-stone)] uppercase tracking-[0.15em]">
            <span>{orders.length} loaded</span>
            <span>{formatUGX(totalRevenue)} loaded value</span>
          </div>
        </div>
        <div className="overflow-x-auto border border-[var(--color-sand)] bg-[var(--color-bone)]">
          <table className="w-full text-sm min-w-[1100px]">
            <thead className="border-b border-[var(--color-sand)] bg-[var(--color-sand)]/40">
              <tr>
                <th className="text-left px-5 py-3 font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--color-stone)] font-normal">
                  Order
                </th>
                <th className="text-left px-5 py-3 font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--color-stone)] font-normal">
                  Customer
                </th>
                <th className="text-left px-5 py-3 font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--color-stone)] font-normal">
                  Items
                </th>
                <th className="text-left px-5 py-3 font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--color-stone)] font-normal">
                  Status
                </th>
                <th className="text-left px-5 py-3 font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--color-stone)] font-normal">
                  Source
                </th>
                <th className="text-right px-5 py-3 font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--color-stone)] font-normal">
                  Net Sales
                </th>
                <th className="text-right px-5 py-3 font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--color-stone)] font-normal">
                  Profit
                </th>
                <th className="text-left px-5 py-3 font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--color-stone)] font-normal">
                  Created
                </th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => {
                const style = STATUS_STYLES[o.status] || "bg-[var(--color-sand)] text-[var(--color-stone)] border-[var(--color-sand)]";
                const label = STATUS_LABEL[o.status] || o.status.toUpperCase();
                const discPct = o.gross_sales_cents > 0
                  ? Math.round((o.discount_cents / o.gross_sales_cents) * 100)
                  : 0;
                return (
                  <tr
                    key={o.id}
                    className="border-b border-[var(--color-sand)]/50 last:border-b-0 hover:bg-[var(--color-sand)]/30 align-middle"
                  >
                    <td className="px-5 py-4 pr-6 min-w-[180px]">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-heading text-sm uppercase tracking-[0.14em] text-[var(--color-ink)]">
                          {o.order_number}
                        </span>
                        <span className="font-mono text-[9px] uppercase tracking-wider text-[var(--color-stone)]">
                          id: {o.id.slice(-8)}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4 pr-6 min-w-[180px]">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-heading text-xs uppercase tracking-[0.12em] text-[var(--color-ink)]">
                          {o.customer_name || "Guest Buyer"}
                        </span>
                        <span className="font-mono text-[10px] text-[var(--color-charcoal)]">
                          {o.customer_phone || o.customer_email || "—"}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-mono text-[11px] text-[var(--color-charcoal)]">
                          {o.units_count} {o.units_count === 1 ? "unit" : "units"}
                        </span>
                        <span className="font-mono text-[9px] uppercase tracking-wider text-[var(--color-stone)]">
                          {o.items_count} {o.items_count === 1 ? "SKU" : "SKUs"}
                          {discPct > 0 && ` · ${discPct}% disc`}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-block px-2 py-1 font-mono text-[10px] uppercase tracking-wider border ${style}`}>
                        {label}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-mono text-[11px] text-[var(--color-stone)] uppercase tracking-wider">
                        {o.source_class ? o.source_class.replace("_", " ") : "direct"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex flex-col gap-0.5 items-end">
                        <span className="font-heading text-xs text-[var(--color-ink)]">
                          {formatUGX(o.net_sales_cents)}
                        </span>
                        {discPct > 0 && (
                          <span className="font-mono text-[9px] text-[var(--color-earth)] uppercase tracking-wider">
                            -{formatUGX(o.discount_cents)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className={`font-mono text-xs ${
                        o.gross_profit_cents >= 0 ? "text-[var(--color-moss)]" : "text-[var(--color-ember)]"
                      }`}>
                        {formatUGX(o.gross_profit_cents)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-mono text-[11px] text-[var(--color-stone)] whitespace-nowrap">
                        {formatDate(o.created_at)}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {orders.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-5 py-12 text-center"
                  >
                    <div className="flex flex-col items-center gap-3">
                      <svg
                        width="40"
                        height="40"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="var(--color-stone)"
                        strokeWidth="1.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                        <line x1="3" y1="6" x2="21" y2="6" />
                        <path d="M16 10a4 4 0 01-8 0" />
                      </svg>
                      <div className="space-y-1">
                        <p className="font-heading text-xs uppercase tracking-[0.18em] text-[var(--color-ink)]">
                          No orders yet
                        </p>
                        <p className="font-mono text-[10px] text-[var(--color-stone)]">
                          Purchases via the WhatsApp checkout will appear here automatically
                        </p>
                      </div>
                    </div>
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
