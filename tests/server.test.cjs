'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');
const { createSiteServer, loadConfig, publicPath, sanitizePosts } = require('../server.cjs');

const config = { accessToken: 'TEST_CREDENTIAL_NOT_REAL', pageId: '12345', apiVersion: 'v23.0' };
const sample = { id: '12345_67890', message: 'Curso de prueba', full_picture: 'https://scontent.test.fbcdn.net/photo.jpg', permalink_url: 'https://www.facebook.com/12345/posts/67890', created_time: '2026-09-24T15:00:00Z' };
const goodFetch = async () => ({ ok: true, json: async () => ({ data: [sample] }) });

async function fixture(t, options = {}) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'genomicstrack-server-'));
  await fs.mkdir(path.join(root, 'media'));
  await fs.mkdir(path.join(root, 'cursos'));
  await fs.mkdir(path.join(root, 'scripts'));
  await fs.mkdir(path.join(root, 'CVS'));
  await fs.writeFile(path.join(root, 'index.html'), '<h1>Public page</h1>');
  await fs.writeFile(path.join(root, 'site.css'), 'body{color:green}');
  await fs.writeFile(path.join(root, '.env.local'), 'META_ACCESS_TOKEN=LOCAL_TEST_SECRET\nMETA_PAGE_ID=456\nPORT=9001\n');
  await fs.writeFile(path.join(root, 'server.cjs'), 'PRIVATE_SERVER_SOURCE');
  await fs.writeFile(path.join(root, 'scripts/private.js'), 'PRIVATE_SCRIPT');
  await fs.writeFile(path.join(root, 'CVS/Entries'), 'PRIVATE_CVS');
  await fs.writeFile(path.join(root, 'media/test.webp'), 'PUBLIC_IMAGE');
  await fs.writeFile(path.join(root, 'cursos/test-course.html'), '<h1>Course</h1>');
  const server = createSiteServer({ root, config, fetchImpl: goodFetch, ...options });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  t.after(async () => { await new Promise(resolve => server.close(resolve)); await fs.rm(root, { recursive: true, force: true }); });
  const port = server.address().port;
  function request(requestPath, method = 'GET') {
    return new Promise((resolve, reject) => {
      const request = http.request({ host: '127.0.0.1', port, path: requestPath, method }, response => {
        let body = '';
        response.setEncoding('utf8');
        response.on('data', chunk => { body += chunk; });
        response.on('end', () => resolve({ status: response.statusCode, headers: response.headers, body, json: () => JSON.parse(body) }));
      });
      request.on('error', reject);
      request.end();
    });
  }
  return { root, request };
}

test('only explicitly public files are served; secrets, sources and traversals are denied', async t => {
  const { request } = await fixture(t);
  for (const route of ['/', '/index.html?hello=world', '/site.css', '/media/test.webp', '/cursos/test-course.html']) {
    assert.equal((await request(route)).status, 200, route);
  }
  for (const route of ['/.env.local', '/.env', '/.env.example', '/.git/config', '/server.cjs', '/README_SERVIDOR.md', '/scripts/private.js', '/tests/server.test.cjs', '/CVS/Entries', '/media/../.env.local', '/%2eenv.local', '/media/%2e%2e/.env.local', '/media/%252e%252e/.env.local', '/media\\..\\.env.local', '/media/%00.png', '/%zz', '//.env.local', '/missing.html']) {
    const response = await request(route);
    assert.equal(response.status, 404, route);
    assert.match(response.body, /Volver al inicio/);
    assert.doesNotMatch(response.body, /LOCAL_TEST_SECRET|PRIVATE_/);
  }
  const head = await request('/site.css', 'HEAD');
  assert.equal(head.status, 200);
  assert.equal(head.body, '');
  assert.equal(head.headers['x-content-type-options'], 'nosniff');
  assert.equal((await request('/', 'POST')).status, 405);
});

test('public media aliases cannot expose private files', async t => {
  const { root, request } = await fixture(t);
  // Hard links need no Windows symlink privilege. Renaming a private source via a
  // symlink is additionally checked by realpath in the actual static server.
  assert.equal(publicPath('/media/.env.local'), null);
  assert.equal(publicPath('/media/CVS/secret.webp'), null);
  try {
    await fs.symlink(path.join(root, '.env.local'), path.join(root, 'media/secret.webp'));
  } catch (error) {
    if (error.code === 'EPERM') { t.diagnostic('Symlink creation unavailable; route denial checks passed.'); return; }
    throw error;
  }
  assert.equal((await request('/media/secret.webp')).status, 404);
});

