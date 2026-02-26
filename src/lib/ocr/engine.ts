import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { writeFile, readFile, rm } from 'node:fs/promises';
import { execFile as execFileCb } from 'node:child_process';
import { promisify } from 'node:util';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

const execFile = promisify(execFileCb);

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

async function localPdfToText(bytes: Uint8Array): Promise<OcrEngineResult> {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const pdfPath = join(tmpdir(), `ocr-${id}.pdf`);
  const outPath = join(tmpdir(), `ocr-${id}.txt`);

  try {
    await writeFile(pdfPath, bytes);
    await execFile('pdftotext', [pdfPath, outPath], { timeout: 20_000 });
    const text = (await readFile(outPath, 'utf8')).trim();
    if (!text) return { ok: false, engine: 'local-pdftotext', reason: 'empty_text' };
    return { ok: true, engine: 'local-pdftotext', text };
  } catch {
    return { ok: false, engine: 'local-pdftotext', reason: 'pdftotext_unavailable_or_failed' };
  } finally {
    await rm(pdfPath, { force: true }).catch(() => undefined);
    await rm(outPath, { force: true }).catch(() => undefined);
  }
}

async function localImageTesseract(bytes: Uint8Array, extensionHint: string): Promise<OcrEngineResult> {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const extn = extensionHint || 'png';
  const imgPath = join(tmpdir(), `ocr-${id}.${extn}`);
  const outBase = join(tmpdir(), `ocr-${id}`);
  const outTxt = `${outBase}.txt`;

  try {
    await writeFile(imgPath, bytes);
    await execFile('tesseract', [imgPath, outBase], { timeout: 30_000 });
    const text = (await readFile(outTxt, 'utf8')).trim();
    if (!text) return { ok: false, engine: 'local-tesseract', reason: 'empty_text' };
    return { ok: true, engine: 'local-tesseract', text };
  } catch {
    return { ok: false, engine: 'local-tesseract', reason: 'tesseract_unavailable_or_failed' };
  } finally {
    await rm(imgPath, { force: true }).catch(() => undefined);
    await rm(outTxt, { force: true }).catch(() => undefined);
  }
}

async function localEngine(bytes: Uint8Array, mimeType: string, filePath: string): Promise<OcrEngineResult> {
  if (mimeType === 'text/plain') {
    const text = Buffer.from(bytes).toString('utf8').trim();
    if (text) return { ok: true, engine: 'local-text', text };
    return { ok: false, engine: 'local-text', reason: 'empty_text' };
  }

  if (mimeType === 'application/pdf') {
    return localPdfToText(bytes);
  }

  if (mimeType.startsWith('image/')) {
    const extensionHint = ext(filePath);
    return localImageTesseract(bytes, extensionHint);
  }

  return { ok: false, engine: 'local', reason: 'unsupported_file_type' };
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

  const local = await localEngine(bytes, mimeType, input.path);
  if (local.ok) return local;

  if (last.reason !== 'ocr_http_endpoint_missing') {
    return { ok: false, engine: `${last.engine}+${local.engine}`, reason: `${last.reason};${local.reason}` };
  }

  return local;
}
