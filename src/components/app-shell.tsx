import Link from 'next/link';
import type { ReactNode } from 'react';

const links = [
  ['Dashboard', '/app/dashboard'],
  ['Permits', '/app/permits'],
  ['Templates', '/app/templates'],
  ['Contractors', '/app/contractors'],
  ['Training', '/app/training'],
  ['Qualifications', '/app/qualifications'],
  ['Reminders', '/app/reminders'],
  ['Reports', '/app/reports'],
  ['Settings', '/app/settings'],
  ['Admin', '/app/admin']
] as const;

export function AppShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <h1 className="text-lg font-semibold text-blue-900">Site Permit</h1>
          <Link className="rounded-md border border-slate-300 px-3 py-2 text-sm" href="/auth/login">
            Account
          </Link>
        </div>
      </header>
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 p-4 md:grid-cols-[240px_1fr]">
        <aside className="rounded-lg border border-slate-200 bg-white p-3">
          <nav className="flex flex-col gap-1">
            {links.map(([label, href]) => (
              <Link key={href} href={href} className="rounded-md px-3 py-3 text-sm hover:bg-slate-100">
                {label}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="mb-4 text-xl font-semibold text-slate-900">{title}</h2>
          {children}
        </main>
      </div>
    </div>
  );
}
