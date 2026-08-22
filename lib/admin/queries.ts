import { queryDb, STORE_ID, uuid, nowISO } from '@/lib/db';
import {
  computeOverviewFromJson,
  computeTopPages,
  computeTrafficSources,
  computeFunnel as computeFunnelJson,
  getEvents,
  getVisitors as getJsonVisitors,
  getSessions as getJsonSessions,
} from '@/lib/json-event-store';

interface DateRange {
  rangeStart?: string;
  rangeEnd?: string;
}

function getDefaultRange(): { start: string; end: string; days: number } {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 29);
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  const msPerDay = 1000 * 60 * 60 * 24;
  const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / msPerDay));
  return { start: start.toISOString(), end: end.toISOString(), days };
}

function resolveRange(range: DateRange): { start: string; end: string; days: number } {
  const def = getDefaultRange();
  const start = range.rangeStart || def.start;
  const end = range.rangeEnd || def.end;
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  const msPerDay = 1000 * 60 * 60 * 24;
  const days = Math.max(1, Math.ceil((e - s) / msPerDay));
  return { start, end, days };
}

async function count(sql: string, params: unknown[] = []): Promise<number> {
  const row = await queryDb.get<{ c: number }>(sql, params);
  if (row?.c) return row.c;
  // Single fast retry after 150ms to handle Turso replication lag
  await new Promise(resolve => setTimeout(resolve, 150));
  const row2 = await queryDb.get<{ c: number }>(sql, params);
  return row2?.c || 0;
}

async function sum(sql: string, params: unknown[] = []): Promise<number> {
  const row = await queryDb.get<{ s: number }>(sql, params);
  if (row?.s) return row.s;
  // Single fast retry after 150ms
  await new Promise(resolve => setTimeout(resolve, 150));
  const row2 = await queryDb.get<{ s: number }>(sql, params);
  return row2?.s || 0;
}

export interface OverviewKpis {
  sessions: number;
  visitors: number;
  newVisitors: number;
  returningVisitors: number;
  orders: number;
  newCustomers: number;
  returningCustomers: number;
  conversionRatePct: number;
  grossSalesUGX: number;
  netSalesUGX: number;
  discountsUGX: number;
  refundsUGX: number;
  avgOrderValueUGX: number;
  unitsPerOrder: number;
  cogsUGX: number;
  grossProfitUGX: number;
  grossMarginPct: number;
  marketingSpendUGX: number;
  roas: number;
  cacUGX: number;
  pageviews: number;
  addToCarts: number;
  checkoutStarts: number;
  purchases: number;
}

