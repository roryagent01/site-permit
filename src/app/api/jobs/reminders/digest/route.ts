import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const provided = request.headers.get('x-cron-secret');
  if (!cronSecret || provided !== cronSecret) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const admin = createSupabaseAdminClient();
  const today = new Date();
  const dateKey = today.toISOString().slice(0, 10);
  const emailDailyCap = Number(process.env.EMAIL_DAILY_CAP ?? 200);

  const { data: workspaces } = await admin.from('workspaces').select('id,name');
  const results: Array<{ workspaceId: string; expiringCount: number; logged: boolean; mode: 'full' | 'summary' }> = [];

  for (const ws of workspaces ?? []) {
    const { data: settings } = await admin
      .from('reminder_settings')
      .select('windows_days,digest_enabled')
      .eq('workspace_id', ws.id)
      .maybeSingle();

    if (settings?.digest_enabled === false) continue;
    const windows = (settings?.windows_days as number[] | null) ?? [30, 14, 7];

    const maxDays = Math.max(...windows);
    const limitDate = new Date(today);
    limitDate.setDate(limitDate.getDate() + maxDays);

    const { data: expiring } = await admin
      .from('contractor_qualifications')
      .select('id,expiry_date,contractors(name),qualification_types(name)')
      .eq('workspace_id', ws.id)
      .lte('expiry_date', limitDate.toISOString().slice(0, 10));

    const deliveryKey = `digest:${ws.id}:${dateKey}`;
    const recipient = `workspace:${ws.id}:owners-admins`;
    const mode: 'full' | 'summary' = (expiring?.length ?? 0) > emailDailyCap ? 'summary' : 'full';

    const { error } = await admin.from('reminder_deliveries').upsert(
      {
        workspace_id: ws.id,
        delivery_key: deliveryKey,
        recipient,
        payload: {
          workspace: ws.name,
          expiringCount: expiring?.length ?? 0,
          windows,
          mode,
          capped: mode === 'summary'
        }
      },
      { onConflict: 'workspace_id,delivery_key,recipient' }
    );

    results.push({ workspaceId: ws.id, expiringCount: expiring?.length ?? 0, logged: !error, mode });
  }

  return NextResponse.json({ ok: true, results });
}
