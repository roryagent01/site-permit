import Link from 'next/link';

export default function HomePage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Site Permit',
    url: process.env.APP_BASE_URL ?? 'https://example.com',
    description: 'WorkPermitOS for permit-to-work, contractor qualifications, and induction tracking.'
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 p-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <h1 className="text-3xl font-semibold text-blue-900">Site Permit</h1>
      <p className="text-slate-700">Clean industrial Permit-to-Work and Contractor Qualification platform for SMB teams.</p>
      <div className="flex flex-wrap gap-2">
        <Link href="/pricing" className="rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white">Pricing</Link>
        <Link href="/how-it-works" className="rounded-md border px-4 py-2 text-sm font-medium">How it works</Link>
        <Link href="/auth/login" className="rounded-md border px-4 py-2 text-sm font-medium">Login</Link>
      </div>
      <div className="rounded-lg border border-blue-100 bg-white p-4">
        <p className="font-medium text-slate-800">MVP routes scaffolded:</p>
        <ul className="mt-2 list-disc pl-6 text-sm text-slate-700">
          <li>/auth/login</li>
          <li>/app/dashboard</li>
          <li>/app/permits</li>
          <li>/app/templates</li>
          <li>/app/contractors</li>
          <li>/app/qualifications</li>
          <li>/app/reminders</li>
          <li>/app/reports</li>
          <li>/app/settings</li>
          <li>/app/admin</li>
        </ul>
      </div>
    </main>
  );
}