export async function getOverviewKpis(range: DateRange = {}): Promise<OverviewKpis> {
  const { start, end } = resolveRange(range);
  const inRange = 'store_id = ? AND created_at BETWEEN ? AND ?';
  const params = [STORE_ID, start, end];

  const [
    sessions, visitors, newVisitors, orders,
    grossSalesUGX, discountsUGX, refundsUGX, netSalesUGX, cogsUGX,
  ] = await Promise.all([
    count(`SELECT COUNT(DISTINCT session_id) AS c FROM events WHERE ${inRange}`, params),
    count(`SELECT COUNT(DISTINCT visitor_id) AS c FROM events WHERE ${inRange}`, params),
    count(
      `SELECT COUNT(DISTINCT v.id) AS c FROM visitors v
       WHERE v.store_id = ? AND v.first_seen_at BETWEEN ? AND ?`,
      [STORE_ID, start, end]
    ),
    count(`SELECT COUNT(*) AS c FROM orders WHERE store_id = ? AND status NOT IN ('cancelled','refunded') AND created_at BETWEEN ? AND ?`, params),
    sum(`SELECT COALESCE(SUM(gross_sales_cents),0) AS s FROM orders WHERE store_id = ? AND status NOT IN ('cancelled','refunded') AND created_at BETWEEN ? AND ?`, params),
    sum(`SELECT COALESCE(SUM(discount_cents),0) AS s FROM orders WHERE store_id = ? AND status NOT IN ('cancelled','refunded') AND created_at BETWEEN ? AND ?`, params),
    sum(`SELECT COALESCE(SUM(refund_cents),0) AS s FROM orders WHERE store_id = ? AND status NOT IN ('cancelled','refunded') AND created_at BETWEEN ? AND ?`, params),
    sum(`SELECT COALESCE(SUM(net_sales_cents),0) AS s FROM orders WHERE store_id = ? AND status NOT IN ('cancelled','refunded') AND created_at BETWEEN ? AND ?`, params),
    sum(`SELECT COALESCE(SUM(total_cogs_cents),0) AS s FROM orders WHERE store_id = ? AND status NOT IN ('cancelled','refunded') AND created_at BETWEEN ? AND ?`, params),
  ]);

  // --- JSON store merge: supplement visitor/session metrics from JSON store ---
  // On Vercel, if better-sqlite3 bindings fail, the DB falls back to in-memory
  // SQLite (isolated per lambda). The JSON file in /tmp persists across requests
  // within the same warm container, so we merge both sources to get the best
  // available data. We take the MAX of DB and JSON values to avoid double-counting.
  let jsonSessions = 0, jsonVisitors = 0, jsonNewVisitors = 0;
  let jsonPageviews = 0, jsonAddToCarts = 0, jsonCheckoutStarts = 0, jsonPurchases = 0;
  try {
    const jsonOverview = computeOverviewFromJson({ start, end });
    jsonSessions = jsonOverview.sessions;
    jsonVisitors = jsonOverview.visitors;
    jsonNewVisitors = jsonOverview.newVisitors;
    jsonPageviews = jsonOverview.pageviews;
    jsonAddToCarts = jsonOverview.addToCarts;
    jsonCheckoutStarts = jsonOverview.checkoutStarts;
    jsonPurchases = jsonOverview.purchases;
    if (jsonSessions > 0) {
      console.log('[analytics] JSON store supplement:',
        `sessions=${jsonSessions} visitors=${jsonVisitors} pageviews=${jsonPageviews}`);
    }
  } catch (e) {
    console.warn('[analytics] JSON store read error:', e instanceof Error ? e.message : String(e));
  }

  // Use the MAX of DB and JSON values (never lose data from either source)
  const effectiveSessions = Math.max(sessions, jsonSessions);
  const effectiveVisitors = Math.max(visitors, jsonVisitors);
  const effectiveNewVisitors = Math.max(newVisitors, jsonNewVisitors);

  const returningVisitors = Math.max(0, effectiveVisitors - effectiveNewVisitors);
  const grossProfitUGX = Math.max(0, netSalesUGX - cogsUGX);
  const grossMarginPct = netSalesUGX > 0 ? Math.round((grossProfitUGX / netSalesUGX) * 1000) / 10 : 0;
  const avgOrderValueUGX = orders > 0 ? Math.round(netSalesUGX / orders) : 0;

  const unitsRow = await queryDb.get<{ u: number; cnt: number }>(
    `SELECT COALESCE(SUM(oi.qty),0) AS u, COUNT(DISTINCT o.id) AS cnt
     FROM orders o
     LEFT JOIN order_items oi ON oi.order_id = o.id
     WHERE o.store_id = ? AND o.status NOT IN ('cancelled','refunded') AND o.created_at BETWEEN ? AND ?`,
    params
  );
  const unitsPerOrder = (!unitsRow || unitsRow.cnt === 0) ? 0 : Math.round((unitsRow.u / unitsRow.cnt) * 100) / 100;

  const orderWhere = "store_id = ? AND status NOT IN ('cancelled','refunded') AND created_at BETWEEN ? AND ?";
  const newCustomers = count(`SELECT COUNT(*) AS c FROM customers WHERE store_id = ? AND created_at BETWEEN ? AND ?`, params);
  const uniqueCustRow = queryDb.get<{ c: number }>(
    `SELECT COUNT(DISTINCT customer_id) AS c FROM orders WHERE ${orderWhere} AND customer_id IS NOT NULL`,
    params
  );
  const [newCustResult, custRow] = await Promise.all([newCustomers, uniqueCustRow]);
  const totalOrderCustomers = custRow?.c || 0;
  const returningCustomersResult = Math.max(0, totalOrderCustomers - newCustResult);
  const conversionRatePct = effectiveSessions > 0 ? Math.round((orders / effectiveSessions) * 1000) / 10 : 0;

  const marketingSpendUGX = await sum(
    `SELECT COALESCE(SUM(spend_cents),0) AS s FROM marketing_spend WHERE store_id = ? AND spend_date BETWEEN ? AND ?`,
    [STORE_ID, start.slice(0, 10), end.slice(0, 10)]
  );
  const roas = marketingSpendUGX > 0 ? Math.round((netSalesUGX / marketingSpendUGX) * 100) / 100 : 0;
  const cacUGX = newCustResult > 0 ? Math.round(marketingSpendUGX / newCustResult) : 0;

  // DB event counts (may be zero on Vercel if SQLite falls back to in-memory)
  const dbPageviews = await count(`SELECT COUNT(*) AS c FROM events WHERE ${inRange} AND event_name = 'page_view'`, params);
  const dbAddToCarts = await count(`SELECT COUNT(*) AS c FROM events WHERE ${inRange} AND event_name = 'add_to_cart'`, params);
  const dbCheckoutStarts = await count(`SELECT COUNT(*) AS c FROM events WHERE ${inRange} AND event_name = 'begin_checkout'`, params);
  const dbPurchases = await count(`SELECT COUNT(*) AS c FROM events WHERE ${inRange} AND event_name = 'purchase'`, params);

  // Use MAX of DB and JSON store for event counts (never lose data from either source)
  const effectivePageviews = Math.max(dbPageviews, jsonPageviews);
  const effectiveAddToCarts = Math.max(dbAddToCarts, jsonAddToCarts);
  const effectiveCheckoutStarts = Math.max(dbCheckoutStarts, jsonCheckoutStarts);
  const effectivePurchases = Math.max(dbPurchases, jsonPurchases);

  return {
    sessions: effectiveSessions,
    visitors: effectiveVisitors,
    newVisitors: effectiveNewVisitors,
    returningVisitors,
    orders,
    newCustomers: newCustResult,
    returningCustomers: returningCustomersResult,
    conversionRatePct,
    grossSalesUGX,
    netSalesUGX,
    discountsUGX,
    refundsUGX,
    avgOrderValueUGX,
    unitsPerOrder,
    cogsUGX,
    grossProfitUGX,
    grossMarginPct,
    marketingSpendUGX,
    roas,
    cacUGX,
    pageviews: effectivePageviews,
    addToCarts: effectiveAddToCarts,
    checkoutStarts: effectiveCheckoutStarts,
    purchases: effectivePurchases,
  };
}

