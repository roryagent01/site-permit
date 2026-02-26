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
import { formatDateValue } from '@/lib/i18n/date';

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

async function createContractorPortalInviteAction(formData: FormData) {
  'use server';
  const ctx = await getCurrentWorkspace();
  if (!ctx || !['owner', 'admin', 'issuer'].includes(ctx.role)) return;
  const contractorId = String(formData.get('contractor_id') ?? '').trim();
  const hours = Number(formData.get('hours') || 168);
  if (!contractorId) return;

  const supabase = await createSupabaseServerClient();
  const token = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
  const expiresAt = new Date(Date.now() + Math.max(1, Math.min(720, hours)) * 3600 * 1000).toISOString();

  await supabase.from('contractor_portal_invites').insert({
    workspace_id: ctx.workspaceId,
    contractor_id: contractorId,
    token,
    expires_at: expiresAt,
    created_by: ctx.user.id
  });

  revalidatePath('/app/admin');
}

async function revokeContractorPortalInviteAction(formData: FormData) {
  'use server';
  const ctx = await getCurrentWorkspace();
  if (!ctx || !['owner', 'admin', 'issuer'].includes(ctx.role)) return;
  const inviteId = String(formData.get('invite_id') ?? '');
  if (!inviteId) return;

  const supabase = await createSupabaseServerClient();
  await supabase
    .from('contractor_portal_invites')
    .update({ revoked_at: new Date().toISOString() })
    .eq('workspace_id', ctx.workspaceId)
    .eq('id', inviteId)
    .is('revoked_at', null);

  revalidatePath('/app/admin');
}

