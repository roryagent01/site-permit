import { revalidatePath } from 'next/cache';
import { AppShell } from '@/components/app-shell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getCurrentWorkspace } from '@/lib/workspace/current';

async function createModuleAction(formData: FormData) {
  'use server';
  const ctx = await getCurrentWorkspace();
  if (!ctx || !['admin', 'owner', 'issuer'].includes(ctx.role)) return;
  const supabase = await createSupabaseServerClient();
  await supabase.from('training_modules').insert({
    workspace_id: ctx.workspaceId,
    title: String(formData.get('title') ?? ''),
    summary: String(formData.get('summary') ?? '') || null,
    content_url: String(formData.get('content_url') ?? '') || null,
    created_by: ctx.user.id
  });
  revalidatePath('/app/training');
}

async function sendInvitesAction(formData: FormData) {
  'use server';
  const ctx = await getCurrentWorkspace();
  if (!ctx || !['admin', 'owner', 'issuer'].includes(ctx.role)) return;
  const supabase = await createSupabaseServerClient();

  const contractorId = String(formData.get('contractor_id') ?? '');
  const moduleId = String(formData.get('module_id') ?? '');
  const emailsRaw = String(formData.get('emails') ?? '');
  const expiresHours = Number(formData.get('expires_hours') || 168);

  const recipients = emailsRaw
    .split(/[\n,;]/)
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  for (const email of recipients) {
    const { data: contact } = await supabase
      .from('contractor_contacts')
      .upsert({ workspace_id: ctx.workspaceId, contractor_id: contractorId, email, status: 'active' }, { onConflict: 'workspace_id,contractor_id,email' })
      .select('id')
      .single();

    const token = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
    await supabase.from('training_invites').insert({
      workspace_id: ctx.workspaceId,
      contractor_id: contractorId,
      contractor_contact_id: contact?.id ?? null,
      module_id: moduleId,
      recipient_email: email,
      token,
      expires_at: new Date(Date.now() + Math.max(1, Math.min(720, expiresHours)) * 3600 * 1000).toISOString(),
      sent_at: new Date().toISOString(),
      created_by: ctx.user.id
    });
  }

  revalidatePath('/app/training');
}

export default async function TrainingPage() {
  const ctx = await getCurrentWorkspace();
  const supabase = await createSupabaseServerClient();

  const [modules, contractors, invites, records] = await Promise.all([
    ctx
      ? (await supabase.from('training_modules').select('id,title,summary,content_url,active').eq('workspace_id', ctx.workspaceId).order('created_at', { ascending: false })).data ?? []
      : [],
    ctx
      ? (await supabase.from('contractors').select('id,name').eq('workspace_id', ctx.workspaceId).order('name')).data ?? []
      : [],
    ctx
      ? (await supabase
          .from('training_invites')
          .select('id,recipient_email,expires_at,completed_at,contractors(name),training_modules(title)')
          .eq('workspace_id', ctx.workspaceId)
          .order('created_at', { ascending: false })
          .limit(30)).data ?? []
      : [],
    ctx
      ? (await supabase
          .from('contractor_training_records')
          .select('id,recipient_email,completed_at,contractors(name),training_modules(title)')
          .eq('workspace_id', ctx.workspaceId)
          .order('completed_at', { ascending: false })
          .limit(30)).data ?? []
      : []
  ]);

  return (
    <AppShell title="Training & Site Induction">
      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Create training module">
          <form action={createModuleAction} className="space-y-2">
            <input name="title" placeholder="Site Induction v1" className="w-full rounded border px-3 py-2 text-sm" />
            <input name="summary" placeholder="Short summary" className="w-full rounded border px-3 py-2 text-sm" />
            <input name="content_url" placeholder="https://training.example.com/module" className="w-full rounded border px-3 py-2 text-sm" />
            <Button type="submit">Create module</Button>
          </form>
          <ul className="mt-3 space-y-1 text-xs text-slate-600">
            {modules.map((m) => (
              <li key={m.id}>{m.title} {m.content_url ? `• ${m.content_url}` : ''}</li>
            ))}
            {!modules.length ? <li>No modules yet.</li> : null}
          </ul>
        </Card>

        <Card title="Send induction links (bulk)">
          <form action={sendInvitesAction} className="space-y-2">
            <select name="contractor_id" className="w-full rounded border px-3 py-2 text-sm">
              <option value="">Select contractor</option>
              {contractors.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <select name="module_id" className="w-full rounded border px-3 py-2 text-sm">
              <option value="">Select module</option>
              {modules.map((m) => (
                <option key={m.id} value={m.id}>{m.title}</option>
              ))}
            </select>
            <textarea name="emails" placeholder="email1@contractor.com, email2@contractor.com" className="w-full rounded border px-3 py-2 text-sm" rows={4} />
            <input name="expires_hours" type="number" min={1} max={720} defaultValue={168} className="w-full rounded border px-3 py-2 text-sm" />
            <Button type="submit">Send invites</Button>
          </form>
        </Card>

        <Card title="Recent training invites">
          <ul className="space-y-2 text-xs">
            {invites.map((i) => (
              <li key={i.id} className="rounded border p-2">
                <div className="font-medium">{i.recipient_email}</div>
                <div className="text-slate-600">{(i.contractors as { name?: string } | null)?.name} • {(i.training_modules as { title?: string } | null)?.title}</div>
                <div className="text-slate-500">Expires: {new Date(i.expires_at).toLocaleString()} {i.completed_at ? '• completed' : ''}</div>
              </li>
            ))}
            {!invites.length ? <li className="text-slate-500">No invites yet.</li> : null}
          </ul>
        </Card>

        <Card title="Completed inductions (credited)">
          <ul className="space-y-2 text-xs">
            {records.map((r) => (
              <li key={r.id} className="rounded border p-2">
                <div className="font-medium">{r.recipient_email}</div>
                <div className="text-slate-600">{(r.contractors as { name?: string } | null)?.name} • {(r.training_modules as { title?: string } | null)?.title}</div>
                <div className="text-slate-500">Completed: {new Date(r.completed_at).toLocaleString()}</div>
              </li>
            ))}
            {!records.length ? <li className="text-slate-500">No completions yet.</li> : null}
          </ul>
        </Card>
      </div>
    </AppShell>
  );
}
