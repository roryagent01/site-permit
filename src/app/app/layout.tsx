import type { ReactNode } from 'react';
import { requireAuth } from '@/lib/auth/rbac';

export default async function ProtectedAppLayout({ children }: { children: ReactNode }) {
  await requireAuth();
  return children;
}
