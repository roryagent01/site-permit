import { AppShell } from '@/components/app-shell';
import { Card } from '@/components/ui/card';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getCurrentWorkspace } from '@/lib/workspace/current';

export default async function AdminPage() {
  const ctx = await getCurrentWorkspace();
  const supabase = await createSupabaseServerClient();

  const [members, audits] = await Promise.all([
    ctx
      ? (await supabase
          .from('workspace_members')
          .select('id,user_id,role,created_at')
          .eq('workspace_id', ctx.workspaceId)
          .order('created_at', { ascending: true })).data ?? []
      : [],
    ctx
      ? (await supabase
          .from('audit_events')
          .select('id,action,object_type,created_at')
          .eq('workspace_id', ctx.workspaceId)
          .order('created_at', { ascending: false })
          .limit(50)).data ?? []
      : []
  ]);

  return (
    <AppShell title="Admin">
      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Workspace members">
          <ul className="space-y-2 text-sm">
            {members.map((m) => (
              <li key={m.id} className="rounded border p-2">
                <div className="font-medium">{m.user_id}</div>
                <div className="text-slate-600">Role: {m.role}</div>
              </li>
            ))}
          </ul>
        </Card>
        <Card title="Audit events">
          <ul className="space-y-2 text-sm">
            {audits.map((a) => (
              <li key={a.id} className="rounded border p-2">
                <div className="font-medium">{a.action}</div>
                <div className="text-slate-600">{a.object_type} • {new Date(a.created_at).toLocaleString()}</div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </AppShell>
  );
}
