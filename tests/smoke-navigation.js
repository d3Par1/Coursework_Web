// tests/smoke-navigation.js
// Smoke test: verify protected routes redirect to login when unauthenticated
const http = require('http');
const app = require('../server');

const ROUTES = [
  { path: '/', name: 'Dashboard', expect302: true },
  { path: '/accounts', name: 'Accounts', expect302: true },
  { path: '/transactions', name: 'Transactions', expect302: true },
  { path: '/categories', name: 'Categories', expect302: true },
  { path: '/budgets', name: 'Budgets', expect302: true },
  { path: '/auth/login', name: 'Login', expect302: false, expect: 'Sign in' },
  { path: '/auth/register', name: 'Register', expect302: false, expect: 'Create' }
];

const PORT = 0; // Let OS assign a random available port
let server;
let passed = 0;
let failed = 0;

function testRoute(route) {
  return new Promise((resolve) => {
    const options = {
      hostname: '127.0.0.1',
      port: server.address().port,
      path: route.path,
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        let ok;
        if (route.expect302) {
          ok = res.statusCode === 302 && res.headers.location && res.headers.location.includes('/auth/login');
        } else {
          ok = res.statusCode === 200 && body.includes(route.expect);
        }

        if (ok) {
          console.log(`  PASS  ${route.name} (${route.path}) - ${res.statusCode}`);
          passed++;
        } else {
          console.log(`  FAIL  ${route.name} (${route.path}) - status: ${res.statusCode}, expected ${route.expect302 ? '302' : '200'}`);
          failed++;
        }
        resolve();
      });
    });

    req.on('error', (err) => {
      console.log(`  FAIL  ${route.name} (${route.path}) - ${err.message}`);
      failed++;
      resolve();
    });

    req.end();
  });
}

async function run() {
  console.log('Smoke Navigation Tests');
  console.log('======================\n');

  server = app.listen(PORT, '127.0.0.1', async () => {
    for (const route of ROUTES) {
      await testRoute(route);
    }

    console.log(`\nResults: ${passed} passed, ${failed} failed out of ${ROUTES.length} tests`);

    server.close(() => {
      process.exit(failed > 0 ? 1 : 0);
    });
  });
}

run();
