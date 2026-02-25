import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export async function getWorkspaceRoleRecipientEmails(workspaceId: string, roles: Array<'owner' | 'admin' | 'approver' | 'issuer' | 'viewer'>) {
  const admin = createSupabaseAdminClient();
  const { data: members } = await admin
    .from('workspace_members')
    .select('user_id, role')
    .eq('workspace_id', workspaceId)
    .in('role', roles);

  const emails = new Set<string>();
  for (const m of members ?? []) {
    const u = await admin.auth.admin.getUserById(m.user_id);
    const email = u.data.user?.email;
    if (email) emails.add(email);
  }

  return Array.from(emails);
}
