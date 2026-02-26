import Link from 'next/link';

const docs = [
  { title: 'Agent API Capability Matrix', path: '/docs/agent-api', source: 'docs/agent-api.md' },
  { title: 'Email Notifications', path: '/docs/email-notifications', source: 'docs/email-notifications.md' },
  { title: 'Operations Runbook', path: '/docs/ops-runbook', source: 'docs/ops-runbook.md' },
  { title: 'Security Hardening', path: '/docs/production/security-hardening', source: 'docs/production/security-hardening.md' },
  { title: 'Reliability & Recovery', path: '/docs/production/reliability-recovery', source: 'docs/production/reliability-recovery.md' },
  { title: 'Observability', path: '/docs/production/observability', source: 'docs/production/observability.md' },
  { title: 'Performance & Scale', path: '/docs/production/performance-scale', source: 'docs/production/performance-scale.md' }
];

export default function DocsIndexPage() {
  return (
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="text-3xl font-semibold text-blue-900">Documentation</h1>
      <p className="mt-2 text-slate-600">Public docs index for implementation, API automation, and operations guidance.</p>
      <ul className="mt-6 space-y-2">
        {docs.map((d) => (
          <li key={d.path} className="rounded border bg-white p-3">
            <div className="font-medium">{d.title}</div>
            <div className="text-xs text-slate-500">Source: <code>{d.source}</code></div>
            <div className="mt-1 text-sm text-blue-700">{d.path}</div>
          </li>
        ))}
      </ul>
      <div className="mt-6">
        <Link href="/" className="text-sm text-blue-700 hover:underline">Back to home</Link>
      </div>
    </main>
  );
}
