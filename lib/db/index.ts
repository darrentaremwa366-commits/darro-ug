import { createClient, type Client as LibsqlClient, type ResultSet } from '@libsql/client';
import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import bcryptjs from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

export const STORE_ID = 'store_darro';

export function nowISO(): string {
  return new Date().toISOString();
}

export function uuid(): string {
  return crypto.randomUUID();
}

function getProjectRoot(): string {
  if (process.env.PROJECT_ROOT) {
    const p = path.resolve(process.env.PROJECT_ROOT);
    if (fs.existsSync(path.join(p, 'package.json'))) return p;
  }
  const tryCandidates = (base: string): string | null => {
    let cur = path.resolve(base);
    for (let i = 0; i < 12; i++) {
      if (fs.existsSync(path.join(cur, 'package.json'))) return cur;
      const parent = path.dirname(cur);
      if (parent === cur) break;
      cur = parent;
    }
    return null;
  };
  const fromCwd = tryCandidates(process.cwd());
  if (fromCwd) return fromCwd;
  for (const drive of ['C:', 'D:', 'E:']) {
    const candidate = path.join(drive + path.sep, 'Users', 'Lenovo', 'Desktop', 'agency', 'ecommerce-demo');
    if (fs.existsSync(path.join(candidate, 'package.json'))) return candidate;
  }
  return process.cwd();
}

function getDataDir(): string {
  // On Vercel serverless (or any serverless where cwd/project is read-only)
  // we MUST write to /tmp because the deployed source directory is mounted
  // read-only. Without this, ALL analytics/admin writes silently fail into
  // the NoopBackend and the dashboard shows zeroes forever.
  if (process.env.VERCEL || process.env.DARRO_DB_USE_TMP) {
    const tmpDir = process.env.DARRO_DB_TMP_DIR || '/tmp/darro-db';
    if (!fs.existsSync(/*turbopackIgnore: true*/ tmpDir)) {
      try { fs.mkdirSync(/*turbopackIgnore: true*/ tmpDir, { recursive: true }); } catch { /* ignore */ }
    }
    return tmpDir;
  }
  return path.join(getProjectRoot(), 'data');
}

function getDbPath(): string {
  return path.join(getDataDir(), 'darro-analytics.sqlite');
}

function ensureDataDirSync(): void {
  const dataDir = getDataDir();
  if (!fs.existsSync(/*turbopackIgnore: true*/ dataDir)) {
    fs.mkdirSync(/*turbopackIgnore: true*/ dataDir, { recursive: true });
  }
}

export interface SeedProductsItem {
  id: number;
  slug: string;
  name: string;
  collection?: string;
  sku?: string;
  regularPriceUGX: number;
  memberPriceUGX?: number;
  stockStatus?: string;
}

function loadProductsFromDisk(): SeedProductsItem[] {
  try {
    const root = getProjectRoot();
    const productsJsonPath = path.join(root, 'data', 'products.json');
    if (fs.existsSync(productsJsonPath)) {
      return JSON.parse(fs.readFileSync(productsJsonPath, 'utf-8'));
    }
  } catch (e) {
    console.warn('[db] loadProductsFromDisk failed:', e instanceof Error ? e.message : String(e));
  }
  return [];
}

