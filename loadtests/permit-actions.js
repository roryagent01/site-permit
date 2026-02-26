import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: Number(__ENV.VUS || 10),
  duration: __ENV.DURATION || '30s'
};

const baseUrl = __ENV.BASE_URL || 'http://localhost:3000';
const token = __ENV.BEARER_TOKEN || '';
const permitId = __ENV.PERMIT_ID || '';

export default function () {
  const payload = JSON.stringify({ action: 'transition', nextStatus: 'submitted' });
  const res = http.post(`${baseUrl}/api/app/permits/${permitId}/actions`, payload, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });

  check(res, {
    'status is 200/401/403/409': (r) => [200, 401, 403, 409].includes(r.status)
  });
  sleep(1);
}
