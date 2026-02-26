import { revalidatePath } from 'next/cache';
import { AppShell } from '@/components/app-shell';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getCurrentWorkspace } from '@/lib/workspace/current';
import { logAuditEvent } from '@/lib/audit/events';

async function snapshotTemplateVersion(
  workspaceId: string,
  templateId: string,
  actorUserId: string,
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>
) {
  const { data: template } = await supabase
    .from('permit_templates')
    .select('id,name,category,definition')
    .eq('workspace_id', workspaceId)
    .eq('id', templateId)
    .single();
  if (!template) return;

  const { data: existing } = await supabase
    .from('template_versions')
    .select('version_no')
    .eq('workspace_id', workspaceId)
    .eq('template_id', templateId)
    .order('version_no', { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextVersion = (existing?.version_no ?? 0) + 1;
  await supabase.from('template_versions').insert({
    workspace_id: workspaceId,
    template_id: templateId,
    version_no: nextVersion,
    name: template.name,
    category: template.category,
    definition: template.definition,
    created_by: actorUserId
  });
}

async function createTemplateAction(formData: FormData) {
  'use server';
  const ctx = await getCurrentWorkspace();
  if (!ctx) return;
  if (!['admin', 'owner'].includes(ctx.role)) return;
  const supabase = await createSupabaseServerClient();

  const name = String(formData.get('name') ?? '');
  const category = String(formData.get('category') ?? '');

  const gatingMode = String(formData.get('gating_mode') || 'warn');
  const requiredQualificationTypeIds = String(formData.get('required_qualification_type_ids') || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const trainingGateMode = String(formData.get('training_gate_mode') || 'warn');
  const requiredTrainingModuleIds = String(formData.get('required_training_module_ids') || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const approvalRoles = String(formData.get('approval_roles') || 'approver')
    .split(',')
    .map((s) => s.trim())
    .filter((s) => ['owner', 'admin', 'approver', 'issuer', 'viewer'].includes(s));

  const { data: template } = await supabase
    .from('permit_templates')
    .insert({
      workspace_id: ctx.workspaceId,
      name,
      category,
      definition: {
        requiredFields: ['location', 'start_at', 'end_at'],
        requiredApprovals: [{ order: 1, role: 'approver' }],
        qualificationGate: {
          mode: gatingMode,
          requiredQualificationTypeIds
        },
        trainingGate: {
          mode: trainingGateMode,
          requiredTrainingModuleIds
        }
      },
      created_by: ctx.user.id
    })
    .select('id')
    .single();

  if (template?.id) {
    const steps = (approvalRoles.length ? approvalRoles : ['approver']).map((role, index) => ({
      workspace_id: ctx.workspaceId,
      template_id: template.id,
      step_order: index + 1,
      role,
      required: true
    }));
    await supabase.from('permit_template_steps').insert(steps);
    await snapshotTemplateVersion(ctx.workspaceId, template.id, ctx.user.id, supabase);
  }

  await logAuditEvent({
    workspaceId: ctx.workspaceId,
    actorUserId: ctx.user.id,
    action: 'template.created',
    objectType: 'permit_template',
    objectId: template?.id,
    payload: {
      name,
      category,
      gatingMode,
      requiredQualificationTypeIds,
      trainingGateMode,
      requiredTrainingModuleIds,
      approvalRoles
    }
  });

  revalidatePath('/app/templates');
}

async function rollbackTemplateAction(formData: FormData) {
  'use server';
  const ctx = await getCurrentWorkspace();
  if (!ctx || !['admin', 'owner'].includes(ctx.role)) return;
  const templateId = String(formData.get('template_id') ?? '');
  const versionId = String(formData.get('version_id') ?? '');
  if (!templateId || !versionId) return;

  const supabase = await createSupabaseServerClient();
  const { data: v } = await supabase
    .from('template_versions')
    .select('id,name,category,definition')
    .eq('workspace_id', ctx.workspaceId)
    .eq('template_id', templateId)
    .eq('id', versionId)
    .single();

  if (!v) return;

  await supabase
    .from('permit_templates')
    .update({ name: v.name, category: v.category, definition: v.definition })
    .eq('workspace_id', ctx.workspaceId)
    .eq('id', templateId);

  await snapshotTemplateVersion(ctx.workspaceId, templateId, ctx.user.id, supabase);
  await logAuditEvent({
    workspaceId: ctx.workspaceId,
    actorUserId: ctx.user.id,
    action: 'template.rollback',
    objectType: 'permit_template',
    objectId: templateId,
    payload: { versionId }
  });

  revalidatePath('/app/templates');
}

export default async function TemplatesPage() {
  const ctx = await getCurrentWorkspace();
  const supabase = await createSupabaseServerClient();

  const templates = ctx
    ? (await supabase
        .from('permit_templates')
        .select('id,name,category,created_at,template_versions(id,version_no,created_at)')
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
            <select name="gating_mode" className="w-full rounded-md border px-3 py-2">
              <option value="warn">Qualification gate: warn</option>
              <option value="block">Qualification gate: block</option>
            </select>
            <input
              name="required_qualification_type_ids"
              placeholder="Required qualification type IDs (comma-separated)"
              className="w-full rounded-md border px-3 py-2"
            />
            <select name="training_gate_mode" className="w-full rounded-md border px-3 py-2">
              <option value="warn">Training gate: warn</option>
              <option value="block">Training gate: block</option>
            </select>
            <input
              name="required_training_module_ids"
              placeholder="Required training module IDs (comma-separated)"
              className="w-full rounded-md border px-3 py-2"
            />
            <input
              name="approval_roles"
              defaultValue="approver"
              placeholder="Approval roles sequence (comma-separated, e.g. approver,admin)"
              className="w-full rounded-md border px-3 py-2"
            />
            <Button type="submit">Create template</Button>
          </form>
        </Card>
        <Card title="Existing templates">
          <ul className="space-y-2 text-sm">
            {templates.map((t) => {
              const versions = ((t.template_versions as Array<{ id: string; version_no: number }> | null) ?? []).sort(
                (a, b) => b.version_no - a.version_no
              );
              return (
                <li key={t.id} className="rounded border p-2">
                  <div className="font-medium">{t.name}</div>
                  <div className="text-slate-600">{t.category}</div>
                  <div className="mt-1 text-xs text-slate-500">Versions: {versions.map((v) => `v${v.version_no}`).join(', ') || 'none'}</div>
                  {versions[0] ? (
                    <form action={rollbackTemplateAction} className="mt-2">
                      <input type="hidden" name="template_id" value={t.id} />
                      <input type="hidden" name="version_id" value={versions[0].id} />
                      <Button type="submit" variant="secondary" className="min-h-0 px-2 py-1 text-xs">
                        Rollback to latest snapshot
                      </Button>
                    </form>
                  ) : null}
                </li>
              );
            })}
            {templates.length === 0 ? <li className="text-slate-500">No templates yet.</li> : null}
          </ul>
        </Card>
      </div>
    </AppShell>
  );
}
