'use client';

import { useState } from 'react';

export function BillingControls() {
  const [busy, setBusy] = useState<string | null>(null);

  async function goCheckout(plan: 'starter' | 'growth' | 'scale') {
    setBusy(`checkout:${plan}`);
    const res = await fetch('/api/billing/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan })
    });
    const j = await res.json();
    setBusy(null);
    if (j?.ok && j?.data?.url) window.location.href = j.data.url;
    else alert(j?.error?.message ?? 'Failed to open checkout');
  }

  async function openPortal() {
    setBusy('portal');
    const res = await fetch('/api/billing/stripe/portal', { method: 'POST' });
    const j = await res.json();
    setBusy(null);
    if (j?.ok && j?.data?.url) window.location.href = j.data.url;
    else alert(j?.error?.message ?? 'Failed to open billing portal');
  }

  return (
    <div className="space-y-2 text-xs">
      <div className="flex flex-wrap gap-2">
        <button onClick={() => goCheckout('starter')} disabled={!!busy} className="rounded border px-2 py-1">Starter checkout</button>
        <button onClick={() => goCheckout('growth')} disabled={!!busy} className="rounded border px-2 py-1">Growth checkout</button>
        <button onClick={() => goCheckout('scale')} disabled={!!busy} className="rounded border px-2 py-1">Scale checkout</button>
        <button onClick={openPortal} disabled={!!busy} className="rounded border px-2 py-1">Billing portal</button>
      </div>
      <p className="text-slate-500">Set `STRIPE_SECRET_KEY` and `STRIPE_PRICE_*` env vars to enable live checkout.</p>
    </div>
  );
}
