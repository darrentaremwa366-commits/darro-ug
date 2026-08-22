import { NextResponse } from 'next/server';
import { queryDb, useTurso } from '@/lib/db';
import { debugSize, getEvents, getVisitors, getSessions, computeOverviewFromJson } from '@/lib/json-event-store';

export async function GET() {
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - 29);
  start.setHours(0, 0, 0, 0);

  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  const range = { start: start.toISOString(), end: end.toISOString() };

  // Get JSON store stats
  const jsonStats = debugSize();
  const jsonOverview = computeOverviewFromJson(range);

  // Get DB stats
  let dbStatus = 'unknown';
  let dbError: string | null = null;
  let dbEventCount = 0;
  let dbSessionCount = 0;
  let dbVisitorCount = 0;
  let dbPageviewCount = 0;
  let productViewCount = 0;
  try {
    const isTurso = useTurso();
    const testQuery = await queryDb.get<{ c: number }>('SELECT COUNT(*) AS c FROM events LIMIT 1');
    dbStatus = testQuery ? `working (${isTurso ? 'Turso' : 'SQLite'})` : 'no events table';
    
    // Query actual event counts with the same date range as admin overview
    const STORE_ID = 'store_darro';
    const inRange = 'store_id = ? AND created_at BETWEEN ? AND ?';
    const params = [STORE_ID, range.start, range.end];
    
    const [sessRow, visRow, pvRow, pvProdRow] = await Promise.all([
      queryDb.get<{ c: number }>(`SELECT COUNT(DISTINCT session_id) AS c FROM events WHERE ${inRange}`, params),
      queryDb.get<{ c: number }>(`SELECT COUNT(DISTINCT visitor_id) AS c FROM events WHERE ${inRange}`, params),
      queryDb.get<{ c: number }>(`SELECT COUNT(*) AS c FROM events WHERE ${inRange} AND event_name = 'page_view'`, params),
      queryDb.get<{ c: number }>(`SELECT COUNT(DISTINCT session_id) AS c FROM events WHERE ${inRange} AND event_name = 'product_view'`, params),
    ]);
    dbSessionCount = sessRow?.c || 0;
    dbVisitorCount = visRow?.c || 0;
    dbPageviewCount = pvRow?.c || 0;
    productViewCount = pvProdRow?.c || 0;
  } catch (e) {
    dbError = e instanceof Error ? e.message : String(e);
    dbStatus = 'error';
  }

  // Get recent events (last 5)
  const events = getEvents();
  const recentEvents = events.slice(-5).map((e) => ({
    id: e.id,
    event_name: e.event_name,
    created_at: e.created_at,
    page_path: e.page_path,
    visitor_id: e.visitor_id?.slice(0, 8) + '...',
  }));

  const visitors = getVisitors();
  const sessions = getSessions();

  // Test Turso write to verify full flow (with parent records)
  let writeTest = 'not_tested';
  let writeError: string | null = null;
  let verifyCount = 0;
  let writeDetails: Record<string, unknown> = {};
  try {
    const storeId = 'store_darro';
    const testId = 'debug-test-' + Date.now();
    const visitorId = 'debug-visitor-' + Date.now();
    const sessionId = 'debug-session-' + Date.now();
    const now = new Date().toISOString();
    
    // First insert parent records using the SAME pattern as event API
    const visResult = await queryDb.run(
      `INSERT INTO visitors (id, store_id, consent_state, first_seen_at, last_seen_at)
       VALUES (?, ?, ?, ?, ?)`,
      [visitorId, storeId, 'granted', now, now]
    );
    writeDetails.vis_changes = visResult.changes;
    
    const sessResult = await queryDb.run(
      `INSERT INTO sessions (id, store_id, visitor_id, landing_path, referrer, started_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [sessionId, storeId, visitorId, '/debug-test', null, now]
    );
    writeDetails.sess_changes = sessResult.changes;
    
    // Then insert the event using the SAME pattern as event API
    const writeResult = await queryDb.run(
      `INSERT INTO events (id, store_id, visitor_id, session_id, customer_id, event_name, created_at,
                           page_path, referrer, consent_state, schema_version, props_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [testId, storeId, visitorId, sessionId, null, 'page_view', now, '/debug-test', null, 'granted', 1, null]
    );
    writeTest = `inserted (changes=${writeResult.changes})`;
    writeDetails.evt_changes = writeResult.changes;
    
    // Verify the write by reading back
    const verifyRow = await queryDb.get<{ c: number }>(
      "SELECT COUNT(*) AS c FROM events WHERE id = ?",
      [testId]
    );
    verifyCount = verifyRow?.c || 0;
  } catch (e) {
    writeError = e instanceof Error ? e.message : String(e);
    writeTest = 'failed';
  }

  // Test the exact same queries as getOverviewKpis()
  let overviewDebug: Record<string, unknown> = {};
  try {
    const STORE_ID = 'store_darro';
    const [newVisitorsRow, ordersRow] = await Promise.all([
      queryDb.get<{ c: number }>(
        `SELECT COUNT(DISTINCT v.id) AS c FROM visitors v WHERE v.store_id = ? AND v.first_seen_at BETWEEN ? AND ?`,
        [STORE_ID, range.start, range.end]
      ),
      queryDb.get<{ c: number }>(
        `SELECT COUNT(*) AS c FROM orders WHERE store_id = ? AND status NOT IN ('cancelled','refunded') AND created_at BETWEEN ? AND ?`,
        [STORE_ID, range.start, range.end]
      ),
    ]);
    overviewDebug.new_visitors_from_table = newVisitorsRow?.c || 0;
    overviewDebug.orders_count = ordersRow?.c || 0;
    overviewDebug.orders_query = 'ok';
  } catch (e) {
    overviewDebug.orders_query = 'error: ' + (e instanceof Error ? e.message : String(e));
  }

  // Also test the visitors table directly
  try {
    const allVisitors = await queryDb.all<{ id: string; first_seen_at: string }>(
      `SELECT id, first_seen_at FROM visitors WHERE store_id = ?`,
      ['store_darro']
    );
    overviewDebug.visitors_table_rows = allVisitors.length;
    if (allVisitors.length > 0) {
      overviewDebug.visitors_sample = JSON.stringify(allVisitors[0]);
    }
  } catch (e) {
    overviewDebug.visitors_table = 'error: ' + (e instanceof Error ? e.message : String(e));
  }

  // Check actual event data to diagnose query issues
  try {
    const allEvents = await queryDb.all<{ id: string; store_id: string; created_at: string; event_name: string }>(
      `SELECT id, store_id, created_at, event_name FROM events ORDER BY rowid DESC LIMIT 5`
    );
    overviewDebug.raw_events = allEvents;
    
    // Check date range query
    const rangeTest = await queryDb.all<{ id: string; created_at: string }>(
      `SELECT id, created_at FROM events WHERE store_id = ? AND created_at BETWEEN ? AND ?`,
      ['store_darro', range.start, range.end]
    );
    overviewDebug.range_query_results = rangeTest.length;
    if (rangeTest.length > 0) {
      overviewDebug.range_sample = rangeTest[0];
    }
  } catch (e) {
    overviewDebug.raw_events_error = e instanceof Error ? e.message : String(e);
  }

  return NextResponse.json({
    status: 'ok',
    timestamp: now.toISOString(),
    date_range: range,
    environment: process.env.NODE_ENV,
    vercel: !!process.env.VERCEL,
    turso_configured: !!(process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN),
    database: {
      status: dbStatus,
      error: dbError,
      session_count: dbSessionCount,
      visitor_count: dbVisitorCount,
      pageview_count: dbPageviewCount,
      product_view_count: productViewCount,
      write_test: writeTest,
      write_error: writeError,
      write_verify_count: verifyCount,
      write_details: writeDetails,
    },
    json_store: {
      file_size_bytes: jsonStats.fileSize,
      total_events: jsonStats.events,
      total_visitors: jsonStats.visitors,
      total_sessions: jsonStats.sessions,
    },
    json_overview_30d: jsonOverview,
    recent_events: recentEvents,
    visitors_count: visitors.length,
    sessions_count: sessions.length,
    overview_debug: overviewDebug,
  });
}
