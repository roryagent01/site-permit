import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { scanFile } from '@/lib/security/file-scan';

export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get('x-cron-secret') !== secret) {
    return NextResponse.json({ ok: false, error: { code: 'unauthorized', message: 'Invalid cron secret' } }, { status: 401 });
  }

  const admin = createSupabaseAdminClient();
  const { data: pending } = await admin
    .from('file_scan_results')
    .select('id,workspace_id,file_id,files(path,size_bytes)')
    .eq('status', 'pending')
    .limit(200);

  let processed = 0;
  for (const row of pending ?? []) {
    const file = row.files as { path?: string; size_bytes?: number } | null;
    const path = file?.path ?? '';
    const size = file?.size_bytes ?? 0;

    const result = await scanFile({ path, sizeBytes: size });

    await admin
      .from('file_scan_results')
      .update({ status: result.status, reason: result.reason ?? null, engine: result.engine, scanned_at: new Date().toISOString() })
      .eq('id', row.id);

    await admin
      .from('files')
      .update({ blocked: result.status === 'quarantined', block_reason: result.reason ?? null })
      .eq('id', row.file_id);

    processed += 1;
  }

  return NextResponse.json({ ok: true, data: { processed }, error: null });
}
