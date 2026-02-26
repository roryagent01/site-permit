import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getCurrentWorkspace } from '@/lib/workspace/current';
import { ok, fail } from '@/lib/api/response';
import { extractTextFromStoredFile } from '@/lib/ocr/engine';

const schema = z.object({
  fileId: z.string().uuid().optional(),
  text: z.string().min(1).optional()
}).refine((v) => Boolean(v.fileId || v.text), {
  message: 'Provide either fileId or text',
  path: ['fileId']
});

function extractDate(text: string): string | null {
  const m = text.match(/(\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4})/);
  return m ? m[1] : null;
}

function guessName(text: string): string | null {
  const m = text.match(/(?:Name|Employee|Trainee)[:\s]+([A-Za-z][A-Za-z\s'-]{2,60})/i);
  return m ? m[1].trim() : null;
}

function guessTraining(text: string): string | null {
  const m = text.match(/(?:Course|Training|Induction)[:\s]+([A-Za-z0-9][A-Za-z0-9\s()'\-]{2,80})/i);
  return m ? m[1].trim() : null;
}

export async function POST(request: Request) {
  const ctx = await getCurrentWorkspace();
  if (!ctx) return NextResponse.json(fail('unauthorized', 'Authentication required'), { status: 401 });
  if (!['admin', 'owner', 'issuer'].includes(ctx.role)) return NextResponse.json(fail('forbidden', 'Role not allowed'), { status: 403 });

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json(fail('invalid_payload', 'Invalid OCR parse payload'), { status: 400 });

  const supabase = await createSupabaseServerClient();

  let rawText = parsed.data.text ?? '';
  let parser = 'regex-v1';

  if (!rawText && parsed.data.fileId) {
    const { data: file } = await supabase
      .from('files')
      .select('id,bucket,path,final_path,blocked')
      .eq('workspace_id', ctx.workspaceId)
      .eq('id', parsed.data.fileId)
      .maybeSingle();

    if (!file) return NextResponse.json(fail('not_found', 'OCR file not found'), { status: 404 });
    if (file.blocked) return NextResponse.json(fail('file_blocked', 'File is blocked pending scan/quarantine'), { status: 409 });

    const filePath = file.path ?? file.final_path;
    const engine = await extractTextFromStoredFile({
      bucket: file.bucket,
      path: filePath,
      retries: 3
    });

    if (!engine.ok || !engine.text) {
      const { data: failedDoc } = await supabase
        .from('ocr_documents')
        .insert({
          workspace_id: ctx.workspaceId,
          file_id: file.id,
          source_type: 'upload',
          status: 'failed',
          parser: engine.engine,
          raw_text: null,
          created_by: ctx.user.id
        })
        .select('id')
        .single();

      return NextResponse.json(
        fail('ocr_failed', engine.reason ?? 'OCR extraction failed', { documentId: failedDoc?.id }),
        { status: 422 }
      );
    }

    rawText = engine.text;
    parser = engine.engine;
  }

  const name = guessName(rawText);
  const trainingName = guessTraining(rawText);
  const expiry = extractDate(rawText);

  const { data: doc } = await supabase
    .from('ocr_documents')
    .insert({
      workspace_id: ctx.workspaceId,
      file_id: parsed.data.fileId ?? null,
      source_type: parsed.data.fileId ? 'upload' : 'api',
      status: 'parsed',
      raw_text: rawText,
      parser,
      created_by: ctx.user.id
    })
    .select('id')
    .single();

  const extracted = [
    { field_name: 'name', field_value: name, confidence: name ? 0.62 : 0.0, snippet: name ?? null },
    { field_name: 'training_name', field_value: trainingName, confidence: trainingName ? 0.6 : 0.0, snippet: trainingName ?? null },
    { field_name: 'expiry_date', field_value: expiry, confidence: expiry ? 0.58 : 0.0, snippet: expiry ?? null }
  ];

  if (doc?.id) {
    await supabase.from('ocr_extractions').insert(
      extracted.map((e) => ({ workspace_id: ctx.workspaceId, document_id: doc.id, ...e }))
    );
  }

  return NextResponse.json(ok({ documentId: doc?.id, extracted, parser }));
}
