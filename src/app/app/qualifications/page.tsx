import Link from 'next/link';
import { AppShell } from '@/components/app-shell';
import { Card } from '@/components/ui/card';

export default function QualificationsPage() {
  return (
    <AppShell title="Qualifications">
      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Qualification setup">
          <p className="mb-3 text-sm text-slate-600">Manage qualification types and validity rules.</p>
          <Link href="/app/qualifications/types" className="rounded-md bg-blue-700 px-4 py-2 text-sm text-white">Open qualification types</Link>
        </Card>
        <Card title="Contractor qualification records">
          <p className="mb-3 text-sm text-slate-600">Issue/expiry dates, verification status, and evidence links.</p>
          <Link href="/app/qualifications/records" className="rounded-md bg-blue-700 px-4 py-2 text-sm text-white">Open records</Link>
        </Card>
      </div>
    </AppShell>
  );
}
