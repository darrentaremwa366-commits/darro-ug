import Database from 'better-sqlite3';
import fs from 'node:fs';
import fsPromises from 'node:fs/promises';
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

const globalForDb = globalThis as unknown as {
  db?: Database.Database;
  initialized?: boolean;
};

let dbInstance: Database.Database | undefined;

function getProjectRoot(): string {
  if (process.env.PROJECT_ROOT) {
    const p = path.resolve(process.env.PROJECT_ROOT);
    if (fs.existsSync(path.join(p, 'package.json'))) return p;
  }

  // Strategy: walk well-known parent dirs of the current working directory.
  // Next SSR chunk CWD may be C:\ROOT which is a synthetic root.
  // We search upward from process.cwd() for a dir containing package.json.
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

  // Strategy: check the real dev-launch directory passed as env
  // The server is launched from ecommerce-demo, so look for each drive root
  for (const drive of ['C:', 'D:', 'E:']) {
    const candidate = path.join(drive + path.sep, 'Users', 'Lenovo', 'Desktop', 'agency', 'ecommerce-demo');
    if (fs.existsSync(path.join(candidate, 'package.json'))) return candidate;
  }

  // Final fallback: process.cwd()
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

export function initDb(): Database.Database {
  if (globalForDb.db && globalForDb.initialized) {
    return globalForDb.db;
  }

  ensureDataDirSync();
  const dbPath = getDbPath();

  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // Resolve schema.sql relative to PROJECT_ROOT/lib/db (not __dirname which may be Next SSR chunk root)
  const schemaPath = path.join(getProjectRoot(), 'lib', 'db', 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
  db.exec(schemaSql);

  const now = nowISO();

  const storeExists = db
    .prepare('SELECT id FROM stores WHERE id = ?')
    .get(STORE_ID) as { id: string } | undefined;

  if (!storeExists) {
    db.prepare(
      `INSERT INTO stores (id, name, slug, timezone, currency, settings_json, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      STORE_ID,
      'Darro',
      'darro',
      'Africa/Kampala',
      'UGX',
      JSON.stringify({}),
      now,
      now
    );
  }

  const adminExists = db
    .prepare('SELECT id FROM admin_users WHERE id = ?')
    .get('admin_owner') as { id: string } | undefined;

  if (!adminExists) {
    const passwordHash = bcryptjs.hashSync('darro2026', 10);
    db.prepare(
      `INSERT INTO admin_users (id, store_id, email, password_hash, role, full_name, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      'admin_owner',
      STORE_ID,
      'owner@darro.co',
      passwordHash,
      'owner',
      'Darro Owner',
      now,
      now
    );
  }

  // products.json actually lives in repo-root data/ — project root = ecommerce-demo, so same path
  const productsJsonPath = path.join(getProjectRoot(), 'data', 'products.json');
  if (fs.existsSync(productsJsonPath)) {
    const productsRaw = fs.readFileSync(productsJsonPath, 'utf-8');
    const products = JSON.parse(productsRaw) as Array<{
      id: number;
      slug: string;
      name: string;
      collection?: string;
      sku?: string;
      regularPriceUGX: number;
      memberPriceUGX?: number;
      stockStatus?: string;
    }>;

    const upsertProduct = db.prepare(
      `INSERT INTO products (id, store_id, external_id, slug, name, sku, collection, active,
                              regular_price_cents, member_price_cents, cogs_cents, created_at, updated_at)
       VALUES (@id, @store_id, @external_id, @slug, @name, @sku, @collection, @active,
               @regular_price_cents, @member_price_cents, @cogs_cents, @created_at, @updated_at)
       ON CONFLICT(store_id, slug) DO UPDATE SET
         name = excluded.name,
         sku = excluded.sku,
         collection = excluded.collection,
         active = excluded.active,
         regular_price_cents = excluded.regular_price_cents,
         member_price_cents = excluded.member_price_cents,
         cogs_cents = excluded.cogs_cents,
         updated_at = excluded.updated_at`
    );

    const tx = db.transaction((prods: typeof products) => {
      for (const p of prods) {
        const cogsCents = Math.floor(p.regularPriceUGX * 0.45);
        const active = p.stockStatus === 'soldOut' ? 0 : 1;
        upsertProduct.run({
          id: `prod_${p.slug}`,
          store_id: STORE_ID,
          external_id: String(p.id),
          slug: p.slug,
          name: p.name,
          sku: p.sku || `DRR-P${String(p.id).padStart(3, '0')}`,
          collection: p.collection || null,
          active,
          regular_price_cents: p.regularPriceUGX,
          member_price_cents: p.memberPriceUGX || null,
          cogs_cents: cogsCents,
          created_at: now,
          updated_at: now,
        });
      }
    });

    tx(products);
  }

  globalForDb.db = db;
  globalForDb.initialized = true;
  dbInstance = db;

  return db;
}

export const db: Database.Database =
  globalForDb.db || initDb();

if (!globalForDb.db) {
  globalForDb.db = db;
  globalForDb.initialized = true;
}

export default db;
