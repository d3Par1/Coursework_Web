/**
 * Smoke tests for form validation (Plan 01-02, updated for Phase 2 auth)
 * Tests client+server validation on auth forms.
 * Uses plain Node.js http module -- no test framework required.
 */
const http = require('http');
const app = require('../server');
const db = require('../config/database');

let passed = 0;
let failed = 0;
const total = 6;

const TEST_EMAIL = 'validation-test@test.com';

function report(name, ok) {
  if (ok) {
    passed++;
    console.log(`  PASS: ${name}`);
  } else {
    failed++;
    console.log(`  FAIL: ${name}`);
  }
}

function makeRequest(options, body) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
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
  console.log('Validation smoke tests\n');

  // Clean up any leftover test user from previous runs
  try { db.prepare('DELETE FROM users WHERE email = ?').run(TEST_EMAIL); } catch (e) { /* ignore */ }

  // Test a: POST /auth/register with empty body -> 422 with errors
  {
    const res = await makeRequest({
      hostname: '127.0.0.1', port, path: '/auth/register', method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': 0 }
    });
    report(
      'POST /auth/register empty -> 422 with errors',
      res.status === 422 && res.body.includes('is-invalid') && res.body.includes('invalid-feedback')
    );
  }

  // Test b: POST /auth/register with valid data -> 302 redirect to / (auto-login)
  {
    const data = `name=Test&email=${encodeURIComponent(TEST_EMAIL)}&password=123456&confirmPassword=123456`;
    const res = await makeRequest({
      hostname: '127.0.0.1', port, path: '/auth/register', method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(data) }
    }, data);
    report(
      'POST /auth/register valid -> 302 to /',
      res.status === 302 && res.headers.location === '/'
    );
  }

  // Test c: POST /auth/login with empty body -> 422 with errors
  {
    const res = await makeRequest({
      hostname: '127.0.0.1', port, path: '/auth/login', method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': 0 }
    });
    report(
      'POST /auth/login empty -> 422 with errors',
      res.status === 422 && res.body.includes('is-invalid') && res.body.includes('invalid-feedback')
    );
  }

  // Test d: POST /auth/login with valid data -> 302 redirect to /
  // Uses the user created in test b
  {
    const data = `email=${encodeURIComponent(TEST_EMAIL)}&password=123456`;
    const res = await makeRequest({
      hostname: '127.0.0.1', port, path: '/auth/login', method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(data) }
    }, data);
    report(
      'POST /auth/login valid -> 302 to /',
      res.status === 302 && res.headers.location === '/'
    );
  }

  // Clean up test user after login test
  try { db.prepare('DELETE FROM users WHERE email = ?').run(TEST_EMAIL); } catch (e) { /* ignore */ }

  // Test e: GET /auth/register -> 200 with form elements
  {
    const res = await makeRequest({ hostname: '127.0.0.1', port, path: '/auth/register', method: 'GET' });
    report(
      'GET /auth/register -> 200 with needs-validation form',
      res.status === 200 && res.body.includes('Create') && res.body.includes('needs-validation')
    );
  }

  // Test f: GET /auth/login -> 200 with form elements
  {
    const res = await makeRequest({ hostname: '127.0.0.1', port, path: '/auth/login', method: 'GET' });
    report(
      'GET /auth/login -> 200 with needs-validation form',
      res.status === 200 && res.body.includes('Sign in') && res.body.includes('needs-validation')
    );
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
  console.log(`\nResults: ${passed}/${total} passed`);
  server.close(() => {
    process.exit(failed > 0 ? 1 : 0);
  });
});
