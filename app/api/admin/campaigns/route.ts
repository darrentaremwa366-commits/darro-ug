import { NextRequest, NextResponse } from 'next/server';
import { getAdminUserFromRequest } from '@/lib/auth';
import { getCampaignList, createCampaign } from '@/lib/admin/queries';
import { STORE_ID } from '@/lib/db';

export async function GET(_req: NextRequest): Promise<NextResponse> {
  const user = await getAdminUserFromRequest();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const campaigns = getCampaignList(user.storeId || STORE_ID);
    return NextResponse.json({ campaigns });
  } catch (e) {
    const err = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: err }, { status: 500 });
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const user = await getAdminUserFromRequest();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = (await req.json()) as {
      name?: string;
      utm_source?: string | null;
      utm_medium?: string | null;
      utm_campaign?: string | null;
      utm_content?: string | null;
      utm_term?: string | null;
      landing_url?: string | null;
    };

    const name = (body.name || '').trim();
    if (!name) {
      return NextResponse.json({ error: 'Campaign name is required' }, { status: 400 });
    }

    const id = createCampaign({
      storeId: user.storeId || STORE_ID,
      name,
      utm_source: body.utm_source || null,
      utm_medium: body.utm_medium || null,
      utm_campaign: body.utm_campaign || null,
      utm_content: body.utm_content || null,
      utm_term: body.utm_term || null,
      landing_url: body.landing_url || null,
      createdBy: user.adminId,
    });

    return NextResponse.json({ id, ok: true });
  } catch (e) {
    const err = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: err }, { status: 500 });
  }
}
