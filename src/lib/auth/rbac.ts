import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const roleRank = {
  viewer: 1,
  issuer: 2,
  approver: 3,
  admin: 4,
  owner: 5
} as const;

type Role = keyof typeof roleRank;

export async function requireAuth() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    redirect('/auth/login');
  }

  return data.user;
}

export async function requireWorkspaceRole(workspaceId: string, minimumRole: Role) {
  const user = await requireAuth();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)
    .single();

  if (error || !data || roleRank[data.role as Role] < roleRank[minimumRole]) {
    redirect('/app/dashboard?error=forbidden');
  }

  return { user, role: data.role as Role };
}
