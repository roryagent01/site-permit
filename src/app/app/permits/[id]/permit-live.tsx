'use client';

import { useEffect, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';

export function PermitLiveStatus({ permitId, initialStatus }: { permitId: string; initialStatus: string }) {
  const [status, setStatus] = useState(initialStatus);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    const channel = supabase
      .channel(`permit-${permitId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'permits', filter: `id=eq.${permitId}` },
        (payload) => {
          const next = payload.new as { status?: string };
          if (next?.status) setStatus(next.status);
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [permitId]);

  return <p className="text-sm text-slate-600">Live status: {status}</p>;
}
