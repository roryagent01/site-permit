import { createSupabaseServerClient } from '@/lib/supabase/server';

const PLAN_LIMITS = {
  starter: {
    users: Number(process.env.STARTER_MAX_USERS ?? 10),
    contractors: Number(process.env.STARTER_MAX_CONTRACTORS ?? 25),
    permitsPerMonth: Number(process.env.STARTER_MAX_PERMITS_PER_MONTH ?? 50),
    storageMb: Number(process.env.STARTER_MAX_STORAGE_MB ?? 500)
  },
  growth: { users: 100, contractors: 200, permitsPerMonth: 500, storageMb: 5120 },
  scale: { users: 500, contractors: 1000, permitsPerMonth: 2000, storageMb: 25600 }
} as const;

export async function assertContractorWithinLimit(workspaceId: string, plan: string) {
  const supabase = await createSupabaseServerClient();
  const { count } = await supabase
    .from('contractors')
    .select('*', { count: 'exact', head: true })
    .eq('workspace_id', workspaceId);

  const limit = PLAN_LIMITS[(plan as keyof typeof PLAN_LIMITS) ?? 'starter']?.contractors ?? 25;
  if ((count ?? 0) >= limit) throw new Error('contractor_limit_reached');
}

export async function assertPermitsWithinLimit(workspaceId: string, plan: string) {
  const supabase = await createSupabaseServerClient();
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
  const { count } = await supabase
    .from('permits')
    .select('*', { count: 'exact', head: true })
    .eq('workspace_id', workspaceId)
    .gte('created_at', start);

  const limit = PLAN_LIMITS[(plan as keyof typeof PLAN_LIMITS) ?? 'starter']?.permitsPerMonth ?? 50;
  if ((count ?? 0) >= limit) throw new Error('permit_limit_reached');
}

export async function assertMembersWithinLimit(workspaceId: string, plan: string) {
  const supabase = await createSupabaseServerClient();
  const { count } = await supabase
    .from('workspace_members')
    .select('*', { count: 'exact', head: true })
    .eq('workspace_id', workspaceId);

  const limit = PLAN_LIMITS[(plan as keyof typeof PLAN_LIMITS) ?? 'starter']?.users ?? 10;
  if ((count ?? 0) >= limit) throw new Error('user_limit_reached');
}

export async function assertStorageWithinLimit(workspaceId: string, plan: string, incomingBytes = 0) {
  const supabase = await createSupabaseServerClient();
  const now = new Date();
  const periodMonth = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;

  const { data: usage } = await supabase
    .from('usage_counters')
    .select('storage_used_bytes')
    .eq('workspace_id', workspaceId)
    .eq('period_month', periodMonth)
    .maybeSingle();

  const used = usage?.storage_used_bytes ?? 0;
  const limitMb = PLAN_LIMITS[(plan as keyof typeof PLAN_LIMITS) ?? 'starter']?.storageMb ?? 500;
  const limitBytes = limitMb * 1024 * 1024;
  if (used + incomingBytes > limitBytes) throw new Error('storage_limit_reached');
}

export function getPlanLimitSnapshot(plan: string) {
  return PLAN_LIMITS[(plan as keyof typeof PLAN_LIMITS) ?? 'starter'] ?? PLAN_LIMITS.starter;
}