const _IN_MEMORY_SCHEMA_FALLBACK = `
CREATE TABLE IF NOT EXISTS stores (id TEXT PRIMARY KEY, name TEXT NOT NULL, slug TEXT UNIQUE NOT NULL, timezone TEXT NOT NULL DEFAULT 'Africa/Kampala', currency TEXT NOT NULL DEFAULT 'UGX', settings_json TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS admin_users (id TEXT PRIMARY KEY, store_id TEXT NOT NULL, email TEXT NOT NULL, password_hash TEXT NOT NULL, role TEXT NOT NULL CHECK(role IN ('owner','analyst','marketer','support')), full_name TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, UNIQUE(store_id, email));
CREATE TABLE IF NOT EXISTS visitors (id TEXT PRIMARY KEY, store_id TEXT NOT NULL, consent_state TEXT DEFAULT 'pending', first_seen_at TEXT NOT NULL, last_seen_at TEXT NOT NULL, device_type TEXT, os_name TEXT, browser_name TEXT, country_code TEXT);
CREATE TABLE IF NOT EXISTS sessions (id TEXT PRIMARY KEY, store_id TEXT NOT NULL, visitor_id TEXT NOT NULL, customer_id TEXT, landing_path TEXT, referrer TEXT, utm_source TEXT, utm_medium TEXT, utm_campaign TEXT, utm_content TEXT, utm_term TEXT, source_class TEXT, first_touch_campaign_id TEXT, last_touch_campaign_id TEXT, started_at TEXT NOT NULL, ended_at TEXT);
CREATE TABLE IF NOT EXISTS customers (id TEXT PRIMARY KEY, store_id TEXT NOT NULL, email TEXT, email_hash TEXT, phone TEXT, phone_hash TEXT, full_name TEXT, first_order_at TEXT, last_order_at TEXT, total_orders INTEGER NOT NULL DEFAULT 0, total_spent_cents INTEGER NOT NULL DEFAULT 0, encrypted_pii TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS identity_links (id TEXT PRIMARY KEY, store_id TEXT NOT NULL, visitor_id TEXT NOT NULL, customer_id TEXT NOT NULL, linked_via TEXT NOT NULL, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS events (id TEXT PRIMARY KEY, store_id TEXT NOT NULL, visitor_id TEXT NOT NULL, session_id TEXT NOT NULL, customer_id TEXT, event_name TEXT NOT NULL, created_at TEXT NOT NULL, page_path TEXT, referrer TEXT, consent_state TEXT DEFAULT 'pending', schema_version INTEGER NOT NULL DEFAULT 1, props_json TEXT);
CREATE TABLE IF NOT EXISTS carts (id TEXT PRIMARY KEY, store_id TEXT NOT NULL, visitor_id TEXT, customer_id TEXT, session_id TEXT, status TEXT NOT NULL DEFAULT 'active', total_regular_cents INTEGER NOT NULL DEFAULT 0, total_member_cents INTEGER NOT NULL DEFAULT 0, discount_cents INTEGER NOT NULL DEFAULT 0, currency TEXT NOT NULL DEFAULT 'UGX', created_at TEXT NOT NULL, updated_at TEXT NOT NULL, abandoned_at TEXT);
CREATE TABLE IF NOT EXISTS cart_items (id TEXT PRIMARY KEY, store_id TEXT NOT NULL, cart_id TEXT NOT NULL, product_id TEXT NOT NULL, product_slug TEXT NOT NULL, product_name TEXT NOT NULL, variant_name TEXT, qty INTEGER NOT NULL, unit_price_cents INTEGER NOT NULL, member_price_cents INTEGER, cogs_cents INTEGER NOT NULL DEFAULT 0, added_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS checkouts (id TEXT PRIMARY KEY, store_id TEXT NOT NULL, cart_id TEXT, visitor_id TEXT, customer_id TEXT, session_id TEXT, status TEXT NOT NULL DEFAULT 'started', contact_email TEXT, contact_phone TEXT, recovery_status TEXT, started_at TEXT NOT NULL, contact_submitted_at TEXT, completed_at TEXT, abandoned_at TEXT);
CREATE TABLE IF NOT EXISTS orders (id TEXT PRIMARY KEY, store_id TEXT NOT NULL, checkout_id TEXT, cart_id TEXT, visitor_id TEXT, customer_id TEXT, session_id TEXT, order_number TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'new', customer_email TEXT, customer_phone TEXT, customer_name TEXT, shipping_address_json TEXT, gross_sales_cents INTEGER NOT NULL DEFAULT 0, discount_cents INTEGER NOT NULL DEFAULT 0, refund_cents INTEGER NOT NULL DEFAULT 0, shipping_cents INTEGER NOT NULL DEFAULT 0, tax_cents INTEGER NOT NULL DEFAULT 0, net_sales_cents INTEGER NOT NULL DEFAULT 0, total_cogs_cents INTEGER NOT NULL DEFAULT 0, gross_profit_cents INTEGER NOT NULL DEFAULT 0, payment_method TEXT, payment_fee_cents INTEGER NOT NULL DEFAULT 0, currency TEXT NOT NULL DEFAULT 'UGX', first_touch_campaign_id TEXT, last_touch_campaign_id TEXT, source_class TEXT, utm_source TEXT, utm_medium TEXT, utm_campaign TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, completed_at TEXT);
CREATE TABLE IF NOT EXISTS order_items (id TEXT PRIMARY KEY, store_id TEXT NOT NULL, order_id TEXT NOT NULL, product_id TEXT NOT NULL, product_slug TEXT NOT NULL, product_name TEXT NOT NULL, variant_name TEXT, qty INTEGER NOT NULL, unit_price_cents INTEGER NOT NULL, member_price_cents INTEGER, discount_cents INTEGER NOT NULL DEFAULT 0, gross_sales_cents INTEGER NOT NULL DEFAULT 0, net_sales_cents INTEGER NOT NULL DEFAULT 0, refund_cents INTEGER NOT NULL DEFAULT 0, cogs_cents_snapshot INTEGER NOT NULL DEFAULT 0, gross_profit_cents INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS products (id TEXT PRIMARY KEY, store_id TEXT NOT NULL, external_id TEXT, slug TEXT NOT NULL, name TEXT NOT NULL, sku TEXT, collection TEXT, active INTEGER NOT NULL DEFAULT 1, regular_price_cents INTEGER NOT NULL, member_price_cents INTEGER, cogs_cents INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, UNIQUE(store_id, slug));
CREATE TABLE IF NOT EXISTS inventory_costs (id TEXT PRIMARY KEY, store_id TEXT NOT NULL, product_id TEXT NOT NULL, cogs_cents INTEGER NOT NULL, effective_from TEXT NOT NULL, effective_to TEXT);
CREATE TABLE IF NOT EXISTS campaigns (id TEXT PRIMARY KEY, store_id TEXT NOT NULL, name TEXT NOT NULL, utm_source TEXT, utm_medium TEXT, utm_campaign TEXT, utm_content TEXT, utm_term TEXT, landing_url TEXT, created_by TEXT, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS attribution_touches (id TEXT PRIMARY KEY, store_id TEXT NOT NULL, visitor_id TEXT NOT NULL, session_id TEXT NOT NULL, customer_id TEXT, order_id TEXT, campaign_id TEXT, touch_type TEXT NOT NULL, conversion_window_hours INTEGER, touched_at TEXT NOT NULL, source_class TEXT, utm_source TEXT, utm_medium TEXT, utm_campaign TEXT, referrer_host TEXT);
CREATE TABLE IF NOT EXISTS marketing_spend (id TEXT PRIMARY KEY, store_id TEXT NOT NULL, campaign_id TEXT, spend_date TEXT NOT NULL, platform TEXT NOT NULL, campaign_name TEXT, spend_cents INTEGER NOT NULL, currency TEXT NOT NULL DEFAULT 'UGX', created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS admin_audit_log (id TEXT PRIMARY KEY, store_id TEXT NOT NULL, admin_user_id TEXT, action TEXT NOT NULL, resource_type TEXT, resource_id TEXT, details_json TEXT, ip_address TEXT, user_agent TEXT, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS data_deletion_requests (id TEXT PRIMARY KEY, store_id TEXT NOT NULL, customer_identifier TEXT NOT NULL, customer_id TEXT, status TEXT NOT NULL DEFAULT 'pending', requested_at TEXT NOT NULL, completed_at TEXT, notes TEXT);
CREATE INDEX IF NOT EXISTS idx_events_store_time ON events(store_id, created_at);
CREATE INDEX IF NOT EXISTS idx_events_name ON events(store_id, event_name, created_at);
CREATE INDEX IF NOT EXISTS idx_events_visitor ON events(visitor_id, created_at);
CREATE INDEX IF NOT EXISTS idx_events_session ON events(session_id, created_at);
CREATE INDEX IF NOT EXISTS idx_orders_store_created ON orders(store_id, created_at);
CREATE INDEX IF NOT EXISTS idx_products_store_active ON products(store_id, active);
CREATE INDEX IF NOT EXISTS idx_visitors_store_first ON visitors(store_id, first_seen_at);
`;

