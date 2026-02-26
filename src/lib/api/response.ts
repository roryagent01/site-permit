export function ok<T>(data: T, meta?: Record<string, unknown>) {
  return { ok: true as const, data, error: null, meta: meta ?? null };
}

export function fail(code: string, message: string, details?: Record<string, unknown>) {
  return { ok: false as const, data: null, error: { code, message, details: details ?? null } };
}
