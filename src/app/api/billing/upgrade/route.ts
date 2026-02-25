import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getCurrentWorkspace } from '@/lib/workspace/current';
import { logAuditEvent } from '@/lib/audit/events';
import { enforceRateLimit, requestIp } from '@/lib/security/rate-limit';

const schema = z.object({
  plan: z.enum(['starter', 'growth', 'scale']),
  dedicatedHosting: z.boolean().optional(),
  dedicatedRegion: z.string().optional()
});

export async function POST(request: Request) {
  const rl = enforceRateLimit(`billing-upgrade:${requestIp(request.headers)}`, 20, 60_000);
  if (!rl.allowed) return NextResponse.json({ error: 'rate_limited' }, { status: 429 });

  const ctx = await getCurrentWorkspace();
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!['owner', 'admin'].includes(ctx.role)) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from('workspaces')
    .update({
      plan: parsed.data.plan,
      dedicated_hosting: parsed.data.dedicatedHosting ?? false,
      dedicated_region: parsed.data.dedicatedRegion ?? null,
      support_tier: parsed.data.plan === 'starter' ? 'email' : 'priority'
    })
    .eq('id', ctx.workspaceId);

  if (error) return NextResponse.json({ error: 'update_failed' }, { status: 500 });

  await logAuditEvent({
    workspaceId: ctx.workspaceId,
    actorUserId: ctx.user.id,
    action: 'billing.plan_updated',
    objectType: 'workspace',
    objectId: ctx.workspaceId,
    payload: parsed.data
  });

  return NextResponse.json({ ok: true });
}
