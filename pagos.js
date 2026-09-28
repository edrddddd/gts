(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.PaymentGuide = api;
  if (typeof document !== 'undefined') api.init(document, root);
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';
  function profilesFor(course) {
    const rows = course && course.precios && course.precios.filas;
    if (!Array.isArray(rows) || !rows.length) return ['Licenciatura', 'Posgrado', 'Público general'];
    return [...new Set(rows.map(row => String(row[0] || '').replace(/\*/g, '').trim()).filter(Boolean))];
  }
  function paymentState(course, profile, catalog) {
    const status = course ? catalog.getStatus(course) : '';
    const messages = {
      finalizado: 'Esta edición finalizó. Consulta una próxima edición antes de realizar cualquier pago.',
      'en-curso': 'Esta edición ya comenzó. Consulta disponibilidad con el equipo antes de pagar.',
      inscripcion: 'Confirma cupo, precio vigente y datos de pago con el equipo antes de inscribirte.'
    };
    return { course, status, profile: profilesFor(course).includes(profile) ? profile : '', amount: 'Por confirmar con el equipo', canPay: false, notice: messages[status] || 'Selecciona un curso para consultar disponibilidad y recibir instrucciones.' };
  }
  function contactQuery(state, originalContext = {}) {
    const query = new URLSearchParams({ servicio: 'cursos' });
    if (state.course) query.set('curso', state.course.id);
    else if (originalContext.curso) query.set('curso', originalContext.curso);
    if (state.profile) query.set('perfil', state.profile);
    else if (!state.course && originalContext.perfil) query.set('perfil', originalContext.perfil);
    const reason = state.status === 'finalizado' ? 'Quiero información sobre una próxima edición y su inscripción.' : 'Quiero confirmar disponibilidad, importe y datos de pago para mi inscripción.';
    query.set('motivo', originalContext.motivo || reason);
    return query;
  }
  function contactUrl(state, originalContext = {}) {
    return `contacto.html?${contactQuery(state, originalContext).toString()}`;
  }
  function directContactLinks(state, originalContext = {}) {
    const query = contactQuery(state, originalContext);
    const reference = query.get('curso');
    const title = state.course ? state.course.titulo : reference;
    const lines = ['Hola, quiero consultar sobre una inscripción.'];
    if (reference) lines.push(`Curso: ${title} (${reference})`);
    if (query.get('perfil')) lines.push(`Perfil: ${query.get('perfil')}`);
    lines.push(`Motivo de la consulta: ${query.get('motivo')}`);
    const message = encodeURIComponent(lines.join('\n'));
    const subject = encodeURIComponent(title ? `Consulta de inscripción: ${title}` : 'Consulta de inscripción · GenomicsTrack Solutions');
    return { whatsapp: `https://wa.me/5215643236165?text=${message}`, email: `mailto:hola@genomicstracksolutions.com?subject=${subject}&body=${message}` };
  }
  function courseGroups(catalog) {
    const groups = [
      { status: 'inscripcion', label: 'Próximas ediciones', courses: [] },
      { status: 'en-curso', label: 'En curso', courses: [] },
      { status: 'finalizado', label: 'Histórico · ediciones finalizadas', courses: [] }
    ];
    catalog.courses.forEach(course => {
      const group = groups.find(item => item.status === catalog.getStatus(course));
      if (group) group.courses.push(course);
    });
    groups.forEach(group => group.courses.sort((a, b) => group.status === 'inscripcion' ? a.inicio.localeCompare(b.inicio) : b.inicio.localeCompare(a.inicio)));
    return groups.filter(group => group.courses.length);
  }
  function init(doc, win) {
    const courseSelect = doc.getElementById('payment-course');
    if (!courseSelect) return;
    const byId = id => doc.getElementById(id);
    const catalog = win.CourseCatalog;
    if (!catalog) {
      byId('payment-notice').textContent = 'No pudimos cargar el catálogo. Contacta al equipo para confirmar tu curso e instrucciones.';
      return;
    }
    const query = new URLSearchParams(win.location.search);
    const reference = String(query.get('curso') || '').trim().slice(0, 300);
    const originalContext = { curso: /^c\d+$/i.test(reference) ? reference.toLowerCase() : reference, perfil: String(query.get('perfil') || '').replace(/\*/g, '').trim().slice(0, 100), motivo: String(query.get('motivo') || '').slice(0, 1000) };
    courseGroups(catalog).forEach(group => {
      const optgroup = doc.createElement('optgroup');
      optgroup.label = group.label;
      group.courses.forEach(course => {
        const option = doc.createElement('option');
        option.value = course.id;
        const start = new Date(`${course.inicio}T12:00:00Z`);
        const edition = new Intl.DateTimeFormat('es-MX', { month: 'long', year: 'numeric', timeZone: 'America/Mexico_City' }).format(start);
        option.textContent = `${course.titulo} · ${edition}`;
        optgroup.append(option);
      });
      courseSelect.append(optgroup);
    });
    const initialCourse = catalog.getById(originalContext.curso);
    if (initialCourse) courseSelect.value = initialCourse.id;
    else if (originalContext.curso) {
      byId('payment-missing').textContent = 'El curso del enlace no está en el catálogo. Conservaremos su referencia en tu consulta o puedes seleccionar otro.';
      byId('payment-missing').hidden = false;
    }
    function updateProfiles(selected) {
      const profileSelect = byId('payment-profile');
      profileSelect.replaceChildren();
      const placeholder = doc.createElement('option');
      placeholder.value = ''; placeholder.textContent = 'Selecciona tu perfil';
      profileSelect.append(placeholder);
      profilesFor(catalog.getById(courseSelect.value)).forEach(profile => {
        const option = doc.createElement('option');
        option.value = profile; option.textContent = profile;
        profileSelect.append(option);
      });
      profileSelect.value = profilesFor(catalog.getById(courseSelect.value)).includes(selected) ? selected : '';
    }
    function render() {
      const course = catalog.getById(courseSelect.value);
      const state = paymentState(course, byId('payment-profile').value, catalog);
      byId('payment-course-name').textContent = course ? course.titulo : 'Por seleccionar';
      byId('payment-course-status').textContent = course ? catalog.labelStatus(state.status) : 'Consulta el catálogo';
      byId('payment-amount').textContent = state.amount;
      byId('payment-notice').textContent = state.notice;
      const contactHref = contactUrl(state, originalContext);
      byId('payment-contact').href = contactHref;
      doc.querySelectorAll('a[href^="contacto.html"]').forEach(link => { link.href = contactHref; });
      const directLinks = directContactLinks(state, originalContext);
      doc.querySelectorAll('[data-payment-channel]').forEach(link => {
        link.href = directLinks[link.getAttribute('data-payment-channel')];
      });
      doc.querySelectorAll('.site-footer a[href^="https://wa.me/5215643236165"]').forEach(link => { link.href = directLinks.whatsapp; });
      doc.querySelectorAll('.site-footer a[href^="mailto:hola@genomicstracksolutions.com"]').forEach(link => { link.href = directLinks.email; });
      byId('payment-course-link').hidden = !course;
      if (course) byId('payment-course-link').href = `cursos/${encodeURIComponent(course.id)}.html`;
    }
    updateProfiles(originalContext.perfil);
    render();
    courseSelect.addEventListener('change', () => {
      originalContext.curso = courseSelect.value;
      originalContext.perfil = '';
      originalContext.motivo = '';
      byId('payment-missing').hidden = true;
      updateProfiles(byId('payment-profile').value);
      render();
    });
    byId('payment-profile').addEventListener('change', render);
  }
  return { profilesFor, paymentState, contactUrl, directContactLinks, courseGroups, init };
});
