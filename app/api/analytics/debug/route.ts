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
  try {
    const isTurso = useTurso();
    const testQuery = await queryDb.get<{ c: number }>('SELECT COUNT(*) AS c FROM events LIMIT 1');
    dbStatus = testQuery ? `working (${isTurso ? 'Turso' : 'SQLite'})` : 'no events table';
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

  return NextResponse.json({
    status: 'ok',
    timestamp: now.toISOString(),
    environment: process.env.NODE_ENV,
    vercel: !!process.env.VERCEL,
    turso_configured: !!(process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN),
    database: {
      status: dbStatus,
      error: dbError,
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
  });
}
