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
    .select('id,workspace_id,file_id,files(path,final_path,bucket,size_bytes)')
    .eq('status', 'pending')
    .limit(200);

  let processed = 0;
  for (const row of pending ?? []) {
    const file = row.files as { path?: string; final_path?: string | null; bucket?: string; size_bytes?: number } | null;
    const path = file?.path ?? '';
    const finalPath = file?.final_path ?? null;
    const bucket = file?.bucket ?? 'permit_attachments';
    const size = file?.size_bytes ?? 0;

    const result = await scanFile({ path, sizeBytes: size });

    let finalStatus = result.status;
    let finalReason = result.reason ?? null;

    if (result.status === 'clean' && finalPath && finalPath !== path) {
      const moved = await admin.storage.from(bucket).move(path, finalPath);
      if (moved.error) {
        finalStatus = 'failed';
        finalReason = 'promote_move_failed';
      }
    }

    await admin
      .from('file_scan_results')
      .update({ status: finalStatus, reason: finalReason, engine: result.engine, scanned_at: new Date().toISOString() })
      .eq('id', row.id);

    await admin
      .from('files')
      .update({
        path: finalStatus === 'clean' && finalPath ? finalPath : path,
        final_path: finalStatus === 'clean' ? null : finalPath,
        blocked: finalStatus !== 'clean',
        block_reason: finalStatus === 'clean' ? null : (finalReason ?? finalStatus)
      })
      .eq('id', row.file_id);

    processed += 1;
  }

  return NextResponse.json({ ok: true, data: { processed }, error: null });
}
