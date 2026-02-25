import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { reminderDigestEmailHtml, sendEmail } from '@/lib/notifications/email';
import { getWorkspaceRoleRecipientEmails } from '@/lib/notifications/workspace-recipients';
import { enforceRateLimit, requestIp } from '@/lib/security/rate-limit';

export async function POST(request: Request) {
  const rl = enforceRateLimit(`reminder-digest:${requestIp(request.headers)}`, 10, 60_000);
  if (!rl.allowed) return NextResponse.json({ error: 'rate_limited' }, { status: 429 });

  const cronSecret = process.env.CRON_SECRET;
  const provided = request.headers.get('x-cron-secret');
  if (!cronSecret || provided !== cronSecret) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const admin = createSupabaseAdminClient();
  const today = new Date();
  const dateKey = today.toISOString().slice(0, 10);
  const emailDailyCap = Number(process.env.EMAIL_DAILY_CAP ?? 200);

  const { data: workspaces } = await admin.from('workspaces').select('id,name');
  const results: Array<{ workspaceId: string; expiringCount: number; logged: boolean; mode: 'full' | 'summary' }> = [];

  for (const ws of workspaces ?? []) {
    const { data: settings } = await admin
      .from('reminder_settings')
      .select('windows_days,digest_enabled')
      .eq('workspace_id', ws.id)
      .maybeSingle();

    if (settings?.digest_enabled === false) continue;
    const windows = (settings?.windows_days as number[] | null) ?? [30, 14, 7];

    const maxDays = Math.max(...windows);
    const limitDate = new Date(today);
    limitDate.setDate(limitDate.getDate() + maxDays);

    const { data: expiring } = await admin
      .from('contractor_qualifications')
      .select('id,expiry_date,contractors(name),qualification_types(name)')
      .eq('workspace_id', ws.id)
      .lte('expiry_date', limitDate.toISOString().slice(0, 10));

    const deliveryKey = `digest:${ws.id}:${dateKey}`;
    const recipient = `workspace:${ws.id}:owners-admins`;
    const mode: 'full' | 'summary' = (expiring?.length ?? 0) > emailDailyCap ? 'summary' : 'full';

    const recipients = await getWorkspaceRoleRecipientEmails(ws.id, ['owner', 'admin']);
    const emailResult = recipients.length
      ? await sendEmail({
          to: recipients,
          subject: `Qualification expiry digest (${ws.name})`,
          html: reminderDigestEmailHtml({
            workspaceName: ws.name,
            expiringCount: expiring?.length ?? 0,
            mode,
            appBaseUrl: process.env.APP_BASE_URL
          })
        })
      : { ok: false, error: 'no_recipients' };

    const { error } = await admin.from('reminder_deliveries').upsert(
      {
        workspace_id: ws.id,
        delivery_key: deliveryKey,
        recipient,
        mode,
        send_status: emailResult.ok ? 'sent' : 'failed',
        payload: {
          workspace: ws.name,
          expiringCount: expiring?.length ?? 0,
          windows,
          mode,
          capped: mode === 'summary',
          emailError: emailResult.ok ? null : emailResult.error,
          recipientCount: recipients.length
        }
      },
      { onConflict: 'workspace_id,delivery_key,recipient' }
    );

    results.push({ workspaceId: ws.id, expiringCount: expiring?.length ?? 0, logged: !error, mode });
  }

  return NextResponse.json({ ok: true, results });
}
