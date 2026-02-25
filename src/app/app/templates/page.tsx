import { revalidatePath } from 'next/cache';
import { AppShell } from '@/components/app-shell';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getCurrentWorkspace } from '@/lib/workspace/current';

async function createTemplateAction(formData: FormData) {
  'use server';
  const ctx = await getCurrentWorkspace();
  if (!ctx) return;
  const supabase = await createSupabaseServerClient();

  await supabase.from('permit_templates').insert({
    workspace_id: ctx.workspaceId,
    name: String(formData.get('name') ?? ''),
    category: String(formData.get('category') ?? ''),
    definition: {
      requiredFields: ['location', 'start_at', 'end_at'],
      requiredApprovals: [{ order: 1, role: 'approver' }]
    },
    created_by: ctx.user.id
  });

  revalidatePath('/app/templates');
}

export default async function TemplatesPage() {
  const ctx = await getCurrentWorkspace();
  const supabase = await createSupabaseServerClient();

  const templates = ctx
    ? (await supabase
        .from('permit_templates')
        .select('id,name,category,created_at')
        .eq('workspace_id', ctx.workspaceId)
        .order('created_at', { ascending: false })).data ?? []
    : [];

  return (
    <AppShell title="Permit Templates">
      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Create template">
          <form action={createTemplateAction} className="space-y-3">
            <input name="name" required placeholder="Hot Work Permit" className="w-full rounded-md border px-3 py-2" />
            <input name="category" required placeholder="Hot Work" className="w-full rounded-md border px-3 py-2" />
            <Button type="submit">Create template</Button>
          </form>
        </Card>
        <Card title="Existing templates">
          <ul className="space-y-2 text-sm">
            {templates.map((t) => (
              <li key={t.id} className="rounded border p-2">
                <div className="font-medium">{t.name}</div>
                <div className="text-slate-600">{t.category}</div>
              </li>
            ))}
            {templates.length === 0 ? <li className="text-slate-500">No templates yet.</li> : null}
          </ul>
        </Card>
      </div>
    </AppShell>
  );
}
