import { redirect } from "next/navigation";
import { getAdminUserFromRequest } from "@/lib/auth";
import {
  getMarketingStats,
  getOverviewKpis,
} from "@/lib/admin/queries";
import AdminLayout from "@/components/admin/AdminLayout";
import StatCard from "@/components/admin/StatCard";
import UtmBuilderClient from "@/components/admin/UtmBuilderClient";

function formatUGX(amount: number): string {
  return `UGX ${Intl.NumberFormat("en-UG").format(amount)}`;
}

function compactUGX(amount: number): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}K`;
  return String(amount);
}

export default async function AdminMarketing() {
  const user = await getAdminUserFromRequest();
  if (!user) redirect("/admin/login");

  const [stats, kpis] = await Promise.all([
    getMarketingStats(),
    getOverviewKpis(),
  ]);

  const totalChannelSessions = stats.channels.reduce((s, c) => s + c.sessions, 0);
  const totalChannelOrders = stats.channels.reduce((s, c) => s + c.orders, 0);
  const totalChannelRevenue = stats.channels.reduce((s, c) => s + c.revenue, 0);
  const totalSpend = kpis.marketingSpendUGX;
  const blendedRoas = totalSpend > 0 ? Math.round((totalChannelRevenue / totalSpend) * 100) / 100 : 0;

  return (
    <AdminLayout title="Marketing" subtitle={`Channels · campaigns · UTM builder`}>
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-10">
        <StatCard
          label="Tracked Sessions"
          value={Intl.NumberFormat("en-UG").format(totalChannelSessions)}
          delta={`${stats.channels.length} channels`}
          positive
        />
        <StatCard
          label="Orders (Attributed)"
          value={Intl.NumberFormat("en-UG").format(totalChannelOrders)}
          delta="via source rules"
          positive
        />
        <StatCard
          label="Attributed Revenue"
          value={formatUGX(totalChannelRevenue)}
          delta="net sales"
          positive
        />
        <StatCard
          label="Marketing Spend"
          value={formatUGX(totalSpend)}
          delta="last 30 days"
          positive={false}
        />
        <StatCard
          label="Blended ROAS"
          value={`${blendedRoas}x`}
          delta={`CAC ${formatUGX(kpis.cacUGX)}`}
          positive={blendedRoas >= 2}
        />
      </section>

      <section className="mb-10">
        <h2 className="font-heading text-sm uppercase tracking-[0.18em] text-[var(--color-ink)] mb-5">
          Channel Performance
        </h2>
        <div className="overflow-x-auto border border-[var(--color-sand)] bg-[var(--color-bone)] mb-4">
          <table className="w-full text-sm min-w-[900px]">
            <thead className="border-b border-[var(--color-sand)] bg-[var(--color-sand)]/40">
              <tr>
                <th className="text-left px-4 py-3 font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--color-stone)] font-normal">
                  Source
                </th>
                <th className="text-left px-4 py-3 font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--color-stone)] font-normal">
                  UTM Source / Medium / Campaign
                </th>
                <th className="text-right px-4 py-3 font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--color-stone)] font-normal">
                  Sessions
                </th>
                <th className="text-right px-4 py-3 font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--color-stone)] font-normal">
                  Conv Rate
                </th>
                <th className="text-right px-4 py-3 font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--color-stone)] font-normal">
                  Orders
                </th>
                <th className="text-right px-4 py-3 font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--color-stone)] font-normal">
                  Revenue
                </th>
                <th className="text-right px-4 py-3 font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--color-stone)] font-normal">
                  ROAS
                </th>
                <th className="text-right px-4 py-3 font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--color-stone)] font-normal">
                  CAC
                </th>
              </tr>
            </thead>
            <tbody>
              {stats.channels.map((c, idx) => (
                <tr
                  key={`${c.source_class}-${c.utm_source || ''}-${c.utm_medium || ''}-${idx}`}
                  className="border-b border-[var(--color-sand)]/50 last:border-b-0 hover:bg-[var(--color-sand)]/30"
                >
                  <td className="px-4 py-3 pr-6">
                    <span className={`inline-block px-2 py-1 font-mono text-[10px] uppercase tracking-wider border ${
                      c.source_class === 'campaign'
                        ? 'bg-[var(--color-earth)]/20 text-[var(--color-earth)] border-[var(--color-earth)]/40'
                        : c.source_class === 'direct'
                        ? 'bg-[var(--color-ink)]/10 text-[var(--color-ink)] border-[var(--color-sand)]'
                        : c.source_class === 'organic_search'
                        ? 'bg-[var(--color-moss)]/15 text-[var(--color-moss)] border-[var(--color-moss)]/40'
                        : c.source_class === 'social'
                        ? 'bg-[var(--color-ember)]/15 text-[var(--color-ember)] border-[var(--color-ember)]/40'
                        : c.source_class === 'referral'
                        ? 'bg-[var(--color-stone)]/15 text-[var(--color-charcoal)] border-[var(--color-sand)]'
                        : 'bg-[var(--color-sand)]/50 text-[var(--color-stone)] border-[var(--color-sand)]'
                    }`}>
                      {c.source_class.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-mono text-[11px] text-[var(--color-charcoal)]">
                        {c.utm_source || '—'}
                      </span>
                      <span className="font-mono text-[9px] text-[var(--color-stone)] uppercase tracking-wider">
                        {[c.utm_medium, c.utm_campaign].filter(Boolean).join(' / ') || 'no utm params'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-xs text-[var(--color-charcoal)]">
                    {Intl.NumberFormat("en-UG").format(c.sessions)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-xs text-[var(--color-moss)]">
                    {c.conversionRate}%
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-xs text-[var(--color-charcoal)]">
                    {Intl.NumberFormat("en-UG").format(c.orders)}
                  </td>
                  <td className="px-4 py-3 text-right font-heading text-xs text-[var(--color-ink)]">
                    {formatUGX(c.revenue)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-xs">
                    <span className={c.roas >= 2 ? "text-[var(--color-moss)]" : c.roas > 0 ? "text-[var(--color-earth)]" : "text-[var(--color-stone)]"}>
                      {c.roas > 0 ? `${c.roas}x` : '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-xs text-[var(--color-stone)]">
                    {c.cac > 0 ? compactUGX(c.cac) : '—'}
                  </td>
                </tr>
              ))}
              {stats.channels.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-8 text-center font-mono text-[10px] text-[var(--color-stone)]"
                  >
                    No channel data yet — sessions will be classified as traffic arrives
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mb-10">
        <h2 className="font-heading text-sm uppercase tracking-[0.18em] text-[var(--color-ink)] mb-5">
          Campaigns Library
        </h2>
        <div className="overflow-x-auto border border-[var(--color-sand)] bg-[var(--color-bone)] mb-4">
          <table className="w-full text-sm min-w-[900px]">
            <thead className="border-b border-[var(--color-sand)] bg-[var(--color-sand)]/40">
              <tr>
                <th className="text-left px-4 py-3 font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--color-stone)] font-normal">
                  Campaign Name
                </th>
                <th className="text-left px-4 py-3 font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--color-stone)] font-normal">
                  UTM Source / Medium
                </th>
                <th className="text-left px-4 py-3 font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--color-stone)] font-normal">
                  utm_campaign
                </th>
                <th className="text-right px-4 py-3 font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--color-stone)] font-normal">
                  Sessions
                </th>
                <th className="text-right px-4 py-3 font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--color-stone)] font-normal">
                  Orders
                </th>
                <th className="text-right px-4 py-3 font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--color-stone)] font-normal">
                  Revenue
                </th>
                <th className="text-right px-4 py-3 font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--color-stone)] font-normal">
                  ROAS
                </th>
              </tr>
            </thead>
            <tbody>
              {stats.campaignList.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-[var(--color-sand)]/50 last:border-b-0 hover:bg-[var(--color-sand)]/30"
                >
                  <td className="px-4 py-3 pr-6">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-heading text-xs uppercase tracking-[0.12em] text-[var(--color-ink)]">
                        {c.name}
                      </span>
                      <span className="font-mono text-[9px] uppercase tracking-wider text-[var(--color-stone)]">
                        id: {c.id.slice(-8)}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-mono text-[11px] text-[var(--color-charcoal)]">
                        {c.utm_source || '—'}
                      </span>
                      <span className="font-mono text-[9px] text-[var(--color-stone)] uppercase tracking-wider">
                        {c.utm_medium || 'no medium'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-[11px] text-[var(--color-charcoal)]">
                      {c.utm_campaign || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-xs text-[var(--color-charcoal)]">
                    {Intl.NumberFormat("en-UG").format(c.sessions)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-xs text-[var(--color-charcoal)]">
                    {Intl.NumberFormat("en-UG").format(c.orders)}
                  </td>
                  <td className="px-4 py-3 text-right font-heading text-xs text-[var(--color-ink)]">
                    {formatUGX(c.revenue)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-xs">
                    <span className={c.roas >= 2 ? "text-[var(--color-moss)]" : c.roas > 0 ? "text-[var(--color-earth)]" : "text-[var(--color-stone)]"}>
                      {c.roas > 0 ? `${c.roas}x` : '—'}
                    </span>
                  </td>
                </tr>
              ))}
              {stats.campaignList.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-8 text-center font-mono text-[10px] text-[var(--color-stone)]"
                  >
                    No campaigns yet — build and save your first tracked link below
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mb-10">
        <h2 className="font-heading text-sm uppercase tracking-[0.18em] text-[var(--color-ink)] mb-5">
          UTM Link Builder · Create Tracked URL
        </h2>
        <UtmBuilderClient defaultLanding="https://darro.co" />
      </section>
    </AdminLayout>
  );
}
