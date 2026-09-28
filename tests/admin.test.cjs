'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const http = require('node:http');
const { createAdmin, hashPassword } = require('../admin-server.cjs');

const PASSWORD = 'Local-test-password-2026';
const hashPromise = hashPassword(PASSWORD);
const PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jM1sAAAAASUVORK5CYII=';
const banner = { mime: 'image/png', data: PNG };
const complete = {
  titulo: 'Curso de genómica', descripcion: 'Aprende análisis de datos de secuenciación.',
  categoria: 'Genómica', inicio: '2026-10-10', fin: '2026-10-12', fechas: '10 y 12 de octubre',
  horario: '17:00 a 20:00', duracion: '6 horas', nivel: 'Desde cero', modalidad: 'En línea',
  temario: ['Introducción', 'Práctica'], incluye: ['Material', 'Grabaciones'],
  instructor: [{ nombre: 'Nombre de prueba', desc: 'Docente de genómica', cv: 'https://example.com/cv' }],
  precio: '', precios: { columnas: ['Perfil', 'Preventa', 'Regular'], filas: [['Estudiante', '$500 MXN', '$800 MXN'], ['Profesional', '$900 MXN', '$1000 MXN']] },
  publicationStatus: 'published'
};

async function fixture(t, options = {}) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'gts-admin-test-'));
  await fs.mkdir(path.join(root, 'data'));
  await fs.writeFile(path.join(root, 'data/cursos.json'), JSON.stringify([{ ...complete, id: 'c9', img: 'media/base.jpg', formulario: 'https://example.com/registration', cartelVigente: false, inscripcionConfirmada: false }]));
  const config = { adminPasswordHash: await hashPromise, ...options.config };
  const admin = createAdmin({ root, config, now: options.now });
  const server = http.createServer(async (req, res) => {
    if (!await admin.handle(req, res)) { res.writeHead(404); res.end(); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  t.after(async () => { await new Promise(resolve => server.close(resolve)); await fs.rm(root, { force: true, recursive: true }); });
  function request(route, method = 'GET', body, headers = {}) {
    return new Promise((resolve, reject) => {
      const encoded = body === undefined ? undefined : JSON.stringify(body);
      const req = http.request(`${origin}${route}`, {
        method, headers: { ...(encoded === undefined ? {} : { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(encoded) }), ...headers }
      }, res => {
        const chunks = [];
        res.on('data', chunk => chunks.push(chunk));
        res.on('end', () => { const bytes = Buffer.concat(chunks); resolve({ status: res.statusCode, headers: res.headers, body: bytes.toString('utf8'), bytes, json: () => JSON.parse(bytes.toString('utf8')) }); });
      });
      req.on('error', reject);
      req.end(encoded);
    });
  }
  async function login(loginOrigin = origin) {
    const response = await request('/api/admin/login', 'POST', { password: PASSWORD }, { Origin: loginOrigin });
    assert.equal(response.status, 200, response.body);
    return { Cookie: response.headers['set-cookie'][0].split(';')[0], Origin: loginOrigin, 'X-CSRF-Token': response.json().csrfToken };
  }
  return { root, config, admin, origin, request, login };
}

test('disabled administration does not reveal configuration or accept writes', async t => {
  const { request, admin } = await fixture(t, { config: { adminPasswordHash: '' } });
  assert.deepEqual((await request('/api/admin/session')).json(), { configured: false, authenticated: false });
  const response = await request('/api/admin/courses', 'POST', { course: complete });
  assert.equal(response.status, 503);
  assert.doesNotMatch(response.body, /scrypt\$|Local-test-password/);
  assert.equal((await admin.getPublishedCourses()).length, 1);
});

test('login uses HttpOnly Strict cookie, requires exact Origin and protects all course writes', async t => {
  const { request, login, origin } = await fixture(t);
  assert.equal((await request('/api/admin/courses')).status, 401);
  assert.equal((await request('/api/admin/courses', 'POST', { revision: 0, course: complete, banner }, { Origin: origin })).status, 401);
  assert.equal((await request('/api/admin/login', 'POST', { password: PASSWORD })).status, 403);
  assert.equal((await request('/api/admin/login', 'POST', { password: PASSWORD }, { Origin: 'https://evil.example' })).status, 403);
  const headers = await login();
  assert.equal((await request('/api/admin/session', 'GET', undefined, headers)).json().authenticated, true);
  const noCsrf = { Cookie: headers.Cookie, Origin: origin };
  assert.equal((await request('/api/admin/courses', 'POST', { revision: 0, course: complete, banner }, noCsrf)).status, 403);
  assert.equal((await request('/api/admin/courses', 'POST', { revision: 0, course: complete, banner }, { ...headers, Origin: 'https://evil.example' })).status, 403);
  const response = await request('/api/admin/login', 'POST', { password: PASSWORD }, { Origin: origin });
  assert.match(response.headers['set-cookie'][0], /HttpOnly; SameSite=Strict/);
  assert.doesNotMatch(response.headers['set-cookie'][0], /; Secure/);
  assert.equal((await request('/api/admin/logout', 'POST', {}, noCsrf)).status, 403);
  assert.equal((await request('/api/admin/logout', 'POST', {}, headers)).status, 200);
  assert.equal((await request('/api/admin/courses', 'GET', undefined, headers)).status, 401);
});

test('published courses and raster banners persist across reopening; fields and IDs are server controlled', async t => {
  const { root, config, admin, request, login } = await fixture(t);
  const headers = await login();
  const response = await request('/api/admin/courses', 'POST', {
    revision: 0, banner, course: { ...complete, id: 'c9', img: '../../secret.svg', inscripcionConfirmada: true, formulario: 'javascript:alert(1)', untrusted: 'private' }
  }, headers);
  assert.equal(response.status, 201, response.body);
  const { course, revision } = response.json();
  assert.equal(course.id, 'c10');
  assert.equal(revision, 1);
  assert.equal(course.precio, '-');
  assert.equal(course.cartelVigente, true);
  assert.equal(course.inscripcionConfirmada, undefined);
  assert.equal(course.formulario, undefined);
  assert.equal(course.untrusted, undefined);
  assert.deepEqual(course.precios, complete.precios);
  assert.match(course.img, /^media\/admin\/[a-f0-9-]+\.png$/);
  assert.deepEqual(await admin.getBanner(course.img), Buffer.from(PNG, 'base64'));
  const reopened = createAdmin({ root, config });
  assert.deepEqual(await reopened.getPublishedCourses(), await admin.getPublishedCourses());
  assert.deepEqual(await reopened.getBanner(course.img), Buffer.from(PNG, 'base64'));
  const updated = await request('/api/admin/courses/c9', 'PUT', { revision: 1, banner, course: { titulo: 'Nombre actualizado', inscripcionConfirmada: true, img: 'evil.svg', id: 'c10' } }, headers);
  assert.equal(updated.status, 200, updated.body);
  assert.equal(updated.json().course.id, 'c9');
  assert.equal(updated.json().course.formulario, 'https://example.com/registration');
  assert.equal(updated.json().course.inscripcionConfirmada, false);
  assert.equal(updated.json().course.cartelVigente, true);
  assert.equal((await fs.readdir(path.join(root, '.admin-data'))).some(file => file.endsWith('.tmp')), false);
});

test('draft courses and their banners stay private, including after unpublishing', async t => {
  const { admin, request, login } = await fixture(t);
  const headers = await login();
  const saved = await request('/api/admin/courses', 'POST', { revision: 0, course: { titulo: 'Borrador privado', publicationStatus: 'draft' }, banner }, headers);
  assert.equal(saved.status, 201, saved.body);
  const course = saved.json().course;
  assert.equal((await admin.getPublishedCourses()).some(item => item.id === course.id), false);
  assert.equal(await admin.getBanner(course.img), null);
  const privatePath = course.img.replace('media/admin/', '/api/admin/banner/');
  assert.equal((await request(privatePath)).status, 401);
  assert.deepEqual((await request(privatePath, 'GET', undefined, headers)).bytes, Buffer.from(PNG, 'base64'));
  assert.equal((await request('/api/admin/courses', 'GET', undefined, headers)).json().courses.length, 2);
  assert.equal((await request(`/api/admin/courses/${course.id}`, 'PUT', { revision: 1, course: complete }, headers)).status, 200);
  assert.ok(await admin.getBanner(course.img));
  assert.equal((await request(`/api/admin/courses/${course.id}`, 'PUT', { revision: 2, course: { publicationStatus: 'draft' } }, headers)).status, 200);
  assert.equal(await admin.getBanner(course.img), null);
});

test('invalid course content and malicious uploads cannot mutate the store', async t => {
  const { root, request, login } = await fixture(t);
  const headers = await login();
  const invalid = [
    { course: { ...complete, titulo: '<img src=x onerror=alert(1)>' }, banner },
    { course: { ...complete, instructor: [{ nombre: 'Instructor', cv: 'javascript:alert(1)' }] }, banner },
    { course: { ...complete, instructor: [{ nombre: 'Instructor', cv: 'https://name:password@example.com' }] }, banner },
    { course: { ...complete, inicio: '2026-02-30' }, banner },
    { course: { ...complete, inicio: '2026-12-31' }, banner },
    { course: { ...complete, temario: [] }, banner },
    { course: { ...complete, precios: { columnas: ['Perfil', 'Regular'], filas: [['Estudiante']] } }, banner },
    { course: complete },
    { course: complete, banner: { mime: 'image/svg+xml', data: Buffer.from('<svg onload="alert(1)"></svg>').toString('base64') } },
    { course: complete, banner: { mime: 'image/png', data: Buffer.from('<script>alert(1)</script>').toString('base64') } },
    { course: complete, banner: { mime: 'image/jpeg', data: PNG } },
    { course: complete, banner: { mime: 'image/png', data: 'not_base64!' } }
  ];
  for (const body of invalid) {
    const result = await request('/api/admin/courses', 'POST', { revision: 0, ...body }, headers);
    assert.equal(result.status, 400, result.body);
  }
  await assert.rejects(fs.stat(path.join(root, '.admin-data')), { code: 'ENOENT' });
  const state = (await request('/api/admin/courses', 'GET', undefined, headers)).json();
  assert.equal(state.revision, 0);
  assert.equal(state.courses.length, 1);
});

test('oversize images are refused without storing bytes', async t => {
  const { root, request, login } = await fixture(t);
  const headers = await login();
  const result = await request('/api/admin/courses', 'POST', { revision: 0, course: complete, banner: { mime: 'image/png', data: Buffer.alloc(5 * 1024 * 1024 + 1).toString('base64') } }, headers);
  assert.equal(result.status, 413);
  await assert.rejects(fs.stat(path.join(root, '.admin-data')), { code: 'ENOENT' });
});

test('concurrent edits have one winner and retry allocates a distinct ID', async t => {
  const { admin, request, login } = await fixture(t);
  const headers = await login();
  const body = { revision: 0, course: { titulo: 'Nuevo borrador', publicationStatus: 'draft' } };
  const responses = await Promise.all([request('/api/admin/courses', 'POST', body, headers), request('/api/admin/courses', 'POST', body, headers)]);
  assert.deepEqual(responses.map(result => result.status).sort(), [201, 409]);
  const retry = await request('/api/admin/courses', 'POST', { ...body, revision: 1 }, headers);
  assert.equal(retry.status, 201);
  assert.equal(retry.json().course.id, 'c11');
  const state = (await request('/api/admin/courses', 'GET', undefined, headers)).json();
  assert.equal(state.revision, 2);
  assert.equal(new Set(state.courses.map(course => course.id)).size, 3);
  assert.equal((await admin.getPublishedCourses()).length, 1);
});

test('sessions expire and failed login attempts are bounded', async t => {
  let time = 1000;
  const { request, login, origin } = await fixture(t, { now: () => time });
  const headers = await login();
  time += 8 * 60 * 60 * 1000;
  assert.equal((await request('/api/admin/courses', 'GET', undefined, headers)).status, 401);
  for (let i = 0; i < 8; i += 1) assert.equal((await request('/api/admin/login', 'POST', { password: 'wrong' }, { Origin: origin })).status, 401);
  assert.equal((await request('/api/admin/login', 'POST', { password: PASSWORD }, { Origin: origin })).status, 429);
  time += 15 * 60 * 1000;
  await login();
});

test('HTTPS origin enables Secure cookies; public hosts require explicit origin configuration', async t => {
  const secured = await fixture(t, { config: { adminOrigin: 'https://admin.example.com' } });
  const response = await secured.request('/api/admin/login', 'POST', { password: PASSWORD }, { Origin: 'https://admin.example.com' });
  assert.equal(response.status, 200, response.body);
  assert.match(response.headers['set-cookie'][0], /; Secure/);
  const local = await fixture(t);
  assert.equal((await local.request('/api/admin/login', 'POST', { password: PASSWORD }, { Host: 'public.example.com', Origin: 'https://public.example.com' })).status, 503);
  assert.throws(() => createAdmin({ root: local.root, config: { adminOrigin: 'http://public.example.com' } }));
  assert.throws(() => createAdmin({ root: local.root, config: { adminDataDir: 'media/private' } }));
});

test('banner paths reject traversal and symlink storage cannot expose or overwrite targets', async t => {
  const { root, admin, request, login } = await fixture(t);
  for (const name of ['../courses.json', '/media/admin/../../secret.png', '/media/admin/test.svg', '/media/admin/%2e%2e/secret.png', 'media/admin/not-a-uuid.png']) assert.equal(await admin.getBanner(name), null);
  const outside = await fs.mkdtemp(path.join(os.tmpdir(), 'gts-admin-outside-'));
  t.after(() => fs.rm(outside, { force: true, recursive: true }));
  await fs.writeFile(path.join(outside, 'untouched.txt'), 'KEEP');
  try { await fs.symlink(outside, path.join(root, '.admin-data'), process.platform === 'win32' ? 'junction' : 'dir'); } catch (error) {
    if (error.code === 'EPERM') { t.diagnostic('Symlink unavailable; traversal checks passed.'); return; }
    throw error;
  }
  const headers = await login();
  assert.equal((await request('/api/admin/courses', 'POST', { revision: 0, course: complete, banner }, headers)).status, 500);
  assert.deepEqual(await fs.readdir(outside), ['untouched.txt']);
  assert.equal(await fs.readFile(path.join(outside, 'untouched.txt'), 'utf8'), 'KEEP');
});
