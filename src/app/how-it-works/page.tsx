const steps = [
  'Create permit templates for your site risks',
  'Issue permits and route approvals',
  'Track contractor qualifications and expiries',
  'Get daily digest reminders',
  'Export permit PDFs and review audit logs'
];

export default function HowItWorksPage() {
  return (
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="text-3xl font-semibold text-blue-900">How it works</h1>
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
