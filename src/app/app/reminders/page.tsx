import { revalidatePath } from 'next/cache';
import { AppShell } from '@/components/app-shell';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getCurrentWorkspace } from '@/lib/workspace/current';
import { logAuditEvent } from '@/lib/audit/events';

async function saveReminderSettingsAction(formData: FormData) {
  'use server';
  const ctx = await getCurrentWorkspace();
  if (!ctx) return;

  const windows = String(formData.get('windows') ?? '30,14,7')
    .split(',')
    .map((x) => Number(x.trim()))
    .filter((n) => Number.isFinite(n) && n > 0);

  const supabase = await createSupabaseServerClient();
  const digestEnabled = formData.get('digest_enabled') === 'on';

  await supabase.from('reminder_settings').upsert({
    workspace_id: ctx.workspaceId,
    windows_days: windows,
    digest_enabled: digestEnabled,
    updated_at: new Date().toISOString()
  });

  await logAuditEvent({
    workspaceId: ctx.workspaceId,
    actorUserId: ctx.user.id,
    action: 'reminder_settings.updated',
    objectType: 'reminder_settings',
    payload: { windows, digestEnabled }
  });

  revalidatePath('/app/reminders');
}

async function reminderQualificationAction(formData: FormData) {
  'use server';
  const ctx = await getCurrentWorkspace();
  if (!ctx || !['admin', 'owner'].includes(ctx.role)) return;

  const qualificationId = String(formData.get('qualification_id') ?? '');
  const action = String(formData.get('action') ?? ''); // renew | waive
  const reason = String(formData.get('reason') ?? '').trim();
  if (!qualificationId || !['renew', 'waive'].includes(action)) return;

  const supabase = await createSupabaseServerClient();

  if (action === 'renew') {
    const { data: rec } = await supabase
      .from('contractor_qualifications')
      .select('issue_date,expiry_date')
      .eq('workspace_id', ctx.workspaceId)
      .eq('id', qualificationId)
      .single();

    const newIssue = new Date().toISOString().slice(0, 10);
    const current = rec?.expiry_date ? new Date(`${rec.expiry_date}T00:00:00Z`) : new Date();
    current.setMonth(current.getMonth() + 12);
    const newExpiry = current.toISOString().slice(0, 10);

    await supabase
      .from('contractor_qualifications')
      .update({ issue_date: newIssue, expiry_date: newExpiry, waived: false, waiver_reason: null, waived_until: null })
      .eq('workspace_id', ctx.workspaceId)
      .eq('id', qualificationId);
  }

  if (action === 'waive') {
    if (!reason) return;
    const waivedUntil = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().slice(0, 10);
    await supabase
      .from('contractor_qualifications')
      .update({ waived: true, waiver_reason: reason, waived_until: waivedUntil })
      .eq('workspace_id', ctx.workspaceId)
      .eq('id', qualificationId);
  }

  await logAuditEvent({
    workspaceId: ctx.workspaceId,
    actorUserId: ctx.user.id,
    action: `reminder_qualification.${action}`,
    objectType: 'contractor_qualification',
    objectId: qualificationId,
    payload: { reason: reason || null }
  });

  revalidatePath('/app/reminders');
}

async function resendDeliveryAction(formData: FormData) {
  'use server';
  const ctx = await getCurrentWorkspace();
  if (!ctx) return;

  const sourceDeliveryId = String(formData.get('delivery_id') ?? '');
  if (!sourceDeliveryId) return;

  const supabase = await createSupabaseServerClient();
  const { data: src } = await supabase
    .from('reminder_deliveries')
    .select('id,delivery_key,recipient,payload,mode')
    .eq('workspace_id', ctx.workspaceId)
    .eq('id', sourceDeliveryId)
    .maybeSingle();

  if (!src) return;

  await supabase.from('reminder_deliveries').insert({
    workspace_id: ctx.workspaceId,
    delivery_key: `${src.delivery_key}:resend:${Date.now()}`,
    recipient: src.recipient,
    payload: src.payload,
    mode: src.mode,
    resend_of: src.id,
    send_status: 'sent'
  });

  await logAuditEvent({
    workspaceId: ctx.workspaceId,
    actorUserId: ctx.user.id,
    action: 'reminder_delivery.resent',
    objectType: 'reminder_delivery',
    objectId: src.id,
    payload: { recipient: src.recipient }
  });

  revalidatePath('/app/reminders');
}

