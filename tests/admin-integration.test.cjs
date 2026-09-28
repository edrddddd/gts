'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { createSiteServer, loadConfig } = require('../server.cjs');
const { hashPassword } = require('../admin-server.cjs');

const project = path.join(__dirname, '..');
const password = 'Only-integration-tests-2026';
const banner = { mime: 'image/png', data: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jrZkAAAAASUVORK5CYII=' };

test('an admin publication survives restart and reaches every public course surface', async t => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'gts-admin-integration-'));
  await fs.mkdir(path.join(root, 'data'));
  await fs.mkdir(path.join(root, 'cursos'));
  for (const file of ['index.html', 'cursos.html', 'catalog-data.js', 'sitemap.xml', 'site.config.json', 'cursos/c1.html']) {
    await fs.copyFile(path.join(project, file), path.join(root, file));
  }
  const base = JSON.parse(await fs.readFile(path.join(project, 'data/cursos.json'), 'utf8')).find(c => c.id === 'c30');
  await fs.writeFile(path.join(root, 'data/cursos.json'), JSON.stringify([{ ...base, id: 'c1', titulo: 'Curso original' }]));
  await fs.writeFile(path.join(root, 'data/image-manifest.json'), '{}');
  const config = { adminPasswordHash: await hashPassword(password), adminDataDir: path.join(root, '.admin-data') };
  let server;
  let origin;
  async function start() {
    server = createSiteServer({ root, config });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    origin = `http://127.0.0.1:${server.address().port}`;
  }
  t.after(async () => {
    if (server?.listening) await new Promise(resolve => server.close(resolve));
    assert.ok(path.resolve(root).startsWith(path.resolve(os.tmpdir()) + path.sep + 'gts-admin-integration-'));
    await fs.rm(root, { recursive: true, force: true });
  });
  await start();
  const login = await fetch(origin + '/api/admin/login', { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) });
  assert.equal(login.status, 200);
  const cookie = login.headers.get('set-cookie').split(';')[0];
  const { csrfToken } = await login.json();
  const headers = { Origin: origin, Cookie: cookie, 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken };
  const list = await (await fetch(origin + '/api/admin/courses', { headers })).json();
  const course = {
    titulo: 'Curso nuevo desde el panel', descripcion: 'Una descripción completa para probar la publicación.', categoria: 'Genómica',
    inicio: '2099-01-01', fin: '2099-01-03', fechas: '1 y 3 de enero de 2099', horario: '17:00–20:00 CDMX', duracion: '6 horas',
    nivel: 'Inicial', modalidad: 'En línea', precio: '', temario: ['Tema uno', 'Tema dos'], incluye: ['Material y grabación'],
    instructor: [{ nombre: 'Docente de prueba', desc: 'Experiencia docente.', cv: 'https://example.org/cv' }],
    precios: { columnas: ['Perfil', 'Preventa', 'Regular'], filas: [['Estudiantes', '$500 MXN', '']] }, publicationStatus: 'draft'
  };
  const saved = await fetch(origin + '/api/admin/courses', { method: 'POST', headers, body: JSON.stringify({ course, banner, revision: list.revision }) });
  assert.equal(saved.status, 201);
  const draft = await saved.json();
  assert.equal(draft.course.id, 'c2');
  const imagePath = '/' + draft.course.img;
  assert.equal((await fetch(origin + '/cursos/c2.html')).status, 404);
  assert.equal((await fetch(origin + imagePath)).status, 404);
  assert.doesNotMatch(await (await fetch(origin + '/catalog-data.js')).text(), /Curso nuevo desde el panel/);
  const published = await fetch(origin + '/api/admin/courses/c2', { method: 'PUT', headers, body: JSON.stringify({ course: { ...draft.course, publicationStatus: 'published' }, revision: draft.revision }) });
  assert.equal(published.status, 200);
  const updated = await published.json();
  for (const page of ['/', '/index.html', '/cursos.html', '/cursos/c2.html', '/catalog-data.js', '/data/cursos.json']) {
    const response = await fetch(origin + page);
    assert.equal(response.status, 200, page);
    assert.match(await response.text(), /Curso nuevo desde el panel/, page);
  }
  const detail = await (await fetch(origin + '/cursos/c2.html')).text();
  assert.match(detail, /Tema uno/);
  assert.match(detail, /Preventa/);
  assert.match(detail, /\$500 MXN/);
  assert.match(detail, /contacto\.html\?curso=c2/);
  assert.match(await (await fetch(origin + '/sitemap.xml')).text(), /cursos\/c2\.html/);
  assert.equal((await fetch(origin + imagePath)).status, 200);
  const withdrawn = await fetch(origin + '/api/admin/courses/c1', { method: 'PUT', headers, body: JSON.stringify({ course: { publicationStatus: 'draft' }, revision: updated.revision }) });
  assert.equal(withdrawn.status, 200);
  for (const hiddenRoute of ['/cursos/c1.html', '/cursos/%631.html', '/%63ursos/c1.html']) {
    assert.equal((await fetch(origin + hiddenRoute)).status, 404, 'No fallback to old static page: ' + hiddenRoute);
  }
  assert.doesNotMatch(await (await fetch(origin + '/sitemap.xml')).text(), /cursos\/c1\.html/);
  for (const privatePath of ['/.admin-data/courses.json', '/admin-server.cjs', '/course-renderer.cjs', '/render.yaml', '/.env.admin']) {
    assert.equal((await fetch(origin + privatePath)).status, 404, privatePath);
  }
  // Restart the service against the same persistent directory.
  await new Promise(resolve => server.close(resolve));
  await start();
  assert.match(await (await fetch(origin + '/cursos/c2.html')).text(), /Curso nuevo desde el panel/);
  assert.equal((await fetch(origin + imagePath)).status, 200);
  // A session from before the restart is no longer authenticated.
  assert.equal((await fetch(origin + '/api/admin/courses', { headers: { Cookie: cookie } })).status, 401);
  assert.ok(updated.revision);
});

test('admin configuration is private and environment values override local setup', async t => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'gts-admin-config-'));
  t.after(async () => {
    assert.ok(path.resolve(root).startsWith(path.resolve(os.tmpdir()) + path.sep + 'gts-admin-config-'));
    await fs.rm(root, { recursive: true, force: true });
  });
  await fs.writeFile(path.join(root, '.env.local'), 'META_PAGE_ID=123\n');
  await fs.writeFile(path.join(root, '.env.admin'), 'ADMIN_PASSWORD_HASH=LOCAL_TEST_HASH\nMETA_PAGE_ID=DO_NOT_OVERRIDE\n');
  const config = loadConfig(root, { ADMIN_PASSWORD_HASH: 'ENV_TEST_HASH', ADMIN_ORIGIN: 'https://example.org', ADMIN_DATA_DIR: 'private-courses' });
  assert.equal(config.adminPasswordHash, 'ENV_TEST_HASH');
  assert.equal(config.adminOrigin, 'https://example.org');
  assert.equal(config.adminDataDir, path.join(root, 'private-courses'));
  assert.equal(config.pageId, '123');
});
