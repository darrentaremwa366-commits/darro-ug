import { NextResponse } from 'next/server';
import { getOverviewKpis, getFunnel } from '@/lib/admin/queries';
import { queryDb, useTurso } from '@/lib/db';

export async function GET() {
  try {
    // First, check raw Turso access
    const isTurso = useTurso();
    const rawCount = await queryDb.get<{ c: number }>('SELECT COUNT(*) AS c FROM events LIMIT 1');
    const storeCheck = await queryDb.get<{ c: number }>(
      "SELECT COUNT(*) AS c FROM events WHERE store_id = 'store_darro'"
    );
    
    const [kpis, funnel] = await Promise.all([
      getOverviewKpis(),
      getFunnel(),
    ]);
    
    return NextResponse.json({
      ok: true,
      turso_configured: isTurso,
      raw_event_count: rawCount?.c ?? -1,
      store_darro_events: storeCheck?.c ?? -1,
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
