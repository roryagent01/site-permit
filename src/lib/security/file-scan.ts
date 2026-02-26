export type ScanInput = { path: string; sizeBytes: number };
export type ScanResult = { status: 'clean' | 'quarantined' | 'failed'; reason?: string; engine: string };

async function clamavScan(input: ScanInput): Promise<ScanResult | null> {
  const endpoint = process.env.CLAMAV_SCAN_ENDPOINT;
  if (!endpoint) return null;

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: input.path, sizeBytes: input.sizeBytes })
    });
    if (!res.ok) return { status: 'failed', reason: `clamav_http_${res.status}`, engine: 'clamav-http' };
    const j = (await res.json()) as { status?: 'clean' | 'quarantined'; reason?: string };
    if (j.status === 'clean' || j.status === 'quarantined') {
      return { status: j.status, reason: j.reason, engine: 'clamav-http' };
    }
    return { status: 'failed', reason: 'clamav_invalid_payload', engine: 'clamav-http' };
  } catch {
    return { status: 'failed', reason: 'clamav_unreachable', engine: 'clamav-http' };
  }
}

function baselineRules(input: ScanInput): ScanResult {
  const suspiciousExt = /\.(exe|scr|bat|cmd|js)$/i.test(input.path);
  const oversized = input.sizeBytes > 100 * 1024 * 1024;
  if (suspiciousExt) return { status: 'quarantined', reason: 'suspicious_extension', engine: 'baseline-rules' };
  if (oversized) return { status: 'quarantined', reason: 'oversized_file', engine: 'baseline-rules' };
  return { status: 'clean', engine: 'baseline-rules' };
}

export async function scanFile(input: ScanInput): Promise<ScanResult> {
  const clam = await clamavScan(input);
  if (clam && clam.status !== 'failed') return clam;
  if (clam && clam.status === 'failed') return clam;
  return baselineRules(input);
}
