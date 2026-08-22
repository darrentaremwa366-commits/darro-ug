import { NextRequest, NextResponse } from 'next/server';
import { queryDb, STORE_ID, nowISO, uuid } from '@/lib/db';
import { appendEvent, upsertVisitor, upsertSession } from '@/lib/json-event-store';

const ALLOWED_EVENTS = new Set([
  'page_view',
  'product_view',
  'search',
  'add_to_cart',
  'remove_from_cart',
  'begin_checkout',
  'checkout_contact_submitted',
  'purchase',
  'refund',
  'cancel',
  'login',
  'signup',
  'lead_submit',
]);

const MAX_PAYLOAD_BYTES = 32 * 1024;
const MAX_PROPS_JSON_BYTES = 8 * 1024;

const VISITOR_COOKIE = 'darro_visitor';
const SESSION_COOKIE = 'darro_session';
const VISITOR_COOKIE_MAX_AGE = 365 * 24 * 60 * 60;
const SESSION_COOKIE_MAX_AGE = 30 * 60;

const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 50;
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function getClientIp(req: NextRequest): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0]?.trim() || 'unknown';
  return req.headers.get('x-real-ip') || 'unknown';
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  entry.count += 1;
  return entry.count <= RATE_LIMIT_MAX_REQUESTS;
}

function getAllowedOrigin(req: NextRequest): string | null {
  const origin = req.headers.get('origin');
  if (!origin) return null;
  const host = req.headers.get('host');
  if (!host) return null;
  try {
    const originUrl = new URL(origin);
    if (originUrl.host === host) return origin;
  } catch {
    return null;
  }
  return null;
}

function parseUtmParams(
  searchOrProps: URLSearchParams | Record<string, unknown> | undefined
): {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
} {
  const out = {
    utm_source: null as string | null,
    utm_medium: null as string | null,
    utm_campaign: null as string | null,
    utm_content: null as string | null,
    utm_term: null as string | null,
  };

  if (!searchOrProps) return out;

  if (searchOrProps instanceof URLSearchParams) {
    out.utm_source = searchOrProps.get('utm_source');
    out.utm_medium = searchOrProps.get('utm_medium');
    out.utm_campaign = searchOrProps.get('utm_campaign');
    out.utm_content = searchOrProps.get('utm_content');
    out.utm_term = searchOrProps.get('utm_term');
  } else if (typeof searchOrProps === 'object') {
    const p = searchOrProps as Record<string, unknown>;
    out.utm_source = typeof p.utm_source === 'string' ? p.utm_source : null;
    out.utm_medium = typeof p.utm_medium === 'string' ? p.utm_medium : null;
    out.utm_campaign = typeof p.utm_campaign === 'string' ? p.utm_campaign : null;
    out.utm_content = typeof p.utm_content === 'string' ? p.utm_content : null;
    out.utm_term = typeof p.utm_term === 'string' ? p.utm_term : null;
  }
  return out;
}

function classifySource(
  referrer: string | null,
  utm: { utm_source: string | null; utm_medium: string | null }
): string {
  if (utm.utm_source || utm.utm_medium) return 'campaign';
  if (!referrer) return 'direct';
  try {
    const host = new URL(referrer).hostname.toLowerCase();
    const searchEngines = ['google.', 'bing.', 'yahoo.', 'duckduckgo.', 'baidu.', 'yandex.'];
    for (const se of searchEngines) {
      if (host.includes(se)) return 'organic_search';
    }
    const socials = ['facebook.com', 'instagram.com', 'twitter.com', 'x.com', 'linkedin.com', 'tiktok.com', 'youtube.com'];
    for (const s of socials) {
      if (host.includes(s)) return 'social';
    }
    return 'referral';
  } catch {
    return 'direct';
  }
}

