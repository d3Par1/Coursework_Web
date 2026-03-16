/**
 * Smoke tests for authentication (Plan 02-01)
 * Covers AUTH-01 through AUTH-04: register, login, logout, route protection, bcrypt hashing.
 * Uses plain Node.js http module -- no test framework required.
 */
const http = require('http');
const app = require('../server');
const db = require('../config/database');

let passed = 0;
let failed = 0;
const total = 8;

const EMAIL = `test-${Date.now()}@test.com`;
const NAME = 'TestUser';
const PASSWORD = '123456';

let sessionCookie = null;

function report(name, ok) {
  if (ok) {
    passed++;
    console.log(`  PASS: ${name}`);
  } else {
    failed++;
    console.log(`  FAIL: ${name}`);
  }
}

function parseCookies(res) {
  const setCookie = res.headers['set-cookie'];
  if (!setCookie) return null;
  // Extract connect.sid cookie
  for (const cookie of setCookie) {
    if (cookie.startsWith('connect.sid=')) {
      return cookie.split(';')[0];
    }
  }
  return null;
}

function makeRequest(options, body) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve({
        status: res.statusCode,
        headers: res.headers,
        body: data,
        raw: res
      }));
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function runTests(port) {
  console.log('Auth smoke tests\n');

  // Test a: POST /auth/register with valid data -> 302 redirect to / (AUTH-01)
  {
    const data = `name=${NAME}&email=${encodeURIComponent(EMAIL)}&password=${PASSWORD}&confirmPassword=${PASSWORD}`;
    const res = await makeRequest({
      hostname: '127.0.0.1', port, path: '/auth/register', method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(data) }
    }, data);
    const ok = res.status === 302 && res.headers.location === '/';
    report('Register valid user -> 302 to / (AUTH-01)', ok);
    const cookie = parseCookies(res);
    if (cookie) sessionCookie = cookie;
  }

  // Test b: Verify bcrypt hash in DB (AUTH-04)
  {
    const row = db.prepare('SELECT password_hash FROM users WHERE email = ?').get(EMAIL);
    const ok = row && (row.password_hash.startsWith('$2a$') || row.password_hash.startsWith('$2b$'));
    report('Password stored as bcrypt hash (AUTH-04)', ok);
  }

  // Test c: GET / with session cookie -> 200 (session persists, AUTH-02)
  {
    const res = await makeRequest({
      hostname: '127.0.0.1', port, path: '/', method: 'GET',
      headers: sessionCookie ? { Cookie: sessionCookie } : {}
    });
    const ok = res.status === 200;
    report('GET / with session cookie -> 200 (AUTH-02)', ok);
  }

  // Test d: POST /auth/logout with session cookie -> 302 to /auth/login (AUTH-03)
  {
    const res = await makeRequest({
      hostname: '127.0.0.1', port, path: '/auth/logout', method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': 0,
        ...(sessionCookie ? { Cookie: sessionCookie } : {})
      }
    });
    const ok = res.status === 302 && res.headers.location === '/auth/login';
    report('Logout -> 302 to /auth/login (AUTH-03)', ok);
    // Clear cookie after logout
    sessionCookie = null;
  }

  // Test e: GET / without session cookie -> 302 to /auth/login (route protection)
  {
    const res = await makeRequest({
      hostname: '127.0.0.1', port, path: '/', method: 'GET'
    });
    const ok = res.status === 302 && res.headers.location === '/auth/login';
    report('GET / unauthenticated -> 302 to /auth/login', ok);
  }

  // Test f: POST /auth/login with registered credentials -> 302 to / (AUTH-02)
  {
    const data = `email=${encodeURIComponent(EMAIL)}&password=${PASSWORD}`;
    const res = await makeRequest({
      hostname: '127.0.0.1', port, path: '/auth/login', method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(data) }
    }, data);
    const ok = res.status === 302 && res.headers.location === '/';
    report('Login valid credentials -> 302 to / (AUTH-02)', ok);
  }

  // Test g: POST /auth/register with duplicate email -> 422 (duplicate handling)
  {
    const data = `name=Dup&email=${encodeURIComponent(EMAIL)}&password=${PASSWORD}&confirmPassword=${PASSWORD}`;
    const res = await makeRequest({
      hostname: '127.0.0.1', port, path: '/auth/register', method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(data) }
    }, data);
    const ok = res.status === 422 && res.body.includes('already exists');
    report('Register duplicate email -> 422 with error', ok);
  }

  // Test h: POST /auth/login with wrong password -> 401 (invalid credentials)
  {
    const data = `email=${encodeURIComponent(EMAIL)}&password=wrongpassword`;
    const res = await makeRequest({
      hostname: '127.0.0.1', port, path: '/auth/login', method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(data) }
    }, data);
    const ok = res.status === 401 && res.body.includes('Invalid email or password');
    report('Login wrong password -> 401 with error', ok);
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
