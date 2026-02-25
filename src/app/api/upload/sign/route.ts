import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { getCurrentWorkspace } from '@/lib/workspace/current';

const bodySchema = z.object({
  bucket: z.enum(['permit_attachments', 'qualification_evidence']),
  fileName: z.string().min(1)
});

export async function POST(request: Request) {
  const ctx = await getCurrentWorkspace();
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });
  }

  const path = `${ctx.workspaceId}/${Date.now()}-${parsed.data.fileName}`;
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.storage.from(parsed.data.bucket).createSignedUploadUrl(path);

  if (error) {
    return NextResponse.json({ error: 'sign_failed' }, { status: 500 });
  }

  return NextResponse.json({
    token: data.token,
    path,
    bucket: parsed.data.bucket,
    signedUrl: data.signedUrl
  });
}
