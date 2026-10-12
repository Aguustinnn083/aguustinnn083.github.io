const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createApp } = require('../server');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

test('index.html should not contain the legacy fake-player mock data', () => {
  assert.doesNotMatch(html, /const\s+people\s*=\s*\[/, 'Legacy mocked people data should be removed.');
  assert.doesNotMatch(html, /data-person-index/, 'Legacy fake-person UI should be removed.');
  assert.match(html, /data-auth-form/, 'Live auth form should still exist.');
});

test('browser preflight OPTIONS requests are accepted without a 405', async () => {
  const server = createApp({ dbPath: ':memory:' });
  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();
  const base = `http://127.0.0.1:${port}`;

  try {
    const res = await fetch(`${base}/api/health`, { method: 'OPTIONS' });
    assert.equal(res.status, 204);
  } finally {
    await new Promise((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
  }
});

test('signup and friend-request flow work against the real server API', async () => {
  const server = createApp({ dbPath: ':memory:' });
  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();
  const base = `http://127.0.0.1:${port}`;

  async function request(path, init = {}) {
    const res = await fetch(`${base}${path}`, {
      ...init,
      headers: {
        ...(init.headers || {}),
        ...(init.body && !Object.keys(init.headers || {}).some((key) => key.toLowerCase() === 'content-type')
          ? { 'Content-Type': 'application/json' }
          : {})
      }
    });
    const text = await res.text();
    let body;
    try { body = JSON.parse(text); } catch { body = text; }
    return { res, body };
  }

  try {
    const first = await request('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ username: 'alice', password: 'password1234' })
    });
    assert.equal(first.res.status, 200);
    const cookie = first.res.headers.get('set-cookie');
    assert.ok(cookie, 'signup should create a session cookie');

    const second = await request('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ username: 'bob', password: 'password1234' }),
      headers: { Cookie: cookie }
    });
    assert.equal(second.res.status, 200);

    const list = await request('/api/users?search=bob', {
      headers: { Cookie: cookie }
    });
    assert.equal(list.res.status, 200);
    assert.ok(list.body.users.some((user) => user.username === 'bob'));

    const requestResult = await request(`/api/users/${list.body.users[0].id}/friend-request`, {
      method: 'POST',
      headers: { Cookie: cookie },
      body: '{}'
    });
    assert.equal(requestResult.res.status, 201);
    assert.equal(requestResult.body.status, 'pending');
  } finally {
    await new Promise((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
  }
});
