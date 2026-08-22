/**
 * JSON Event Store — Vercel-safe persistence layer.
 *
 * On Vercel serverless, better-sqlite3 native bindings often fail to load
 * (compiled on Windows → Linux runtime). The fallback to in-memory SQLite
 * means each lambda invocation has isolated memory — events written on
 * one invocation are invisible to admin dashboard reads on another.
 *
 * This module solves that by persisting events (and related analytics
 * entities) to a JSON file in /tmp, which IS shared across requests within
 * the same warm container. When Turso or file-based SQLite are available,
 * the JSON file is a redundant backup; when they're NOT (Vercel production),
 * it becomes the primary analytics store.
 *
 * LIMITATION: /tmp is NOT shared across different Vercel containers. For
 * permanent durability across cold starts, set TURSO_DATABASE_URL +
 * TURSO_AUTH_TOKEN env vars — the existing TursoBackend will then be
 * used as the primary backend and this JSON store becomes unnecessary.
 */

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const STORE_DIR = process.env.VERCEL
  ? (process.env.DARRO_DB_TMP_DIR || '/tmp/darro-db')
  : path.join(os.tmpdir(), 'darro-test');

const STORE_FILE = path.join(STORE_DIR, 'darro-events.json');

interface JsonEvent {
  id: string;
  store_id: string;
  visitor_id: string;
  session_id: string;
  customer_id?: string | null;
  event_name: string;
  created_at: string;
  page_path?: string | null;
  referrer?: string | null;
  consent_state?: string;
  schema_version?: number;
  props_json?: string | null;
}

interface JsonVisitor {
  id: string;
  store_id: string;
  consent_state?: string;
  first_seen_at: string;
  last_seen_at: string;
}

interface JsonSession {
  id: string;
  store_id: string;
  visitor_id: string;
  customer_id?: string | null;
  landing_path?: string | null;
  referrer?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  source_class?: string | null;
  started_at: string;
  ended_at?: string | null;
}

interface JsonStore {
  events: JsonEvent[];
  visitors: JsonVisitor[];
  sessions: JsonSession[];
  updated_at: string;
}

function ensureDir(): void {
  try {
    fs.mkdirSync(STORE_DIR, { recursive: true });
  } catch { /* ignore */ }
}

function loadStore(): JsonStore {
  ensureDir();
  try {
    if (fs.existsSync(STORE_FILE)) {
      const raw = fs.readFileSync(STORE_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      return {
        events: Array.isArray(parsed.events) ? parsed.events : [],
        visitors: Array.isArray(parsed.visitors) ? parsed.visitors : [],
        sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
        updated_at: parsed.updated_at || new Date(0).toISOString(),
      };
    }
  } catch (e) {
    console.warn('[json-store] Failed to load store, starting fresh:',
      e instanceof Error ? e.message : String(e));
  }
  return { events: [], visitors: [], sessions: [], updated_at: new Date(0).toISOString() };
}

function saveStore(store: JsonStore): void {
  ensureDir();
  store.updated_at = new Date().toISOString();
  try {
    fs.writeFileSync(STORE_FILE, JSON.stringify(store), 'utf-8');
  } catch (e) {
    console.warn('[json-store] Failed to save store:',
      e instanceof Error ? e.message : String(e));
  }
}

/** Append an event to the JSON store. Thread-safe via read-modify-write. */
export function appendEvent(event: JsonEvent): void {
  const store = loadStore();
  store.events.push(event);
  saveStore(store);
}

/** Upsert a visitor (update last_seen_at if exists, insert if new). */
export function upsertVisitor(visitor: JsonVisitor): void {
  const store = loadStore();
  const existing = store.visitors.find((v) => v.id === visitor.id);
  if (existing) {
    existing.last_seen_at = visitor.last_seen_at;
    if (visitor.consent_state) existing.consent_state = visitor.consent_state;
  } else {
    store.visitors.push(visitor);
  }
  saveStore(store);
}

/** Upsert a session. */
export function upsertSession(session: JsonSession): void {
  const store = loadStore();
  const existing = store.sessions.find((s) => s.id === session.id);
  if (existing) {
    existing.ended_at = session.ended_at || existing.ended_at;
  } else {
    store.sessions.push(session);
  }
  saveStore(store);
}

/** Read all events, optionally filtered by time range. */
export function getEvents(range?: { start?: string; end?: string }): JsonEvent[] {
  const store = loadStore();
  if (!range?.start && !range?.end) return store.events;
  return store.events.filter((e) => {
    const ts = new Date(e.created_at).getTime();
    if (range?.start && ts < new Date(range.start).getTime()) return false;
    if (range?.end && ts > new Date(range.end).getTime()) return false;
    return true;
  });
}

/** Read all visitors. */
export function getVisitors(): JsonVisitor[] {
  return loadStore().visitors;
}

/** Read all sessions. */
export function getSessions(): JsonSession[] {
  return loadStore().sessions;
}

/** Compute overview KPIs from the JSON store (used as fallback when SQLite is empty). */
export function computeOverviewFromJson(range: { start: string; end: string }): {
  sessions: number; visitors: number; newVisitors: number;
  pageviews: number; addToCarts: number; checkoutStarts: number; purchases: number;
} {
  const store = loadStore();
  const events = store.events.filter((e) => {
    const ts = new Date(e.created_at).getTime();
    return ts >= new Date(range.start).getTime() && ts <= new Date(range.end).getTime();
  });

  const visitorIds = new Set(events.map((e) => e.visitor_id));
  const sessionIds = new Set(events.map((e) => e.session_id));

  // New visitors: first_seen_at within range
  const newVisitors = store.visitors.filter((v) => {
    const ts = new Date(v.first_seen_at).getTime();
    return ts >= new Date(range.start).getTime() && ts <= new Date(range.end).getTime();
  });

  const countEvent = (name: string) => events.filter((e) => e.event_name === name).length;

  return {
    sessions: sessionIds.size,
    visitors: visitorIds.size,
    newVisitors: newVisitors.length,
    pageviews: countEvent('page_view'),
    addToCarts: countEvent('add_to_cart'),
    checkoutStarts: countEvent('begin_checkout'),
    purchases: countEvent('purchase'),
  };
}

/** Clear all data (useful for testing). */
export function clearStore(): void {
  saveStore({ events: [], visitors: [], sessions: [], updated_at: new Date(0).toISOString() });
}

/** Debug: show store size. */
export function debugSize(): { events: number; visitors: number; sessions: number; fileSize: number } {
  const store = loadStore();
  let fileSize = 0;
  try { fileSize = fs.statSync(STORE_FILE).size; } catch { /* ignore */ }
  return {
    events: store.events.length,
    visitors: store.visitors.length,
    sessions: store.sessions.length,
    fileSize,
  };
}
