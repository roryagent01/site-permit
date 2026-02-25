import './globals.css';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'Site Permit',
  description: 'WorkPermitOS for SMB PTW and contractor qualification tracking'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
