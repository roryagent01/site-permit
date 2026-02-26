import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: Number(__ENV.VUS || 5),
  duration: __ENV.DURATION || '20s'
};

const baseUrl = __ENV.BASE_URL || 'http://localhost:3000';
const cronSecret = __ENV.CRON_SECRET || '';

export default function () {
  const res = http.post(`${baseUrl}/api/jobs/reminders/digest`, null, {
    headers: {
      ...(cronSecret ? { 'x-cron-secret': cronSecret } : {})
    }
  });

  check(res, {
    'status is 200/401/429': (r) => [200, 401, 429].includes(r.status)
  });
  sleep(1);
}
