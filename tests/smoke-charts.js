/**
 * Smoke tests for /api/charts/* (Phase 5 Chart.js endpoints — Nazar)
 * Covers: auth gate, JSON shape, month/months query handling.
 */
const http = require('http');
const app = require('../server');
const db = require('../config/database');

let passed = 0;
let failed = 0;
const total = 7;

const EMAIL = `chart-${Date.now()}@test.com`;
const NAME = 'ChartTester';
const PASSWORD = '123456';
let sessionCookie = null;

function report(name, ok, detail) {
  if (ok) {
    passed++;
    console.log(`  PASS: ${name}`);
  } else {
    failed++;
    console.log(`  FAIL: ${name}${detail ? ' — ' + detail : ''}`);
  }
}

function parseSessionCookie(res) {
  const setCookie = res.headers['set-cookie'];
  if (!setCookie) return null;
  for (const c of setCookie) {
    if (c.startsWith('connect.sid=')) return c.split(';')[0];
  }
  return null;
}

function request(opts, body) {
  return new Promise((resolve, reject) => {
    const req = http.request(opts, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function runTests(port) {
  console.log('Charts smoke tests\n');

  // 1: Unauthenticated GET /api/charts/categories -> 302
  {
    const res = await request({
      hostname: '127.0.0.1', port, path: '/api/charts/categories', method: 'GET',
    });
    const ok = res.status === 302 && (res.headers.location || '').includes('/auth/login');
    report('GET /api/charts/categories unauth -> 302 to /auth/login', ok, `status=${res.status}`);
  }

  // 2: Unauthenticated GET /api/charts/monthly -> 302
  {
    const res = await request({
      hostname: '127.0.0.1', port, path: '/api/charts/monthly', method: 'GET',
    });
    const ok = res.status === 302 && (res.headers.location || '').includes('/auth/login');
    report('GET /api/charts/monthly unauth -> 302 to /auth/login', ok, `status=${res.status}`);
  }

  // Register + capture session cookie
  {
    const data = `name=${NAME}&email=${encodeURIComponent(EMAIL)}&password=${PASSWORD}&confirmPassword=${PASSWORD}`;
    const res = await request({
      hostname: '127.0.0.1', port, path: '/auth/register', method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(data) },
    }, data);
    sessionCookie = parseSessionCookie(res);
  }

  // 3: Authenticated GET /api/charts/categories -> 200 with valid JSON shape
  {
    const res = await request({
      hostname: '127.0.0.1', port, path: '/api/charts/categories', method: 'GET',
      headers: sessionCookie ? { Cookie: sessionCookie } : {},
    });
    let json = null;
    try { json = JSON.parse(res.body); } catch (e) { /* parse fail */ }
    const ok = res.status === 200
      && json
      && /^\d{4}-\d{2}$/.test(json.month)
      && Array.isArray(json.labels)
      && Array.isArray(json.data)
      && Array.isArray(json.colors)
      && json.labels.length === json.data.length
      && json.labels.length === json.colors.length;
    report('GET /api/charts/categories auth -> 200 with valid pie shape', ok, `status=${res.status}`);
  }

  // 4: Authenticated GET /api/charts/monthly -> 200 with valid JSON shape
  {
    const res = await request({
      hostname: '127.0.0.1', port, path: '/api/charts/monthly', method: 'GET',
      headers: sessionCookie ? { Cookie: sessionCookie } : {},
    });
    let json = null;
    try { json = JSON.parse(res.body); } catch (e) { /* parse fail */ }
    const ok = res.status === 200
      && json
      && json.months === 6
      && Array.isArray(json.labels)
      && Array.isArray(json.income)
      && Array.isArray(json.expense)
      && json.labels.length === json.income.length
      && json.labels.length === json.expense.length;
    report('GET /api/charts/monthly auth -> 200 with valid bar shape', ok, `status=${res.status}`);
  }

  // 5: Month query — bogus value falls back to current month
  {
    const res = await request({
      hostname: '127.0.0.1', port, path: '/api/charts/categories?month=not-a-month', method: 'GET',
      headers: sessionCookie ? { Cookie: sessionCookie } : {},
    });
    let json = null;
    try { json = JSON.parse(res.body); } catch (e) { /* parse fail */ }
    const expectedMonth = new Date().toISOString().slice(0, 7);
    const ok = res.status === 200 && json && json.month === expectedMonth;
    report('GET /api/charts/categories?month=invalid -> falls back to current month', ok, `month=${json && json.month}`);
  }

  // 6: Months query — out-of-range value clamps to default 6
  {
    const res = await request({
      hostname: '127.0.0.1', port, path: '/api/charts/monthly?months=99', method: 'GET',
      headers: sessionCookie ? { Cookie: sessionCookie } : {},
    });
    let json = null;
    try { json = JSON.parse(res.body); } catch (e) { /* parse fail */ }
    const ok = res.status === 200 && json && json.months === 6;
    report('GET /api/charts/monthly?months=99 -> clamps to 6', ok, `months=${json && json.months}`);
  }

  // 7: Months query — valid value (3) is honored
  {
    const res = await request({
      hostname: '127.0.0.1', port, path: '/api/charts/monthly?months=3', method: 'GET',
      headers: sessionCookie ? { Cookie: sessionCookie } : {},
    });
    let json = null;
    try { json = JSON.parse(res.body); } catch (e) { /* parse fail */ }
    const ok = res.status === 200 && json && json.months === 3;
    report('GET /api/charts/monthly?months=3 -> honored', ok, `months=${json && json.months}`);
  }
}

const server = app.listen(0, '127.0.0.1', async () => {
  const port = server.address().port;
  try {
    await runTests(port);
  } catch (err) {
    console.error('Test error:', err);
    failed = total - passed;
  }

  // Clean up test user
  try {
    db.prepare('DELETE FROM users WHERE email = ?').run(EMAIL);
  } catch (e) { /* ignore */ }

  console.log(`\nResults: ${passed}/${total} passed`);
  server.close(() => {
    process.exit(failed > 0 ? 1 : 0);
  });
});
