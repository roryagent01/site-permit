import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: Number(__ENV.VUS || 5),
  duration: __ENV.DURATION || '30s'
};

const baseUrl = __ENV.BASE_URL || 'http://localhost:3000';
const token = __ENV.BEARER_TOKEN || '';
const contractorId = __ENV.CONTRACTOR_ID || '';
const moduleId = __ENV.MODULE_ID || '';

export default function () {
  const body = JSON.stringify({
    contractorId,
    moduleId,
    recipients: [{ email: `k6+${__VU}_${__ITER}@example.com` }],
    expiresInHours: 24
  });
  const res = http.post(`${baseUrl}/api/app/training/invites`, body, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });

  check(res, {
    'status is 200/400/401/403': (r) => [200, 400, 401, 403].includes(r.status)
  });
  sleep(1);
}
