import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getCurrentWorkspace } from '@/lib/workspace/current';
import { ok, fail } from '@/lib/api/response';

const schema = z.object({
  documentId: z.string().uuid(),
  contractorId: z.string().uuid(),
  contractorContactEmail: z.string().email().optional(),
  trainingModuleId: z.string().uuid().optional(),
  qualificationTypeId: z.string().uuid().optional(),
  override: z.object({
    name: z.string().optional(),
    trainingName: z.string().optional(),
    expiryDate: z.string().optional()
  }).optional()
});

export async function POST(request: Request) {
  const ctx = await getCurrentWorkspace();
  if (!ctx) return NextResponse.json(fail('unauthorized', 'Authentication required'), { status: 401 });
  if (!['admin', 'owner', 'issuer'].includes(ctx.role)) return NextResponse.json(fail('forbidden', 'Role not allowed'), { status: 403 });

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json(fail('invalid_payload', 'Invalid OCR apply payload'), { status: 400 });

  const supabase = await createSupabaseServerClient();
  const { data: extractions } = await supabase
    .from('ocr_extractions')
    .select('field_name,field_value')
    .eq('workspace_id', ctx.workspaceId)
    .eq('document_id', parsed.data.documentId);

  const map = new Map((extractions ?? []).map((e) => [e.field_name, e.field_value]));
  const expiryDate = parsed.data.override?.expiryDate ?? (map.get('expiry_date') as string | null) ?? null;
  const trainingName = parsed.data.override?.trainingName ?? (map.get('training_name') as string | null) ?? null;

  if (parsed.data.trainingModuleId) {
    const email = parsed.data.contractorContactEmail ?? 'unknown@unknown.local';
    await supabase.from('contractor_training_records').upsert({
      workspace_id: ctx.workspaceId,
      contractor_id: parsed.data.contractorId,
      contractor_contact_id: null,
      module_id: parsed.data.trainingModuleId,
      invite_id: null,
      recipient_email: email,
      completed_at: new Date().toISOString()
    }, { onConflict: 'workspace_id,module_id,recipient_email' });
  }

  if (parsed.data.qualificationTypeId) {
    await supabase.from('contractor_qualifications').upsert({
      workspace_id: ctx.workspaceId,
      contractor_id: parsed.data.contractorId,
      qualification_type_id: parsed.data.qualificationTypeId,
      issue_date: new Date().toISOString().slice(0, 10),
      expiry_date: expiryDate,
      verification_status: 'unverified'
    });
  }

  await supabase.from('ocr_documents').update({ status: 'applied' }).eq('workspace_id', ctx.workspaceId).eq('id', parsed.data.documentId);

  return NextResponse.json(ok({ applied: true, trainingName, expiryDate }));
}