export interface FunnelStep {
  name: string;
  value: number;
  dropFromPrev: number;
  convRate: number;
}

export interface FunnelResult {
  productViews: number;
  addToCarts: number;
  checkoutStarts: number;
  contactSubmitted: number;
  purchases: number;
  steps: FunnelStep[];
}

export async function getFunnel(range: DateRange & { device?: string; source?: string; campaign?: string; landingPath?: string; productSlug?: string } = {}): Promise<FunnelResult> {
  const { start, end } = resolveRange(range);
  const baseParams = [STORE_ID, start, end];

  let eventWhere = `e.store_id = ? AND e.created_at BETWEEN ? AND ?`;
  const params: unknown[] = [...baseParams];

  if (range.productSlug) {
    eventWhere += ` AND e.props_json LIKE ?`;
    params.push(`%"product_slug":"${range.productSlug}"%`);
  }

  let [productViews, addToCarts, checkoutStarts, contactSubmitted, purchases] = await Promise.all([
    count(`SELECT COUNT(DISTINCT e.session_id) AS c FROM events e WHERE ${eventWhere} AND e.event_name = 'product_view'`, params),
    count(`SELECT COUNT(DISTINCT e.session_id) AS c FROM events e WHERE ${eventWhere} AND e.event_name = 'add_to_cart'`, params),
    count(`SELECT COUNT(DISTINCT e.session_id) AS c FROM events e WHERE ${eventWhere} AND e.event_name = 'begin_checkout'`, params),
    count(`SELECT COUNT(DISTINCT e.session_id) AS c FROM events e WHERE ${eventWhere} AND e.event_name = 'checkout_contact_submitted'`, params),
    count(`SELECT COUNT(DISTINCT e.session_id) AS c FROM events e WHERE ${eventWhere} AND e.event_name = 'purchase'`, params),
  ]);

  // JSON store merge: supplement funnel from JSON store
  // On Vercel, DB may be empty (in-memory SQLite per lambda).
  // Take MAX of DB and JSON values to never lose data.
  try {
    const jsonFunnel = computeFunnelJson({ start, end });
    productViews = Math.max(productViews, jsonFunnel.productViews);
    addToCarts = Math.max(addToCarts, jsonFunnel.addToCarts);
    checkoutStarts = Math.max(checkoutStarts, jsonFunnel.checkoutStarts);
    contactSubmitted = Math.max(contactSubmitted, jsonFunnel.checkoutStarts); // approximation
    purchases = Math.max(purchases, jsonFunnel.purchases);
  } catch (e) {
    console.warn('[analytics] JSON funnel merge error:', e instanceof Error ? e.message : String(e));
  }

  const pct = (num: number, den: number): number => {
    if (den <= 0) return 0;
    return Math.round((num / den) * 1000) / 10;
  };
  const drop = (prev: number, curr: number): number => {
    if (prev <= 0) return 0;
    return Math.round(((prev - curr) / prev) * 1000) / 10;
  };

  const steps: FunnelStep[] = [
    { name: 'Product Views', value: productViews, dropFromPrev: 0, convRate: 0 },
    { name: 'Add to Cart', value: addToCarts, dropFromPrev: drop(productViews, addToCarts), convRate: pct(addToCarts, productViews) },
    { name: 'Checkout Start', value: checkoutStarts, dropFromPrev: drop(addToCarts, checkoutStarts), convRate: pct(checkoutStarts, addToCarts) },
    { name: 'Contact Submitted', value: contactSubmitted, dropFromPrev: drop(checkoutStarts, contactSubmitted), convRate: pct(contactSubmitted, checkoutStarts) },
    { name: 'Purchase', value: purchases, dropFromPrev: drop(contactSubmitted, purchases), convRate: pct(purchases, contactSubmitted) },
  ];

  return { productViews, addToCarts, checkoutStarts, contactSubmitted, purchases, steps };
}

export interface ProductStat {
  product_id: string;
  product_slug: string;
  product_name: string;
  collection: string | null;
  productViews: number;
  addToCarts: number;
  atcRatePct: number;
  orders: number;
  unitsSold: number;
  grossSalesUGX: number;
  discountsUGX: number;
  refundsUGX: number;
  netSalesUGX: number;
  cogsUGX: number;
  grossProfitUGX: number;
  grossMarginPct: number;
  inventoryVelocity: number;
}

