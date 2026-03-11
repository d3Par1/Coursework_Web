// tests/smoke-navigation.js
// Smoke test: verify all main routes return HTTP 200
const http = require('http');
const app = require('../server');

const ROUTES = [
  { path: '/', name: 'Dashboard', expect: 'Dashboard' },
  { path: '/accounts', name: 'Accounts', expect: 'Accounts' },
  { path: '/transactions', name: 'Transactions', expect: 'Transactions' },
  { path: '/categories', name: 'Categories', expect: 'Categories' },
  { path: '/budgets', name: 'Budgets', expect: 'Budgets' }
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
        const statusOk = res.statusCode === 200;
        const bodyOk = body.includes(route.expect);

        if (statusOk && bodyOk) {
          console.log(`  PASS  ${route.name} (${route.path}) - ${res.statusCode}`);
          passed++;
        } else {
          console.log(`  FAIL  ${route.name} (${route.path}) - status: ${res.statusCode}, body contains "${route.expect}": ${bodyOk}`);
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
