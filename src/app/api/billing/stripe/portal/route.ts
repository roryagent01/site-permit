import { NextResponse } from 'next/server';
import { getCurrentWorkspace } from '@/lib/workspace/current';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getStripe } from '@/lib/billing/stripe';

export async function POST() {
  const ctx = await getCurrentWorkspace();
  if (!ctx) return NextResponse.json({ ok: false, error: { code: 'unauthorized', message: 'Authentication required' } }, { status: 401 });
  if (!['owner', 'admin'].includes(ctx.role)) return NextResponse.json({ ok: false, error: { code: 'forbidden', message: 'Role not allowed' } }, { status: 403 });

  const supabase = await createSupabaseServerClient();
  const { data: ws } = await supabase.from('workspaces').select('stripe_customer_id').eq('id', ctx.workspaceId).single();
  if (!ws?.stripe_customer_id) return NextResponse.json({ ok: false, error: { code: 'no_customer', message: 'No stripe customer found' } }, { status: 400 });

  const stripe = getStripe();
  const base = process.env.APP_BASE_URL ?? 'http://localhost:3000';
  const session = await stripe.billingPortal.sessions.create({ customer: ws.stripe_customer_id, return_url: `${base}/app/settings` });

  return NextResponse.json({ ok: true, data: { url: session.url }, error: null });
}