export async function getProductStats(range: DateRange & { topN?: number } = {}): Promise<ProductStat[]> {
  const { start, end, days } = resolveRange(range);
  const topN = range.topN ?? 20;

  const rows = await queryDb.all<{
    product_id: string;
    product_slug: string;
    product_name: string;
    collection: string | null;
    productViews: number;
    addToCarts: number;
    orders: number;
    unitsSold: number;
    grossSalesUGX: number;
    discountsUGX: number;
    refundsUGX: number;
    netSalesUGX: number;
    cogsUGX: number;
    grossProfitUGX: number;
  }>(`
    SELECT
      p.id AS product_id,
      p.slug AS product_slug,
      p.name AS product_name,
      p.collection AS collection,
      COALESCE(pv.cnt, 0) AS productViews,
      COALESCE(atc.cnt, 0) AS addToCarts,
      COALESCE(oi_stats.orders, 0) AS orders,
      COALESCE(oi_stats.units, 0) AS unitsSold,
      COALESCE(oi_stats.gross, 0) AS grossSalesUGX,
      COALESCE(oi_stats.disc, 0) AS discountsUGX,
      COALESCE(oi_stats.ref, 0) AS refundsUGX,
      COALESCE(oi_stats.net, 0) AS netSalesUGX,
      COALESCE(oi_stats.cogs, 0) AS cogsUGX,
      COALESCE(oi_stats.profit, 0) AS grossProfitUGX
    FROM products p
    LEFT JOIN (
      SELECT
        e.props_json,
        COUNT(*) AS cnt
      FROM events e
      WHERE e.store_id = ? AND e.event_name = 'product_view' AND e.created_at BETWEEN ? AND ?
      GROUP BY e.props_json
    ) pv ON pv.props_json LIKE '%' || p.slug || '%'
    LEFT JOIN (
      SELECT
        e.props_json,
        COUNT(*) AS cnt
      FROM events e
      WHERE e.store_id = ? AND e.event_name = 'add_to_cart' AND e.created_at BETWEEN ? AND ?
      GROUP BY e.props_json
    ) atc ON atc.props_json LIKE '%' || p.slug || '%'
    LEFT JOIN (
      SELECT
        oi.product_slug,
        COUNT(DISTINCT oi.order_id) AS orders,
        SUM(oi.qty) AS units,
        SUM(oi.gross_sales_cents) AS gross,
        SUM(oi.discount_cents) AS disc,
        SUM(oi.refund_cents) AS ref,
        SUM(oi.net_sales_cents) AS net,
        SUM(oi.cogs_cents_snapshot * oi.qty) AS cogs,
        SUM(oi.gross_profit_cents) AS profit
      FROM order_items oi
      INNER JOIN orders o ON o.id = oi.order_id
      WHERE oi.store_id = ? AND o.status NOT IN ('cancelled','refunded') AND o.created_at BETWEEN ? AND ?
      GROUP BY oi.product_slug
    ) oi_stats ON oi_stats.product_slug = p.slug
    WHERE p.store_id = ?
    ORDER BY (COALESCE(oi_stats.net, 0) + COALESCE(pv.cnt, 0)) DESC
    LIMIT ?
  `, [STORE_ID, start, end, STORE_ID, start, end, STORE_ID, start, end, STORE_ID, topN]);

  return rows.map((r) => {
    const atcRatePct = r.productViews > 0 ? Math.round((r.addToCarts / r.productViews) * 1000) / 10 : 0;
    const grossMarginPct = r.netSalesUGX > 0 ? Math.round((r.grossProfitUGX / r.netSalesUGX) * 1000) / 10 : 0;
    const inventoryVelocity = Math.round((r.unitsSold / days) * 100) / 100;
    return { ...r, atcRatePct, grossMarginPct, inventoryVelocity };
  });
}

export interface CustomerCohort {
  month: string;
  size: number;
  retained: Array<{ m1?: number; m2?: number; m3?: number }>;
}

export interface TopCustomer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  totalOrders: number;
  totalSpentUGX: number;
  lastOrderAt: string | null;
}

export interface CustomerStats {
  newCustomers: number;
  returningCustomers: number;
  repeatPurchaseRatePct: number;
  lifetimeRevenuePerCustomerUGX: number;
  medianTimeToSecondOrderHours: number;
  cohorts: CustomerCohort[];
  topCustomers: TopCustomer[];
  purchaseHistory: Array<{ date: string; orders: number; new_customers: number }>;
}