function sanitizeProps(props: unknown): string | null {
  try {
    if (props === null || props === undefined) return null;
    const str = JSON.stringify(props);
    if (str.length > MAX_PROPS_JSON_BYTES) {
      return str.slice(0, MAX_PROPS_JSON_BYTES);
    }
    return str;
  } catch {
    return null;
  }
}

interface EventRequestBody {
  event_id?: string;
  event_name: string;
  visitor_id?: string;
  session_id?: string;
  page_path?: string;
  referrer?: string;
  consent_state?: string;
  props?: Record<string, unknown>;
  schema_version?: number;
}

interface CartItemLike {
  product_id?: string;
  product_slug?: string;
  product_name?: string;
  variant_name?: string;
  qty?: number;
  unit_price_cents?: number;
  member_price_cents?: number;
  cogs_cents?: number;
}

export async function POST(req: NextRequest) {
  try {
    const origin = getAllowedOrigin(req);
    const hasOriginHeader = req.headers.get('origin') !== null;
    if (hasOriginHeader && !origin) {
      return NextResponse.json({ ok: false, error: 'Invalid origin' }, { status: 403 });
    }

    const ip = getClientIp(req);
    if (!checkRateLimit(ip)) {
      return NextResponse.json({ ok: false, error: 'Too many requests' }, { status: 429 });
    }

    const contentLength = req.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > MAX_PAYLOAD_BYTES) {
      return NextResponse.json({ ok: false, error: 'Payload too large' }, { status: 413 });
    }

    const rawBody = await req.text();
    if (rawBody.length > MAX_PAYLOAD_BYTES) {
      return NextResponse.json({ ok: false, error: 'Payload too large' }, { status: 413 });
    }

    let body: EventRequestBody;
    try {
      body = JSON.parse(rawBody) as EventRequestBody;
    } catch {
      return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
    }

    const eventName = body.event_name?.toString().trim();
    if (!eventName || !ALLOWED_EVENTS.has(eventName)) {
      return NextResponse.json({ ok: false, error: 'Invalid event name' }, { status: 400 });
    }

    const reqCookies = req.cookies;
    let visitorId = body.visitor_id || reqCookies.get(VISITOR_COOKIE)?.value;
    let sessionId = body.session_id || reqCookies.get(SESSION_COOKIE)?.value;

    if (!visitorId) visitorId = uuid();
    if (!sessionId) sessionId = uuid();

    const consentState =
      body.consent_state === 'granted' || body.consent_state === 'denied' || body.consent_state === 'pending'
        ? body.consent_state
        : 'pending';

    const pagePath = typeof body.page_path === 'string' ? body.page_path : null;
    const referrer = typeof body.referrer === 'string' ? body.referrer : null;
    const schemaVersion = typeof body.schema_version === 'number' ? Math.floor(body.schema_version) : 1;
    const propsJson = sanitizeProps(body.props);
    const now = nowISO();
    const eventId = (body.event_id && typeof body.event_id === 'string') ? body.event_id : uuid();

    const existingEvent = await queryDb.get<{ id: string }>(
      'SELECT id FROM events WHERE id = ? AND store_id = ?',
      [eventId, STORE_ID]
    );

    if (existingEvent) {
      // Still update visitor/session in JSON store for tracking continuity
      try {
        upsertVisitor({
          id: visitorId,
          store_id: STORE_ID,
          consent_state: consentState,
          first_seen_at: now,
          last_seen_at: now,
        });
        upsertSession({
          id: sessionId,
          store_id: STORE_ID,
          visitor_id: visitorId,
          started_at: now,
        });
      } catch { /* non-critical */ }
      const response = NextResponse.json({ ok: true, visitor_id: visitorId, session_id: sessionId });
      setCookies(response, visitorId, sessionId);
      setCorsHeaders(response, origin);
      return response;
    }

    let pageUtm = {
      utm_source: null as string | null,
      utm_medium: null as string | null,
      utm_campaign: null as string | null,
      utm_content: null as string | null,
      utm_term: null as string | null,
    };
    if (pagePath && pagePath.includes('?')) {
      try {
        const qs = pagePath.split('?')[1] || '';
        const sp = new URLSearchParams(qs);
        pageUtm = parseUtmParams(sp);
      } catch {
        // ignore
      }
    }

    const propsUtm = parseUtmParams(body.props?.utm as Record<string, unknown> | undefined);
    const mergedUtm = {
      utm_source: propsUtm.utm_source || pageUtm.utm_source,
      utm_medium: propsUtm.utm_medium || pageUtm.utm_medium,
      utm_campaign: propsUtm.utm_campaign || pageUtm.utm_campaign,
      utm_content: propsUtm.utm_content || pageUtm.utm_content,
      utm_term: propsUtm.utm_term || pageUtm.utm_term,
    };
    const sourceClass = classifySource(referrer, mergedUtm);

    const existingVisitor = await queryDb.get<{ id: string; consent_state: string; first_seen_at: string }>(
      'SELECT id, consent_state, first_seen_at FROM visitors WHERE id = ? AND store_id = ?',
      [visitorId, STORE_ID]
    );

    if (!existingVisitor) {
      await queryDb.run(
        `INSERT INTO visitors (id, store_id, consent_state, first_seen_at, last_seen_at)
         VALUES (?, ?, ?, ?, ?)`,
        [visitorId, STORE_ID, consentState, now, now]
      );
    } else {
      const updateConsent = consentState === 'granted' ? consentState : existingVisitor.consent_state;
      await queryDb.run(
        `UPDATE visitors SET consent_state = ?, last_seen_at = ? WHERE id = ? AND store_id = ?`,
        [updateConsent, now, visitorId, STORE_ID]
      );
    }

    const existingSession = await queryDb.get<{ id: string; started_at: string }>(
      'SELECT id, started_at FROM sessions WHERE id = ? AND store_id = ?',
      [sessionId, STORE_ID]
    );

    if (!existingSession) {
      await queryDb.run(
        `INSERT INTO sessions (id, store_id, visitor_id, landing_path, referrer,
                               utm_source, utm_medium, utm_campaign, utm_content, utm_term,
                               source_class, started_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          sessionId,
          STORE_ID,
          visitorId,
          pagePath,
          referrer,
          mergedUtm.utm_source,
          mergedUtm.utm_medium,
          mergedUtm.utm_campaign,
          mergedUtm.utm_content,
          mergedUtm.utm_term,
          sourceClass,
          now,
        ]
      );
    }

    let customerId: string | null = null;
    const props = body.props || {};
    if (eventName === 'purchase' || eventName === 'checkout_contact_submitted' || eventName === 'signup' || eventName === 'login') {
      const customerEmail = (props.customer_email as string) || (props.email as string) || null;
      const customerPhone = (props.customer_phone as string) || (props.phone as string) || null;
      const customerName = (props.customer_name as string) || (props.full_name as string) || null;

      if (customerEmail || customerPhone) {
        const existingCustomer = await queryDb.get<{ id: string }>(
          `SELECT id FROM customers WHERE store_id = ? AND (
             (? IS NOT NULL AND LOWER(email) = LOWER(?)) OR
             (? IS NOT NULL AND phone = ?)
           ) LIMIT 1`,
          [
            STORE_ID,
            customerEmail,
            customerEmail || '',
            customerPhone,
            customerPhone || '',
          ]
        );

        if (existingCustomer) {
          customerId = existingCustomer.id;
          await queryDb.run(
            `UPDATE customers SET email = COALESCE(?, email),
                                   phone = COALESCE(?, phone),
                                   full_name = COALESCE(?, full_name),
                                   updated_at = ?
             WHERE id = ? AND store_id = ?`,
            [customerEmail, customerPhone, customerName, now, customerId, STORE_ID]
          );
        } else {
          customerId = uuid();
          await queryDb.run(
            `INSERT INTO customers (id, store_id, email, phone, full_name, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [customerId, STORE_ID, customerEmail, customerPhone, customerName, now, now]
          );
        }

        const linkExists = await queryDb.get<{ id: string }>(
          'SELECT id FROM identity_links WHERE store_id = ? AND visitor_id = ? AND customer_id = ?',
          [STORE_ID, visitorId, customerId]
        );

        if (!linkExists) {
          await queryDb.run(
            `INSERT INTO identity_links (id, store_id, visitor_id, customer_id, linked_via, created_at)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
              uuid(),
              STORE_ID,
              visitorId,
              customerId,
              eventName === 'login' ? 'login' : eventName === 'signup' ? 'signup' : 'checkout_email',
              now,
            ]
          );
        }

        if (existingSession) {
          await queryDb.run(
            `UPDATE sessions SET customer_id = ? WHERE id = ? AND store_id = ?`,
            [customerId, sessionId, STORE_ID]
          );
        }
      }
    }

    await queryDb.run(
      `INSERT INTO events (id, store_id, visitor_id, session_id, customer_id, event_name, created_at,
                           page_path, referrer, consent_state, schema_version, props_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        eventId,
        STORE_ID,
        visitorId,
        sessionId,
        customerId,
        eventName,
        now,
        pagePath,
        referrer,
        consentState,
        schemaVersion,
        propsJson,
      ]
    );

    // --- JSON store fallback (Vercel-safe persistence in /tmp) ---
    // When better-sqlite3 native bindings fail on Vercel, the DB falls back
    // to in-memory SQLite (isolated per lambda). The JSON file in /tmp
    // persists across requests within the same warm container, giving us
    // reliable visitor/session tracking. This runs alongside the DB write
    // so both backends stay in sync.
    try {
      // Upsert visitor in JSON store
      upsertVisitor({
        id: visitorId,
        store_id: STORE_ID,
        consent_state: consentState,
        first_seen_at: now,
        last_seen_at: now,
      });

      // Upsert session in JSON store
      upsertSession({
        id: sessionId,
        store_id: STORE_ID,
        visitor_id: visitorId,
        customer_id: customerId,
        landing_path: pagePath,
        referrer: referrer,
        utm_source: mergedUtm.utm_source,
        utm_medium: mergedUtm.utm_medium,
        utm_campaign: mergedUtm.utm_campaign,
        source_class: sourceClass,
        started_at: now,
      });

      // Append event in JSON store
      appendEvent({
        id: eventId,
        store_id: STORE_ID,
        visitor_id: visitorId,
        session_id: sessionId,
        customer_id: customerId,
        event_name: eventName,
        created_at: now,
        page_path: pagePath,
        referrer: referrer,
        consent_state: consentState,
        schema_version: schemaVersion,
        props_json: propsJson,
      });
    } catch (jsonErr) {
      console.warn('[analytics] JSON store write failed (non-critical):',
        jsonErr instanceof Error ? jsonErr.message : String(jsonErr));
    }

    if (eventName === 'add_to_cart' && body.props) {
      await handleAddToCart(visitorId, sessionId, customerId, body.props.cart, body.props.item, now);
    }

    if (eventName === 'begin_checkout' && body.props) {
      await handleBeginCheckout(visitorId, sessionId, customerId, body.props.cart_id, now);
    }

    if (eventName === 'purchase' && body.props) {
      await handlePurchase(visitorId, sessionId, customerId, body.props, now);
    }

    const response = NextResponse.json({ ok: true, visitor_id: visitorId, session_id: sessionId });
    setCookies(response, visitorId, sessionId);
    setCorsHeaders(response, origin);
    return response;
  } catch {
    return NextResponse.json({ ok: false, error: 'Server error' }, { status: 500 });
  }
}

function setCookies(response: NextResponse, visitorId: string, sessionId: string) {
  response.cookies.set(VISITOR_COOKIE, visitorId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: VISITOR_COOKIE_MAX_AGE,
  });
  response.cookies.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_COOKIE_MAX_AGE,
  });
}

