const tiers = [
  {
    name: 'Starter',
    price: '€19.99/mo',
    bullets: ['10 users', '25 contractors', '50 permits/month', '500MB storage', 'Email support']
  },
  {
    name: 'Growth',
    price: 'Contact',
    bullets: ['100 users', '200 contractors', '500 permits/month', '5GB storage', 'Priority email support']
  },
  {
    name: 'Scale',
    price: 'Contact',
    bullets: ['500 users', '1,000 contractors', '2,000 permits/month', '25GB storage', 'Priority support + onboarding']
  }
];

const faqs = [
  {
    q: 'Does Site Permit support contractor onboarding?',
    a: 'Yes, internal employee invites and contractor self-onboarding links are built in.'
  },
  {
    q: 'Can induction/training be completed before arriving on site?',
    a: 'Yes, tokenized training links can be sent in bulk and completion is credited to contractor profiles.'
  },
  {
    q: 'Can an AI agent operate the platform via API?',
    a: 'Yes, major workflows are available through API-first routes with role and workspace controls.'
  }
];

export default function PricingPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: f.a
      }
    }))
  };

  return (
    <main className="mx-auto max-w-6xl p-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <h1 className="text-3xl font-semibold text-blue-900">Pricing</h1>
      <p className="mt-2 text-slate-600">SMB-first pricing with dedicated hosting add-on for larger or regulated teams.</p>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {tiers.map((t) => (
          <section key={t.name} className="rounded-lg border bg-white p-4">
            <h2 className="text-xl font-semibold">{t.name}</h2>
            <p className="mt-1 text-sm text-slate-600">{t.price}</p>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700">
              {t.bullets.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <section className="mt-8 rounded-lg border bg-white p-4">
        <h2 className="text-xl font-semibold">FAQ</h2>
        <ul className="mt-3 space-y-3 text-sm">
          {faqs.map((f) => (
            <li key={f.q}>
              <div className="font-medium">{f.q}</div>
              <div className="text-slate-600">{f.a}</div>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