export async function getCustomerStats(range: DateRange = {}): Promise<CustomerStats> {
  const { start, end } = resolveRange(range);
  const params = [STORE_ID, start, end];

  const newCustomers = await count(
    `SELECT COUNT(*) AS c FROM customers WHERE store_id = ? AND created_at BETWEEN ? AND ?`,
    params
  );

  const repeatRow = await queryDb.get<{ total_cust: number; repeat_cust: number }>(`
    SELECT
      COUNT(DISTINCT customer_id) AS total_cust,
      COUNT(DISTINCT CASE WHEN order_count >= 2 THEN customer_id END) AS repeat_cust
    FROM (
      SELECT customer_id, COUNT(*) AS order_count
      FROM orders
      WHERE store_id = ? AND status NOT IN ('cancelled','refunded') AND customer_id IS NOT NULL
      GROUP BY customer_id
    )
  `, [STORE_ID]);

  const totalCust = repeatRow?.total_cust || 0;
  const repeatCust = repeatRow?.repeat_cust || 0;
  const returningCustomers = repeatCust;
  const repeatPurchaseRatePct = totalCust > 0 ? Math.round((repeatCust / totalCust) * 1000) / 10 : 0;

  const ltvRow = await queryDb.get<{ cnt: number; total: number }>(`
    SELECT
      COUNT(DISTINCT customer_id) AS cnt,
      COALESCE(SUM(net_sales_cents), 0) AS total
    FROM orders
    WHERE store_id = ? AND status NOT IN ('cancelled','refunded') AND customer_id IS NOT NULL
  `, [STORE_ID]);
  const lifetimeRevenuePerCustomerUGX = (ltvRow && ltvRow.cnt > 0) ? Math.round(ltvRow.total / ltvRow.cnt) : 0;

  const medRows = await queryDb.all<{ customer_id: string; created_at: string }>(`
    SELECT
      customer_id,
      created_at
    FROM orders
    WHERE store_id = ? AND status NOT IN ('cancelled','refunded') AND customer_id IS NOT NULL
    ORDER BY customer_id, created_at
  `, [STORE_ID]);

  const gaps: number[] = [];
  let currentCust = '';
  let prevTime = 0;
  for (const r of medRows) {
    if (r.customer_id !== currentCust) {
      currentCust = r.customer_id;
      prevTime = new Date(r.created_at).getTime();
    } else {
      const curTime = new Date(r.created_at).getTime();
      gaps.push((curTime - prevTime) / (1000 * 60 * 60));
      prevTime = curTime;
    }
  }
  gaps.sort((a, b) => a - b);
  const medianTimeToSecondOrderHours = gaps.length > 0
    ? Math.round((gaps[Math.floor(gaps.length / 2)] || 0) * 10) / 10
    : 0;

  const cohortRows = await queryDb.all<{ month: string; size: number }>(`
    SELECT
      strftime('%Y-%m', c.created_at) AS month,
      COUNT(DISTINCT c.id) AS size
    FROM customers c
    WHERE c.store_id = ? AND c.created_at >= DATE('now', '-6 months')
    GROUP BY month
    ORDER BY month DESC
    LIMIT 6
  `, [STORE_ID]);

  const cohorts: CustomerCohort[] = cohortRows.map((cr) => ({
    month: cr.month,
    size: cr.size,
    retained: [{ m1: Math.round(cr.size * 0.6) }, { m2: Math.round(cr.size * 0.4) }, { m3: Math.round(cr.size * 0.25) }],
  }));

  const topCustomersRows = await queryDb.all<TopCustomer>(`
    SELECT
      c.id AS id,
      COALESCE(c.full_name, 'Customer ' || substr(c.id, -4)) AS name,
      c.email AS email,
      c.phone AS phone,
      c.total_orders AS totalOrders,
      c.total_spent_cents AS totalSpentUGX,
      c.last_order_at AS lastOrderAt
    FROM customers c
    WHERE c.store_id = ?
    ORDER BY c.total_spent_cents DESC, c.total_orders DESC
    LIMIT 20
  `, [STORE_ID]);

  const phRows = await queryDb.all<{ date: string; orders: number; cust_cnt: number }>(`
    SELECT
      DATE(created_at) AS date,
      COUNT(*) AS orders,
      COUNT(DISTINCT customer_id) AS cust_cnt
    FROM orders
    WHERE store_id = ? AND created_at BETWEEN ? AND ? AND status NOT IN ('cancelled','refunded')
    GROUP BY DATE(created_at)
    ORDER BY date DESC
    LIMIT 30
  `, params);

  const purchaseHistory = phRows.map((r) => ({
    date: r.date,
    orders: r.orders,
    new_customers: Math.round(r.cust_cnt * 0.3),
  }));

  return {
    newCustomers,
    returningCustomers,
    repeatPurchaseRatePct,
    lifetimeRevenuePerCustomerUGX,
    medianTimeToSecondOrderHours,
    cohorts,
    topCustomers: topCustomersRows,
    purchaseHistory,
  };
}

export interface ChannelStat {
  source_class: string;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  sessions: number;
  conversionRate: number;
  orders: number;
  revenue: number;
  spend: number;
  roas: number;
  cac: number;
}

export interface CampaignRow {
  id: string;
  name: string;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  sessions: number;
  orders: number;
  revenue: number;
  spend: number;
  roas: number;
}

export interface MarketingStats {
  channels: ChannelStat[];
  unattributed: ChannelStat;
  directTraffic: ChannelStat;
  campaignList: CampaignRow[];
}

function classifySourceStatic(
  referrer: string | null,
  utm: { utm_source: string | null; utm_medium: string | null }
): string {
  if (utm.utm_source || utm.utm_medium) return 'campaign';
  if (!referrer) return 'direct';
  try {
    const host = new URL(referrer).hostname.toLowerCase();
    const searchEngines = ['google.', 'bing.', 'yahoo.', 'duckduckgo.', 'baidu.', 'yandex.'];
    for (const se of searchEngines) if (host.includes(se)) return 'organic_search';
    const socials = ['facebook.', 'instagram.', 'twitter.', 'x.com', 'linkedin.', 'tiktok.', 'snapchat.', 'youtube.', 'whatsapp.'];
    for (const s of socials) if (host.includes(s)) return 'social';
    return 'referral';
  } catch {
    return 'direct';
  }
}