export default async function RemindersPage() {
  const ctx = await getCurrentWorkspace();
  const supabase = await createSupabaseServerClient();

  const [settings, deliveries, expiring] = await Promise.all([
    ctx
      ? (await supabase.from('reminder_settings').select('*').eq('workspace_id', ctx.workspaceId).maybeSingle()).data
      : null,
    ctx
      ? (await supabase
          .from('reminder_deliveries')
          .select('id,delivery_key,recipient,sent_at,mode,send_status,resend_of')
          .eq('workspace_id', ctx.workspaceId)
          .order('sent_at', { ascending: false })
          .limit(20)).data ?? []
      : [],
    ctx
      ? (await supabase
          .from('contractor_qualifications')
          .select('id,expiry_date,waived,waiver_reason,contractors(name),qualification_types(name)')
          .eq('workspace_id', ctx.workspaceId)
          .lte('expiry_date', new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().slice(0, 10))
          .order('expiry_date', { ascending: true })
          .limit(30)).data ?? []
      : []
  ]);

  return (
    <AppShell title="Reminder Settings & Delivery Logs">
      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Settings">
          <form action={saveReminderSettingsAction} className="space-y-3">
            <label className="block text-sm">Reminder windows (days, comma-separated)</label>
            <input
              name="windows"
              defaultValue={(settings?.windows_days as number[] | undefined)?.join(',') ?? '30,14,7'}
              className="w-full rounded-md border px-3 py-2"
            />
            <label className="flex items-center gap-2 text-sm">
              <input name="digest_enabled" type="checkbox" defaultChecked={settings?.digest_enabled ?? true} /> Daily digest enabled
            </label>
            <Button type="submit">Save reminder settings</Button>
          </form>
        </Card>
        <Card title="Delivery logs">
          <ul className="space-y-2 text-sm">
            {deliveries.map((d) => (
              <li key={d.id} className="rounded border p-2">
                <div className="font-medium">{d.delivery_key}</div>
                <div className="text-slate-600">
                  {d.recipient} • {new Date(d.sent_at).toLocaleString()} • mode={d.mode} • status={d.send_status}
                </div>
                <form action={resendDeliveryAction} className="mt-2">
                  <input type="hidden" name="delivery_id" value={d.id} />
                  <Button type="submit" variant="secondary" className="px-3 py-1.5 text-xs min-h-0">
                    Resend
                  </Button>
                </form>
              </li>
            ))}
            {deliveries.length === 0 ? <li className="text-slate-500">No deliveries logged yet.</li> : null}
          </ul>
        </Card>

        <Card title="Expiring qualifications (smart actions)">
          <ul className="space-y-2 text-sm">
            {expiring.map((q) => (
              <li key={q.id} className="rounded border p-2">
                <div className="font-medium">
                  {(q.contractors as { name?: string } | null)?.name} • {(q.qualification_types as { name?: string } | null)?.name}
                </div>
                <div className="text-slate-600">Expiry: {q.expiry_date ?? '-'} {q.waived ? '• waived' : ''}</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <form action={reminderQualificationAction}>
                    <input type="hidden" name="qualification_id" value={q.id} />
                    <input type="hidden" name="action" value="renew" />
                    <Button type="submit" variant="secondary" className="min-h-0 px-2 py-1 text-xs">Mark renewed (+12m)</Button>
                  </form>
                  <form action={reminderQualificationAction} className="flex items-center gap-1">
                    <input type="hidden" name="qualification_id" value={q.id} />
                    <input type="hidden" name="action" value="waive" />
                    <input name="reason" placeholder="Waive reason" className="rounded border px-2 py-1 text-xs" />
                    <Button type="submit" variant="secondary" className="min-h-0 px-2 py-1 text-xs">Waive 30d</Button>
                  </form>
                </div>
              </li>
            ))}
            {expiring.length === 0 ? <li className="text-slate-500">No expiring qualifications in 30 days.</li> : null}
          </ul>
        </Card>
      </div>
    </AppShell>
  );
}
