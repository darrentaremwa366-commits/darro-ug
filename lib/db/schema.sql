-- SQLite schema. Idempotent CREATE TABLE IF NOT EXISTS.
-- All PKs are TEXT (UUID). All times are ISO 8601 UTC TEXT.
-- Enforce store_id scoping on every row.

CREATE TABLE IF NOT EXISTS stores (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'Africa/Kampala',
  currency TEXT NOT NULL DEFAULT 'UGX',
  settings_json TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS admin_users (
  id TEXT PRIMARY KEY,
  store_id TEXT NOT NULL REFERENCES stores(id),
  email TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('owner','analyst','marketer','support')),
  full_name TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(store_id, email)
);

CREATE TABLE IF NOT EXISTS visitors (
  id TEXT PRIMARY KEY,
  store_id TEXT NOT NULL REFERENCES stores(id),
  consent_state TEXT DEFAULT 'pending' CHECK(consent_state IN ('pending','granted','denied')),
  first_seen_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL,
  device_type TEXT,
  os_name TEXT,
  browser_name TEXT,
  country_code TEXT
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  store_id TEXT NOT NULL REFERENCES stores(id),
  visitor_id TEXT NOT NULL REFERENCES visitors(id),
  customer_id TEXT REFERENCES customers(id),
  landing_path TEXT,
  referrer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  source_class TEXT,
  first_touch_campaign_id TEXT REFERENCES campaigns(id),
  last_touch_campaign_id TEXT REFERENCES campaigns(id),
  started_at TEXT NOT NULL,
  ended_at TEXT
);

CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  store_id TEXT NOT NULL REFERENCES stores(id),
  email TEXT,
  email_hash TEXT,
  phone TEXT,
  phone_hash TEXT,
  full_name TEXT,
  first_order_at TEXT,
  last_order_at TEXT,
  total_orders INTEGER NOT NULL DEFAULT 0,
  total_spent_cents INTEGER NOT NULL DEFAULT 0,
  encrypted_pii TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS identity_links (
  id TEXT PRIMARY KEY,
  store_id TEXT NOT NULL REFERENCES stores(id),
  visitor_id TEXT NOT NULL REFERENCES visitors(id),
  customer_id TEXT NOT NULL REFERENCES customers(id),
  linked_via TEXT NOT NULL CHECK(linked_via IN ('checkout_email','checkout_phone','login','signup','form_submit')),
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  store_id TEXT NOT NULL REFERENCES stores(id),
  visitor_id TEXT NOT NULL REFERENCES visitors(id),
  session_id TEXT NOT NULL REFERENCES sessions(id),
  customer_id TEXT REFERENCES customers(id),
  event_name TEXT NOT NULL,
  created_at TEXT NOT NULL,
  page_path TEXT,
  referrer TEXT,
  consent_state TEXT DEFAULT 'pending',
  schema_version INTEGER NOT NULL DEFAULT 1,
  props_json TEXT
);
CREATE INDEX IF NOT EXISTS idx_events_store_time ON events(store_id, created_at);
CREATE INDEX IF NOT EXISTS idx_events_name ON events(store_id, event_name, created_at);
CREATE INDEX IF NOT EXISTS idx_events_visitor ON events(visitor_id, created_at);
CREATE INDEX IF NOT EXISTS idx_events_session ON events(session_id, created_at);