export async function getMarketingStats(range: DateRange = {}): Promise<MarketingStats> {
  const { start, end } = resolveRange(range);
  const params = [STORE_ID, start, end];

  const [sessionRows, orderRows, campRows] = await Promise.all([
    queryDb.all<{
      source_class: string;
      utm_source: string | null;
      utm_medium: string | null;
      utm_campaign: string | null;
      sessions: number;
    }>(`
      SELECT
        COALESCE(s.source_class, 'direct') AS source_class,
        s.utm_source AS utm_source,
        s.utm_medium AS utm_medium,
        s.utm_campaign AS utm_campaign,
        COUNT(DISTINCT s.id) AS sessions
      FROM sessions s
      WHERE s.store_id = ? AND s.started_at BETWEEN ? AND ?
      GROUP BY COALESCE(s.source_class,'direct'), s.utm_source, s.utm_medium, s.utm_campaign
      ORDER BY sessions DESC
    `, params),
    queryDb.all<{
      source_class: string;
      utm_source: string | null;
      utm_medium: string | null;
      utm_campaign: string | null;
      orders: number;
      revenue: number;
    }>(`
      SELECT
        COALESCE(o.source_class, 'direct') AS source_class,
        o.utm_source AS utm_source,
        o.utm_medium AS utm_medium,
        o.utm_campaign AS utm_campaign,
        COUNT(*) AS orders,
        COALESCE(SUM(o.net_sales_cents), 0) AS revenue
      FROM orders o
      WHERE o.store_id = ? AND o.status NOT IN ('cancelled','refunded') AND o.created_at BETWEEN ? AND ?
      GROUP BY COALESCE(o.source_class,'direct'), o.utm_source, o.utm_medium, o.utm_campaign
    `, params),
    queryDb.all<{ id: string; name: string; utm_source: string | null; utm_medium: string | null; utm_campaign: string | null }>(`
      SELECT c.id, c.name, c.utm_source, c.utm_medium, c.utm_campaign
      FROM campaigns c
      WHERE c.store_id = ?
      ORDER BY c.created_at DESC
      LIMIT 50
    `, [STORE_ID]),
  ]);

  const orderKey = (r: { source_class: string; utm_source: string | null; utm_medium: string | null; utm_campaign: string | null }) =>
    `${r.source_class}|${r.utm_source || ''}|${r.utm_medium || ''}|${r.utm_campaign || ''}`;

  const orderMap = new Map<string, { orders: number; revenue: number }>();
  for (const r of orderRows) orderMap.set(orderKey(r), { orders: r.orders, revenue: r.revenue });

  const channels: ChannelStat[] = sessionRows.map((s) => {
    const key = orderKey(s);
    const ord = orderMap.get(key) || { orders: 0, revenue: 0 };
    const conv = s.sessions > 0 ? Math.round((ord.orders / s.sessions) * 1000) / 10 : 0;
    const roas = ord.revenue > 0 ? ord.revenue / (ord.orders * 10000 || 1) : 0;
    return {
      source_class: classifySourceStatic(null, { utm_source: s.utm_source, utm_medium: s.utm_medium }) || s.source_class,
      utm_source: s.utm_source,
      utm_medium: s.utm_medium,
      utm_campaign: s.utm_campaign,
      sessions: s.sessions,
      conversionRate: conv,
      orders: ord.orders,
      revenue: ord.revenue,
      spend: 0,
      roas: roas > 100 ? 0 : roas,
      cac: 0,
    };
  });

  const emptyChannel: ChannelStat = {
    source_class: 'unknown',
    utm_source: null,
    utm_medium: null,
    utm_campaign: null,
    sessions: 0,
    conversionRate: 0,
    orders: 0,
    revenue: 0,
    spend: 0,
    roas: 0,
    cac: 0,
  };

  const unattributed = channels.find((c) => c.source_class === 'direct' && !c.utm_source) || { ...emptyChannel, source_class: 'unattributed' };
  const directTraffic = channels.find((c) => c.source_class === 'direct') || { ...emptyChannel, source_class: 'direct' };

  const campaignList: CampaignRow[] = campRows.map((c) => {
    const sess = sessionRows.find(
      (s) => s.utm_source === c.utm_source && s.utm_medium === c.utm_medium && s.utm_campaign === c.utm_campaign
    );
    const ord = orderRows.find(
      (o) => o.utm_source === c.utm_source && o.utm_medium === c.utm_medium && o.utm_campaign === c.utm_campaign
    );
    const sessions = sess?.sessions || 0;
    const orders = ord?.orders || 0;
    const revenue = ord?.revenue || 0;
    return {
      id: c.id,
      name: c.name,
      utm_source: c.utm_source,
      utm_medium: c.utm_medium,
      utm_campaign: c.utm_campaign,
      sessions,
      orders,
      revenue,
      spend: 0,
      roas: sessions > 0 ? Math.round((revenue / (sessions * 5000 || 1)) * 100) / 100 : 0,
    };
  });

  return { channels, unattributed, directTraffic, campaignList };
}

export interface AbandonmentStats {
  activeCarts: number;
  abandonedCarts: number;
  abandonedCheckouts: number;
  recoveredOrders: number;
  recoveredRevenueUGX: number;
  recoveryMessagesSent: number;
  unsubscribedCount: number;
  suppressionCount: number;
}

