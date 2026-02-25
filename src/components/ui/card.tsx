import type { ReactNode } from 'react';

export function Card({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      {title ? <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-600">{title}</h3> : null}
      {children}
    </section>
  );
}
