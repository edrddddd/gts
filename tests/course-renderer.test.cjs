'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const pages = require('../course-renderer.cjs');
const courses = require('../data/cursos.json');
const manifest = require('../data/image-manifest.json');
const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
const escaped = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
const shell = read('cursos/c1.html');
const sample = { ...courses[0], id: 'c99', titulo: 'Curso desde administración', inicio: '2026-10-01', fin: '2026-10-03', precio: '-', publicationStatus: 'published' };

test('runtime details preserve every original topic, stage, profile and poster', () => {
  for (const course of courses) {
    const html = pages.renderDetailPage(shell, course, manifest, '2026-09-27');
    assert.match(html, new RegExp('data-course-detail="' + course.id + '"'));
    for (const topic of course.temario || []) assert.ok(html.includes(escaped(topic)), course.id + ': ' + topic);
    for (const value of [...(course.precios?.columnas || []), ...(course.precios?.filas || []).flat()]) {
      const text = String(value).trim();
      if (text && !/^[-—–]+$/.test(text)) assert.ok(html.includes(escaped(text)), course.id + ': ' + text);
    }
    if (course.img && course.cartelVigente !== false) assert.ok(html.includes('../' + course.img), course.id + ' poster');
    assert.ok(html.includes('contacto.html?curso=' + course.id));
  }
});

test('runtime content escapes text and rejects unsafe image and instructor links', () => {
  const unsafe = { ...sample, titulo: '<script>alert(1)</script>', descripcion: 'A & B', img: 'media/%2e%2e/.env.png', instructor: [{nombre: '<b>A</b>', desc: 'Docente', cv: 'javascript:alert(1)'}] };
  const html = pages.renderDetailPage(shell, unsafe, {}, '2026-09-27');
  assert.ok(html.includes('&lt;script&gt;alert(1)&lt;/script&gt;'));
  assert.ok(html.includes('A &amp; B'));
  assert.doesNotMatch(html, /<script>alert|javascript:alert|\.env\.png/);
  assert.throws(() => pages.renderDetailPage(shell, {...sample, publicationStatus:'draft'}), /no publicado/);
});

test('detail metadata and blank stage prices belong to the requested course', () => {
  const html = pages.renderDetailPage(shell, { ...sample, precios: { columnas: ['Perfil', 'Preventa', 'Regular'], filas: [['Estudiante', '', '$800 MXN']] } }, {}, '2026-10-01');
  assert.match(html, /<title>Curso desde administración \| GenomicsTrack Solutions<\/title>/);
  assert.match(html, /rel="canonical" href="https:\/\/[^" ]+\/cursos\/c99.html"/);
  assert.match(html, /property="og:url" content="https:\/\/[^" ]+\/cursos\/c99.html"/);
  assert.match(html, /data-course-price>-<\/dd>/);
  assert.match(html, /<td>-<\/td><td>\$800 MXN<\/td>/);
  assert.match(html, /status-en-curso/);
});

test('catalog respects Mexico City day boundaries and excludes drafts from cards and filters', () => {
  const rows = [sample, {...sample, id:'c100', titulo:'Privado', categoria:'Categoría privada', publicationStatus:'draft'}];
  const catalog = read('cursos.html');
  const before = pages.renderCatalogPage(catalog, rows, {}, new Date('2026-10-01T05:59:59Z'));
  assert.match(before, /status-inscripcion/);
  const start = pages.renderCatalogPage(catalog, rows, {}, new Date('2026-10-01T06:00:00Z'));
  assert.match(start, /status-en-curso/);
  assert.doesNotMatch(start, /Privado|Categoría privada|data-course-id="c100"/);
  const after = pages.renderCatalogPage(catalog, rows, {}, '2026-10-04');
  assert.match(after, /data-course-id="c99" hidden/);
  assert.match(after, /0 cursos vigentes/);
});

test('home selects upcoming courses and keeps surrounding sections intact', () => {
  const home = pages.renderHomePage(read('index.html'), [sample, {...sample, id:'c100', titulo:'Privado', publicationStatus:'draft'}], {}, '2026-09-27');
  assert.match(home, /id="home-courses"/);
  assert.match(home, /href="cursos\/c99.html"/);
  assert.doesNotMatch(home, /Privado/);
  assert.equal((home.match(/<footer\b/g) || []).length, 1);
  assert.equal((home.match(/data-course-id=/g) || []).length, 1);
});

test('browser data remains executable while excluding drafts and escaping script boundaries', () => {
  const title = '</script>\u2028Texto';
  const script = pages.renderCatalogData(read('catalog-data.js'), [{...sample, titulo:title}, {...sample,id:'c100',publicationStatus:'draft'}]);
  assert.doesNotMatch(script, /<\/script>/);
  const context = { module: {exports:{}}, Intl, Date, URLSearchParams };
  vm.runInNewContext(script, context);
  assert.equal(context.module.exports.getById('c99').titulo, title);
  assert.equal(context.module.exports.getById('c100'), undefined);
});

test('sitemap replaces removed courses and excludes administration and drafts', () => {
  const xml = '<urlset><url><loc>https://example.org/index.html</loc></url><url><loc>https://example.org/admin.html</loc></url><url><loc>https://example.org/cursos/c1.html</loc></url></urlset>';
  const output = pages.renderSitemap(xml, [sample, {...sample,id:'c100',publicationStatus:'draft'}], 'https://example.org');
  assert.match(output, /index.html/);
  assert.match(output, /cursos\/c99.html/);
  assert.doesNotMatch(output, /admin|cursos\/c1.html|cursos\/c100.html/);
});
