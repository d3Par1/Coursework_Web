/**
 * Smoke tests for form validation (Plan 01-02)
 * Tests client+server validation on auth forms.
 * Uses plain Node.js http module -- no test framework required.
 */
const http = require('http');
const app = require('../server');

let passed = 0;
let failed = 0;
const total = 6;

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

  // Test a: POST /auth/register with empty body -> 422 with errors
  {
    const res = await makeRequest({
      hostname: 'localhost', port, path: '/auth/register', method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': 0 }
    });
    report(
      'POST /auth/register empty -> 422 with errors',
      res.status === 422 && res.body.includes('is-invalid') && res.body.includes('invalid-feedback')
    );
  }

  // Test b: POST /auth/register with valid data -> 302 redirect to /auth/login
  {
    const data = 'name=Test&email=test%40test.com&password=123456&confirmPassword=123456';
    const res = await makeRequest({
      hostname: 'localhost', port, path: '/auth/register', method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(data) }
    }, data);
    report(
      'POST /auth/register valid -> 302 to /auth/login',
      res.status === 302 && res.headers.location === '/auth/login'
    );
  }

  // Test c: POST /auth/login with empty body -> 422 with errors
  {
    const res = await makeRequest({
      hostname: 'localhost', port, path: '/auth/login', method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': 0 }
    });
    report(
      'POST /auth/login empty -> 422 with errors',
      res.status === 422 && res.body.includes('is-invalid') && res.body.includes('invalid-feedback')
    );
  }

  // Test d: POST /auth/login with valid data -> 302 redirect to /
  {
    const data = 'email=test%40test.com&password=123456';
    const res = await makeRequest({
      hostname: 'localhost', port, path: '/auth/login', method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(data) }
    }, data);
    report(
      'POST /auth/login valid -> 302 to /',
      res.status === 302 && res.headers.location === '/'
    );
  }

  // Test e: GET /auth/register -> 200 with form elements
  {
    const res = await makeRequest({ hostname: 'localhost', port, path: '/auth/register', method: 'GET' });
    report(
      'GET /auth/register -> 200 with needs-validation form',
      res.status === 200 && res.body.includes('Register') && res.body.includes('needs-validation')
    );
  }

  // Test f: GET /auth/login -> 200 with form elements
  {
    const res = await makeRequest({ hostname: 'localhost', port, path: '/auth/login', method: 'GET' });
    report(
      'GET /auth/login -> 200 with needs-validation form',
      res.status === 200 && res.body.includes('Login') && res.body.includes('needs-validation')
    );
  }
}

const server = app.listen(0, async () => {
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
