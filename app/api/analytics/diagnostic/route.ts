import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@libsql/client';
import { queryDb, STORE_ID, useTurso } from '@/lib/db';
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
    // IMPORTANT: check libsql:file: and :memory: BEFORE libsql://
    // because libsql:file:/path starts with "libsql:" too.
    const tursoUrlScheme = tursoUrl.startsWith('libsql:file:') || tursoUrl.startsWith('file:')
      ? 'local-file (DATA LOST ON REDEPLOY)'
      : tursoUrl.startsWith('libsql::memory:') || tursoUrl.startsWith(':memory:')
        ? 'in-memory (DATA LOST ON REDEPLOY)'
        : tursoUrl.startsWith('libsql://') || tursoUrl.startsWith('wss://') || tursoUrl.startsWith('https://')
          ? 'remote'
          : tursoUrl.startsWith('libsql:')
            ? 'unknown-libsql-variant (possibly local)'
            : 'unknown';

    // 3. Environment info
    const envInfo = {
      vercel: process.env.VERCEL || false,
      turso_configured: !!(process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN),
      turso_url: process.env.TURSO_DATABASE_URL ? '[SET]' : '[NOT SET]',
      turso_url_full: tursoUrl || '[NOT SET]', // URL itself is not secret — only the auth token is
      turso_url_length: tursoUrl.length,
      turso_url_scheme: tursoUrlScheme,
      turso_url_prefix: tursoUrl ? tursoUrl.substring(0, Math.min(20, tursoUrl.length)) + (tursoUrl.length > 20 ? '...' : '') : '[NOT SET]',
      turso_has_token: !!process.env.TURSO_AUTH_TOKEN,
      node_env: process.env.NODE_ENV || 'unknown',
    };

    // 4. DIRECT Turso test — bypasses queryDb entirely to prove whether the
    // remote Turso DB actually has events. If this returns 0 but queryDb
    // returned >0, then queryDb was silently falling back to local SQLite
    // (which gets wiped on every redeploy).
    let directTurso: {
      status: string;
      event_count: number;
      visitor_count: number;
      session_count: number;
      error: string | null;
    } = { status: 'not_tested', event_count: -1, visitor_count: -1, session_count: -1, error: null };

    if (useTurso()) {
      try {
        // Fresh client — no shared state with queryDb
        const direct = createClient({
          url: process.env.TURSO_DATABASE_URL!,
          authToken: process.env.TURSO_AUTH_TOKEN!,
        });
        const [dEvt, dVis, dSess] = await Promise.all([
          direct.execute('SELECT COUNT(*) AS c FROM events WHERE store_id = ?', [STORE_ID]),
          direct.execute('SELECT COUNT(*) AS c FROM visitors WHERE store_id = ?', [STORE_ID]),
          direct.execute('SELECT COUNT(*) AS c FROM sessions WHERE store_id = ?', [STORE_ID]),
        ]);
        directTurso = {
          status: 'connected',
          event_count: Number(dEvt.rows[0]?.c ?? 0),
          visitor_count: Number(dVis.rows[0]?.c ?? 0),
          session_count: Number(dSess.rows[0]?.c ?? 0),
          error: null,
        };
      } catch (e) {
        directTurso = {
          status: 'error',
          event_count: -1,
          visitor_count: -1,
          session_count: -1,
          error: e instanceof Error ? e.message : String(e),
        };
      }
    }

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
      direct_turso: directTurso,
      diagnosis: directTurso.event_count > 0 && tursoEventCount === 0
        ? 'queryDb IS FALLING BACK to local SQLite (not Turso)! Events written to local SQLite get wiped on redeploy.'
        : directTurso.event_count === 0 && directTurso.status === 'connected'
          ? 'Turso remote DB genuinely has 0 events — event API is NOT writing to Turso (likely writing to local SQLite fallback).'
          : 'OK',
      summary: {
        json_has_data: jsonSize.events > 0,
        turso_has_data: tursoEventCount > 0,
        direct_turso_has_data: directTurso.event_count > 0,
        recommended_source: jsonSize.events > 0 ? 'json' : (directTurso.event_count > 0 ? 'direct_turso' : 'none'),
      },
    });
  } catch (err) {
    return NextResponse.json({
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    }, { status: 500 });
  }
}