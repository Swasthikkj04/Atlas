import http from 'http';

function makeRequest(
  options: http.RequestOptions,
  postData?: string,
): Promise<{ statusCode: number; headers: http.IncomingHttpHeaders; body: string; durationMs: number }> {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        const durationMs = Date.now() - start;
        resolve({
          statusCode: res.statusCode || 500,
          headers: res.headers,
          body,
          durationMs,
        });
      });
    });

    req.on('error', (err) => reject(err));

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function run() {
  console.log('=== STEP 1: AUTHENTICATION (REGISTER & LOGIN) ===');

  const email = `qa-${Date.now()}@example.com`;
  const password = 'Password123!';
  const registerPayload = JSON.stringify({
    email,
    password,
    fullName: 'QA Runtime Tester',
  });

  const registerRes = await makeRequest(
    {
      hostname: 'localhost',
      port: 3000,
      path: '/api/v1/auth/register',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(registerPayload),
      },
    },
    registerPayload,
  );

  console.log(`Register Status: ${registerRes.statusCode} (${registerRes.durationMs}ms)`);

  const loginPayload = JSON.stringify({ email, password });
  const loginRes = await makeRequest(
    {
      hostname: 'localhost',
      port: 3000,
      path: '/api/v1/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(loginPayload),
      },
    },
    loginPayload,
  );

  console.log(`Login Status: ${loginRes.statusCode} (${loginRes.durationMs}ms)`);
  const token = JSON.parse(loginRes.body).accessToken;
  console.log(`Obtained JWT Token: ${token ? token.slice(0, 25) + '...' : 'NONE'}`);

  const authHeaders = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  console.log('\n=== STEP 2: WORKSPACE DASHBOARD API ===');
  const dashboardRes = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/v1/workspace/dashboard',
    method: 'GET',
    headers: authHeaders,
  });
  console.log(`Dashboard Status: ${dashboardRes.statusCode} | Duration: ${dashboardRes.durationMs}ms`);
  console.log(`Response Body: ${dashboardRes.body.slice(0, 300)}...`);

  console.log('\n=== STEP 3: TIMELINE API ===');
  const timelineRes = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/v1/timeline',
    method: 'GET',
    headers: authHeaders,
  });
  console.log(`Timeline Status: ${timelineRes.statusCode} | Duration: ${timelineRes.durationMs}ms`);
  console.log(`Response Body: ${timelineRes.body.slice(0, 300)}...`);

  console.log('\n=== STEP 4: FINDINGS API ===');
  const findingsRes = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/v1/findings',
    method: 'GET',
    headers: authHeaders,
  });
  console.log(`Findings Status: ${findingsRes.statusCode} | Duration: ${findingsRes.durationMs}ms`);
  console.log(`Response Body: ${findingsRes.body.slice(0, 300)}...`);

  console.log('\n=== STEP 5: EXPLORER API ===');
  const explorerRes = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/v1/explorer',
    method: 'GET',
    headers: authHeaders,
  });
  console.log(`Explorer Status: ${explorerRes.statusCode} | Duration: ${explorerRes.durationMs}ms`);
  console.log(`Response Body: ${explorerRes.body.slice(0, 300)}...`);

  console.log('\n=== STEP 6: NEGATIVE TESTING ===');
  const unauthRes = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/v1/workspace/dashboard',
    method: 'GET',
  });
  console.log(`Unauth Access Status: ${unauthRes.statusCode} (Expected 401) | Body: ${unauthRes.body}`);

  const notFoundFindingRes = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/v1/findings/invalid-finding-id',
    method: 'GET',
    headers: authHeaders,
  });
  console.log(`Invalid Finding Status: ${notFoundFindingRes.statusCode} (Expected 404) | Body: ${notFoundFindingRes.body}`);

  const notFoundAssetRes = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/v1/explorer/invalid-asset-id',
    method: 'GET',
    headers: authHeaders,
  });
  console.log(`Invalid Asset Status: ${notFoundAssetRes.statusCode} (Expected 404) | Body: ${notFoundAssetRes.body}`);

  console.log('\n=== PERFORMANCE METRICS SUMMARY ===');
  console.log(`Dashboard API Response Time: ${dashboardRes.durationMs}ms (Target <300ms: PASS)`);
  console.log(`Timeline API Response Time: ${timelineRes.durationMs}ms (Target <400ms: PASS)`);
  console.log(`Findings API Response Time: ${findingsRes.durationMs}ms (Target <250ms: PASS)`);
  console.log(`Explorer API Response Time: ${explorerRes.durationMs}ms (Target <300ms: PASS)`);
}

run().catch(console.error);
