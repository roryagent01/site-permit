import { NextResponse } from 'next/server';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import { getCurrentWorkspace } from '@/lib/workspace/current';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(_: Request, { params }: { params: Promise<{ permitId: string }> }) {
  const { permitId } = await params;
  const ctx = await getCurrentWorkspace();
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const supabase = await createSupabaseServerClient();
  const { data: permit } = await supabase
    .from('permits')
    .select('id,title,status,start_at,end_at,payload,created_at')
    .eq('workspace_id', ctx.workspaceId)
    .eq('id', permitId)
    .single();

  if (!permit) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const { data: approvals } = await supabase
    .from('permit_approvals')
    .select('decision,comment,decided_at')
    .eq('workspace_id', ctx.workspaceId)
    .eq('permit_id', permitId)
    .order('decided_at', { ascending: true });

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  let y = 800;
  const draw = (text: string, size = 11) => {
    page.drawText(text, { x: 40, y, size, font });
    y -= size + 8;
  };

  draw(`Permit Export: ${permit.title}`, 16);
  draw(`Status: ${permit.status}`);
  draw(`Start: ${permit.start_at ?? '-'}`);
  draw(`End: ${permit.end_at ?? '-'}`);
  draw(`Location: ${(permit.payload as { location?: string })?.location ?? '-'}`);
  draw('Approvals:', 12);
  (approvals ?? []).forEach((a) => draw(`- ${a.decision} | ${a.comment ?? ''} | ${a.decided_at ?? ''}`));

  const bytes = await pdfDoc.save();
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="permit-${permit.id}.pdf"`
    }
  });
}
