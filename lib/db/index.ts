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
  return path.join(getProjectRoot(), 'data');
}

function getDbPath(): string {
  return path.join(getDataDir(), 'darro-analytics.sqlite');
}

function ensureDataDirSync(): void {
  const dataDir = getDataDir();
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
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
    const productsJsonPath = path.join(getProjectRoot(), 'data', 'products.json');
    if (fs.existsSync(productsJsonPath)) {
      return JSON.parse(fs.readFileSync(productsJsonPath, 'utf-8'));
    }
  } catch {}
  return [];
}

function loadSchemaFromDisk(): string {
  const schemaPath = path.join(getProjectRoot(), 'lib', 'db', 'schema.sql');
  return fs.readFileSync(schemaPath, 'utf-8');
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

// Resolve which sync db to export for backwards-compat code
let _syncDb: Database.Database;
let _dbInitError: Error | null = null;
try {
  _syncDb = globalForSqlite.db || initSqliteFile();
} catch (err) {
  _dbInitError = err instanceof Error ? err : new Error(String(err));
  console.warn('[db] SQLite file init failed, using in-memory fallback (this is expected on Vercel read-only fs).', _dbInitError.message);
  _syncDb = initSqliteMemory();
}
export const db: Database.Database = _syncDb;
export const dbInitError: Error | null = _dbInitError;
export const isDbAvailable = true;
export function initDb(): void { /* no-op: init happens lazily via queryDb / _syncDb */ }
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
    return this.sqlite.prepare(sql).get(...params) as T | undefined;
  }
  async all<T = unknown>(sql: string, params: unknown[] = []): Promise<T[]> {
    return this.sqlite.prepare(sql).all(...params) as T[];
  }
  async run(sql: string, params: unknown[] = []) {
    const info = this.sqlite.prepare(sql).run(...params);
    return { changes: info.changes, lastInsertRowid: Number(info.lastInsertRowid) };
  }
  async exec(sqlBatch: string) {
    this.sqlite.exec(sqlBatch);
  }
  async batch(statements: Array<{ sql: string; params?: unknown[] }>) {
    const tx = this.sqlite.transaction((stmts: typeof statements) => {
      for (const s of stmts) {
        this.sqlite.prepare(s.sql).run(...(s.params || []));
      }
    });
    tx(statements);
  }
}

class TursoBackend implements DbBackend {
  type: Backend = 'turso';
  constructor(private client: LibsqlClient) {}
  async get<T = unknown>(sql: string, params: unknown[] = []): Promise<T | undefined> {
    const rs = await this.client.execute({ sql, args: params as any });
    if (rs.rows.length === 0) return undefined;
    return rowToObject(rs.rows[0]) as T;
  }
  async all<T = unknown>(sql: string, params: unknown[] = []): Promise<T[]> {
    const rs = await this.client.execute({ sql, args: params as any });
    return rs.rows.map((r) => rowToObject(r)) as T[];
  }
  async run(sql: string, params: unknown[] = []) {
    const rs = await this.client.execute({ sql, args: params as any });
    return {
      changes: rs.rowsAffected ?? 0,
      lastInsertRowid: rs.lastInsertRowid != null ? BigInt(String(rs.lastInsertRowid)) : 0,
    };
  }
  async exec(sqlBatch: string) {
    const stmts = sqlBatch
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    for (const stmt of stmts) {
      await this.client.execute(stmt);
    }
  }
  async batch(statements: Array<{ sql: string; params?: unknown[] }>) {
    const steps = statements.map((s) => ({ sql: s.sql, args: (s.params || []) as any }));
    await this.client.batch(steps as any, 'write');
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

async function resolveBackend(): Promise<DbBackend> {
  if (globalForBackend.backend) return globalForBackend.backend;

  if (useTurso()) {
    const client = createClient({
      url: process.env.TURSO_DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN!,
    });
    const backend = new TursoBackend(client);
    globalForBackend.backend = backend;
    // Seed lazily; avoid double-seeding
    if (!globalForBackend.seedPromise) {
      globalForBackend.seedPromise = ensureTursoSeeded(client).catch((err) => {
        console.warn('[db] Turso seed warning:', err.message);
      });
    }
    await globalForBackend.seedPromise;
    return backend;
  }

  // Fall back to local sync SQLite wrapped in async interface
  const backend = new SqliteBackend(_syncDb);
  globalForBackend.backend = backend;
  return backend;
}

/**
 * Async unified query API — use this from all API routes & admin pages.
 *
 * If TURSO_DATABASE_URL + TURSO_AUTH_TOKEN are set, queries go to Turso
 * (permanent, persists across Vercel function cold starts). Otherwise the
 * same queries run against the local better-sqlite3 DB (file, or in-memory
 * fallback on read-only filesystems).
 */
export const queryDb = {
  async get<T = unknown>(sql: string, params?: unknown[]): Promise<T | undefined> {
    const b = await resolveBackend();
    return b.get<T>(sql, params);
  },
  async all<T = unknown>(sql: string, params?: unknown[]): Promise<T[]> {
    const b = await resolveBackend();
    return b.all<T>(sql, params);
  },
  async run(sql: string, params?: unknown[]): Promise<{ changes: number; lastInsertRowid: bigint | number }> {
    const b = await resolveBackend();
    return b.run(sql, params);
  },
  async exec(sqlBatch: string): Promise<void> {
    const b = await resolveBackend();
    return b.exec(sqlBatch);
  },
  async batch(statements: Array<{ sql: string; params?: unknown[] }>): Promise<void> {
    const b = await resolveBackend();
    return b.batch(statements);
  },
};
