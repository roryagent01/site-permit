import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

async function bootstrapWorkspaceForUser(userId: string, email?: string | null) {
  const supabase = await createSupabaseServerClient();

  const { data: membership } = await supabase
    .from('workspace_members')
    .select('id')
    .eq('user_id', userId)
    .limit(1);

  if (membership && membership.length > 0) return;

  const companyName = email?.split('@')[0]?.replace(/[._-]/g, ' ') || 'My Company';

  const { data: workspace, error: workspaceError } = await supabase
    .from('workspaces')
    .insert({
      name: companyName.replace(/\b\w/g, (m) => m.toUpperCase())
    })
    .select('id')
    .single();

  if (workspaceError || !workspace) return;

  await supabase.from('workspace_members').insert({
    workspace_id: workspace.id,
    user_id: userId,
    role: 'owner'
  });

  await supabase.from('sites').insert({
    workspace_id: workspace.id,
    name: 'Main Site'
  });

  await supabase.from('qualification_types').insert([
    { workspace_id: workspace.id, name: 'Manual Handling', validity_months: 24, evidence_required: true },
    { workspace_id: workspace.id, name: 'Working at Height', validity_months: 24, evidence_required: true },
    { workspace_id: workspace.id, name: 'Confined Space', validity_months: 24, evidence_required: true },
    { workspace_id: workspace.id, name: 'Electrical', validity_months: 24, evidence_required: true },
    { workspace_id: workspace.id, name: 'Insurance', validity_months: 12, evidence_required: true },
    { workspace_id: workspace.id, name: 'RAMS Review', validity_months: 12, evidence_required: false }
  ]);

  await supabase.from('reminder_settings').upsert({
    workspace_id: workspace.id,
    windows_days: [30, 14, 7],
    digest_enabled: true,
    updated_at: new Date().toISOString()
  });
}

export async function GET(request: Request) {
  const reqUrl = new URL(request.url);
  const code = reqUrl.searchParams.get('code');
  const next = reqUrl.searchParams.get('next') ?? '/app/dashboard';

  if (!code) {
    return NextResponse.redirect(new URL('/auth/login?error=missing_code', reqUrl.origin));
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL('/auth/login?error=callback_failed', reqUrl.origin));
  }

  const { data } = await supabase.auth.getUser();
  if (data.user) {
    await bootstrapWorkspaceForUser(data.user.id, data.user.email);
  }

  return NextResponse.redirect(new URL(next, reqUrl.origin));
}
