const steps = [
  'Create permit templates for your site risks',
  'Issue permits and route approvals',
  'Track contractor qualifications and expiries',
  'Get daily digest reminders',
  'Export permit PDFs and review audit logs'
];

export default function HowItWorksPage() {
  const orgJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Site Permit',
    url: process.env.APP_BASE_URL ?? 'https://example.com',
    description: 'WorkPermitOS: permit-to-work, contractor qualifications, and induction workflows for SMB teams.'
  };

  return (
    <main className="mx-auto max-w-5xl p-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />
      <h1 className="text-3xl font-semibold text-blue-900">How it works</h1>
      <p className="mt-2 text-sm text-slate-600">Compliance note: WorkPermitOS is a practical operations tool and does not claim formal Part 11/Annex 11 validation out-of-the-box.</p>
      <ol className="mt-6 space-y-3 text-slate-700">
        {steps.map((s, i) => (
          <li key={s} className="rounded-md border bg-white p-3">
            <span className="mr-2 font-semibold text-blue-800">{i + 1}.</span>
            {s}
          </li>
        ))}
      </ol>
    </main>
  );
}
