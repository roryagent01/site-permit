import { notFound } from 'next/navigation';
import { formatDateValue } from '@/lib/i18n/date';

async function getPortalData(token: string) {
  const base = process.env.APP_BASE_URL ?? 'http://localhost:3000';
  const res = await fetch(`${base}/api/public/contractor-portal/${token}`, { cache: 'no-store' });
  return res.json();
}

export default async function ContractorPortalTokenPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const data = await getPortalData(token);
  if (!data?.ok) notFound();

  const contractor = data.data.contractor;
  const quals = data.data.qualifications ?? [];
  const training = data.data.trainingRecords ?? [];

  return (
    <main className="mx-auto max-w-3xl p-4">
      <h1 className="text-2xl font-semibold text-blue-900">Contractor Portal</h1>
      <p className="mt-1 text-sm text-slate-600">{contractor?.name} • {contractor?.status}</p>

      <section className="mt-4 rounded border bg-white p-3">
        <h2 className="mb-2 font-medium">Qualification status</h2>
        <ul className="space-y-2 text-sm">
          {quals.map((q: any) => (
            <li key={q.id} className="rounded border p-2">
              <div className="font-medium">{q.qualification_types?.name ?? 'Qualification'}</div>
              <div className="text-slate-600">Expiry: {q.expiry_date ?? '-'} • {q.verification_status}</div>
            </li>
          ))}
          {!quals.length ? <li className="text-slate-500">No qualifications found.</li> : null}
        </ul>
      </section>

      <section className="mt-4 rounded border bg-white p-3">
        <h2 className="mb-2 font-medium">Training completion history</h2>
        <ul className="space-y-2 text-sm">
          {training.map((t: any) => (
            <li key={t.id} className="rounded border p-2">
              <div className="font-medium">{t.training_modules?.title ?? 'Training'}</div>
              <div className="text-slate-600">{t.recipient_email} • {formatDateValue(t.completed_at)}</div>
            </li>
          ))}
          {!training.length ? <li className="text-slate-500">No completed training records yet.</li> : null}
        </ul>
      </section>
    </main>
  );
}
