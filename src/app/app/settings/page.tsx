import { revalidatePath } from 'next/cache';
import { AppShell } from '@/components/app-shell';
import { Card } from '@/components/ui/card';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getCurrentWorkspace } from '@/lib/workspace/current';
import { getPlanLimitSnapshot } from '@/lib/limits';
import { BillingControls } from './billing-controls';

function Meter({ label, used, max }: { label: string; used: number; max: number }) {
  const pct = Math.min(100, Math.round((used / Math.max(max, 1)) * 100));
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span>{label}</span>
        <span>
          {used} / {max}
        </span>
      </div>
      <div className="h-2 w-full rounded bg-slate-100">
        <div className="h-2 rounded bg-blue-700" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

async function updateWorkspacePreferencesAction(formData: FormData) {
  'use server';
  const ctx = await getCurrentWorkspace();
  if (!ctx || !['owner', 'admin'].includes(ctx.role)) return;

  const locale = String(formData.get('locale') ?? 'en-IE');
  const dateFormat = String(formData.get('date_format') ?? 'DD/MM/YYYY');
  const billingEmail = String(formData.get('billing_email') ?? '').trim() || null;

  const supabase = await createSupabaseServerClient();
  await supabase
    .from('workspaces')
    .update({ locale, date_format: dateFormat, billing_email: billingEmail })
    .eq('id', ctx.workspaceId);

  revalidatePath('/app/settings');
}

export default async function SettingsPage() {
  const ctx = await getCurrentWorkspace();
  const supabase = await createSupabaseServerClient();

  if (!ctx) {
    return (
      <AppShell title="Settings">
        <p className="text-sm text-slate-600">No workspace context.</p>
      </AppShell>
    );
  }

  const { data: workspace } = await supabase
    .from('workspaces')
    .select('billing_email,dedicated_hosting,dedicated_region,support_tier,locale,date_format,billing_status,stripe_customer_id')
    .eq('id', ctx.workspaceId)
    .maybeSingle();

  const [members, contractors, permitsMonth, webhookEvents] = await Promise.all([
    supabase.from('workspace_members').select('*', { count: 'exact', head: true }).eq('workspace_id', ctx.workspaceId),
    supabase.from('contractors').select('*', { count: 'exact', head: true }).eq('workspace_id', ctx.workspaceId),
    supabase
      .from('permits')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', ctx.workspaceId)
      .gte('created_at', new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1)).toISOString()),
    workspace?.stripe_customer_id
      ? supabase
          .from('billing_webhook_events')
          .select('stripe_event_id,event_type,processed_at')
          .eq('customer_id', workspace.stripe_customer_id)
          .order('processed_at', { ascending: false })
          .limit(5)
      : Promise.resolve({ data: [] as { stripe_event_id: string; event_type: string; processed_at: string }[] })
  ]);

  const limits = getPlanLimitSnapshot(ctx.workspacePlan);

  return (
    <AppShell title="Workspace Settings & Plan Usage">
      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Workspace">
          <p className="text-sm">Name: {ctx.workspaceName}</p>
          <p className="text-sm">Plan: {ctx.workspacePlan}</p>
          <p className="text-sm">Support: {workspace?.support_tier ?? 'email'}</p>
          <p className="text-sm">Billing email: {workspace?.billing_email ?? 'not set'}</p>
          <p className="text-sm">Dedicated hosting: {workspace?.dedicated_hosting ? `yes (${workspace?.dedicated_region ?? 'region pending'})` : 'no'}</p>
          <p className="text-sm">Locale: {workspace?.locale ?? 'en-IE'} • Date format: {workspace?.date_format ?? 'DD/MM/YYYY'}</p>
        </Card>

        <Card title="Usage">
          <div className="space-y-3">
            <Meter label="Users" used={members.count ?? 0} max={limits.users} />
            <Meter label="Contractors" used={contractors.count ?? 0} max={limits.contractors} />
            <Meter label="Permits this month" used={permitsMonth.count ?? 0} max={limits.permitsPerMonth} />
          </div>
          <p className="mt-4 text-xs text-slate-600">Need more capacity? Upgrade via billing controls below.</p>
        </Card>

        <Card title="Billing (self-serve Stripe)">
          <p className="mb-2 text-xs text-slate-600">Billing status: {workspace?.billing_status ?? 'none'} • Customer: {workspace?.stripe_customer_id ?? 'none'}</p>
          <BillingControls />
          <div className="mt-3 border-t pt-3">
            <p className="mb-2 text-xs font-medium text-slate-700">Recent billing webhook events</p>
            <ul className="space-y-1 text-xs text-slate-600">
              {(webhookEvents.data ?? []).map((e) => (
                <li key={e.stripe_event_id} className="rounded bg-slate-50 px-2 py-1">
                  {e.event_type} • {new Date(e.processed_at).toISOString()}
                </li>
              ))}
              {(webhookEvents.data ?? []).length === 0 ? <li>No webhook events yet.</li> : null}
            </ul>
          </div>
        </Card>

        <Card title="Workspace preferences (i18n/date)">
          <form action={updateWorkspacePreferencesAction} className="space-y-2 text-sm">
            <input name="billing_email" defaultValue={workspace?.billing_email ?? ''} placeholder="Billing email" className="w-full rounded border px-3 py-2" />
            <input name="locale" defaultValue={workspace?.locale ?? 'en-IE'} placeholder="Locale e.g. en-IE" className="w-full rounded border px-3 py-2" />
            <select name="date_format" defaultValue={workspace?.date_format ?? 'DD/MM/YYYY'} className="w-full rounded border px-3 py-2">
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            </select>
            <button type="submit" className="rounded border px-3 py-2 text-sm">Save preferences</button>
          </form>
        </Card>
      </div>
    </AppShell>
  );
}
