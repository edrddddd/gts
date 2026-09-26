'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const catalog = require('../catalog-data.js');
const source = JSON.parse(fs.readFileSync(path.join(root, 'data/cursos.json'), 'utf8'));

test('all 33 courses are generated from the canonical data without losing profiles', () => {
  assert.deepEqual(catalog.courses, source);
  assert.equal(catalog.courses.length, 33);
  assert.equal(new Set(source.map(c => c.id)).size, 33);
  assert.equal(catalog.getById('c30').instructor[1].nombre, 'Josué Guzmán Linares');
  assert.equal(catalog.getById('c8').instructor.length, 2);
  assert.equal(catalog.getById('unknown'), undefined);
  source.forEach(course => {
    assert.match(course.inicio, /^\d{4}-\d{2}-\d{2}$/);
    assert.match(course.fin, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(course.inicio <= course.fin, course.id);
  });
});

test('course states change at the first and last Mexico City calendar days inclusively', () => {
  const course = catalog.getById('c31');
  assert.equal(catalog.getStatus(course, '2026-09-21'), 'inscripcion');
  assert.equal(catalog.getStatus(course, '2026-09-22'), 'en-curso');
  assert.equal(catalog.getStatus(course, '2026-10-01'), 'en-curso');
  assert.equal(catalog.getStatus(course, '2026-10-02'), 'finalizado');
  assert.equal(catalog.getStatus(course, '2026-09-22T05:59:59Z'), 'inscripcion');
  assert.equal(catalog.getStatus(course, '2026-09-22T06:00:00Z'), 'en-curso');
  assert.equal(catalog.getStatus(course, '2026-10-02T05:59:59Z'), 'en-curso');
  assert.equal(catalog.getStatus(course, '2026-10-02T06:00:00Z'), 'finalizado');
  assert.equal(catalog.getStatus(course, new Date('2026-10-02T00:30:00-06:00')), 'finalizado');
});

test('audit date has two upcoming, two in-progress and 29 historical editions', () => {
  const current = source.filter(c => catalog.getStatus(c, '2026-09-24') === 'en-curso');
  const finished = source.filter(c => catalog.getStatus(c, '2026-09-24') === 'finalizado');
  assert.deepEqual(current.map(c => c.id), ['c31', 'c30']);
  assert.equal(finished.length, 29);
  assert.deepEqual(source.filter(c => catalog.getStatus(c, '2026-09-24') === 'inscripcion').map(c => c.id), ['c33', 'c32']);
  assert.equal(catalog.getStatus(catalog.getById('c29'), '2026-09-24'), 'finalizado');
});

test('missing courses fail closed and invalid calendar inputs fail explicitly', () => {
  assert.equal(catalog.getStatus(undefined), 'finalizado');
  assert.equal(catalog.canPay(undefined), false);
  assert.throws(() => catalog.localDay('not-a-date'), TypeError);
  assert.throws(() => catalog.localDay('2026-02-30'), TypeError);
  assert.throws(() => catalog.localDay('2026-99-99'), TypeError);
});

test('an in-progress or completed course can never enable payment', () => {
  for (const course of source) {
    assert.equal(catalog.canPay(course, '2026-09-24'), false);
    assert.equal(catalog.canPay({...course, inscripcionConfirmada: true}, course.inicio), false);
    assert.equal(catalog.canPay({...course, inscripcionConfirmada: true}, '2030-01-01'), false);
  }
});

test('verified course corrections preserve source links without invented prices', () => {
  const course = catalog.getById('c31');
  assert.match(course.descripcion, /bioestadística/);
  assert.doesNotMatch(course.descripcion, /amplicones|comunidades microbianas/);
  assert.equal(course.temario.length, 8);
  assert.match(course.temario[0], /bioestadística/);
  assert.ok(course.precios.filas.every(row => row.slice(1).every(value => value === '--')));
  assert.match(course.fuente, /122203410122829797$/);
  assert.equal(catalog.getById('c30').inicio, '2026-09-19');
  assert.equal(catalog.getById('c30').fin, '2026-09-27');
  assert.equal(catalog.getStatus(catalog.getById('c30'), '2026-09-28'), 'finalizado');
  assert.equal(catalog.getById('c30').cartelVigente, false);
  const meta = catalog.getById('c29');
  assert.equal(meta.temario.length, 9);
  assert.match(meta.temario[0], /16S, 18S e ITS/);
  assert.equal(meta.temarioOriginal.length, 10);
});

test('permanent course pages have readable initial content and contextual contact links', () => {
  for (const course of source) {
    const html = fs.readFileSync(path.join(root, 'cursos', course.id + '.html'), 'utf8');
    assert.match(html, /<h1>/, course.id);
    assert.match(html, new RegExp('data-course-detail="' + course.id + '"'));
    assert.ok(html.includes(course.titulo.replaceAll('&', '&amp;')), course.id);
    assert.ok(html.includes('contacto.html?curso=' + course.id + '&amp;servicio=cursos'), course.id);
    assert.doesNotMatch(html, /paypal\.com|paypal\.me|4152\s*3140|modal-overlay|onclick=/);
    if (course.img && course.cartelVigente !== false) assert.match(html, /loading="lazy"/);
    else assert.doesNotMatch(html, /<img[^>]+src="\.\.\/"/);
  }
});

test('the catalog works as a browser global without CommonJS', () => {
  const context = {Intl, Date};
  vm.runInNewContext(fs.readFileSync(path.join(root, 'catalog-data.js'), 'utf8'), context);
  assert.equal(context.CourseCatalog.courses.length, 33);
  assert.equal(context.CourseCatalog.labelStatus('en-curso'), 'En curso');
  assert.equal(context.CourseCatalog.getStatus(context.CourseCatalog.getById('c30'), '2026-09-24'), 'en-curso');
});
