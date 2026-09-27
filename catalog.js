(function () {
  'use strict';
  const catalog = window.CourseCatalog;
  if (!catalog) return;
  const allowedStates = ['vigentes', 'inscripcion', 'en-curso', 'finalizado', 'todos'];
  const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const notices = {
    inscripcion: 'Confirma el cupo, el perfil y el importe con nuestro equipo antes de realizar un pago.',
    'en-curso': 'Esta edición ya comenzó. Consulta si es posible incorporarte y confirma el importe antes de realizar un pago.',
    finalizado: 'Esta edición ya terminó. Puedes solicitar información sobre la próxima edición; las fechas y tarifas de esta ficha son históricas.'
  };
  const ctaLabels = {inscripcion: 'Consultar inscripción', 'en-curso': 'Consultar disponibilidad', finalizado: 'Avisarme de la próxima edición'};
  const motives = {inscripcion: 'Solicitar información para inscribirme', 'en-curso': 'Consultar disponibilidad para incorporarme al curso iniciado', finalizado: 'Me interesa la próxima edición'};

  function updateStatus(element, state) {
    element.textContent = catalog.labelStatus(state);
    element.className = 'badge course-status status-' + state;
  }

  const detail = document.querySelector('[data-course-detail]');
  function refreshDetail() {
    if (!detail) return;
    const course = catalog.getById(detail.dataset.courseDetail);
    if (!course) return;
    const state = catalog.getStatus(course);
    // Keep the selected course through shared header/footer links as well as CTAs.
    document.querySelectorAll('a[href]').forEach(link => {
      const url = new URL(link.href, location.href);
      if (url.origin !== location.origin || !/\/(contacto|pagos)\.html$/.test(url.pathname)) return;
      url.searchParams.set('curso', course.id);
      url.searchParams.set('servicio', 'cursos');
      if (!url.searchParams.has('motivo')) url.searchParams.set('motivo', motives[state]);
      link.href = url.pathname + url.search + url.hash;
    });
    detail.querySelectorAll('[data-course-status]').forEach(el => updateStatus(el, state));
    detail.querySelectorAll('[data-course-notice]').forEach(el => { el.textContent = notices[state]; });
    detail.querySelectorAll('[data-course-cta]').forEach(link => {
      const params = new URLSearchParams({curso: course.id, servicio: 'cursos', motivo: motives[state]});
      link.href = '../contacto.html?' + params.toString();
      link.textContent = ctaLabels[state];
    });
    detail.querySelectorAll('[data-price-caption]').forEach(el => {
      el.textContent = state === 'finalizado' ? 'Tarifas históricas · edición finalizada' : 'Tarifas publicadas · confirmar vigencia';
    });
    detail.querySelectorAll('[data-price-notice]').forEach(el => {
      el.textContent = state === 'finalizado' ? 'Estos importes se conservan como referencia histórica y no constituyen una oferta vigente.' : 'Tarifas de referencia de esta edición; las promociones publicadas pueden haber finalizado. Confirma el importe vigente antes de pagar.';
    });
  }
  refreshDetail();

  const grid = document.getElementById('course-grid');
  let refresh = refreshDetail;
  if (grid) {
    const form = document.getElementById('catalog-filters');
    const search = document.getElementById('course-search');
    const topic = document.getElementById('course-topic');
    const tabs = document.getElementById('course-states');
    const count = document.getElementById('course-count');
    const empty = document.getElementById('course-empty');
    const clear = document.getElementById('clear-course-filters');
    const stateNote = document.getElementById('course-state-note');
    const cards = Array.from(grid.querySelectorAll('[data-course-id]')).map(element => ({element, course: catalog.getById(element.dataset.courseId)}));
    let state = 'vigentes';
    function readURL() {
      const params = new URLSearchParams(location.search);
      state = allowedStates.includes(params.get('estado')) ? params.get('estado') : 'vigentes';
      search.value = params.get('q') || '';
      topic.value = params.get('area') || '';
    }
    function syncURL() {
      const url = new URL(location.href);
      [['estado', state === 'vigentes' ? '' : state], ['q', search.value.trim()], ['area', topic.value]].forEach(([key, value]) => value ? url.searchParams.set(key, value) : url.searchParams.delete(key));
      history.replaceState(null, '', url);
    }
    function filter() {
      const query = normalize(search.value.trim());
      let total = 0;
      cards.forEach(({element, course}) => {
        if (!course) { element.hidden = true; return; }
        const current = catalog.getStatus(course);
        const instructor = [course.instructor].flat().filter(Boolean).map(i => i.nombre).join(' ');
        const haystack = normalize([course.titulo, course.descripcion, course.categoria, instructor, course.fechas, ...(course.temario || [])].join(' '));
        const matchesState = state === 'todos' || (state === 'vigentes' ? current !== 'finalizado' : current === state);
        const matches = matchesState && (!topic.value || course.categoria === topic.value) && (!query || haystack.includes(query));
        element.hidden = !matches;
        element.querySelectorAll('[data-course-status]').forEach(el => updateStatus(el, current));
        const price = element.querySelector('[data-card-price]');
        if (price) price.textContent = current === 'finalizado' ? 'Tarifas históricas en la ficha' : 'Consultar precio y disponibilidad';
        if (matches) total += 1;
      });
      tabs.querySelectorAll('[data-filter]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.filter === state)));
      count.textContent = total + (total === 1 ? ' curso encontrado' : ' cursos encontrados');
      empty.hidden = total !== 0;
      clear.hidden = total !== 0;
      const isUntouched = !query && !topic.value;
      document.getElementById('course-empty-title').textContent = isUntouched && state === 'vigentes' ? 'No hay ediciones vigentes por ahora.' : isUntouched && state === 'inscripcion' ? 'Estamos preparando las próximas ediciones.' : 'No encontramos cursos con esos filtros.';
      document.getElementById('course-empty-message').textContent = isUntouched ? 'Explora el histórico y cuéntanos qué curso te interesa para una próxima edición.' : 'Prueba con otra palabra, cambia el área o consulta todas las ediciones.';
      stateNote.textContent = state === 'finalizado' ? 'Estas ediciones ya terminaron. Las fechas y tarifas son históricas; puedes consultar próximas ediciones.' : state === 'inscripcion' ? 'Confirma cupo, requisitos e importe con el equipo antes de realizar un pago.' : 'Las ediciones en curso requieren confirmar disponibilidad antes de incorporarte.';
    }
    form.hidden = false;
    tabs.hidden = false;
    readURL();
    filter();
    search.addEventListener('input', () => { filter(); syncURL(); });
    topic.addEventListener('change', () => { filter(); syncURL(); });
    form.addEventListener('submit', event => { event.preventDefault(); filter(); syncURL(); });
    tabs.addEventListener('click', event => {
      const button = event.target.closest('[data-filter]');
      if (!button) return;
      state = button.dataset.filter;
      filter();
      syncURL();
    });
    clear.addEventListener('click', () => {
      state = 'todos'; search.value = ''; topic.value = '';
      filter(); syncURL(); search.focus();
    });
    window.addEventListener('popstate', () => { readURL(); filter(); });
    refresh = filter;
  }
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
})();