function setCorsHeaders(response: NextResponse, origin: string | null) {
  if (origin) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Vary', 'Origin');
  }
}

export async function OPTIONS(req: NextRequest) {
  const origin = getAllowedOrigin(req);
  const response = NextResponse.json({}, { status: 204 });
  setCorsHeaders(response, origin);
  if (origin) {
    response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  }
  return response;
}

async function handleAddToCart(
  visitorId: string,
  sessionId: string,
  customerId: string | null,
  cartArg: unknown,
  itemArg: unknown,
  now: string
) {
  try {
    let cartId = (cartArg as { id?: string })?.id;
    if (!cartId) cartId = uuid();

    const items: CartItemLike[] = [];
    if (Array.isArray((cartArg as { items?: CartItemLike[] })?.items)) {
      items.push(...((cartArg as { items: CartItemLike[] }).items));
    } else if (itemArg && typeof itemArg === 'object') {
      items.push(itemArg as CartItemLike);
    }
    if (items.length === 0) return;

    let totalRegular = 0;
    let totalMember = 0;
    for (const it of items) {
      const qty = typeof it.qty === 'number' ? Math.max(1, Math.floor(it.qty)) : 1;
      const unit = typeof it.unit_price_cents === 'number' ? Math.max(0, it.unit_price_cents) : 0;
      totalRegular += qty * unit;
      if (typeof it.member_price_cents === 'number') {
        totalMember += qty * it.member_price_cents;
      } else {
        totalMember += qty * unit;
      }
    }

    const existingCart = await queryDb.get<{ id: string }>(
      'SELECT id FROM carts WHERE id = ? AND store_id = ?',
      [cartId, STORE_ID]
    );

    if (!existingCart) {
      await queryDb.run(
        `INSERT INTO carts (id, store_id, visitor_id, customer_id, session_id, status,
                            total_regular_cents, total_member_cents, discount_cents, currency,
                            created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, 'active', ?, ?, 0, 'UGX', ?, ?)`,
        [
          cartId,
          STORE_ID,
          visitorId,
          customerId,
          sessionId,
          totalRegular,
          totalMember,
          now,
          now,
        ]
      );
    } else {
      await queryDb.run(
        `UPDATE carts SET visitor_id = COALESCE(?, visitor_id),
                          customer_id = COALESCE(?, customer_id),
                          session_id = COALESCE(?, session_id),
                          status = 'active',
                          total_regular_cents = ?,
                          total_member_cents = ?,
                          updated_at = ?
         WHERE id = ? AND store_id = ?`,
        [visitorId, customerId, sessionId, totalRegular, totalMember, now, cartId, STORE_ID]
      );
    }

    await queryDb.run(
      `DELETE FROM cart_items WHERE cart_id = ? AND store_id = ?`,
      [cartId, STORE_ID]
    );

    const statements: Array<{ sql: string; params?: unknown[] }> = [];
    for (const it of items) {
      const productId = it.product_id || (it.product_slug ? `prod_${it.product_slug}` : uuid());
      const qty = typeof it.qty === 'number' ? Math.max(1, Math.floor(it.qty)) : 1;
      statements.push({
        sql: `INSERT INTO cart_items (id, store_id, cart_id, product_id, product_slug, product_name,
                                       variant_name, qty, unit_price_cents, member_price_cents, cogs_cents, added_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        params: [
          uuid(),
          STORE_ID,
          cartId,
          productId,
          it.product_slug || 'unknown',
          it.product_name || 'Unknown Product',
          it.variant_name || null,
          qty,
          typeof it.unit_price_cents === 'number' ? it.unit_price_cents : 0,
          typeof it.member_price_cents === 'number' ? it.member_price_cents : null,
          typeof it.cogs_cents === 'number' ? it.cogs_cents : Math.floor((it.unit_price_cents || 0) * 0.45),
          now,
        ],
      });
    }
    if (statements.length) {
      await queryDb.batch(statements);
    }
  } catch {
    // swallow - never fail the event for cart side effects
  }
}

async function handleBeginCheckout(
  visitorId: string,
  sessionId: string,
  customerId: string | null,
  cartIdArg: unknown,
  now: string
) {
  try {
    const cartId = typeof cartIdArg === 'string' ? cartIdArg : uuid();
    const checkoutId = uuid();

    await queryDb.run(
      `INSERT INTO checkouts (id, store_id, cart_id, visitor_id, customer_id, session_id, status, started_at)
       VALUES (?, ?, ?, ?, ?, ?, 'started', ?)`,
      [checkoutId, STORE_ID, cartId, visitorId, customerId, sessionId, now]
    );
  } catch {
    // swallow
  }
}

async function handlePurchase(
  visitorId: string,
  sessionId: string,
  customerId: string | null,
  props: Record<string, unknown>,
  now: string
) {
  try {
    const orderId = uuid();
    const orderNumber =
      typeof props.order_number === 'string'
        ? props.order_number
        : `DRR-${String(Date.now()).slice(-6)}`;

    const items: CartItemLike[] = Array.isArray((props.cart as { items?: CartItemLike[] })?.items)
      ? ((props.cart as { items: CartItemLike[] }).items)
      : [];

    const shippingCents = typeof props.shipping_cents === 'number' ? props.shipping_cents : 0;
    const taxCents = typeof props.tax_cents === 'number' ? props.tax_cents : 0;
    const discountCents = typeof props.discount_cents === 'number' ? props.discount_cents : 0;

    let grossSales = 0;
    let totalCogs = 0;
    const orderItemRows: Array<{
      id: string;
      product_id: string;
      product_slug: string;
      product_name: string;
      variant_name: string | null;
      qty: number;
      unit_price_cents: number;
      member_price_cents: number | null;
      line_discount: number;
      line_gross: number;
      line_net: number;
      line_cogs: number;
      line_profit: number;
    }> = [];

    for (const it of items) {
      const qty = typeof it.qty === 'number' ? Math.max(1, Math.floor(it.qty)) : 1;
      const unit = typeof it.unit_price_cents === 'number' ? Math.max(0, it.unit_price_cents) : 0;
      const member = typeof it.member_price_cents === 'number' ? it.member_price_cents : null;
      const cogs =
        typeof it.cogs_cents === 'number'
          ? it.cogs_cents
          : Math.floor(unit * 0.45);
      const lineGross = qty * unit;
      const effectiveUnit = member ?? unit;
      const lineNet = qty * effectiveUnit;
      const lineDiscount = Math.max(0, lineGross - lineNet);
      const lineCogsTotal = qty * cogs;
      const lineProfit = lineNet - lineCogsTotal;

      grossSales += lineGross;
      totalCogs += lineCogsTotal;

      orderItemRows.push({
        id: uuid(),
        product_id: it.product_id || (it.product_slug ? `prod_${it.product_slug}` : uuid()),
        product_slug: it.product_slug || 'unknown',
        product_name: it.product_name || 'Unknown Product',
        variant_name: it.variant_name || null,
        qty,
        unit_price_cents: unit,
        member_price_cents: member,
        line_discount: lineDiscount,
        line_gross: lineGross,
        line_net: lineNet,
        line_cogs: lineCogsTotal,
        line_profit: lineProfit,
      });
    }

    const netSales = Math.max(0, grossSales - discountCents);
    const grossProfit = Math.max(0, netSales - totalCogs);

    const customerEmail = (props.customer_email as string) || (props.email as string) || null;
    const customerPhone = (props.customer_phone as string) || (props.phone as string) || null;
    const customerName = (props.customer_name as string) || (props.full_name as string) || null;
    const shippingAddressJson = props.shipping_address ? JSON.stringify(props.shipping_address) : null;
    const paymentMethod = typeof props.payment_method === 'string' ? props.payment_method : null;
    const paymentFee = typeof props.payment_fee_cents === 'number' ? props.payment_fee_cents : 0;

    const cartIdArg = (props.cart as { id?: string })?.id;
    const cartId = typeof cartIdArg === 'string' ? cartIdArg : null;
    const checkoutIdArg = props.checkout_id;
    const checkoutId = typeof checkoutIdArg === 'string' ? checkoutIdArg : null;

    const mergedUtm = parseUtmParams(props.utm as Record<string, unknown> | undefined);
    const sourceClass = typeof props.source_class === 'string' ? props.source_class : null;

    await queryDb.run(
      `INSERT INTO orders (id, store_id, checkout_id, cart_id, visitor_id, customer_id, session_id,
                           order_number, status, customer_email, customer_phone, customer_name,
                           shipping_address_json, gross_sales_cents, discount_cents, refund_cents,
                           shipping_cents, tax_cents, net_sales_cents, total_cogs_cents,
                           gross_profit_cents, payment_method, payment_fee_cents, currency,
                           source_class, utm_source, utm_medium, utm_campaign,
                           created_at, updated_at, completed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?,
               ?, 'new', ?, ?, ?,
               ?, ?, ?, 0,
               ?, ?, ?, ?,
               ?, ?, ?, ?,
               ?, ?, ?, ?,
               ?, ?, ?)`,
      [
        orderId,
        STORE_ID,
        checkoutId,
        cartId,
        visitorId,
        customerId,
        sessionId,
        orderNumber,
        customerEmail,
        customerPhone,
        customerName,
        shippingAddressJson,
        grossSales,
        discountCents,
        shippingCents,
        taxCents,
        netSales,
        totalCogs,
        grossProfit,
        paymentMethod,
        paymentFee,
        'UGX',
        sourceClass,
        mergedUtm.utm_source,
        mergedUtm.utm_medium,
        mergedUtm.utm_campaign,
        now,
        now,
        now,
      ]
    );

    const itemStatements: Array<{ sql: string; params?: unknown[] }> = [];
    for (const row of orderItemRows) {
      itemStatements.push({
        sql: `INSERT INTO order_items (id, store_id, order_id, product_id, product_slug, product_name,
                                       variant_name, qty, unit_price_cents, member_price_cents,
                                       discount_cents, gross_sales_cents, net_sales_cents, refund_cents,
                                       cogs_cents_snapshot, gross_profit_cents)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
        params: [
          row.id,
          STORE_ID,
          orderId,
          row.product_id,
          row.product_slug,
          row.product_name,
          row.variant_name,
          row.qty,
          row.unit_price_cents,
          row.member_price_cents,
          row.line_discount,
          row.line_gross,
          row.line_net,
          row.line_cogs,
          row.line_profit,
        ],
      });
    }
    if (itemStatements.length) {
      await queryDb.batch(itemStatements);
    }

    if (cartId) {
      await queryDb.run(
        `UPDATE carts SET status = 'converted', updated_at = ? WHERE id = ? AND store_id = ?`,
        [now, cartId, STORE_ID]
      );
    }

    if (customerId) {
      const custStats = await queryDb.get<{ spent: number; cnt: number }>(
        `SELECT COALESCE(SUM(net_sales_cents),0) AS spent, COUNT(*) AS cnt
         FROM orders WHERE store_id = ? AND customer_id = ?`,
        [STORE_ID, customerId]
      );
      const spent = custStats?.spent ?? netSales;
      const cnt = custStats?.cnt ?? 1;
      await queryDb.run(
        `UPDATE customers SET total_orders = ?, total_spent_cents = ?, last_order_at = ?,
                              first_order_at = COALESCE(first_order_at, ?), updated_at = ?
         WHERE id = ? AND store_id = ?`,
        [cnt, spent, now, now, now, customerId, STORE_ID]
      );
    }
  } catch {
    // swallow - never fail event for purchase side effects
  }
}
