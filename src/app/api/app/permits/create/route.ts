import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentWorkspace } from '@/lib/workspace/current';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { ok, fail } from '@/lib/api/response';

const schema = z.object({
  title: z.string().min(1),
  location: z.string().min(1),
  start_at: z.string().optional(),
  end_at: z.string().optional(),
  template_id: z.string().uuid().optional(),
  contractor_id: z.string().uuid().optional(),
  source: z.enum(['online', 'offline_queue']).optional(),
  sourceMeta: z.record(z.string(), z.any()).optional()
});

export async function POST(request: Request) {
  const ctx = await getCurrentWorkspace();
  if (!ctx) return NextResponse.json(fail('unauthorized', 'Authentication required'), { status: 401 });
  if (!['issuer', 'admin', 'owner'].includes(ctx.role)) return NextResponse.json(fail('forbidden', 'Role not allowed'), { status: 403 });

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json(fail('invalid_payload', 'Invalid permit payload'), { status: 400 });

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from('permits').insert({
    workspace_id: ctx.workspaceId,
    template_id: parsed.data.template_id ?? null,
    title: parsed.data.title,
    start_at: parsed.data.start_at || null,
    end_at: parsed.data.end_at || null,
    status: 'draft',
    payload: { location: parsed.data.location, contractor_id: parsed.data.contractor_id ?? null },
    source: parsed.data.source ?? 'online',
    source_meta: parsed.data.sourceMeta ?? {},
    created_by: ctx.user.id
  }).select('id').single();

  return NextResponse.json(ok({ permitId: data?.id }));
}
