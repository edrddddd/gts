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
  function contactUrl(state, originalContext = {}) {
    const query = new URLSearchParams({ servicio: 'cursos' });
    if (state.course) query.set('curso', state.course.id);
    else if (originalContext.curso) query.set('curso', originalContext.curso);
    if (state.profile) query.set('perfil', state.profile);
    const reason = state.status === 'finalizado' ? 'Quiero información sobre una próxima edición y su inscripción.' : 'Quiero confirmar disponibilidad, importe y datos de pago para mi inscripción.';
    query.set('motivo', originalContext.motivo ? `${originalContext.motivo}\n${reason}` : reason);
    return `contacto.html?${query.toString()}`;
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
    const originalContext = { curso: String(query.get('curso') || '').slice(0, 80), motivo: String(query.get('motivo') || '').slice(0, 1000) };
    catalog.courses.forEach(course => {
      const option = doc.createElement('option');
      option.value = course.id;
      const start = new Date(`${course.inicio}T12:00:00Z`);
      const edition = new Intl.DateTimeFormat('es-MX', { month: 'long', year: 'numeric', timeZone: 'America/Mexico_City' }).format(start);
      option.textContent = `${course.titulo} · ${edition}`;
      courseSelect.append(option);
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
      byId('payment-contact').href = contactUrl(state, originalContext);
      byId('payment-course-link').hidden = !course;
      if (course) byId('payment-course-link').href = `cursos/${encodeURIComponent(course.id)}.html`;
    }
    updateProfiles(String(query.get('perfil') || '').replace(/\*/g, '').trim());
    render();
    courseSelect.addEventListener('change', () => {
      originalContext.curso = courseSelect.value;
      byId('payment-missing').hidden = true;
      updateProfiles(byId('payment-profile').value);
      render();
    });
    byId('payment-profile').addEventListener('change', render);
  }
  return { profilesFor, paymentState, contactUrl, init };
});
