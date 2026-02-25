import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { enforceRateLimit, requestIp } from '@/lib/security/rate-limit';

export async function POST(request: Request) {
  const rl = enforceRateLimit(`permits-activate:${requestIp(request.headers)}`, 20, 60_000);
  if (!rl.allowed) return NextResponse.json({ error: 'rate_limited' }, { status: 429 });

  const cronSecret = process.env.CRON_SECRET;
  const provided = request.headers.get('x-cron-secret');
  if (!cronSecret || provided !== cronSecret) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const admin = createSupabaseAdminClient();
  const nowIso = new Date().toISOString();

  const { data: duePermits } = await admin
    .from('permits')
    .select('id,workspace_id')
    .eq('status', 'approved')
    .lte('start_at', nowIso)
    .limit(500);

  if (!duePermits?.length) return NextResponse.json({ ok: true, activated: 0 });

  const ids = duePermits.map((p) => p.id);
  const { error } = await admin.from('permits').update({ status: 'active', updated_at: nowIso }).in('id', ids);
  if (error) return NextResponse.json({ error: 'activate_failed' }, { status: 500 });

  return NextResponse.json({ ok: true, activated: ids.length });
}
