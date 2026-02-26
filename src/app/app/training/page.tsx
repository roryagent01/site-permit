'use client';

import { useEffect, useMemo, useState } from 'react';

type Module = { id: string; title: string; summary: string | null; content_url: string | null; active: boolean };
type Contractor = { id: string; name: string };
type Invite = {
  id: string;
  recipient_email: string;
  expires_at: string;
  completed_at: string | null;
  contractors?: { name?: string } | null;
  training_modules?: { title?: string } | null;
};
type RecordRow = {
  id: string;
  recipient_email: string;
  completed_at: string;
  contractors?: { name?: string } | null;
  training_modules?: { title?: string } | null;
};

type OcrField = { field_name: string; field_value: string | null; confidence: number; snippet: string | null };

export default function TrainingPage() {
  const [modules, setModules] = useState<Module[]>([]);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [records, setRecords] = useState<RecordRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [moduleForm, setModuleForm] = useState({ title: '', summary: '', contentUrl: '' });
  const [inviteForm, setInviteForm] = useState({ contractorId: '', moduleId: '', emails: '', expiresHours: 168 });

  const [ocrText, setOcrText] = useState('');
  const [ocrFields, setOcrFields] = useState<OcrField[]>([]);
  const [ocrDocumentId, setOcrDocumentId] = useState<string>('');
  const [ocrContractorId, setOcrContractorId] = useState<string>('');
  const [ocrModuleId, setOcrModuleId] = useState<string>('');
  const [ocrQualificationTypeId, setOcrQualificationTypeId] = useState<string>('');
  const [ocrContactEmail, setOcrContactEmail] = useState<string>('');
  const [busyMsg, setBusyMsg] = useState('');

  async function loadAll() {
    setLoading(true);
    try {
      const [mRes, iRes, qRes, cRes] = await Promise.all([
        fetch('/api/app/training/modules').then((r) => r.json()),
        fetch('/api/app/training/invites').then((r) => r.json()),
        fetch('/api/app/qualifications/packs').then((r) => r.json()).catch(() => ({ ok: true, data: { items: [] } })),
        fetch('/api/app/qualifications/packs').then(() => Promise.resolve(null)).catch(() => Promise.resolve(null))
      ]);

      if (mRes?.ok) setModules(mRes.data.items ?? []);
      if (iRes?.ok) setInvites(iRes.data.items ?? []);

      const contractorsResp = await fetch('/api/app/training/invites?contractorId=').then((r) => r.json()).catch(() => null);
      if (contractorsResp?.ok && Array.isArray(contractorsResp.data?.items)) {
        // no contractor list from this endpoint; keep as-is
      }

      // fallback: load contractors/records from page-scoped helper endpoint via server action equivalent path not present,
      // so we infer contractors from invites + records and keep selectors usable from manual IDs.
      const contractorMap = new Map<string, Contractor>();
      (iRes?.data?.items ?? []).forEach((it: any) => {
        if (it.contractor_id && it.contractors?.name) contractorMap.set(it.contractor_id, { id: it.contractor_id, name: it.contractors.name });
      });
      setContractors(Array.from(contractorMap.values()));

      // quick records load from dedicated source unavailable as API; use client-side from training page server list substitute by no-op
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAll();
  }, []);

  const moduleIdOptions = useMemo(() => modules.map((m) => ({ id: m.id, label: m.title })), [modules]);

  async function createModule(e: React.FormEvent) {
    e.preventDefault();
    setBusyMsg('Creating module...');
    const res = await fetch('/api/app/training/modules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(moduleForm)
    });
    setBusyMsg('');
    if (res.ok) {
      setModuleForm({ title: '', summary: '', contentUrl: '' });
      await loadAll();
    }
  }

  async function sendInvites(e: React.FormEvent) {
    e.preventDefault();
    setBusyMsg('Sending invites...');
    const recipients = inviteForm.emails
      .split(/[\n,;]/)
      .map((x) => x.trim())
      .filter(Boolean)
      .map((email) => ({ email }));

    const res = await fetch('/api/app/training/invites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contractorId: inviteForm.contractorId,
        moduleId: inviteForm.moduleId,
        recipients,
        expiresInHours: Number(inviteForm.expiresHours)
      })
    });
    setBusyMsg('');
    if (res.ok) {
      setInviteForm({ contractorId: '', moduleId: '', emails: '', expiresHours: 168 });
      await loadAll();
    }
  }

  async function parseOcr(e: React.FormEvent) {
    e.preventDefault();
    if (!ocrText.trim()) return;
    setBusyMsg('Parsing OCR...');
    const res = await fetch('/api/app/ocr/parse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: ocrText })
    });
    const j = await res.json();
    setBusyMsg('');
    if (j?.ok) {
      setOcrDocumentId(j.data.documentId ?? '');
      setOcrFields(j.data.extracted ?? []);
      const emailLike = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.exec(ocrText)?.[0] ?? '';
      setOcrContactEmail(emailLike);
    }
  }

  async function applyOcr(e: React.FormEvent) {
    e.preventDefault();
    if (!ocrDocumentId || !ocrContractorId) return;
    setBusyMsg('Applying OCR data...');
    const expiry = ocrFields.find((f) => f.field_name === 'expiry_date')?.field_value ?? undefined;
    const trainingName = ocrFields.find((f) => f.field_name === 'training_name')?.field_value ?? undefined;

    const res = await fetch('/api/app/ocr/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        documentId: ocrDocumentId,
        contractorId: ocrContractorId,
        contractorContactEmail: ocrContactEmail || undefined,
        trainingModuleId: ocrModuleId || undefined,
        qualificationTypeId: ocrQualificationTypeId || undefined,
        override: { trainingName: trainingName || undefined, expiryDate: expiry || undefined }
      })
    });
    setBusyMsg('');
    if (res.ok) await loadAll();
  }

  return (
    <main className="mx-auto max-w-7xl p-4">
      <h1 className="mb-3 text-2xl font-semibold text-blue-900">Training & Site Induction</h1>
      {busyMsg ? <p className="mb-3 text-sm text-slate-600">{busyMsg}</p> : null}

      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded border bg-white p-3">
          <h2 className="mb-2 font-medium">Create training module</h2>
          <form onSubmit={createModule} className="space-y-2">
            <input className="w-full rounded border px-2 py-1 text-sm" placeholder="Module title" value={moduleForm.title} onChange={(e) => setModuleForm((s) => ({ ...s, title: e.target.value }))} />
            <input className="w-full rounded border px-2 py-1 text-sm" placeholder="Summary" value={moduleForm.summary} onChange={(e) => setModuleForm((s) => ({ ...s, summary: e.target.value }))} />
            <input className="w-full rounded border px-2 py-1 text-sm" placeholder="Content URL" value={moduleForm.contentUrl} onChange={(e) => setModuleForm((s) => ({ ...s, contentUrl: e.target.value }))} />
            <button className="rounded bg-blue-700 px-3 py-1.5 text-sm text-white" type="submit">Create</button>
          </form>
          <ul className="mt-3 space-y-1 text-xs text-slate-600">
            {modules.map((m) => (
              <li key={m.id}>{m.title} • {m.id}</li>
            ))}
            {!modules.length && !loading ? <li>No modules yet.</li> : null}
          </ul>
        </section>

        <section className="rounded border bg-white p-3">
          <h2 className="mb-2 font-medium">Send induction links (bulk)</h2>
          <form onSubmit={sendInvites} className="space-y-2">
            <input className="w-full rounded border px-2 py-1 text-sm" placeholder="Contractor ID" value={inviteForm.contractorId} onChange={(e) => setInviteForm((s) => ({ ...s, contractorId: e.target.value }))} />
            <select className="w-full rounded border px-2 py-1 text-sm" value={inviteForm.moduleId} onChange={(e) => setInviteForm((s) => ({ ...s, moduleId: e.target.value }))}>
              <option value="">Select module</option>
              {moduleIdOptions.map((m) => (
                <option key={m.id} value={m.id}>{m.label}</option>
              ))}
            </select>
            <textarea className="w-full rounded border px-2 py-1 text-sm" rows={4} placeholder="email1@x.com, email2@x.com" value={inviteForm.emails} onChange={(e) => setInviteForm((s) => ({ ...s, emails: e.target.value }))} />
            <input className="w-full rounded border px-2 py-1 text-sm" type="number" min={1} max={720} value={inviteForm.expiresHours} onChange={(e) => setInviteForm((s) => ({ ...s, expiresHours: Number(e.target.value) }))} />
            <button className="rounded bg-blue-700 px-3 py-1.5 text-sm text-white" type="submit">Send</button>
          </form>
          <ul className="mt-3 space-y-1 text-xs text-slate-600">
            {invites.slice(0, 12).map((i) => (
              <li key={i.id}>{i.recipient_email} • {i.completed_at ? 'completed' : 'pending'} • expires {new Date(i.expires_at).toLocaleString()}</li>
            ))}
            {!invites.length && !loading ? <li>No invites yet.</li> : null}
          </ul>
        </section>

        <section className="rounded border bg-white p-3 md:col-span-2">
          <h2 className="mb-2 font-medium">OCR intake (review before apply)</h2>
          <form onSubmit={parseOcr} className="space-y-2">
            <textarea className="w-full rounded border px-2 py-1 text-sm" rows={6} placeholder="Paste OCR text extracted from PDF/image here" value={ocrText} onChange={(e) => setOcrText(e.target.value)} />
            <button className="rounded bg-slate-800 px-3 py-1.5 text-sm text-white" type="submit">Parse OCR</button>
          </form>

          {ocrDocumentId ? (
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div>
                <p className="mb-1 text-xs text-slate-600">Extracted fields</p>
                <ul className="space-y-1 text-xs">
                  {ocrFields.map((f) => (
                    <li key={f.field_name} className="rounded border p-2">
                      <div className="font-medium">{f.field_name}</div>
                      <div>{f.field_value || '-'}</div>
                      <div className="text-slate-500">confidence: {Number(f.confidence || 0).toFixed(2)}</div>
                    </li>
                  ))}
                </ul>
              </div>

              <form onSubmit={applyOcr} className="space-y-2">
                <input className="w-full rounded border px-2 py-1 text-sm" placeholder="Contractor ID" value={ocrContractorId} onChange={(e) => setOcrContractorId(e.target.value)} />
                <input className="w-full rounded border px-2 py-1 text-sm" placeholder="Contractor contact email (optional)" value={ocrContactEmail} onChange={(e) => setOcrContactEmail(e.target.value)} />
                <select className="w-full rounded border px-2 py-1 text-sm" value={ocrModuleId} onChange={(e) => setOcrModuleId(e.target.value)}>
                  <option value="">Map to training module (optional)</option>
                  {moduleIdOptions.map((m) => (
                    <option key={m.id} value={m.id}>{m.label}</option>
                  ))}
                </select>
                <input className="w-full rounded border px-2 py-1 text-sm" placeholder="Qualification Type ID (optional)" value={ocrQualificationTypeId} onChange={(e) => setOcrQualificationTypeId(e.target.value)} />
                <button className="rounded bg-emerald-700 px-3 py-1.5 text-sm text-white" type="submit">Apply extracted data</button>
              </form>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
