import { NextResponse } from 'next/server';
import { getOverviewKpis, getFunnel } from '@/lib/admin/queries';

export async function GET() {
  try {
    const [kpis, funnel] = await Promise.all([
      getOverviewKpis(),
      getFunnel(),
    ]);
    return NextResponse.json({
      ok: true,
      kpis: {
        sessions: kpis.sessions,
        visitors: kpis.visitors,
        newVisitors: kpis.newVisitors,
        pageviews: kpis.pageviews,
        conversionRatePct: kpis.conversionRatePct,
      },
      funnel: {
        productViews: funnel.productViews,
        addToCarts: funnel.addToCarts,
        checkoutStarts: funnel.checkoutStarts,
        purchases: funnel.purchases,
      },
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
