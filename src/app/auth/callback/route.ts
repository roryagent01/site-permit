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
