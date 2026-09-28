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

test('a course consultation keeps its edition, profile and motive through the payment guide', () => {
  const catalog = require('../catalog-data.js');
  for (const id of ['c31', 'c32', 'c33', 'c1']) {
    const context = contact.readContext(`?curso=${id}&perfil=Posgrado&motivo=Consulta%20de%20inscripci%C3%B3n`);
    const guide = new URL(contact.paymentUrl(context), 'https://example.test/');
    assert.equal(guide.searchParams.get('curso'), id);
    assert.equal(guide.searchParams.get('perfil'), 'Posgrado');
    const returned = new URL(payments.contactUrl(payments.paymentState(catalog.getById(id), 'Posgrado', catalog), context), 'https://example.test/');
    const restored = contact.readContext(returned.search);
    assert.equal(restored.curso, id);
    assert.equal(restored.perfil, 'Posgrado');
    assert.equal(restored.motivo, context.motivo);
  }
  assert.equal(contact.paymentUrl({}), 'pagos.html');
  assert.equal(contact.readContext('?curso=%20C32%20').curso, 'c32');
});

function flowDocument(ids) {
  function element(tag = 'div') {
    let currentValue = '';
    return {
      tag, children: [], hidden: true, textContent: '', attributes: {}, listeners: {},
      get value() { return currentValue; },
      set value(value) {
        const options = this.children.flatMap(child => child.tag === 'optgroup' ? child.children : [child]);
        currentValue = tag === 'select' && !options.some(option => option.value === value) ? '' : value;
      },
      append(child) { this.children.push(child); },
      replaceChildren() { this.children = []; currentValue = ''; },
      setAttribute(key, value) { this.attributes[key] = value; },
      getAttribute(key) { return this.attributes[key]; },
      removeAttribute(key) { delete this.attributes[key]; },
      addEventListener(type, callback) { this.listeners[type] = callback; },
      focus() {}, scrollIntoView() {}
    };
  }
  const elements = Object.fromEntries(ids.map(id => [id, element(id === 'payment-course' || id === 'payment-profile' ? 'select' : 'div')]));
  const queries = {};
  return { elements, queries, getElementById: id => elements[id], createElement: element, querySelectorAll: selector => queries[selector] || [] };
}

test('payment page selects an incoming course before interaction and updates every consultation link', () => {
  const original = require('../catalog-data.js');
  const catalog = { ...original, getStatus: course => original.getStatus(course, '2026-09-27') };
  for (const id of ['c31', 'c32', 'c33', 'c1']) {
    const doc = flowDocument(['payment-course', 'payment-profile', 'payment-notice', 'payment-missing', 'payment-course-name', 'payment-course-status', 'payment-amount', 'payment-contact', 'payment-course-link']);
    const footer = doc.createElement('a');
    doc.queries['a[href^="contacto.html"]'] = [footer];
    payments.init(doc, { CourseCatalog: catalog, location: { search: `?curso=${id}&perfil=Posgrado&motivo=Quiero%20inscribirme` } });
    assert.equal(doc.elements['payment-course'].value, id);
    assert.equal(doc.elements['payment-profile'].value, 'Posgrado');
    assert.equal(doc.elements['payment-course-name'].textContent, catalog.getById(id).titulo);
    assert.equal(new URL(footer.href, 'https://example.test/').searchParams.get('curso'), id);
    assert.deepEqual(doc.elements['payment-course'].children.map(group => group.label), ['Próximas ediciones', 'En curso', 'Histórico · ediciones finalizadas']);
    assert.deepEqual(doc.elements['payment-course'].children[0].children.map(option => option.value), ['c32', 'c33']);
    doc.elements['payment-course'].value = 'c30';
    doc.elements['payment-course'].listeners.change();
    assert.equal(new URL(footer.href, 'https://example.test/').searchParams.get('curso'), 'c30');
    assert.equal(doc.elements['payment-course-name'].textContent, catalog.getById('c30').titulo);
  }
});