export default async function AdminPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; auditPage?: string; auditQ?: string; auditAction?: string; auditObject?: string }>;
}) {
  const { error, auditPage, auditQ, auditAction, auditObject } = await searchParams;
  const ctx = await getCurrentWorkspace();
  const supabase = await createSupabaseServerClient();

  const auditPageSize = 30;
  const auditPageNum = Math.max(1, Number(auditPage || 1));
  const auditFrom = (auditPageNum - 1) * auditPageSize;
  const auditTo = auditFrom + auditPageSize - 1;

  let auditsQuery = supabase
    .from('audit_events')
    .select('id,action,object_type,created_at,payload', { count: 'exact' })
    .eq('workspace_id', ctx?.workspaceId ?? '');
  if (auditAction) auditsQuery = auditsQuery.eq('action', auditAction);
  if (auditObject) auditsQuery = auditsQuery.eq('object_type', auditObject);
  if (auditQ) auditsQuery = auditsQuery.ilike('action', `%${auditQ}%`);

  const [workspacePrefs, members, auditsResp, employeeInvites, contractorInvites, contractorPortalInvites, sites, contractors] = await Promise.all([
    ctx
      ? (await supabase
          .from('workspaces')
          .select('locale,date_format')
          .eq('id', ctx.workspaceId)
          .maybeSingle()).data
      : null,
    ctx
      ? (await supabase
          .from('workspace_members')
          .select('id,user_id,role,created_at')
          .eq('workspace_id', ctx.workspaceId)
          .order('created_at', { ascending: true })).data ?? []
      : [],
    ctx ? await auditsQuery.order('created_at', { ascending: false }).range(auditFrom, auditTo) : null,
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
    ctx
      ? (await supabase
          .from('contractor_portal_invites')
          .select('id,contractor_id,token,expires_at,revoked_at,contractors(name)')
          .eq('workspace_id', ctx.workspaceId)
          .order('created_at', { ascending: false })
          .limit(30)).data ?? []
      : [],
    ctx ? (await supabase.from('sites').select('id,name').eq('workspace_id', ctx.workspaceId).order('name')).data ?? [] : [],
    ctx ? (await supabase.from('contractors').select('id,name').eq('workspace_id', ctx.workspaceId).order('name')).data ?? [] : []
  ]);

  const audits = auditsResp?.data ?? [];
  const auditsTotal = auditsResp?.count ?? 0;
  const auditsTotalPages = Math.max(1, Math.ceil(auditsTotal / auditPageSize));
  const locale = (workspacePrefs?.locale as string | undefined) ?? 'en-IE';
  const dateFormat = (workspacePrefs?.date_format as 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD' | undefined) ?? 'DD/MM/YYYY';

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

        <Card title="Contractor portal scoped links">
          <form action={createContractorPortalInviteAction} className="mb-3 grid gap-2">
            <select name="contractor_id" className="rounded border px-3 py-2 text-sm">
              <option value="">Select contractor</option>
              {contractors.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <input name="hours" type="number" defaultValue={168} min={1} max={720} className="rounded border px-3 py-2 text-sm" />
            <Button type="submit">Create contractor portal link</Button>
          </form>
          <ul className="space-y-2 text-xs">
            {contractorPortalInvites.map((i) => (
              <li key={i.id} className="rounded border p-2">
                <div className="font-medium">{(i.contractors as { name?: string } | null)?.name ?? i.contractor_id}</div>
                <div className="text-slate-600 break-all">{`${process.env.APP_BASE_URL ?? ''}/contractor/portal/${i.token}`}</div>
                <div className="text-slate-500">Expires: {formatDateValue(i.expires_at, { locale, dateFormat })} {i.revoked_at ? '• revoked' : ''}</div>
                {!i.revoked_at ? (
                  <form action={revokeContractorPortalInviteAction} className="mt-1">
                    <input type="hidden" name="invite_id" value={i.id} />
                    <Button type="submit" variant="danger" className="min-h-0 px-2 py-1 text-xs">Revoke</Button>
                  </form>
                ) : null}
              </li>
            ))}
            {!contractorPortalInvites.length ? <li className="text-slate-500">No contractor portal links yet.</li> : null}
          </ul>
        </Card>

        <Card title="Audit events">
          <form className="mb-3 grid gap-2 md:grid-cols-4">
            <input name="auditQ" defaultValue={auditQ} placeholder="Search action" className="rounded border px-2 py-1 text-xs" />
            <input name="auditAction" defaultValue={auditAction} placeholder="Exact action" className="rounded border px-2 py-1 text-xs" />
            <input name="auditObject" defaultValue={auditObject} placeholder="Exact object type" className="rounded border px-2 py-1 text-xs" />
            <button type="submit" className="rounded border px-2 py-1 text-xs">Apply</button>
          </form>
          <ul className="space-y-2 text-sm">
            {audits.map((a) => (
              <li key={a.id} className="rounded border p-2">
                <div className="font-medium">{a.action}</div>
                <div className="text-slate-600">{a.object_type} • {formatDateValue(a.created_at, { locale, dateFormat })}</div>
                <details className="mt-1 text-xs text-slate-500">
                  <summary>Payload</summary>
                  <pre className="mt-1 overflow-auto rounded bg-slate-50 p-2">{JSON.stringify(a.payload ?? {}, null, 2)}</pre>
                </details>
              </li>
            ))}
            {!audits.length ? <li className="text-slate-500">No audit events found for filters.</li> : null}
          </ul>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-600">
            <span>Page {auditPageNum} of {auditsTotalPages} • {auditsTotal} total</span>
            <div className="flex gap-2">
              {auditPageNum > 1 ? (
                <a
                  href={`/app/admin?${new URLSearchParams({ ...(error ? { error } : {}), ...(auditQ ? { auditQ } : {}), ...(auditAction ? { auditAction } : {}), ...(auditObject ? { auditObject } : {}), auditPage: String(auditPageNum - 1) }).toString()}`}
                  className="rounded border px-2 py-1"
                >
                  Prev
                </a>
              ) : null}
              {auditPageNum < auditsTotalPages ? (
                <a
                  href={`/app/admin?${new URLSearchParams({ ...(error ? { error } : {}), ...(auditQ ? { auditQ } : {}), ...(auditAction ? { auditAction } : {}), ...(auditObject ? { auditObject } : {}), auditPage: String(auditPageNum + 1) }).toString()}`}
                  className="rounded border px-2 py-1"
                >
                  Next
                </a>
              ) : null}
            </div>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
