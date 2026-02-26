import { NextResponse } from 'next/server';
import { getCurrentWorkspace } from '@/lib/workspace/current';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getStripe } from '@/lib/billing/stripe';

const PLAN_PRICE_KEY: Record<string, string> = {
  starter: 'STRIPE_PRICE_STARTER',
  growth: 'STRIPE_PRICE_GROWTH',
  scale: 'STRIPE_PRICE_SCALE'
};

export async function POST(request: Request) {
  const ctx = await getCurrentWorkspace();
  if (!ctx) return NextResponse.json({ ok: false, error: { code: 'unauthorized', message: 'Authentication required' } }, { status: 401 });
  if (!['owner', 'admin'].includes(ctx.role)) return NextResponse.json({ ok: false, error: { code: 'forbidden', message: 'Role not allowed' } }, { status: 403 });

  const { plan } = (await request.json().catch(() => ({}))) as { plan?: 'starter' | 'growth' | 'scale' };
  if (!plan || !PLAN_PRICE_KEY[plan]) return NextResponse.json({ ok: false, error: { code: 'invalid_payload', message: 'Invalid plan' } }, { status: 400 });

  const priceId = process.env[PLAN_PRICE_KEY[plan]];
  if (!priceId) return NextResponse.json({ ok: false, error: { code: 'config_error', message: 'Missing Stripe price config' } }, { status: 500 });

  const supabase = await createSupabaseServerClient();
  const { data: ws } = await supabase.from('workspaces').select('id,name,billing_email,stripe_customer_id').eq('id', ctx.workspaceId).single();
  const stripe = getStripe();

  let customerId = ws?.stripe_customer_id as string | null;
  if (!customerId) {
    const c = await stripe.customers.create({
      email: ws?.billing_email ?? ctx.user.email ?? undefined,
      name: ws?.name ?? 'Workspace'
    });
    customerId = c.id;
    await supabase.from('workspaces').update({ stripe_customer_id: customerId }).eq('id', ctx.workspaceId);
  }

  const base = process.env.APP_BASE_URL ?? 'http://localhost:3000';
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${base}/app/settings?billing=success`,
    cancel_url: `${base}/app/settings?billing=cancel`
  });

  return NextResponse.json({ ok: true, data: { url: session.url }, error: null });
}
