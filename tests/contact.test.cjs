const test = require('node:test');
const assert = require('node:assert/strict');
const contact = require('../contacto.js');
const payments = require('../pagos.js');
const valid = { nombre: 'Ana López', correo: 'ana+curso@instituto.mx', servicio: 'cursos', mensaje: 'Quiero información sobre el curso.' };
const now = new Date('2026-09-24T20:00:00Z');

test('four required fields, optional institution and schedule', () => {
  assert.deepEqual(contact.validate(valid, now), {});
  assert.deepEqual(Object.keys(contact.validate({}, now)), ['nombre', 'correo', 'servicio', 'mensaje']);
  assert.deepEqual(contact.validate({ ...valid, servicio: 'consultoria' }, now), {});
});

test('reject malformed emails and accept tagged institutional addresses', () => {
  for (const correo of ['incorrecto', 'a@', 'a@b', 'a@@b.com', 'a b@c.mx', 'a@.com', 'a@b..mx', '.a@b.mx', 'a..b@c.mx', 'a.@c.mx']) {
    assert.ok(contact.validate({ ...valid, correo }, now).correo, correo);
  }
  for (const correo of ['persona@instituto.edu.mx', 'ana.lópez@ejemplo.mx', 'ana+curso@ejemplo.mx']) {
    assert.equal(contact.validate({ ...valid, correo }, now).correo, undefined, correo);
  }
});

test('schedule validates in Mexico City timezone and requires both fields', () => {
  assert.deepEqual(contact.mexicoNow(now), { date: '2026-09-24', time: '14:00' });
  const scheduled = { ...valid, servicio: 'consultoria', fecha: '2026-09-24', hora: '14:01' };
  assert.deepEqual(contact.validate(scheduled, now), {});
  assert.ok(contact.validate({ ...scheduled, hora: '14:00' }, now).hora);
  assert.ok(contact.validate({ ...scheduled, fecha: '2026-09-23' }, now).fecha);
  assert.ok(contact.validate({ ...scheduled, fecha: '2026-02-30' }, now).fecha);
  assert.ok(contact.validate({ ...scheduled, hora: '' }, now).hora);
  assert.ok(contact.validate({ ...scheduled, fecha: '' }, now).fecha);
  assert.deepEqual(contact.validate({ ...scheduled, servicio: 'cursos', fecha: '2020-01-01' }, now), {});
});

test('query context and encoded messages preserve the selected course and profile', () => {
  const query = '?curso=c31&servicio=cursos&perfil=Posgrado&motivo=Pr%C3%B3xima%20edici%C3%B3n%20%26%20costos';
  const context = contact.readContext(query);
  const catalog = { getById: id => id === 'c31' ? { titulo: 'Bioestadística en R' } : undefined };
  const message = contact.buildMessage(valid, context, catalog);
  assert.match(message, /Bioestadística en R \(c31\)/);
  assert.match(message, /Perfil: Posgrado/);
  assert.match(message, /Próxima edición & costos/);
  const links = contact.shareLinks(message, context, catalog);
  assert.equal(new URL(links.whatsapp).searchParams.get('text'), message);
  assert.equal(new URL(links.email).searchParams.get('body'), message);
  assert.equal(new URL(links.email).pathname, contact.EMAIL);
});

test('consulting context is prefilled and explicitly subject to confirmation', () => {
  const context = contact.readContext('?servicio=Consultor%C3%ADa&fecha=2026-10-01&hora=11%3A30&motivo=RNA-seq');
  assert.equal(context.servicio, 'consultoria');
  assert.equal(context.fecha, '2026-10-01');
  const message = contact.buildMessage({ ...valid, ...context }, context);
  assert.match(message, /2026-10-01 a las 11:30/);
  assert.match(message, /Ciudad de México; sujeto a confirmación/);
  assert.equal(contact.readContext('?servicio=toString').servicio, '');
});

test('every published service retains its selection when opening contact', () => {
  const services = require('../data/servicios.json');
  for (const service of services) {
    const context = contact.readContext('?servicio=' + service.id);
    assert.ok(Object.hasOwn(contact.SERVICES, context.servicio), service.id);
    assert.deepEqual(contact.validate({ ...valid, servicio: context.servicio }, now), {});
  }
});

test('payments never turn historical, active or missing prices into a charge', () => {
  for (const status of ['finalizado', 'en-curso', 'inscripcion']) {
    const course = { id: 'c1', precios: { filas: [['Licenciatura*', '$999 MXN'], ['Posgrado*', '--']] } };
    const state = payments.paymentState(course, 'Posgrado', { getStatus: () => status });
    assert.equal(state.canPay, false);
    assert.equal(state.amount, 'Por confirmar con el equipo');
    const link = new URL(payments.contactUrl(state), 'https://example.test/');
    assert.equal(link.searchParams.get('curso'), 'c1');
    assert.equal(link.searchParams.get('perfil'), 'Posgrado');
    assert.equal(link.searchParams.has('importe'), false);
  }
  assert.equal(payments.paymentState(null, '', {}).canPay, false);
});

test('unknown course reference is retained without accepting query prices', () => {
  const state = payments.paymentState(null, '', {});
  const link = new URL(payments.contactUrl(state, { curso: 'desconocido', motivo: 'Duda de acceso' }), 'https://example.test/');
  assert.equal(link.searchParams.get('curso'), 'desconocido');
  assert.match(link.searchParams.get('motivo'), /Duda de acceso/);
  assert.equal(payments.paymentState({ precios: { filas: [['Posgrado*', '--']] } }, 'falso', { getStatus: () => 'en-curso' }).profile, '');
});
