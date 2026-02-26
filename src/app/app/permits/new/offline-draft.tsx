'use client';

import { useEffect, useState } from 'react';

type Draft = { title: string; location: string; start_at: string; end_at: string; template_id: string; contractor_id: string };
const DRAFT_KEY = 'site-permit:offline-draft:new-permit';
const QUEUE_KEY = 'site-permit:offline-queue:new-permit';

function getQueue(): Draft[] {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
  } catch {
    return [];
  }
}

function setQueue(v: Draft[]) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(v));
}

async function replayQueue(setStatus: (s: string) => void) {
  if (!navigator.onLine) return;
  const queue = getQueue();
  if (!queue.length) return;

  let success = 0;
  let failed = 0;
  const remain: Draft[] = [];
  for (const d of queue) {
    try {
      const res = await fetch('/api/app/permits/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...d,
          source: 'offline_queue',
          sourceMeta: {
            queuedAt: new Date().toISOString(),
            replayedAt: new Date().toISOString()
          }
        })
      });
      if (res.ok) success += 1;
      else {
        failed += 1;
        remain.push(d);
      }
    } catch {
      failed += 1;
      remain.push(d);
    }
  }
  setQueue(remain);
  setStatus(`Offline queue replayed: ${success} submitted, ${failed} failed, ${remain.length} remaining.`);
}

export function OfflineDraftHelper() {
  const [status, setStatus] = useState('');

  useEffect(() => {
    const onSubmit = (e: Event) => {
      const form = e.target as HTMLFormElement | null;
      if (!form || form.tagName !== 'FORM') return;
      if (!navigator.onLine) {
        e.preventDefault();
        const data = new FormData(form);
        const draft: Draft = {
          title: String(data.get('title') ?? ''),
          location: String(data.get('location') ?? ''),
          start_at: String(data.get('start_at') ?? ''),
          end_at: String(data.get('end_at') ?? ''),
          template_id: String(data.get('template_id') ?? ''),
          contractor_id: String(data.get('contractor_id') ?? '')
        };
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
        const q = getQueue();
        q.push(draft);
        setQueue(q);
        setStatus('Offline: draft queued. It will auto-submit when back online.');
      }
    };

    const onOnline = () => {
      void replayQueue(setStatus);
    };

    document.addEventListener('submit', onSubmit, true);
    window.addEventListener('online', onOnline);
    void replayQueue(setStatus);

    return () => {
      document.removeEventListener('submit', onSubmit, true);
      window.removeEventListener('online', onOnline);
    };
  }, []);

  function restoreDraft() {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) {
      setStatus('No offline draft found.');
      return;
    }
    const draft = JSON.parse(raw) as Draft;
    for (const [k, v] of Object.entries(draft)) {
      const el = document.querySelector(`[name="${k}"]`) as HTMLInputElement | HTMLSelectElement | null;
      if (el) el.value = v;
    }
    setStatus('Offline draft restored. Review and submit.');
  }

  function clearDraft() {
    localStorage.removeItem(DRAFT_KEY);
    localStorage.removeItem(QUEUE_KEY);
    setStatus('Offline draft and queue cleared.');
  }

  return (
    <div className="mb-3 rounded border bg-amber-50 p-2 text-xs text-amber-800">
      <div className="flex flex-wrap items-center gap-2">
        <span>Offline support: drafts queue when offline and replay automatically when online.</span>
        <button type="button" onClick={restoreDraft} className="rounded border px-2 py-1">Restore draft</button>
        <button type="button" onClick={clearDraft} className="rounded border px-2 py-1">Clear draft/queue</button>
      </div>
      {status ? <div className="mt-1">{status}</div> : null}
    </div>
  );
}
