import { AppShell } from '@/components/app-shell';
import { Card } from '@/components/ui/card';
import { UploadWidget } from '@/components/files/upload-widget';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth/rbac';

export default async function ContractorPortalPage({
  searchParams
}: {
  searchParams: Promise<{ contractorId?: string }>;
}) {
  await requireAuth();
  const { contractorId } = await searchParams;
  const supabase = await createSupabaseServerClient();

  if (!contractorId) {
    return (
      <AppShell title="Contractor Portal">
        <Card>
          <p className="text-sm text-slate-600">Missing contractorId. Open this page with ?contractorId=&lt;id&gt;.</p>
        </Card>
      </AppShell>
    );
  }

  const { data: contractor } = await supabase
    .from('contractors')
    .select('id,name,status,workspace_id')
    .eq('id', contractorId)
    .maybeSingle();

  if (!contractor) {
    return (
      <AppShell title="Contractor Portal">
        <Card>
          <p className="text-sm text-slate-600">Contractor not found.</p>
        </Card>
      </AppShell>
    );
  }

  const { data: quals } = await supabase
    .from('contractor_qualifications')
    .select('id,expiry_date,verification_status,qualification_types(name)')
    .eq('contractor_id', contractor.id)
    .order('expiry_date', { ascending: true });

  return (
    <AppShell title="Contractor Portal">
      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Contractor">
          <p className="text-sm">Name: {contractor.name}</p>
          <p className="text-sm">Status: {contractor.status}</p>
        </Card>
        <Card title="Qualification status">
          <ul className="space-y-2 text-sm">
            {quals?.map((q) => (
              <li key={q.id} className="rounded border p-2">
                <div className="font-medium">{(q.qualification_types as { name?: string } | null)?.name ?? 'Qualification'}</div>
                <div className="text-slate-600">Expiry: {q.expiry_date ?? '-'} • {q.verification_status}</div>
                <div className="mt-2">
                  <UploadWidget bucket="qualification_evidence" contractorQualificationId={q.id} />
                </div>
              </li>
            ))}
            {!quals?.length ? <li className="text-slate-500">No qualifications found.</li> : null}
          </ul>
        </Card>
      </div>
    </AppShell>
  );
}
