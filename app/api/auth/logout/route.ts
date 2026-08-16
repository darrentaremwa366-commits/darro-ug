import { NextRequest, NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/auth';

export async function POST(_req: NextRequest) {
  const response = NextResponse.json({ ok: true });
  clearSessionCookie(response);
  return response;
}