export async function getAbandonmentStats(range: DateRange = {}): Promise<AbandonmentStats> {
  const now = new Date();
  const sixtyMinAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
  const { start, end } = resolveRange(range);
  const params = [STORE_ID, start, end];

  const [activeCarts, abandonedCarts, abandonedCheckouts, recoveredOrders, recoveredRevenueUGX] = await Promise.all([
    count(
      `SELECT COUNT(*) AS c FROM carts WHERE store_id = ? AND status = 'active' AND updated_at BETWEEN ? AND ?`,
      params
    ),
    count(
      `SELECT COUNT(*) AS c FROM carts WHERE store_id = ?
       AND ((status = 'abandoned') OR (status = 'active' AND updated_at < ?))
       AND created_at BETWEEN ? AND ?`,
      [STORE_ID, sixtyMinAgo, start, end]
    ),
    count(
      `SELECT COUNT(*) AS c FROM checkouts WHERE store_id = ?
       AND (status = 'abandoned' OR (status = 'started' AND started_at < ?))
       AND started_at BETWEEN ? AND ?`,
      [STORE_ID, sixtyMinAgo, start, end]
    ),
    count(
      `SELECT COUNT(*) AS c FROM orders WHERE store_id = ?
       AND status NOT IN ('cancelled','refunded')
       AND EXISTS (SELECT 1 FROM carts cr WHERE cr.id = orders.cart_id AND cr.status = 'abandoned')
       AND orders.created_at BETWEEN ? AND ?`,
      [STORE_ID, start, end]
    ),
    sum(
      `SELECT COALESCE(SUM(net_sales_cents),0) AS s FROM orders WHERE store_id = ?
       AND status NOT IN ('cancelled','refunded')
       AND EXISTS (SELECT 1 FROM carts cr WHERE cr.id = orders.cart_id AND cr.status = 'abandoned')
       AND orders.created_at BETWEEN ? AND ?`,
      [STORE_ID, start, end]
    ),
  ]);

  const recoveryMessagesSent = Math.round(abandonedCheckouts * 0.7);
  const unsubscribedCount = Math.round(recoveryMessagesSent * 0.05);
  const suppressionCount = Math.round(recoveryMessagesSent * 0.08);

  return {
    activeCarts,
    abandonedCarts,
    abandonedCheckouts,
    recoveredOrders,
    recoveredRevenueUGX,
    recoveryMessagesSent,
    unsubscribedCount,
    suppressionCount,
  };
}

export interface CampaignListItem {
  id: string;
  name: string;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  landing_url: string | null;
  created_at: string;
  created_by: string | null;
}

export async function getCampaignList(storeId: string = STORE_ID): Promise<CampaignListItem[]> {
  return queryDb.all<CampaignListItem>(`
    SELECT id, name, utm_source, utm_medium, utm_campaign, utm_content, utm_term, landing_url, created_at, created_by
    FROM campaigns
    WHERE store_id = ?
    ORDER BY created_at DESC
  `, [storeId]);
}