function loadSchemaFromDisk(): string {
  try {
    const root = getProjectRoot();
    const schemaPath = path.join(root, 'lib', 'db', 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      return fs.readFileSync(schemaPath, 'utf-8');
    }
  } catch (e) {
    console.warn('[db] loadSchemaFromDisk failed, using embedded fallback schema:', e instanceof Error ? e.message : String(e));
  }
  return _IN_MEMORY_SCHEMA_FALLBACK;
}

// ---------- Better-SQLite3 local DB (dev / fallback) ----------

const globalForSqlite = globalThis as unknown as {
  db?: Database.Database;
  initialized?: boolean;
};

function initSqliteFile(): Database.Database {
  if (globalForSqlite.db && globalForSqlite.initialized) return globalForSqlite.db;
  ensureDataDirSync();
  const db = new Database(getDbPath());
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.exec(loadSchemaFromDisk());
  seedSqlite(db);
  globalForSqlite.db = db;
  globalForSqlite.initialized = true;
  return db;
}

function initSqliteMemory(): Database.Database {
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  db.exec(loadSchemaFromDisk());
  seedSqlite(db);
  return db;
}

function seedSqlite(db: Database.Database): void {
  const now = nowISO();
  const storeExists = db.prepare('SELECT id FROM stores WHERE id = ?').get(STORE_ID) as { id: string } | undefined;
  if (!storeExists) {
    db.prepare(`INSERT INTO stores (id, name, slug, timezone, currency, settings_json, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(STORE_ID, 'Darro', 'darro', 'Africa/Kampala', 'UGX', JSON.stringify({}), now, now);
  }
  const adminExists = db.prepare('SELECT id FROM admin_users WHERE id = ?').get('admin_owner') as { id: string } | undefined;
  if (!adminExists) {
    db.prepare(`INSERT INTO admin_users (id, store_id, email, password_hash, role, full_name, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(
      'admin_owner', STORE_ID, 'owner@darro.co', bcryptjs.hashSync('darro2026', 10),
      'owner', 'Darro Owner', now, now,
    );
  }
  const products = loadProductsFromDisk();
  if (products.length) {
    const upsert = db.prepare(`INSERT INTO products (id, store_id, external_id, slug, name, sku, collection, active,
      regular_price_cents, member_price_cents, cogs_cents, created_at, updated_at)
      VALUES (@id, @store_id, @external_id, @slug, @name, @sku, @collection, @active,
              @regular_price_cents, @member_price_cents, @cogs_cents, @created_at, @updated_at)
      ON CONFLICT(store_id, slug) DO UPDATE SET
        name = excluded.name, sku = excluded.sku, collection = excluded.collection,
        active = excluded.active, regular_price_cents = excluded.regular_price_cents,
        member_price_cents = excluded.member_price_cents, cogs_cents = excluded.cogs_cents,
        updated_at = excluded.updated_at`);
    const tx = db.transaction((prods: typeof products) => {
      for (const p of prods) {
        const cogs = Math.floor(p.regularPriceUGX * 0.45);
        const active = p.stockStatus === 'soldOut' ? 0 : 1;
        upsert.run({
          id: `prod_${p.slug}`, store_id: STORE_ID, external_id: String(p.id),
          slug: p.slug, name: p.name, sku: p.sku || `DRR-P${String(p.id).padStart(3, '0')}`,
          collection: p.collection || null, active,
          regular_price_cents: p.regularPriceUGX,
          member_price_cents: p.memberPriceUGX || null,
          cogs_cents: cogs, created_at: now, updated_at: now,
        });
      }
    });
    tx(products);
  }
}

// Resolve which sync db to export for backwards-compat code.
// IMPORTANT: fully lazy — do NOT touch better-sqlite3 at module-eval time.
// This avoids Vercel build crashes during static prerender (pages that don't
// actually need the DB never trigger native binding load).
let _syncDb: Database.Database | null = null;
let _dbInitError: Error | null = null;
let _initAttempted = false;

function getSyncDb(): Database.Database {
  if (_syncDb) return _syncDb;
  if (globalForSqlite.db && globalForSqlite.initialized) {
    _syncDb = globalForSqlite.db;
    return _syncDb;
  }
  if (_initAttempted && _syncDb) return _syncDb;
  _initAttempted = true;
  try {
    _syncDb = initSqliteFile();
  } catch (err) {
    _dbInitError = err instanceof Error ? err : new Error(String(err));
    console.warn('[db] SQLite file init failed, trying in-memory fallback (Vercel read-only fs?).', _dbInitError.message);
    try {
      _syncDb = initSqliteMemory();
    } catch (err2) {
      const msg = err2 instanceof Error ? err2.message : String(err2);
      console.error('[db] In-memory SQLite init ALSO failed — creating truly empty stub. Error:', msg);
      _syncDb = new Database(':memory:');
      _dbInitError = new Error('DB degraded (no schema/seed): ' + msg);
    }
  }
  return _syncDb!;
}

// Lazy proxy: forwards to getSyncDb() on first property access during runtime queries.
// This keeps existing callers working (db.prepare etc) without touching native init at import time.
export const db: Database.Database = new Proxy({} as Database.Database, {
  get(_target, prop, _receiver) {
    const real = getSyncDb();
    const val = (real as unknown as Record<string | symbol, unknown>)[prop as string | symbol];
    return typeof val === 'function' ? (val as (...args: unknown[]) => unknown).bind(real) : val;
  },
});
export const dbInitError: Error | null = _dbInitError;
export const isDbAvailable = true;
export function initDb(): void { /* no-op: init happens lazily via queryDb / getSyncDb */ }
export default db;

// ---------- Turso (persistent remote DB) + Async unified layer ----------

type Backend = 'sqlite' | 'turso';

interface DbBackend {
  type: Backend;
  get<T = unknown>(sql: string, params?: unknown[]): Promise<T | undefined>;
  all<T = unknown>(sql: string, params?: unknown[]): Promise<T[]>;
  run(sql: string, params?: unknown[]): Promise<{ changes: number; lastInsertRowid: bigint | number }>;
  exec(sqlBatch: string): Promise<void>;
  batch(statements: Array<{ sql: string; params?: unknown[] }>): Promise<void>;
}

class SqliteBackend implements DbBackend {
  type: Backend = 'sqlite';
  constructor(private sqlite: Database.Database) {}
  async get<T = unknown>(sql: string, params: unknown[] = []): Promise<T | undefined> {
    try {
      return this.sqlite.prepare(sql).get(...params) as T | undefined;
    } catch (e) {
      console.warn('[db] SqliteBackend.get failed:', e instanceof Error ? e.message : String(e));
      return undefined;
    }
  }
  async all<T = unknown>(sql: string, params: unknown[] = []): Promise<T[]> {
    try {
      return this.sqlite.prepare(sql).all(...params) as T[];
    } catch (e) {
      console.warn('[db] SqliteBackend.all failed:', e instanceof Error ? e.message : String(e));
      return [];
    }
  }
  async run(sql: string, params: unknown[] = []) {
    try {
      const info = this.sqlite.prepare(sql).run(...params);
      return { changes: info.changes, lastInsertRowid: Number(info.lastInsertRowid) };
    } catch (e) {
      console.warn('[db] SqliteBackend.run failed:', e instanceof Error ? e.message : String(e));
      return { changes: 0, lastInsertRowid: 0 };
    }
  }
  async exec(sqlBatch: string) {
    try {
      this.sqlite.exec(sqlBatch);
    } catch (e) {
      console.warn('[db] SqliteBackend.exec failed:', e instanceof Error ? e.message : String(e));
    }
  }
  async batch(statements: Array<{ sql: string; params?: unknown[] }>) {
    try {
      const tx = this.sqlite.transaction((stmts: typeof statements) => {
        for (const s of stmts) {
          this.sqlite.prepare(s.sql).run(...(s.params || []));
        }
      });
      tx(statements);
    } catch (e) {
      console.warn('[db] SqliteBackend.batch failed:', e instanceof Error ? e.message : String(e));
    }
  }
}

class TursoBackend implements DbBackend {
  type: Backend = 'turso';
  constructor(private client: LibsqlClient) {}
  async get<T = unknown>(sql: string, params: unknown[] = []): Promise<T | undefined> {
    try {
      const steps = [{ sql, args: params as any }];
      const rs = await this.client.batch(steps as any, 'write');
      const rows = rs[0]?.rows;
      if (!rows || rows.length === 0) return undefined;
      return rowToObject(rows[0]) as T;
    } catch (e) {
      console.warn('[db] TursoBackend.get failed:', e instanceof Error ? e.message : String(e));
      return undefined;
    }
  }
  async all<T = unknown>(sql: string, params: unknown[] = []): Promise<T[]> {
    try {
      const steps = [{ sql, args: params as any }];
      const rs = await this.client.batch(steps as any, 'write');
      const rows = rs[0]?.rows;
      if (!rows) return [];
      return rows.map((r) => rowToObject(r)) as T[];
    } catch (e) {
      console.warn('[db] TursoBackend.all failed:', e instanceof Error ? e.message : String(e));
      return [];
    }
  }
  async run(sql: string, params: unknown[] = []) {
    try {
      const steps = [{ sql, args: params as any }];
      const rs = await this.client.batch(steps as any, 'write');
      const result = rs[0];
      return {
        changes: result?.rowsAffected ?? 0,
        lastInsertRowid: result?.lastInsertRowid != null ? BigInt(String(result.lastInsertRowid)) : 0,
      };
    } catch (e) {
      console.warn('[db] TursoBackend.run failed:', e instanceof Error ? e.message : String(e));
      return { changes: 0, lastInsertRowid: 0 };
    }
  }
  async exec(sqlBatch: string) {
    try {
      const stmts = sqlBatch
        .split(';')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      // Execute all statements in a single batch for consistency
      const steps = stmts.map((s) => ({ sql: s }));
      await this.client.batch(steps as any, 'write');
    } catch (e) {
      console.warn('[db] TursoBackend.exec failed:', e instanceof Error ? e.message : String(e));
    }
  }
  async batch(statements: Array<{ sql: string; params?: unknown[] }>) {
    try {
      const steps = statements.map((s) => ({ sql: s.sql, args: (s.params || []) as any }));
      await this.client.batch(steps as any, 'write');
    } catch (e) {
      console.warn('[db] TursoBackend.batch failed:', e instanceof Error ? e.message : String(e));
    }
  }
}

function rowToObject(row: ResultSet['rows'][number]): Record<string, unknown> {
  const obj: Record<string, unknown> = {};
  for (const key of Object.keys(row)) {
    let val = row[key];
    if (typeof val === 'bigint') {
      val = Number(val);
    }
    obj[key] = val;
  }
  return obj;
}

const globalForBackend = globalThis as unknown as {
  backend?: DbBackend;
  seedPromise?: Promise<void>;
};

export function useTurso(): boolean {
  return !!(process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN);
}

async function ensureTursoSeeded(client: LibsqlClient): Promise<void> {
  const b = new TursoBackend(client);
  // Check if stores table has our row (indicates schema + seed already applied)
  const storeRow = await b.get<{ id: string }>(
    `SELECT name FROM sqlite_master WHERE type='table' AND name='stores'`
  );
  if (!storeRow) {
    // Schema missing — apply it
    await b.exec(loadSchemaFromDisk());
  }
  const storeExists = await b.get<{ id: string }>(
    `SELECT id FROM stores WHERE id = ?`,
    [STORE_ID]
  );
  const now = nowISO();
  if (!storeExists) {
    await b.run(
      `INSERT INTO stores (id, name, slug, timezone, currency, settings_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [STORE_ID, 'Darro', 'darro', 'Africa/Kampala', 'UGX', JSON.stringify({}), now, now]
    );
  }
  const adminExists = await b.get<{ id: string }>(
    `SELECT id FROM admin_users WHERE id = ?`,
    ['admin_owner']
  );
  if (!adminExists) {
    await b.run(
      `INSERT INTO admin_users (id, store_id, email, password_hash, role, full_name, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ['admin_owner', STORE_ID, 'owner@darro.co', bcryptjs.hashSync('darro2026', 10), 'owner', 'Darro Owner', now, now]
    );
  }
  const products = loadProductsFromDisk();
  if (products.length) {
    for (const p of products) {
      const cogs = Math.floor(p.regularPriceUGX * 0.45);
      const active = p.stockStatus === 'soldOut' ? 0 : 1;
      await b.run(
        `INSERT INTO products (id, store_id, external_id, slug, name, sku, collection, active,
          regular_price_cents, member_price_cents, cogs_cents, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(store_id, slug) DO UPDATE SET
           name = excluded.name, sku = excluded.sku, collection = excluded.collection,
           active = excluded.active, regular_price_cents = excluded.regular_price_cents,
           member_price_cents = excluded.member_price_cents, cogs_cents = excluded.cogs_cents,
           updated_at = excluded.updated_at`,
        [
          `prod_${p.slug}`, STORE_ID, String(p.id), p.slug, p.name,
          p.sku || `DRR-P${String(p.id).padStart(3, '0')}`,
          p.collection || null, active, p.regularPriceUGX,
          p.memberPriceUGX || null, cogs, now, now,
        ]
      );
    }
  }
}

/**
 * Fallback "do nothing" backend used when both Turso AND SQLite fail to
 * initialize (most commonly: better-sqlite3 native binding refuses to load
 * in a Vercel serverless function due to libc / architecture / Node version
 * mismatch, combined with no TURSO env vars configured).
 *
 * All methods return the same "empty result" shape as the real backends —
 * the intent is that every higher-level admin query continues to work and
 * simply returns zeroes / empty arrays rather than crashing the whole
 * server render with a 500.
 */
class NoopBackend implements DbBackend {
  type: Backend = 'sqlite';
  async get<T = unknown>(): Promise<T | undefined> { return undefined; }
  async all<T = unknown>(): Promise<T[]> { return []; }
  async run(): Promise<{ changes: number; lastInsertRowid: number }> {
    return { changes: 0, lastInsertRowid: 0 };
  }
  async exec(): Promise<void> { /* noop */ }
  async batch(): Promise<void> { /* noop */ }
}

let _noopBackendSingleton: DbBackend | null = null;
function noopBackend(): DbBackend {
  if (!_noopBackendSingleton) _noopBackendSingleton = new NoopBackend();
  return _noopBackendSingleton;
}

async function resolveBackend(): Promise<DbBackend> {
  if (globalForBackend.backend) return globalForBackend.backend;

  try {
    if (useTurso()) {
      try {
        const client = createClient({
          url: process.env.TURSO_DATABASE_URL!,
          authToken: process.env.TURSO_AUTH_TOKEN!,
        });
        const backend = new TursoBackend(client);
        globalForBackend.backend = backend;
        // Seed lazily; avoid double-seeding
        if (!globalForBackend.seedPromise) {
          globalForBackend.seedPromise = ensureTursoSeeded(client).catch((err) => {
            console.warn('[db] Turso seed warning:', err instanceof Error ? err.message : String(err));
          });
        }
        await globalForBackend.seedPromise;
        
        // Warmup query: ensure the Turso connection is fully ready before
        // returning. The first query on a fresh connection may return stale
        // or empty results due to connection initialization lag.
        try {
          await client.batch([{ sql: 'SELECT 1' }] as any, 'write');
          // Small delay to allow the connection to stabilize
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch {
          // Warmup failed but we can still try to use the backend
        }
        
        return backend;
      } catch (tursoErr) {
        console.warn('[db] Turso init failed, falling back to SQLite.',
          tursoErr instanceof Error ? tursoErr.message : String(tursoErr));
        // fall through to SQLite attempt below
      }
    }

    // Fall back to local sync SQLite wrapped in async interface
    const backend = new SqliteBackend(getSyncDb());
    globalForBackend.backend = backend;
    return backend;
  } catch (outerErr) {
    const msg = outerErr instanceof Error ? outerErr.message : String(outerErr);
    console.error('[db] ALL backends failed. Using NoopBackend (queries return empty):', msg);
    const stub = noopBackend();
    globalForBackend.backend = stub;
    return stub;
  }
}

/**
 * Async unified query API — use this from all API routes & admin pages.
 *
 * If TURSO_DATABASE_URL + TURSO_AUTH_TOKEN are set, queries go to Turso
 * (permanent, persists across Vercel function cold starts). Otherwise the
 * same queries run against the local better-sqlite3 DB (file, or in-memory
 * fallback on read-only filesystems).
 *
 * GUARANTEE: None of these methods ever throw. Every failure path returns
 * sensible empty defaults so admin pages never see 500 errors even if the
 * entire DB layer is unavailable.
 */
export const queryDb = {
  async get<T = unknown>(sql: string, params?: unknown[]): Promise<T | undefined> {
    try {
      const b = await resolveBackend();
      const result = await b.get<T>(sql, params ?? []);
      // Retry once on Turso if result is empty (first-query staleness)
      if ((result === undefined || result === null) && b.type === 'turso') {
        await new Promise(resolve => setTimeout(resolve, 50));
        return await b.get<T>(sql, params ?? []);
      }
      return result;
    } catch (e) {
      console.warn('[db] queryDb.get outer failure:', e instanceof Error ? e.message : String(e));
      return undefined;
    }
  },
  async all<T = unknown>(sql: string, params?: unknown[]): Promise<T[]> {
    try {
      const b = await resolveBackend();
      const result = await b.all<T>(sql, params ?? []);
      // Retry once on Turso if result is empty (first-query staleness)
      if (result.length === 0 && b.type === 'turso') {
        await new Promise(resolve => setTimeout(resolve, 50));
        return await b.all<T>(sql, params ?? []);
      }
      return result;
    } catch (e) {
      console.warn('[db] queryDb.all outer failure:', e instanceof Error ? e.message : String(e));
      return [];
    }
  },
  async run(sql: string, params?: unknown[]): Promise<{ changes: number; lastInsertRowid: bigint | number }> {
    try {
      const b = await resolveBackend();
      return await b.run(sql, params ?? []);
    } catch (e) {
      console.warn('[db] queryDb.run outer failure:', e instanceof Error ? e.message : String(e));
      return { changes: 0, lastInsertRowid: 0 };
    }
  },
  async exec(sqlBatch: string): Promise<void> {
    try {
      const b = await resolveBackend();
      await b.exec(sqlBatch);
    } catch (e) {
      console.warn('[db] queryDb.exec outer failure:', e instanceof Error ? e.message : String(e));
    }
  },
  async batch(statements: Array<{ sql: string; params?: unknown[] }>): Promise<void> {
    try {
      const b = await resolveBackend();
      await b.batch(statements);
    } catch (e) {
      console.warn('[db] queryDb.batch outer failure:', e instanceof Error ? e.message : String(e));
    }
  },
};
