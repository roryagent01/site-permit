import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getCurrentWorkspace } from '@/lib/workspace/current';
import { ok, fail } from '@/lib/api/response';

const createSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  qualificationTypeIds: z.array(z.string().uuid()).default([])
});

export async function GET() {
  const ctx = await getCurrentWorkspace();
  if (!ctx) return NextResponse.json(fail('unauthorized', 'Authentication required'), { status: 401 });
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from('qualification_packs')
    .select('id,name,description,qualification_pack_items(qualification_type_id,qualification_types(name))')
    .eq('workspace_id', ctx.workspaceId)
    .order('created_at', { ascending: false });

  return NextResponse.json(ok({ items: data ?? [] }));
}

export async function POST(request: Request) {
  const ctx = await getCurrentWorkspace();
  if (!ctx) return NextResponse.json(fail('unauthorized', 'Authentication required'), { status: 401 });
  if (!['admin', 'owner'].includes(ctx.role)) return NextResponse.json(fail('forbidden', 'Role not allowed'), { status: 403 });

  const parsed = createSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json(fail('invalid_payload', 'Invalid pack payload'), { status: 400 });

  const supabase = await createSupabaseServerClient();
  const { data: pack } = await supabase
    .from('qualification_packs')
    .insert({
      workspace_id: ctx.workspaceId,
      name: parsed.data.name,
      description: parsed.data.description ?? null
    })
    .select('id')
    .single();

  if (pack?.id && parsed.data.qualificationTypeIds.length) {
    await supabase.from('qualification_pack_items').insert(
      parsed.data.qualificationTypeIds.map((id) => ({
        workspace_id: ctx.workspaceId,
        pack_id: pack.id,
        qualification_type_id: id,
        required: true
      }))
    );
  }

  return NextResponse.json(ok({ packId: pack?.id }));
}
