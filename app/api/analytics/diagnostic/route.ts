import { NextRequest, NextResponse } from 'next/server';
import { queryDb, STORE_ID } from '@/lib/db';
import {
  debugSize,
  getEvents,
  getVisitors,
  getSessions,
  computeOverviewFromJson,
} from '@/lib/json-event-store';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const password = searchParams.get('key');
    
    // Simple password check (optional)
    if (password && password !== 'darro2026') {
      return NextResponse.json({ ok: false, error: 'Invalid key' }, { status: 403 });
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // 1. JSON store status
    const jsonSize = debugSize();
    const jsonEvents = getEvents({ start: thirtyDaysAgo.toISOString(), end: now.toISOString() });
    const jsonVisitors = getVisitors();
    const jsonSessions = getSessions();
    const jsonOverview = computeOverviewFromJson({
      start: thirtyDaysAgo.toISOString(),
      end: now.toISOString(),
    });

    // Get unique event names
    const eventNames = [...new Set(jsonEvents.map((e) => e.event_name))];
    
    // Get last 5 events
    const recentEvents = jsonEvents.slice(-5).reverse().map((e) => ({
      id: e.id,
      event_name: e.event_name,
      visitor_id: e.visitor_id,
      session_id: e.session_id,
      page_path: e.page_path,
      created_at: e.created_at,
    }));

    // 2. Turso status (quick check)
    let tursoStatus = 'unknown';
    let tursoEventCount = 0;
    let tursoVisitorCount = 0;
    let tursoSessionCount = 0;
    let tursoError: string | null = null;
    let tursoTables: string[] = [];
    let tursoHasSeed = false;

    try {
      // Check what tables exist
      const tables = await queryDb.all<{ name: string }>(
        "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
      );
      tursoTables = tables.map((t) => t.name);
      
      // Quick warmup query
      const storeRow = await queryDb.get<{ id: string }>(
        'SELECT id FROM stores WHERE id = ?',
        [STORE_ID]
      );
      if (storeRow) {
        tursoStatus = 'connected';
        tursoHasSeed = true;
        
        // Quick counts
        const evtCount = await queryDb.get<{ c: number }>(
          'SELECT COUNT(*) AS c FROM events WHERE store_id = ?',
          [STORE_ID]
        );
        tursoEventCount = evtCount?.c || 0;

        const visCount = await queryDb.get<{ c: number }>(
          'SELECT COUNT(*) AS c FROM visitors WHERE store_id = ?',
          [STORE_ID]
        );
        tursoVisitorCount = visCount?.c || 0;

        const sessCount = await queryDb.get<{ c: number }>(
          'SELECT COUNT(*) AS c FROM sessions WHERE store_id = ?',
          [STORE_ID]
        );
        tursoSessionCount = sessCount?.c || 0;
        
        // Also check if there's ANY data in events (not just filtered by store_id)
        const anyEvents = await queryDb.get<{ c: number }>(
          'SELECT COUNT(*) AS c FROM events'
        );
        console.log('[diagnostic] Any events in table:', anyEvents?.c || 0);
      } else {
        tursoStatus = 'no_seed_data';
      }
    } catch (e) {
      tursoStatus = 'error';
      tursoError = e instanceof Error ? e.message : String(e);
    }

    const tursoUrl = process.env.TURSO_DATABASE_URL || '';
    const tursoUrlScheme = tursoUrl.startsWith('libsql:') || tursoUrl.startsWith('wss:') || tursoUrl.startsWith('https:')
      ? 'remote'
      : tursoUrl.startsWith('file:')
        ? 'local-file (DATA LOST ON REDEPLOY)'
        : 'unknown';

    // 3. Environment info
    const envInfo = {
      vercel: process.env.VERCEL || false,
      turso_configured: !!(process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN),
      turso_url: process.env.TURSO_DATABASE_URL ? '[SET]' : '[NOT SET]',
      turso_url_scheme: tursoUrlScheme,
      node_env: process.env.NODE_ENV || 'unknown',
    };

    return NextResponse.json({
      ok: true,
      timestamp: now.toISOString(),
      environment: envInfo,
      json_store: {
        size: jsonSize,
        overview_last_30d: jsonOverview,
        event_names: eventNames,
        recent_events: recentEvents,
      },
      turso: {
        status: tursoStatus,
        error: tursoError,
        tables: tursoTables,
        has_seed_data: tursoHasSeed,
        event_count: tursoEventCount,
        visitor_count: tursoVisitorCount,
        session_count: tursoSessionCount,
      },
      summary: {
        json_has_data: jsonSize.events > 0,
        turso_has_data: tursoEventCount > 0,
        recommended_source: jsonSize.events > 0 ? 'json' : (tursoEventCount > 0 ? 'turso' : 'none'),
      },
    });
  } catch (err) {
    return NextResponse.json({
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    }, { status: 500 });
  }
}