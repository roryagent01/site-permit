import { revalidatePath } from 'next/cache';
import { AppShell } from '@/components/app-shell';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getCurrentWorkspace } from '@/lib/workspace/current';

async function saveReminderSettingsAction(formData: FormData) {
  'use server';
  const ctx = await getCurrentWorkspace();
  if (!ctx) return;

  const windows = String(formData.get('windows') ?? '30,14,7')
    .split(',')
    .map((x) => Number(x.trim()))
    .filter((n) => Number.isFinite(n) && n > 0);

  const supabase = await createSupabaseServerClient();
  await supabase.from('reminder_settings').upsert({
    workspace_id: ctx.workspaceId,
    windows_days: windows,
    digest_enabled: formData.get('digest_enabled') === 'on',
    updated_at: new Date().toISOString()
  });

  revalidatePath('/app/reminders');
}

export default async function RemindersPage() {
  const ctx = await getCurrentWorkspace();
  const supabase = await createSupabaseServerClient();

  const [settings, deliveries] = await Promise.all([
    ctx
      ? (await supabase.from('reminder_settings').select('*').eq('workspace_id', ctx.workspaceId).maybeSingle()).data
      : null,
    ctx
      ? (await supabase
          .from('reminder_deliveries')
          .select('id,delivery_key,recipient,sent_at')
          .eq('workspace_id', ctx.workspaceId)
          .order('sent_at', { ascending: false })
          .limit(20)).data ?? []
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
                <div className="text-slate-600">{d.recipient} • {new Date(d.sent_at).toLocaleString()}</div>
              </li>
            ))}
            {deliveries.length === 0 ? <li className="text-slate-500">No deliveries logged yet.</li> : null}
          </ul>
        </Card>
      </div>
    </AppShell>
  );
}
