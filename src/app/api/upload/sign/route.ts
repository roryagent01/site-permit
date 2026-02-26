import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { getCurrentWorkspace } from '@/lib/workspace/current';
import { assertStorageWithinLimit } from '@/lib/limits';
import { upsertUsageCounter } from '@/lib/usage/counters';
import { logAuditEvent } from '@/lib/audit/events';
import { enforceRateLimit, requestIp } from '@/lib/security/rate-limit';

const bodySchema = z.object({
  bucket: z.enum(['permit_attachments', 'qualification_evidence']),
  fileName: z.string().min(1),
  sizeBytes: z.number().int().nonnegative().default(0)
});

export async function POST(request: Request) {
  const rl = enforceRateLimit(`upload-sign:${requestIp(request.headers)}`, 60, 60_000);
  if (!rl.allowed) return NextResponse.json({ error: 'rate_limited' }, { status: 429 });

  const ctx = await getCurrentWorkspace();
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });
  }

  try {
    await assertStorageWithinLimit(ctx.workspaceId, ctx.workspacePlan, parsed.data.sizeBytes);
  } catch {
    return NextResponse.json({ error: 'storage_limit_reached' }, { status: 403 });
  }

  const fileKey = `${Date.now()}-${parsed.data.fileName}`;
  const path = `${ctx.workspaceId}/_staging/${fileKey}`;
  const finalPath = `${ctx.workspaceId}/${fileKey}`;
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.storage.from(parsed.data.bucket).createSignedUploadUrl(path);

  if (error) {
    return NextResponse.json({ error: 'sign_failed' }, { status: 500 });
  }

  await upsertUsageCounter(ctx.workspaceId, { storage_used_bytes: parsed.data.sizeBytes });
  await logAuditEvent({
    workspaceId: ctx.workspaceId,
    actorUserId: ctx.user.id,
    action: 'file.upload_sign_requested',
    objectType: 'file',
    payload: { bucket: parsed.data.bucket, path, finalPath, sizeBytes: parsed.data.sizeBytes }
  });

  return NextResponse.json({
    token: data.token,
    path,
    finalPath,
    bucket: parsed.data.bucket,
    signedUrl: data.signedUrl
  });
}