CREATE TABLE IF NOT EXISTS carts (
  id TEXT PRIMARY KEY,
  store_id TEXT NOT NULL REFERENCES stores(id),
  visitor_id TEXT REFERENCES visitors(id),
  customer_id TEXT REFERENCES customers(id),
  session_id TEXT REFERENCES sessions(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','converted','abandoned')),
  total_regular_cents INTEGER NOT NULL DEFAULT 0,
  total_member_cents INTEGER NOT NULL DEFAULT 0,
  discount_cents INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'UGX',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  abandoned_at TEXT
);

CREATE TABLE IF NOT EXISTS cart_items (
  id TEXT PRIMARY KEY,
  store_id TEXT NOT NULL REFERENCES stores(id),
  cart_id TEXT NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  product_slug TEXT NOT NULL,
  product_name TEXT NOT NULL,
  variant_name TEXT,
  qty INTEGER NOT NULL,
  unit_price_cents INTEGER NOT NULL,
  member_price_cents INTEGER,
  cogs_cents INTEGER NOT NULL DEFAULT 0,
  added_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS checkouts (
  id TEXT PRIMARY KEY,
  store_id TEXT NOT NULL REFERENCES stores(id),
  cart_id TEXT REFERENCES carts(id),
  visitor_id TEXT REFERENCES visitors(id),
  customer_id TEXT REFERENCES customers(id),
  session_id TEXT REFERENCES sessions(id),
  status TEXT NOT NULL DEFAULT 'started' CHECK(status IN ('started','contact_submitted','completed','abandoned')),
  contact_email TEXT,
  contact_phone TEXT,
  recovery_status TEXT CHECK(recovery_status IN ('not_started','sent','recovered','expired','opt_out')),
  started_at TEXT NOT NULL,
  contact_submitted_at TEXT,
  completed_at TEXT,
  abandoned_at TEXT
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  store_id TEXT NOT NULL REFERENCES stores(id),
  checkout_id TEXT REFERENCES checkouts(id),
  cart_id TEXT REFERENCES carts(id),
  visitor_id TEXT REFERENCES visitors(id),
  customer_id TEXT REFERENCES customers(id),
  session_id TEXT REFERENCES sessions(id),
  order_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK(status IN ('new','confirmed','processing','out_for_delivery','completed','refunded','cancelled')),
  customer_email TEXT,
  customer_phone TEXT,
  customer_name TEXT,
  shipping_address_json TEXT,
  gross_sales_cents INTEGER NOT NULL DEFAULT 0,
  discount_cents INTEGER NOT NULL DEFAULT 0,
  refund_cents INTEGER NOT NULL DEFAULT 0,
  shipping_cents INTEGER NOT NULL DEFAULT 0,
  tax_cents INTEGER NOT NULL DEFAULT 0,
  net_sales_cents INTEGER NOT NULL DEFAULT 0,
  total_cogs_cents INTEGER NOT NULL DEFAULT 0,
  gross_profit_cents INTEGER NOT NULL DEFAULT 0,
  payment_method TEXT,
  payment_fee_cents INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'UGX',
  first_touch_campaign_id TEXT REFERENCES campaigns(id),
  last_touch_campaign_id TEXT REFERENCES campaigns(id),
  source_class TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  completed_at TEXT
);

CREATE TABLE IF NOT EXISTS order_items (
  id TEXT PRIMARY KEY,
  store_id TEXT NOT NULL REFERENCES stores(id),
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  product_slug TEXT NOT NULL,
  product_name TEXT NOT NULL,
  variant_name TEXT,
  qty INTEGER NOT NULL,
  unit_price_cents INTEGER NOT NULL,
  member_price_cents INTEGER,
  discount_cents INTEGER NOT NULL DEFAULT 0,
  gross_sales_cents INTEGER NOT NULL DEFAULT 0,
  net_sales_cents INTEGER NOT NULL DEFAULT 0,
  refund_cents INTEGER NOT NULL DEFAULT 0,
  cogs_cents_snapshot INTEGER NOT NULL DEFAULT 0,
  gross_profit_cents INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  store_id TEXT NOT NULL REFERENCES stores(id),
  external_id TEXT,
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  sku TEXT,
  collection TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  regular_price_cents INTEGER NOT NULL,
  member_price_cents INTEGER,
  cogs_cents INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(store_id, slug)
);

CREATE TABLE IF NOT EXISTS inventory_costs (
  id TEXT PRIMARY KEY,
  store_id TEXT NOT NULL REFERENCES stores(id),
  product_id TEXT NOT NULL REFERENCES products(id),
  cogs_cents INTEGER NOT NULL,
  effective_from TEXT NOT NULL,
  effective_to TEXT
);

CREATE TABLE IF NOT EXISTS campaigns (
  id TEXT PRIMARY KEY,
  store_id TEXT NOT NULL REFERENCES stores(id),
  name TEXT NOT NULL,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  landing_url TEXT,
  created_by TEXT REFERENCES admin_users(id),
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS attribution_touches (
  id TEXT PRIMARY KEY,
  store_id TEXT NOT NULL REFERENCES stores(id),
  visitor_id TEXT NOT NULL REFERENCES visitors(id),
  session_id TEXT NOT NULL REFERENCES sessions(id),
  customer_id TEXT REFERENCES customers(id),
  order_id TEXT REFERENCES orders(id),
  campaign_id TEXT REFERENCES campaigns(id),
  touch_type TEXT NOT NULL CHECK(touch_type IN ('first','last_assisted','last','direct_override')),
  conversion_window_hours INTEGER,
  touched_at TEXT NOT NULL,
  source_class TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  referrer_host TEXT
);

CREATE TABLE IF NOT EXISTS marketing_spend (
  id TEXT PRIMARY KEY,
  store_id TEXT NOT NULL REFERENCES stores(id),
  campaign_id TEXT REFERENCES campaigns(id),
  spend_date TEXT NOT NULL,
  platform TEXT NOT NULL,
  campaign_name TEXT,
  spend_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'UGX',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS admin_audit_log (
  id TEXT PRIMARY KEY,
  store_id TEXT NOT NULL REFERENCES stores(id),
  admin_user_id TEXT REFERENCES admin_users(id),
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  details_json TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS data_deletion_requests (
  id TEXT PRIMARY KEY,
  store_id TEXT NOT NULL REFERENCES stores(id),
  customer_identifier TEXT NOT NULL,
  customer_id TEXT REFERENCES customers(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','processing','completed','denied')),
  requested_at TEXT NOT NULL,
  completed_at TEXT,
  notes TEXT
);
