import './globals.css';
import type { ReactNode } from 'react';

export const metadata = {
  metadataBase: new URL(process.env.APP_BASE_URL ?? 'https://example.com'),
  title: {
    default: 'Site Permit | WorkPermitOS',
    template: '%s | Site Permit'
  },
  description: 'WorkPermitOS for SMB permit-to-work, contractor qualifications, training induction, and audit-ready workflows.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Site Permit | WorkPermitOS',
    description: 'Permit-to-work and contractor compliance operations for SMB teams.',
    type: 'website'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Site Permit | WorkPermitOS',
    description: 'Permit-to-work and contractor compliance operations for SMB teams.'
  }
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
