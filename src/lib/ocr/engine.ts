import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export type OcrEngineResult = {
  ok: boolean;
  text?: string;
  engine: string;
  reason?: string;
};

function ext(path: string) {
  const i = path.lastIndexOf('.');
  return i >= 0 ? path.slice(i + 1).toLowerCase() : '';
}

function guessMime(path: string) {
  const e = ext(path);
  if (e === 'pdf') return 'application/pdf';
  if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'tiff'].includes(e)) return `image/${e === 'jpg' ? 'jpeg' : e}`;
  if (['txt', 'csv', 'json', 'md'].includes(e)) return 'text/plain';
  return 'application/octet-stream';
}

async function callHttpEngine(bytes: Uint8Array, mimeType: string): Promise<OcrEngineResult> {
  const endpoint = process.env.OCR_HTTP_ENDPOINT;
  if (!endpoint) return { ok: false, engine: 'none', reason: 'ocr_http_endpoint_missing' };

  const payload = {
    mimeType,
    fileBase64: Buffer.from(bytes).toString('base64')
  };

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (process.env.OCR_HTTP_API_KEY) headers['x-api-key'] = process.env.OCR_HTTP_API_KEY;

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });
    if (!res.ok) return { ok: false, engine: 'http-ocr', reason: `ocr_http_${res.status}` };
    const j = (await res.json()) as { text?: string };
    if (!j?.text || !j.text.trim()) return { ok: false, engine: 'http-ocr', reason: 'ocr_empty_text' };
    return { ok: true, engine: 'http-ocr', text: j.text };
  } catch {
    return { ok: false, engine: 'http-ocr', reason: 'ocr_http_unreachable' };
  }
}

function fallbackLocal(bytes: Uint8Array, mimeType: string): OcrEngineResult {
  if (mimeType === 'text/plain') {
    const text = Buffer.from(bytes).toString('utf8').trim();
    if (text) return { ok: true, engine: 'local-text', text };
    return { ok: false, engine: 'local-text', reason: 'empty_text' };
  }
  return { ok: false, engine: 'local-text', reason: 'unsupported_without_ocr_engine' };
}

export async function extractTextFromStoredFile(input: { bucket: string; path: string; retries?: number }): Promise<OcrEngineResult> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.storage.from(input.bucket).download(input.path);
  if (error || !data) return { ok: false, engine: 'storage', reason: 'download_failed' };

  const bytes = new Uint8Array(await data.arrayBuffer());
  const mimeType = guessMime(input.path);
  const retries = Math.max(1, input.retries ?? 2);

  let last: OcrEngineResult = { ok: false, engine: 'none', reason: 'unknown' };
  for (let i = 0; i < retries; i += 1) {
    const http = await callHttpEngine(bytes, mimeType);
    if (http.ok) return http;
    last = http;
  }

  const local = fallbackLocal(bytes, mimeType);
  if (local.ok) return local;

  return last.reason === 'ocr_http_endpoint_missing' ? local : last;
}
