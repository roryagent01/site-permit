import { createSupabaseServerClient } from '@/lib/supabase/server';

function currentPeriodMonth() {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

export async function upsertUsageCounter(workspaceId: string, patch: Partial<{ permits_created: number; storage_used_bytes: number; contractor_count: number; member_count: number }>) {
  const supabase = await createSupabaseServerClient();
  const period = currentPeriodMonth();

  const { data: existing } = await supabase
    .from('usage_counters')
    .select('id,permits_created,storage_used_bytes,contractor_count,member_count')
    .eq('workspace_id', workspaceId)
    .eq('period_month', period)
    .maybeSingle();

  const next = {
    workspace_id: workspaceId,
    period_month: period,
    permits_created: (existing?.permits_created ?? 0) + (patch.permits_created ?? 0),
    storage_used_bytes: (existing?.storage_used_bytes ?? 0) + (patch.storage_used_bytes ?? 0),
    contractor_count: (existing?.contractor_count ?? 0) + (patch.contractor_count ?? 0),
    member_count: (existing?.member_count ?? 0) + (patch.member_count ?? 0),
    updated_at: new Date().toISOString()
  };

  await supabase.from('usage_counters').upsert(next, { onConflict: 'workspace_id,period_month' });
}
