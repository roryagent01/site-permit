import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getStripe } from '@/lib/billing/stripe';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

const PRICE_PLAN: Record<string, 'starter' | 'growth' | 'scale'> = {
  [process.env.STRIPE_PRICE_STARTER ?? '']: 'starter',
  [process.env.STRIPE_PRICE_GROWTH ?? '']: 'growth',
  [process.env.STRIPE_PRICE_SCALE ?? '']: 'scale'
};

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) return NextResponse.json({ ok: false, error: 'missing_webhook_secret' }, { status: 500 });

  const signature = request.headers.get('stripe-signature');
  if (!signature) return NextResponse.json({ ok: false, error: 'missing_signature' }, { status: 400 });

  const raw = await request.text();
  const stripe = getStripe();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(raw, signature, webhookSecret);
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_signature' }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  const { data: existing } = await admin.from('billing_webhook_events').select('id').eq('stripe_event_id', event.id).maybeSingle();
  if (existing?.id) return NextResponse.json({ ok: true, duplicate: true });

  await admin.from('billing_webhook_events').insert({
    stripe_event_id: event.id,
    event_type: event.type,
    customer_id: ((event.data.object as any)?.customer as string | null) ?? null,
    payload: event as unknown as Record<string, unknown>
  });

  const obj = event.data.object as any;
  const customerId = obj?.customer as string | undefined;

  if (customerId) {
    const { data: ws } = await admin.from('workspaces').select('id').eq('stripe_customer_id', customerId).maybeSingle();
    if (ws?.id) {
      if (event.type === 'checkout.session.completed' || event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.created') {
        const subId = obj.subscription ?? obj.id;
        let priceId: string | null = null;
        let subStatus: string = 'active';
        if (obj?.items?.data?.[0]?.price?.id) priceId = obj.items.data[0].price.id;
        if (obj?.status) subStatus = String(obj.status);
        const plan = (priceId && PRICE_PLAN[priceId]) || 'starter';
        await admin.from('workspaces').update({
          plan,
          stripe_subscription_id: subId ?? null,
          stripe_price_id: priceId,
          billing_status: subStatus
        }).eq('id', ws.id);
      }

      if (event.type === 'customer.subscription.deleted') {
        await admin.from('workspaces').update({
          billing_status: 'cancelled',
          stripe_subscription_id: null
        }).eq('id', ws.id);
      }

      if (event.type === 'invoice.payment_failed') {
        await admin.from('workspaces').update({ billing_status: 'past_due' }).eq('id', ws.id);
      }

      if (event.type === 'invoice.paid') {
        await admin.from('workspaces').update({ billing_status: 'active' }).eq('id', ws.id);
      }
    }
  }

  return NextResponse.json({ ok: true });
}
