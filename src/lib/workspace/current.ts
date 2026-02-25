import { createSupabaseServerClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth/rbac';

export async function getCurrentWorkspace() {
  const user = await requireAuth();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from('workspace_members')
    .select('workspace_id, role, workspaces(name, plan)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(1)
    .single();

  if (error || !data) return null;

  return {
    user,
    workspaceId: data.workspace_id,
    role: data.role,
    workspaceName: (data.workspaces as { name?: string } | null)?.name ?? 'Workspace',
    workspacePlan: (data.workspaces as { plan?: string } | null)?.plan ?? 'starter'
  };
}
