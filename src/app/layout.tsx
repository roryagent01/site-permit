import './globals.css';
import type { ReactNode } from 'react';
import { RegisterServiceWorker } from '@/components/pwa/register-sw';

export const metadata = {
  metadataBase: new URL(process.env.APP_BASE_URL ?? 'https://example.com'),
  title: {
    default: 'Permit Pass | WorkPermitOS',
    template: '%s | Permit Pass'
  },
  description: 'WorkPermitOS for SMB permit-to-work, contractor qualifications, training induction, and audit-ready workflows.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Permit Pass | WorkPermitOS',
    description: 'Permit-to-work and contractor compliance operations for SMB teams.',
    type: 'website'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Permit Pass | WorkPermitOS',
    description: 'Permit-to-work and contractor compliance operations for SMB teams.'
  }
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <RegisterServiceWorker />
        {children}
      </body>
    </html>
  );
}
