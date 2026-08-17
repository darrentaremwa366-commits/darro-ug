import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import bcryptjs from 'bcryptjs';
import { queryDb, STORE_ID, nowISO, uuid } from '@/lib/db';

export const JWT_SECRET: string =
  process.env.ADMIN_JWT_SECRET ||
  'darro-dev-secret-change-me-please-32chars-min';

export const SESSION_COOKIE = 'darro_admin_session';

export interface AdminSessionPayload {
  adminId: string;
  storeId: string;
  role: string;
  email: string;
  [key: string]: unknown;
}

export async function signAdminSession(
  payload: AdminSessionPayload
): Promise<string> {
  const secret = new TextEncoder().encode(JWT_SECRET);
  const jwt = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(secret);
  return jwt;
}

export async function verifyAdminSession(
  token: string
): Promise<AdminSessionPayload | null> {
  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return {
      adminId: payload.adminId as string,
      storeId: payload.storeId as string,
      role: payload.role as string,
      email: payload.email as string,
    };
  } catch {
    return null;
  }
}

export function setSessionCookie(
  response: NextResponse,
  token: string
): NextResponse {
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true, // always set on Vercel/HTTPS; browsers ignore on localhost
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24,
  });
  return response;
}

export function clearSessionCookie(response: NextResponse): NextResponse {
  response.cookies.set(SESSION_COOKIE, '', {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  });
  return response;
}

export interface AdminUserRow {
  id: string;
  store_id: string;
  email: string;
  password_hash: string;
  role: string;
  full_name: string | null;
  created_at: string;
  updated_at: string;
}

export async function verifyAdminLogin(
  email: string,
  password: string
): Promise<AdminUserRow | null> {
  const normalizedEmail = email.trim().toLowerCase();

  const envPassword = process.env.ADMIN_PASSWORD;
  if (envPassword && password === envPassword) {
    const envEmail = process.env.ADMIN_EMAIL || 'owner@darro.co';
    if (normalizedEmail === envEmail.toLowerCase()) {
      return {
        id: 'admin_env',
        store_id: STORE_ID,
        email: envEmail,
        password_hash: '',
        role: 'owner',
        full_name: 'Darro Owner',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }
    return null;
  }

  const row = await queryDb.get<AdminUserRow>(
    `SELECT * FROM admin_users WHERE store_id = ? AND LOWER(email) = ?`,
    [STORE_ID, normalizedEmail]
  );

  if (!row) return null;

  const valid = bcryptjs.compareSync(password, row.password_hash);
  if (!valid) return null;

  return row;
}

export async function getAdminUserFromRequest(): Promise<AdminSessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifyAdminSession(token);
}
