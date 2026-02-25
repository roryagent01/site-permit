import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getCurrentWorkspace } from '@/lib/workspace/current';
import { logAuditEvent } from '@/lib/audit/events';
import { enforceRateLimit, requestIp } from '@/lib/security/rate-limit';

const schema = z.object({
  bucket: z.enum(['permit_attachments', 'qualification_evidence']),
  path: z.string().min(1),
  sizeBytes: z.number().int().nonnegative().optional(),
  permitId: z.string().uuid().optional(),
  contractorQualificationId: z.string().uuid().optional()
});

export async function POST(request: Request) {
  const rl = enforceRateLimit(`files-register:${requestIp(request.headers)}`, 120, 60_000);
  if (!rl.allowed) return NextResponse.json({ error: 'rate_limited' }, { status: 429 });

  const ctx = await getCurrentWorkspace();
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('files')
    .insert({
      workspace_id: ctx.workspaceId,
      bucket: parsed.data.bucket,
      path: parsed.data.path,
      size_bytes: parsed.data.sizeBytes ?? null,
      permit_id: parsed.data.permitId ?? null,
      contractor_qualification_id: parsed.data.contractorQualificationId ?? null,
      uploaded_by: ctx.user.id
    })
    .select('id')
    .single();

  if (error) return NextResponse.json({ error: 'register_failed' }, { status: 500 });

  await logAuditEvent({
    workspaceId: ctx.workspaceId,
    actorUserId: ctx.user.id,
    action: 'file.registered',
    objectType: 'file',
    objectId: data?.id,
    payload: { bucket: parsed.data.bucket, path: parsed.data.path }
  });

  return NextResponse.json({ ok: true, id: data?.id });
}