test('Meta token is server-only, responses whitelist fields and cache avoids extra requests', async t => {
  let calls = 0;
  const { request } = await fixture(t, { fetchImpl: async (url, options) => {
    calls += 1;
    assert.equal(options.headers.Authorization, `Bearer ${config.accessToken}`);
    assert.equal(url.origin, 'https://graph.facebook.com');
    assert.equal(url.searchParams.has('access_token'), false);
    assert.equal(options.redirect, 'error');
    return { ok: true, json: async () => ({ data: [{ ...sample, access_token: config.accessToken, private: 'NEVER_PUBLIC' }], paging: { next: config.accessToken } }) };
  } });
  const first = await request('/api/noticias');
  const second = await request('/api/noticias');
  assert.equal(first.status, 200);
  assert.equal(first.json().posts.length, 1);
  assert.equal(first.json().stale, false);
  assert.equal(calls, 1);
  assert.equal(second.body, first.body);
  assert.doesNotMatch(first.body, /TEST_CREDENTIAL|NEVER_PUBLIC|paging|access_token/);
});

test('simultaneous feed requests share one upstream request', async t => {
  let calls = 0;
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  const { request } = await fixture(t, { fetchImpl: async () => { calls += 1; await gate; return goodFetch(); } });
  const first = request('/api/noticias');
  const second = request('/api/noticias');
  await new Promise(resolve => setTimeout(resolve, 30));
  release();
  assert.equal((await first).status, 200);
  assert.equal((await second).status, 200);
  assert.equal(calls, 1);
});

test('expired cache refreshes and retains last good posts on upstream failure', async t => {
  let time = 1000;
  let calls = 0;
  let failing = false;
  const { request } = await fixture(t, { now: () => time, cacheTtlMs: 50, fetchImpl: async () => {
    calls += 1;
    if (failing) throw new Error(`PRIVATE_FAILURE ${config.accessToken}`);
    return goodFetch();
  } });
  await request('/api/noticias');
  time = 1060;
  failing = true;
  const stale = await request('/api/noticias');
  assert.equal(stale.status, 200);
  assert.equal(stale.json().stale, true);
  assert.equal(stale.json().posts[0].message, sample.message);
  assert.equal(stale.json().updatedAt, new Date(1000).toISOString());
  assert.doesNotMatch(stale.body, /PRIVATE_FAILURE|TEST_CREDENTIAL/);
  time = 1200;
  failing = false;
  const refreshed = await request('/api/noticias');
  assert.equal(refreshed.json().stale, false);
  assert.equal(refreshed.json().updatedAt, new Date(time).toISOString());
  assert.equal(calls, 3);
});

test('upstream errors, invalid data and missing configuration become generic 503 errors', async t => {
  for (const options of [
    { config: { ...config, accessToken: '' } },
    { fetchImpl: async () => ({ ok: false, json: async () => ({ error: { message: config.accessToken } }) }) },
    { fetchImpl: async () => ({ ok: true, json: async () => ({ error: { message: config.accessToken } }) }) },
    { fetchImpl: async () => ({ ok: true, json: async () => ({ data: 'invalid' }) }) },
    { fetchImpl: async () => { throw new Error(config.accessToken); } }
  ]) {
    const { request } = await fixture(t, options);
    const response = await request('/api/noticias');
    assert.equal(response.status, 503);
    assert.match(response.json().error, /Facebook/);
    assert.doesNotMatch(response.body, /TEST_CREDENTIAL|stack|graph.facebook/);
    assert.equal((await request('/api/noticias', 'POST')).status, 405);
  }
});

test('hung upstream is cancelled by a timeout', async t => {
  const { request } = await fixture(t, { timeoutMs: 25, fetchImpl: (_url, { signal }) => new Promise((_resolve, reject) => {
    signal.addEventListener('abort', () => reject(signal.reason), { once: true });
  }) });
  assert.equal((await request('/api/noticias')).status, 503);
});

test('post normalization rejects hostile URLs and preserves message as plain text', () => {
  const posts = sanitizePosts([{ ...sample, message: '<img src=x onerror=alert(1)>', full_picture: 'javascript:alert(1)', permalink_url: 'https://facebook.com.evil.example/path', created_time: 'not a date' }], config.pageId);
  assert.equal(posts[0].full_picture, '');
  assert.equal(posts[0].permalink_url, 'https://www.facebook.com/permalink.php?story_fbid=67890&id=12345');
  assert.equal(posts[0].created_time, '');
  assert.equal(posts[0].message, '<img src=x onerror=alert(1)>');
  assert.equal(sanitizePosts([{ id: '<script>' }, null], config.pageId).length, 0);
  assert.equal(sanitizePosts([{ ...sample, full_picture: 'https://user:pass@fbcdn.net/a' }], config.pageId)[0].full_picture, '');
});

test('environment overrides local file and parser ignores unknown keys', async t => {
  const { root } = await fixture(t);
  await fs.appendFile(path.join(root, '.env.local'), 'UNKNOWN_SECRET=never_read\nMETA_API_VERSION="v23.0"\n');
  const values = loadConfig(root, { META_ACCESS_TOKEN: 'PROCESS_TEST_SECRET' });
  assert.equal(values.accessToken, 'PROCESS_TEST_SECRET');
  assert.equal(values.pageId, '456');
  assert.equal(values.port, 9001);
  assert.equal(values.apiVersion, 'v23.0');
  assert.equal(values.UNKNOWN_SECRET, undefined);
});
