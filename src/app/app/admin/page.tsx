import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getCurrentWorkspace } from '@/lib/workspace/current';
import { assertMembersWithinLimit } from '@/lib/limits';
import { upsertUsageCounter } from '@/lib/usage/counters';
import { logAuditEvent } from '@/lib/audit/events';

async function addMemberAction(formData: FormData) {
  'use server';
  const ctx = await getCurrentWorkspace();
  if (!ctx) return;
  const supabase = await createSupabaseServerClient();

  if (!['owner', 'admin'].includes(ctx.role)) {
    redirect('/app/admin?error=forbidden');
  }

  try {
    await assertMembersWithinLimit(ctx.workspaceId, ctx.workspacePlan);
  } catch {
    redirect('/app/admin?error=user_limit_reached');
  }

  const userId = String(formData.get('user_id') ?? '').trim();
  const role = String(formData.get('role') ?? 'viewer');
  if (!userId) return;

  await supabase.from('workspace_members').insert({ workspace_id: ctx.workspaceId, user_id: userId, role });
  await upsertUsageCounter(ctx.workspaceId, { member_count: 1 });
  await logAuditEvent({
    workspaceId: ctx.workspaceId,
    actorUserId: ctx.user.id,
    action: 'member.added',
    objectType: 'workspace_member',
    payload: { userId, role }
  });

  revalidatePath('/app/admin');
}

async function createEmployeeInviteAction(formData: FormData) {
  'use server';
  const ctx = await getCurrentWorkspace();
  if (!ctx || !['owner', 'admin'].includes(ctx.role)) return;

  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const role = String(formData.get('role') ?? 'viewer');
  const hours = Number(formData.get('hours') || 168);
  if (!email) return;

  const supabase = await createSupabaseServerClient();
  const token = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
  const expiresAt = new Date(Date.now() + Math.max(1, Math.min(720, hours)) * 3600 * 1000).toISOString();

  await supabase.from('employee_invites').insert({
    workspace_id: ctx.workspaceId,
    email,
    role,
    token,
    expires_at: expiresAt,
    created_by: ctx.user.id
  });

  revalidatePath('/app/admin');
}

async function createContractorInviteAction(formData: FormData) {
  'use server';
  const ctx = await getCurrentWorkspace();
  if (!ctx || !['owner', 'admin', 'issuer'].includes(ctx.role)) return;

  const siteId = String(formData.get('site_id') ?? '').trim() || null;
  const hours = Number(formData.get('hours') || 168);

  const supabase = await createSupabaseServerClient();
  const token = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
  const expiresAt = new Date(Date.now() + Math.max(1, Math.min(720, hours)) * 3600 * 1000).toISOString();

  await supabase.from('contractor_invites').insert({
    workspace_id: ctx.workspaceId,
    site_id: siteId,
    token,
    expires_at: expiresAt,
    created_by: ctx.user.id
  });

  revalidatePath('/app/admin');
}

async function revokeEmployeeInviteAction(formData: FormData) {
  'use server';
  const ctx = await getCurrentWorkspace();
  if (!ctx || !['owner', 'admin'].includes(ctx.role)) return;
  const inviteId = String(formData.get('invite_id') ?? '');
  if (!inviteId) return;

  const supabase = await createSupabaseServerClient();
  await supabase
    .from('employee_invites')
    .update({ revoked_at: new Date().toISOString() })
    .eq('workspace_id', ctx.workspaceId)
    .eq('id', inviteId)
    .is('accepted_at', null)
    .is('revoked_at', null);

  revalidatePath('/app/admin');
}

async function revokeContractorInviteAction(formData: FormData) {
  'use server';
  const ctx = await getCurrentWorkspace();
  if (!ctx || !['owner', 'admin', 'issuer'].includes(ctx.role)) return;
  const inviteId = String(formData.get('invite_id') ?? '');
  if (!inviteId) return;

  const supabase = await createSupabaseServerClient();
  await supabase
    .from('contractor_invites')
    .update({ revoked_at: new Date().toISOString() })
    .eq('workspace_id', ctx.workspaceId)
    .eq('id', inviteId)
    .is('accepted_at', null)
    .is('revoked_at', null);

  revalidatePath('/app/admin');
}

