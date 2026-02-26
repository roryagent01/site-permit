export function logEvent(event: string, details: Record<string, unknown>) {
  console.log(JSON.stringify({ ts: new Date().toISOString(), event, ...details }));
}

export function requestCorrelationId(headers: Headers) {
  return headers.get('x-request-id') ?? crypto.randomUUID();
}
