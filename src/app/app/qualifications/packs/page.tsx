import { revalidatePath } from 'next/cache';
import { AppShell } from '@/components/app-shell';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getCurrentWorkspace } from '@/lib/workspace/current';

async function createPackAction(formData: FormData) {
  'use server';
  const ctx = await getCurrentWorkspace();
  if (!ctx || !['admin', 'owner'].includes(ctx.role)) return;
  const supabase = await createSupabaseServerClient();

  const name = String(formData.get('name') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();
  const qualIds = String(formData.get('qualification_type_ids') ?? '')
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);

  const { data: pack } = await supabase
    .from('qualification_packs')
    .insert({ workspace_id: ctx.workspaceId, name, description })
    .select('id')
    .single();

  if (pack?.id && qualIds.length) {
    await supabase.from('qualification_pack_items').insert(
      qualIds.map((id) => ({ workspace_id: ctx.workspaceId, pack_id: pack.id, qualification_type_id: id, required: true }))
    );
  }

  revalidatePath('/app/qualifications/packs');
}

export default async function QualificationPacksPage() {
  const ctx = await getCurrentWorkspace();
  const supabase = await createSupabaseServerClient();

  const [packs, types] = await Promise.all([
    ctx
      ? (await supabase
          .from('qualification_packs')
          .select('id,name,description,qualification_pack_items(qualification_type_id,qualification_types(name))')
          .eq('workspace_id', ctx.workspaceId)
          .order('created_at', { ascending: false })).data ?? []
      : [],
    ctx
      ? (await supabase.from('qualification_types').select('id,name').eq('workspace_id', ctx.workspaceId).order('name')).data ?? []
      : []
  ]);

  return (
    <AppShell title="Qualification Requirement Packs">
      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Create pack">
          <form action={createPackAction} className="space-y-3">
            <input name="name" required placeholder="Hot Work Contractor Pack" className="w-full rounded-md border px-3 py-2" />
            <input name="description" placeholder="Required credentials for hot work" className="w-full rounded-md border px-3 py-2" />
            <input
              name="qualification_type_ids"
              placeholder="Qualification type IDs (comma-separated)"
              className="w-full rounded-md border px-3 py-2"
            />
            <p className="text-xs text-slate-500">Available type IDs: {types.map((t) => `${t.name}:${t.id}`).join(' | ')}</p>
            <Button type="submit">Create pack</Button>
          </form>
        </Card>
        <Card title="Existing packs">
          <ul className="space-y-2 text-sm">
            {packs.map((p) => (
              <li key={p.id} className="rounded border p-2">
                <div className="font-medium">{p.name}</div>
                <div className="text-slate-600">{p.description || '-'}</div>
                <div className="text-xs text-slate-500 mt-1">
                  {((p.qualification_pack_items as Array<{ qualification_types?: { name?: string } }> | null) ?? [])
                    .map((i) => i.qualification_types?.name)
                    .filter(Boolean)
                    .join(', ') || 'No items'}
                </div>
              </li>
            ))}
            {!packs.length ? <li className="text-slate-500">No packs yet.</li> : null}
          </ul>
        </Card>
      </div>
    </AppShell>
  );
}
