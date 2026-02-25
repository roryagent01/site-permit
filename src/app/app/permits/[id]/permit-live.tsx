'use client';

import { useEffect, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';

export function PermitLiveStatus({
  permitId,
  initialStatus,
  initialApprovalCount
}: {
  permitId: string;
  initialStatus: string;
  initialApprovalCount: number;
}) {
  const [status, setStatus] = useState(initialStatus);
  const [approvalCount, setApprovalCount] = useState(initialApprovalCount);

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
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'permit_approvals', filter: `permit_id=eq.${permitId}` },
        () => setApprovalCount((c) => c + 1)
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [permitId]);

  return (
    <p className="text-sm text-slate-600">
      Live status: {status} • Approval events: {approvalCount}
    </p>
  );
}
