import { revalidatePath } from 'next/cache';
import { AppShell } from '@/components/app-shell';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getCurrentWorkspace } from '@/lib/workspace/current';
import { logAuditEvent } from '@/lib/audit/events';

async function createQualificationRecordAction(formData: FormData) {
  'use server';
  const ctx = await getCurrentWorkspace();
  if (!ctx) return;
  const supabase = await createSupabaseServerClient();

  const contractorId = String(formData.get('contractor_id'));
  const qualificationTypeId = String(formData.get('qualification_type_id'));
  const { data: rec } = await supabase
    .from('contractor_qualifications')
    .insert({
      workspace_id: ctx.workspaceId,
      contractor_id: contractorId,
      qualification_type_id: qualificationTypeId,
      issue_date: String(formData.get('issue_date') ?? '') || null,
      expiry_date: String(formData.get('expiry_date') ?? '') || null,
      verification_status: 'unverified'
    })
    .select('id')
    .single();

  await logAuditEvent({
    workspaceId: ctx.workspaceId,
    actorUserId: ctx.user.id,
    action: 'contractor_qualification.created',
    objectType: 'contractor_qualification',
    objectId: rec?.id,
    payload: { contractorId, qualificationTypeId }
  });

  revalidatePath('/app/qualifications/records');
}

export default async function QualificationRecordsPage() {
  const ctx = await getCurrentWorkspace();
  const supabase = await createSupabaseServerClient();

  const [contractors, types, records] = await Promise.all([
    ctx
      ? (await supabase.from('contractors').select('id,name').eq('workspace_id', ctx.workspaceId).order('name')).data ?? []
      : [],
    ctx
      ? (await supabase.from('qualification_types').select('id,name').eq('workspace_id', ctx.workspaceId).order('name')).data ?? []
      : [],
    ctx
      ? (await supabase
          .from('contractor_qualifications')
          .select('id,issue_date,expiry_date,verification_status,contractors(name),qualification_types(name)')
          .eq('workspace_id', ctx.workspaceId)
          .order('created_at', { ascending: false })).data ?? []
      : []
  ]);

  return (
    <AppShell title="Qualification Records">
      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Assign qualification">
          <form action={createQualificationRecordAction} className="space-y-3">
            <select name="contractor_id" required className="w-full rounded-md border px-3 py-2">
              <option value="">Select contractor</option>
              {contractors.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <select name="qualification_type_id" required className="w-full rounded-md border px-3 py-2">
              <option value="">Select qualification type</option>
              {types.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            <input name="issue_date" type="date" className="w-full rounded-md border px-3 py-2" />
            <input name="expiry_date" type="date" className="w-full rounded-md border px-3 py-2" />
            <Button type="submit">Assign qualification</Button>
          </form>
        </Card>
        <Card title="Current qualification records">
          <ul className="space-y-2 text-sm">
            {records.map((r) => (
              <li key={r.id} className="rounded border p-2">
                <div className="font-medium">{(r.contractors as { name?: string } | null)?.name} • {(r.qualification_types as { name?: string } | null)?.name}</div>
                <div className="text-slate-600">Expiry: {r.expiry_date || '-'} • {r.verification_status}</div>
              </li>
            ))}
            {records.length === 0 ? <li className="text-slate-500">No qualification records yet.</li> : null}
          </ul>
        </Card>
      </div>
    </AppShell>
  );
}
