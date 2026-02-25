import { revalidatePath } from 'next/cache';
import { AppShell } from '@/components/app-shell';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getCurrentWorkspace } from '@/lib/workspace/current';

async function createQualificationTypeAction(formData: FormData) {
  'use server';
  const ctx = await getCurrentWorkspace();
  if (!ctx) return;
  const supabase = await createSupabaseServerClient();

  await supabase.from('qualification_types').insert({
    workspace_id: ctx.workspaceId,
    name: String(formData.get('name') ?? ''),
    validity_months: Number(formData.get('validity_months') || 12),
    evidence_required: formData.get('evidence_required') === 'on'
  });

  revalidatePath('/app/qualifications/types');
}

export default async function QualificationTypesPage() {
  const ctx = await getCurrentWorkspace();
  const supabase = await createSupabaseServerClient();

  const types = ctx
    ? (await supabase
        .from('qualification_types')
        .select('id,name,validity_months,evidence_required')
        .eq('workspace_id', ctx.workspaceId)
        .order('name')).data ?? []
    : [];

  return (
    <AppShell title="Qualification Types">
      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Create qualification type">
          <form action={createQualificationTypeAction} className="space-y-3">
            <input name="name" required placeholder="Working at Height" className="w-full rounded-md border px-3 py-2" />
            <input name="validity_months" type="number" min={1} defaultValue={12} className="w-full rounded-md border px-3 py-2" />
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="evidence_required" defaultChecked /> Evidence required</label>
            <Button type="submit">Create type</Button>
          </form>
        </Card>
        <Card title="Qualification catalog">
          <ul className="space-y-2 text-sm">
            {types.map((t) => (
              <li key={t.id} className="rounded border p-2">
                <div className="font-medium">{t.name}</div>
                <div className="text-slate-600">Validity: {t.validity_months ?? '-'} months</div>
              </li>
            ))}
            {types.length === 0 ? <li className="text-slate-500">No qualification types yet.</li> : null}
          </ul>
        </Card>
      </div>
    </AppShell>
  );
}
