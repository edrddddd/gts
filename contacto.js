(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ContactFlow = api;
  if (typeof document !== 'undefined') api.init(document, root);
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';
  const EMAIL = 'hola@genomicstracksolutions.com';
  const PHONE = '5215643236165';
  const SERVICES = Object.freeze({ consultoria: 'Consultoría para mi proyecto', analisis: 'Análisis bioinformático', cursos: 'Cursos e inscripciones', capacitacion: 'Capacitación para mi equipo', pipelines: 'Scripts y pipelines', proyectos: 'Proyecto bioinformático', otro: 'Otra consulta' });
  const clean = (value, max = 3000) => String(value || '').trim().slice(0, max);
  function mexicoNow(now = new Date()) {
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Mexico_City', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(now);
    const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
    return { date: `${values.year}-${values.month}-${values.day}`, time: `${values.hour}:${values.minute}` };
  }
  function validDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const date = new Date(`${value}T12:00:00Z`);
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }
  function readContext(search) {
    const query = new URLSearchParams(search || '');
    const service = clean(query.get('servicio'), 80).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const aliases = { consultoria: 'consultoria', consultoria_bioinformatica: 'consultoria', analisis: 'analisis', 'analisis bioinformatico': 'analisis', cursos: 'cursos', curso: 'cursos', capacitacion: 'capacitacion', capacitaciones: 'capacitacion', pipelines: 'pipelines', proyectos: 'proyectos', otro: 'otro' };
    const reference = clean(query.get('curso'), 300);
    const course = /^c\d+$/i.test(reference) ? reference.toLowerCase() : reference;
    const date = clean(query.get('fecha'), 10);
    const time = clean(query.get('hora'), 5);
    return { curso: course, servicio: Object.hasOwn(aliases, service) ? aliases[service] : (course ? 'cursos' : (date || time ? 'consultoria' : '')), fecha: validDate(date) ? date : '', hora: /^([01]\d|2[0-3]):[0-5]\d$/.test(time) ? time : '', motivo: clean(query.get('motivo'), 1000), perfil: clean(query.get('perfil'), 100) };
  }
  function validate(values, now = new Date()) {
    const errors = {};
    const name = String(values.nombre || '').trim();
    const email = String(values.correo || '').trim();
    if (!name) errors.nombre = 'Escribe tu nombre.';
    else if (name.length > 120) errors.nombre = 'Usa un máximo de 120 caracteres.';
    if (!email || email.length > 254 || !/^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/.test(email) || email.includes('..') || /^[.@]|\.@/.test(email)) errors.correo = 'Escribe un correo válido, por ejemplo nombre@institucion.mx.';
    if (!Object.hasOwn(SERVICES, values.servicio)) errors.servicio = 'Selecciona el tipo de consulta.';
    if (!clean(values.mensaje)) errors.mensaje = 'Cuéntanos brevemente qué necesitas.';
    else if (String(values.mensaje).length > 3000) errors.mensaje = 'Usa un máximo de 3000 caracteres.';
    if (values.servicio === 'consultoria' && (values.fecha || values.hora)) {
      const current = mexicoNow(now);
      if (!validDate(values.fecha || '')) errors.fecha = 'Elige una fecha válida para solicitar un horario.';
      else if (values.fecha < current.date) errors.fecha = 'Elige hoy o una fecha futura.';
      if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(values.hora || '')) errors.hora = 'Indica una hora válida en formato de 24 horas (CDMX).';
      else if (values.fecha === current.date && values.hora <= current.time) errors.hora = 'Elige una hora futura de Ciudad de México.';
    }
    return errors;
  }
  function courseLabel(context, catalog) {
    const course = catalog && catalog.getById(context.curso);
    return course ? course.titulo : context.curso;
  }
  function buildMessage(values, context = {}, catalog) {
    const lines = ['Consulta · GenomicsTrack Solutions', '', `Nombre: ${clean(values.nombre, 120)}`, `Correo: ${clean(values.correo, 254)}`, `Servicio: ${SERVICES[values.servicio] || 'Otra consulta'}`];
    if (clean(values.institucion)) lines.push(`Institución: ${clean(values.institucion, 160)}`);
    if (context.curso) lines.push(`Curso: ${courseLabel(context, catalog)} (${context.curso})`);
    if (context.perfil) lines.push(`Perfil: ${context.perfil}`);
    if (context.motivo) lines.push(`Motivo de la consulta: ${context.motivo}`);
    if (values.servicio === 'consultoria' && values.fecha && values.hora) lines.push(`Horario solicitado: ${values.fecha} a las ${values.hora} (Ciudad de México; sujeto a confirmación)`);
    lines.push('', 'Mensaje:', clean(values.mensaje));
    return lines.join('\n');
  }
  function shareLinks(message, context = {}, catalog) {
    const subject = context.curso ? `Consulta: ${courseLabel(context, catalog)}` : 'Consulta · GenomicsTrack Solutions';
    return { whatsapp: `https://wa.me/${PHONE}?text=${encodeURIComponent(message)}`, email: `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}` };
  }
  function paymentUrl(context = {}) {
    const query = new URLSearchParams();
    for (const key of ['curso', 'perfil', 'motivo']) {
      if (context[key]) query.set(key, context[key]);
    }
    return 'pagos.html' + (query.size ? '?' + query.toString() : '');
  }
  function init(doc, win) {
    const form = doc.getElementById('formContacto');
    if (!form) return;
    const byId = id => doc.getElementById(id);
    const context = readContext(win.location.search);
    const catalog = win.CourseCatalog;
    const fields = ['nombre', 'correo', 'servicio', 'institucion', 'fecha', 'hora', 'mensaje'];
    const readValues = () => Object.fromEntries(fields.map(field => [field, byId(field).value.trim()]));
    byId('servicio').value = context.servicio;
    byId('fecha').value = context.fecha;
    byId('fecha').min = mexicoNow().date;
    byId('hora').value = context.hora;
    if (context.motivo) byId('mensaje').value = context.motivo;
    if (context.curso) {
      const course = catalog && catalog.getById(context.curso);
      byId('contact-context').textContent = `Conservamos el curso que seleccionaste${context.perfil ? ` · Perfil: ${context.perfil}` : ''}.`;
      byId('contact-context').hidden = false;
      byId('contact-course-field').hidden = false;
      byId('contact-course').value = courseLabel(context, catalog);
      byId('contact-course-edition').textContent = course ? `Edición: ${course.fechas}` : `Referencia del curso: ${context.curso}`;
      byId('contact-course-detail').hidden = !course;
      if (course) byId('contact-course-detail').href = `cursos/${encodeURIComponent(course.id)}.html`;
      doc.querySelectorAll('a[href="pagos.html"]').forEach(link => { link.href = paymentUrl(context); });
      const directMessage = [`Hola, quiero información sobre ${courseLabel(context, catalog)} (${context.curso}).`, context.perfil ? `Perfil: ${context.perfil}` : '', context.motivo].filter(Boolean).join('\n');
      const directLinks = shareLinks(directMessage, context, catalog);
      doc.querySelectorAll('[data-course-channel]').forEach(link => {
        link.href = directLinks[link.getAttribute('data-course-channel')];
      });
    }
    const updateSchedule = () => { byId('schedule-fields').hidden = byId('servicio').value !== 'consultoria'; };
    updateSchedule();
    byId('servicio').addEventListener('change', updateSchedule);
    form.addEventListener('input', event => {
      const error = byId(`error-${event.target.id}`);
      if (error) { error.textContent = ''; event.target.removeAttribute('aria-invalid'); }
    });
    form.addEventListener('submit', event => {
      event.preventDefault();
      const values = readValues();
      const errors = validate(values);
      fields.forEach(field => {
        const error = byId(`error-${field}`);
        if (error) error.textContent = errors[field] || '';
        if (errors[field]) byId(field).setAttribute('aria-invalid', 'true');
        else byId(field).removeAttribute('aria-invalid');
      });
      const errorFields = Object.keys(errors);
      byId('form-errors').hidden = !errorFields.length;
      if (errorFields.length) {
        byId('form-errors').textContent = 'Revisa los campos señalados antes de continuar.';
        byId(errorFields[0]).focus();
        return;
      }
      const message = buildMessage(values, context, catalog);
      const links = shareLinks(message, context, catalog);
      byId('message-preview').value = message;
      byId('send-whatsapp').href = links.whatsapp;
      byId('send-email').href = links.email;
      byId('share-status').textContent = 'Abrir el canal o copiar el mensaje no confirma su envío.';
      byId('contact-form-panel').hidden = true;
      byId('contact-review').hidden = false;
      byId('step-details').removeAttribute('aria-current');
      byId('step-review').setAttribute('aria-current', 'step');
      byId('contact-review').focus({ preventScroll: true });
      byId('contact-review').scrollIntoView({ block: 'start', behavior: 'instant' });
    });
    byId('edit-message').addEventListener('click', () => {
      byId('contact-review').hidden = true;
      byId('contact-form-panel').hidden = false;
      byId('step-review').removeAttribute('aria-current');
      byId('step-details').setAttribute('aria-current', 'step');
      byId('nombre').focus();
    });
    byId('copy-message').addEventListener('click', async () => {
      try {
        if (!win.navigator.clipboard) throw new Error('Clipboard unavailable');
        await win.navigator.clipboard.writeText(byId('message-preview').value);
        byId('share-status').textContent = 'Mensaje copiado. Pégalo y envíalo por tu canal preferido.';
      } catch (_) {
        byId('message-preview').focus();
        byId('message-preview').select();
        byId('share-status').textContent = 'Seleccionamos el mensaje. Usa la opción Copiar de tu dispositivo o Ctrl+C / Cmd+C.';
      }
    });
    byId('contact-form-panel').hidden = false;
  }
  return { EMAIL, PHONE, SERVICES, mexicoNow, validDate, readContext, validate, buildMessage, shareLinks, paymentUrl, init };
});