test('contact page displays the selected course and retains it in payment and direct contact links', () => {
  const catalog = require('../catalog-data.js');
  const ids = ['formContacto', 'nombre', 'correo', 'servicio', 'institucion', 'fecha', 'hora', 'mensaje', 'contact-context', 'contact-course-field', 'contact-course', 'contact-course-edition', 'contact-course-detail', 'schedule-fields', 'contact-form-panel', 'edit-message', 'copy-message'];
  const doc = flowDocument(ids);
  const guide = doc.createElement('a');
  const direct = doc.createElement('a');
  const footerWhatsapp = doc.createElement('a');
  const footerEmail = doc.createElement('a');
  direct.setAttribute('data-course-channel', 'whatsapp');
  doc.queries['a[href="pagos.html"]'] = [guide];
  doc.queries['[data-course-channel]'] = [direct];
  doc.queries['.site-footer a[href^="https://wa.me/5215643236165"]'] = [footerWhatsapp];
  doc.queries['.site-footer a[href^="mailto:hola@genomicstracksolutions.com"]'] = [footerEmail];
  contact.init(doc, { CourseCatalog: catalog, location: { search: '?curso=c33&perfil=Posgrado&motivo=Quiero%20inscribirme' } });
  assert.equal(doc.elements['contact-course'].value, catalog.getById('c33').titulo);
  assert.equal(doc.elements['contact-course-field'].hidden, false);
  assert.equal(doc.elements.servicio.value, 'cursos');
  assert.match(doc.elements['contact-course-edition'].textContent, /octubre de 2026/);
  assert.equal(new URL(guide.href, 'https://example.test/').searchParams.get('curso'), 'c33');
  assert.equal(new URL(guide.href, 'https://example.test/').searchParams.get('perfil'), 'Posgrado');
  const directMessage = new URL(direct.href).searchParams.get('text');
  assert.match(directMessage, /RNA-seq.*\(c33\)/);
  assert.match(directMessage, /Perfil: Posgrado/);
  assert.match(directMessage, /Quiero inscribirme/);
  assert.equal(new URL(footerWhatsapp.href).searchParams.get('text'), directMessage);
  assert.equal(new URL(footerEmail.href).searchParams.get('body'), directMessage);
  assert.equal(new URL(footerEmail.href).pathname, contact.EMAIL);
});

test('payment direct channels and footer retain context and follow course and profile changes', () => {
  const original = require('../catalog-data.js');
  const catalog = { ...original, getStatus: course => original.getStatus(course, '2026-09-27') };
  const doc = flowDocument(['payment-course', 'payment-profile', 'payment-notice', 'payment-missing', 'payment-course-name', 'payment-course-status', 'payment-amount', 'payment-contact', 'payment-course-link']);
  const whatsapp = doc.createElement('a');
  const email = doc.createElement('a');
  const footerWhatsapp = doc.createElement('a');
  const footerEmail = doc.createElement('a');
  whatsapp.setAttribute('data-payment-channel', 'whatsapp');
  email.setAttribute('data-payment-channel', 'email');
  doc.queries['[data-payment-channel]'] = [whatsapp, email];
  doc.queries['.site-footer a[href^="https://wa.me/5215643236165"]'] = [footerWhatsapp];
  doc.queries['.site-footer a[href^="mailto:hola@genomicstracksolutions.com"]'] = [footerEmail];
  payments.init(doc, { CourseCatalog: catalog, location: { search: '?curso=c33&perfil=Posgrado&motivo=Inscripci%C3%B3n%20%26%20requisitos' } });
  function message() {
    const value = new URL(whatsapp.href).searchParams.get('text');
    assert.equal(new URL(whatsapp.href).pathname, '/5215643236165');
    assert.equal(new URL(email.href).pathname, contact.EMAIL);
    assert.equal(new URL(email.href).searchParams.get('body'), value);
    assert.equal(footerWhatsapp.href, whatsapp.href);
    assert.equal(footerEmail.href, email.href);
    return value;
  }
  assert.match(message(), /RNA-seq.*\(c33\)/);
  assert.match(message(), /Perfil: Posgrado/);
  assert.match(message(), /Inscripción & requisitos/);
  doc.elements['payment-profile'].value = 'Público general';
  doc.elements['payment-profile'].listeners.change();
  assert.match(message(), /Perfil: Público general/);
  assert.doesNotMatch(message(), /Perfil: Posgrado/);
  doc.elements['payment-course'].value = 'c1';
  doc.elements['payment-course'].listeners.change();
  assert.ok(message().includes(`Curso: ${catalog.getById('c1').titulo} (c1)`));
  assert.match(message(), /próxima edición/);
  assert.doesNotMatch(message(), /\(c33\)|Inscripción & requisitos|ya pagué|he pagado|realicé el pago/i);
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, '..', 'pagos.html'), 'utf8');
  assert.match(html, /<a\b[^>]*data-payment-channel="whatsapp"[^>]*href="https:\/\/wa\.me\/5215643236165"/);
  assert.match(html, /<a\b[^>]*data-payment-channel="email"[^>]*href="mailto:hola@genomicstracksolutions\.com"/);
});

test('payment direct channels retain an unknown course reference without claiming a payment occurred', () => {
  const state = payments.paymentState(null, '', {});
  const links = payments.directContactLinks(state, { curso: 'edición especial', perfil: 'Posgrado', motivo: 'Consultar requisitos & acceso' });
  const message = new URL(links.whatsapp).searchParams.get('text');
  assert.match(message, /Curso: edición especial \(edición especial\)/);
  assert.match(message, /Perfil: Posgrado/);
  assert.match(message, /Consultar requisitos & acceso/);
  assert.equal(new URL(links.email).searchParams.get('body'), message);
  const defaultMessage = new URL(payments.directContactLinks(state).whatsapp).searchParams.get('text');
  assert.match(defaultMessage, /Quiero confirmar disponibilidad, importe y datos de pago/);
  assert.doesNotMatch(defaultMessage, /ya pagué|he pagado|realicé el pago/i);
});