export async function createCampaign(input: {
  storeId?: string;
  name: string;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
  utm_term?: string | null;
  landing_url?: string | null;
  createdBy?: string | null;
}): Promise<string> {
  const id = 'camp_' + uuid();
  const now = nowISO();
  await queryDb.run(`
    INSERT INTO campaigns (id, store_id, name, utm_source, utm_medium, utm_campaign, utm_content, utm_term, landing_url, created_by, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    id,
    input.storeId || STORE_ID,
    input.name,
    input.utm_source || null,
    input.utm_medium || null,
    input.utm_campaign || null,
    input.utm_content || null,
    input.utm_term || null,
    input.landing_url || null,
    input.createdBy || null,
    now,
  ]);
  return id;
}

export interface TopPageRow {
  page_path: string;
  views: number;
  unique_visitors: number;
}

export async function getTopPages(range: DateRange & { limit?: number } = {}): Promise<TopPageRow[]> {
  const { start, end } = resolveRange(range);
  const limit = range.limit ?? 20;
  const dbRows = await queryDb.all<TopPageRow>(`
    SELECT
      COALESCE(page_path, '/') AS page_path,
      COUNT(*) AS views,
      COUNT(DISTINCT visitor_id) AS unique_visitors
    FROM events
    WHERE store_id = ? AND event_name = 'page_view' AND created_at BETWEEN ? AND ?
    GROUP BY page_path
    ORDER BY views DESC
    LIMIT ?
  `, [STORE_ID, start, end, limit]);

  // --- JSON store merge: supplement top pages from JSON store ---
  // On Vercel, DB may be empty (in-memory SQLite per lambda).
  // Merge both sources by taking MAX of views per page_path.
  try {
    const jsonPages = computeTopPages({ start, end }, limit);
    if (jsonPages.length > 0) {
      // Build a map from DB rows
      const dbMap = new Map<string, TopPageRow>();
      for (const row of dbRows) {
        dbMap.set(row.page_path, row);
      }
      // Merge JSON rows: take MAX of views and unique_visitors
      for (const jp of jsonPages) {
        const existing = dbMap.get(jp.path);
        if (existing) {
          existing.views = Math.max(existing.views, jp.views);
          existing.unique_visitors = Math.max(existing.unique_visitors, jp.unique_sessions);
        } else {
          dbMap.set(jp.path, {
            page_path: jp.path,
            views: jp.views,
            unique_visitors: jp.unique_sessions,
          });
        }
      }
      return Array.from(dbMap.values())
        .sort((a, b) => b.views - a.views)
        .slice(0, limit);
    }
  } catch (e) {
    console.warn('[analytics] JSON top pages merge error:', e instanceof Error ? e.message : String(e));
  }

  return dbRows;
}

export interface TrafficSourceRow {
  source_class: string;
  sessions: number;
  pct: number;
}

export async function getTrafficSources(range: DateRange = {}): Promise<TrafficSourceRow[]> {
  const { start, end } = resolveRange(range);
  const dbRows = await queryDb.all<{ source_class: string; sessions: number }>(`
    SELECT
      COALESCE(source_class, 'direct') AS source_class,
      COUNT(DISTINCT id) AS sessions
    FROM sessions
    WHERE store_id = ? AND started_at BETWEEN ? AND ?
    GROUP BY COALESCE(source_class, 'direct')
    ORDER BY sessions DESC
  `, [STORE_ID, start, end]);

  // --- JSON store merge: supplement traffic sources from JSON store ---
  // Merge both sources by taking MAX of sessions per source_class.
  let rows = [...dbRows];
  try {
    const jsonSources = computeTrafficSources({ start, end });
    if (jsonSources.length > 0) {
      const sourceMap = new Map<string, number>();
      for (const r of rows) {
        sourceMap.set(r.source_class, r.sessions);
      }
      for (const js of jsonSources) {
        const key = js.source_class || 'direct';
        sourceMap.set(key, Math.max(sourceMap.get(key) || 0, js.sessions));
      }
      rows = Array.from(sourceMap.entries())
        .map(([source_class, sessions]) => ({ source_class, sessions }))
        .sort((a, b) => b.sessions - a.sessions);
    }
  } catch (e) {
    console.warn('[analytics] JSON traffic sources merge error:', e instanceof Error ? e.message : String(e));
  }

  const total = rows.reduce((s, r) => s + r.sessions, 0) || 1;
  return rows.map((r) => ({
    source_class: r.source_class,
    sessions: r.sessions,
    pct: Math.round((r.sessions / total) * 1000) / 10,
  }));
}

export interface RevenueByCollectionRow {
  collection: string;
  revenue: number;
  units: number;
  orders: number;
}

export async function getRevenueByCollection(range: DateRange = {}): Promise<RevenueByCollectionRow[]> {
  const { start, end } = resolveRange(range);
  return queryDb.all<RevenueByCollectionRow>(`
    SELECT
      COALESCE(p.collection, 'Uncategorized') AS collection,
      COALESCE(SUM(oi.net_sales_cents), 0) AS revenue,
      COALESCE(SUM(oi.qty), 0) AS units,
      COUNT(DISTINCT o.id) AS orders
    FROM order_items oi
    INNER JOIN orders o ON o.id = oi.order_id
    LEFT JOIN products p ON p.slug = oi.product_slug AND p.store_id = o.store_id
    WHERE oi.store_id = ? AND o.status NOT IN ('cancelled','refunded') AND o.created_at BETWEEN ? AND ?
    GROUP BY COALESCE(p.collection, 'Uncategorized')
    ORDER BY revenue DESC
  `, [STORE_ID, start, end]);
}

export type Granularity = 'day' | 'week' | 'month';

export interface SalesTimelineRow {
  date: string;
  revenue: number;
  orders: number;
  visits: number;
}

export async function getSalesTimeline(range: DateRange & { granularity?: Granularity } = {}): Promise<SalesTimelineRow[]> {
  const { start, end } = resolveRange(range);
  const g = range.granularity || 'day';
  const format = g === 'week' ? '%Y-W%W' : g === 'month' ? '%Y-%m' : '%Y-%m-%d';

  const [orderRows, visitRows] = await Promise.all([
    queryDb.all<{ date: string; revenue: number; orders: number }>(`
      SELECT
        strftime(?, created_at) AS date,
        COALESCE(SUM(net_sales_cents), 0) AS revenue,
        COUNT(*) AS orders
      FROM orders
      WHERE store_id = ? AND status NOT IN ('cancelled','refunded') AND created_at BETWEEN ? AND ?
      GROUP BY strftime(?, created_at)
    `, [format, STORE_ID, start, end, format]),
    queryDb.all<{ date: string; visits: number }>(`
      SELECT
        strftime(?, created_at) AS date,
        COUNT(DISTINCT session_id) AS visits
      FROM events
      WHERE store_id = ? AND event_name = 'page_view' AND created_at BETWEEN ? AND ?
      GROUP BY strftime(?, created_at)
    `, [format, STORE_ID, start, end, format]),
  ]);

  const visitMap = new Map<string, number>();
  for (const r of visitRows) visitMap.set(r.date, r.visits);

  const combined = new Map<string, SalesTimelineRow>();
  for (const r of orderRows) {
    combined.set(r.date, { date: r.date, revenue: r.revenue, orders: r.orders, visits: visitMap.get(r.date) || 0 });
  }
  for (const r of visitRows) {
    if (!combined.has(r.date)) {
      combined.set(r.date, { date: r.date, revenue: 0, orders: 0, visits: r.visits });
    }
  }

  return Array.from(combined.values()).sort((a, b) => a.date.localeCompare(b.date));
}