export default async function AdminPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const ctx = await getCurrentWorkspace();
  const supabase = await createSupabaseServerClient();

  const [members, audits, employeeInvites, contractorInvites, sites] = await Promise.all([
    ctx
      ? (await supabase
          .from('workspace_members')
          .select('id,user_id,role,created_at')
          .eq('workspace_id', ctx.workspaceId)
          .order('created_at', { ascending: true })).data ?? []
      : [],
    ctx
      ? (await supabase
          .from('audit_events')
          .select('id,action,object_type,created_at')
          .eq('workspace_id', ctx.workspaceId)
          .order('created_at', { ascending: false })
          .limit(50)).data ?? []
      : [],
    ctx
      ? (await supabase
          .from('employee_invites')
          .select('id,email,role,token,expires_at,accepted_at,revoked_at')
          .eq('workspace_id', ctx.workspaceId)
          .order('created_at', { ascending: false })
          .limit(30)).data ?? []
      : [],
    ctx
      ? (await supabase
          .from('contractor_invites')
          .select('id,token,site_id,expires_at,accepted_at,revoked_at')
          .eq('workspace_id', ctx.workspaceId)
          .order('created_at', { ascending: false })
          .limit(30)).data ?? []
      : [],
    ctx ? (await supabase.from('sites').select('id,name').eq('workspace_id', ctx.workspaceId).order('name')).data ?? [] : []
  ]);

  return (
    <AppShell title="Admin">
      {error === 'user_limit_reached' ? (
        <p className="mb-3 rounded-md bg-amber-50 p-3 text-sm text-amber-700">User limit reached for this plan.</p>
      ) : null}
      {error === 'forbidden' ? (
        <p className="mb-3 rounded-md bg-red-50 p-3 text-sm text-red-700">Only owner/admin can add members.</p>
      ) : null}
      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Workspace members (internal employees)">
          <form action={addMemberAction} className="mb-3 grid gap-2">
            <input name="user_id" placeholder="Supabase user UUID" className="rounded border px-3 py-2 text-sm" />
            <select name="role" className="rounded border px-3 py-2 text-sm">
              <option value="viewer">viewer</option>
              <option value="issuer">issuer</option>
              <option value="approver">approver</option>
              <option value="admin">admin</option>
            </select>
            <Button type="submit">Add member</Button>
          </form>
          <ul className="space-y-2 text-sm">
            {members.map((m) => (
              <li key={m.id} className="rounded border p-2">
                <div className="font-medium">{m.user_id}</div>
                <div className="text-slate-600">Role: {m.role}</div>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Employee onboarding links">
          <form action={createEmployeeInviteAction} className="mb-3 grid gap-2">
            <input name="email" type="email" placeholder="employee@company.com" className="rounded border px-3 py-2 text-sm" />
            <select name="role" className="rounded border px-3 py-2 text-sm">
              <option value="viewer">viewer</option>
              <option value="issuer">issuer</option>
              <option value="approver">approver</option>
              <option value="admin">admin</option>
            </select>
            <input name="hours" type="number" defaultValue={168} min={1} max={720} className="rounded border px-3 py-2 text-sm" />
            <Button type="submit">Create employee invite</Button>
          </form>
          <ul className="space-y-2 text-xs">
            {employeeInvites.map((i) => (
              <li key={i.id} className="rounded border p-2">
                <div className="font-medium">{i.email} • {i.role}</div>
                <div className="text-slate-600 break-all">{`${process.env.APP_BASE_URL ?? ''}/api/public/onboarding/employee/${i.token}`}</div>
                <div className="text-slate-500">Expires: {new Date(i.expires_at).toLocaleString()} {i.accepted_at ? '• accepted' : ''} {i.revoked_at ? '• revoked' : ''}</div>
                {!i.accepted_at && !i.revoked_at ? (
                  <form action={revokeEmployeeInviteAction} className="mt-1">
                    <input type="hidden" name="invite_id" value={i.id} />
                    <Button type="submit" variant="danger" className="min-h-0 px-2 py-1 text-xs">Revoke</Button>
                  </form>
                ) : null}
              </li>
            ))}
            {!employeeInvites.length ? <li className="text-slate-500">No employee invites yet.</li> : null}
          </ul>
        </Card>

        <Card title="Contractor self-onboarding links">
          <form action={createContractorInviteAction} className="mb-3 grid gap-2">
            <select name="site_id" className="rounded border px-3 py-2 text-sm">
              <option value="">No specific site</option>
              {sites.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <input name="hours" type="number" defaultValue={168} min={1} max={720} className="rounded border px-3 py-2 text-sm" />
            <Button type="submit">Create contractor invite</Button>
          </form>
          <ul className="space-y-2 text-xs">
            {contractorInvites.map((i) => (
              <li key={i.id} className="rounded border p-2">
                <div className="text-slate-600 break-all">{`${process.env.APP_BASE_URL ?? ''}/api/public/onboarding/contractor/${i.token}`}</div>
                <div className="text-slate-500">Expires: {new Date(i.expires_at).toLocaleString()} {i.accepted_at ? '• accepted' : ''} {i.revoked_at ? '• revoked' : ''}</div>
                {!i.accepted_at && !i.revoked_at ? (
                  <form action={revokeContractorInviteAction} className="mt-1">
                    <input type="hidden" name="invite_id" value={i.id} />
                    <Button type="submit" variant="danger" className="min-h-0 px-2 py-1 text-xs">Revoke</Button>
                  </form>
                ) : null}
              </li>
            ))}
            {!contractorInvites.length ? <li className="text-slate-500">No contractor invites yet.</li> : null}
          </ul>
        </Card>

        <Card title="Audit events">
          <ul className="space-y-2 text-sm">
            {audits.map((a) => (
              <li key={a.id} className="rounded border p-2">
                <div className="font-medium">{a.action}</div>
                <div className="text-slate-600">{a.object_type} • {new Date(a.created_at).toLocaleString()}</div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </AppShell>
  );
}
