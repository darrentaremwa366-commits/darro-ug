import { NextRequest, NextResponse } from 'next/server';
import {
  verifyAdminLogin,
  signAdminSession,
  setSessionCookie,
} from '@/lib/auth';
import db, { STORE_ID, nowISO, uuid } from '@/lib/db';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getClientIp(req: NextRequest): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0]?.trim() || 'unknown';
  return req.headers.get('x-real-ip') || 'unknown';
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawEmail = body.email ?? '';
    const rawPassword = body.password ?? '';

    const email = typeof rawEmail === 'string' ? rawEmail.trim() : '';
    const password = typeof rawPassword === 'string' ? rawPassword : '';

    if (!email || email.length < 3 || !password || password.length < 3) {
      return NextResponse.json(
        { ok: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const admin = await verifyAdminLogin(email, password);

    const ip = getClientIp(req);
    const userAgent = req.headers.get('user-agent') || null;
    const auditId = uuid();
    const now = nowISO();

    if (!admin) {
      await sleep(800);

      try {
        db.prepare(
          `INSERT INTO admin_audit_log (id, store_id, admin_user_id, action, resource_type, resource_id, details_json, ip_address, user_agent, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).run(
          auditId,
          STORE_ID,
          null,
          'login_failed',
          'admin_user',
          null,
          JSON.stringify({ email: email.toLowerCase() }),
          ip,
          userAgent,
          now
        );
      } catch { /* audit log best-effort only */ }

      return NextResponse.json(
        { ok: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const token = await signAdminSession({
      adminId: admin.id,
      storeId: admin.store_id,
      role: admin.role,
      email: admin.email,
    });

    try {
      db.prepare(
        `INSERT INTO admin_audit_log (id, store_id, admin_user_id, action, resource_type, resource_id, details_json, ip_address, user_agent, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        auditId,
        STORE_ID,
        admin.id,
        'login_success',
        'admin_user',
        admin.id,
        JSON.stringify({ email: admin.email.toLowerCase(), role: admin.role }),
        ip,
        userAgent,
        now
      );
    } catch { /* audit log best-effort only */ }

    const response = NextResponse.json({
      ok: true,
      redirect: '/admin/overview',
    });

    setSessionCookie(response, token);
    return response;
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Invalid credentials' },
      { status: 401 }
    );
  }
}
