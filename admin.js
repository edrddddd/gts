'use strict';

(() => {
  const byId = id => document.getElementById(id);
  const form = byId('course-form');
  const textFields = ['titulo', 'descripcion', 'categoria', 'inicio', 'fin', 'fechas', 'horario', 'duracion', 'nivel', 'modalidad', 'precio'];
  const state = { courses: [], revision: null, csrfToken: '', current: null, dirty: false, busy: false, banner: null, bannerURL: '', bannerRead: 0, readingBanner: false, instructors: [], stages: ['Preventa', 'Precio regular'], prices: [{ profile: '', values: ['', ''] }], authenticated: false, initialized: false, conflict: false };

  function node(tag, className, content) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (content !== undefined) element.textContent = content;
    return element;
  }

  function message(id, value = '', error = false) {
    const element = byId(id);
    element.textContent = value;
    element.classList.toggle('is-error', error);
  }

  function courseStatus(course) {
    return course && course.publicationStatus === 'draft' ? 'draft' : 'published';
  }

  function setBusy(value) {
    state.busy = value;
    byId('editor-fields').disabled = value;
    ['new-course', 'logout-button', 'reload-courses', 'save-draft', 'publish-course'].forEach(id => { byId(id).disabled = value; });
    byId('course-list').querySelectorAll('button').forEach(button => { button.disabled = value; });
    byId('course-form').setAttribute('aria-busy', String(value));
  }

  function markDirty() {
    state.dirty = true;
    byId('save-state').textContent = 'Tienes cambios sin guardar.';
    byId('editor-status').textContent = 'Cambios sin guardar';
    updatePreview();
  }

  function canLeave() {
    return !state.dirty || window.confirm('Tienes cambios sin guardar. ¿Quieres descartarlos y continuar?');
  }

  function showLogin(configured = true, explanation = '') {
    state.authenticated = false;
    state.csrfToken = '';
    byId('loading-state').hidden = true;
    byId('admin-panel').hidden = true;
    byId('login-panel').hidden = false;
    byId('logout-button').hidden = true;
    byId('login-form').hidden = !configured;
    byId('setup-notice').hidden = configured;
    byId('admin-password').value = '';
    message('login-message', explanation, Boolean(explanation));
  }

  async function api(path, options = {}) {
    const headers = { Accept: 'application/json', ...options.headers };
    if (options.body) headers['Content-Type'] = 'application/json';
    if (options.method && options.method !== 'GET' && state.csrfToken) headers['X-CSRF-Token'] = state.csrfToken;
    let response;
    try { response = await fetch(path, { credentials: 'same-origin', cache: 'no-store', ...options, headers }); }
    catch { throw new Error('No fue posible conectar con el servidor. Revisa la conexión e inténtalo de nuevo. Tu formulario se conserva.'); }
    let result;
    try { result = await response.json(); }
    catch { throw new Error('El servidor no devolvió una respuesta válida. Tu formulario se conserva; puedes volver a intentarlo.'); }
    if (!response.ok) {
      let detail = typeof result.error === 'string' ? result.error : typeof result.message === 'string' ? result.message : 'No se pudo completar la operación.';
      if (Array.isArray(result.errors)) detail += ' ' + result.errors.map(item => typeof item === 'string' ? item : item.message || '').filter(Boolean).join(' ');
      const error = new Error(detail);
      error.status = response.status;
      if (response.status === 401 && path !== '/api/admin/login') showLogin(true, 'La sesión terminó. Vuelve a entrar para continuar; tus cambios siguen en este formulario.');
      throw error;
    }
    return result;
  }

  function renderCourseList() {
    const search = byId('course-search').value.trim().toLocaleLowerCase('es');
    const filter = byId('course-filter').value;
    const courses = state.courses.filter(course => (!search || `${course.titulo || ''} ${course.categoria || ''} ${course.id || ''}`.toLocaleLowerCase('es').includes(search)) && (filter === 'all' || courseStatus(course) === filter));
    byId('course-count').textContent = String(state.courses.length);
    byId('list-message').textContent = `${courses.length} ${courses.length === 1 ? 'curso' : 'cursos'}${search || filter !== 'all' ? ' en esta selección' : ' en el catálogo'}`;
    const list = byId('course-list');
    list.replaceChildren();
    for (const course of courses) {
      const button = node('button', 'course-list-item');
      button.type = 'button';
      button.disabled = state.busy;
      button.setAttribute('aria-current', String(Boolean(state.current && state.current.id === course.id)));
      button.append(node('strong', '', course.titulo || 'Sin título'));
      const meta = node('small');
      meta.append(node('span', `list-status${courseStatus(course) === 'draft' ? ' is-draft' : ''}`, courseStatus(course) === 'draft' ? 'Borrador' : 'Publicado'), node('span', '', course.id));
      button.append(meta);
      button.addEventListener('click', () => { if (!state.busy && canLeave()) openCourse(course); });
      list.append(button);
    }
    if (!courses.length) list.append(node('p', 'empty-list', 'No hay cursos que coincidan con esta selección.'));
  }

  function inputField(labelText, value, onInput, options = {}) {
    const label = node('label', 'field', labelText);
    const input = node(options.multiline ? 'textarea' : 'input');
    input.value = value || '';
    input.maxLength = options.multiline ? 4000 : options.type === 'url' ? 2000 : 200;
    if (options.multiline) input.rows = 3;
    else input.type = options.type || 'text';
    if (options.placeholder) input.placeholder = options.placeholder;
    input.addEventListener('input', () => { onInput(input.value); markDirty(); });
    label.append(input);
    return label;
  }

  function renderInstructors() {
    const list = byId('instructors-list');
    list.replaceChildren();
    state.instructors.forEach((instructor, index) => {
      const row = node('div', 'instructor-row');
      const heading = node('div', 'instructor-row-heading');
      const remove = node('button', 'remove-button', 'Eliminar');
      remove.type = 'button';
      remove.setAttribute('aria-label', `Eliminar instructor ${index + 1}`);
      remove.addEventListener('click', () => { state.instructors.splice(index, 1); renderInstructors(); markDirty(); });
      heading.append(node('h3', '', `Instructor ${index + 1}`), remove);
      row.append(heading, inputField('Nombre', instructor.nombre, value => { instructor.nombre = value; }, { placeholder: 'Nombre completo' }), inputField('Descripción', instructor.desc, value => { instructor.desc = value; }, { multiline: true, placeholder: 'Experiencia y especialidad' }), inputField('Enlace al perfil o CV (opcional)', instructor.cv, value => { instructor.cv = value; }, { type: 'url', placeholder: 'https://' }));
      list.append(row);
    });
    if (!state.instructors.length) list.append(node('p', 'field-hint', 'Añade al menos un instructor antes de publicar.'));
    byId('add-instructor').disabled = state.instructors.length >= 12;
  }

  function tableInput(value, label, callback, placeholder = '') {
    const input = node('input');
    input.type = 'text';
    input.value = value;
    input.maxLength = label.startsWith('Nombre de la etapa') ? 150 : 200;
    input.placeholder = placeholder;
    input.setAttribute('aria-label', label);
    input.addEventListener('input', () => { callback(input.value); markDirty(); });
    return input;
  }

  function renderPriceTable() {
    const head = byId('price-table-head');
    const body = byId('price-table-body');
    const heading = node('tr');
    const profileHeading = node('th', '', 'Perfil');
    profileHeading.scope = 'col';
    heading.append(profileHeading);
    state.stages.forEach((stage, index) => {
      const cell = node('th');
      cell.scope = 'col';
      const remove = node('button', 'remove-button', 'Eliminar etapa');
      remove.type = 'button';
      remove.disabled = state.stages.length < 2;
      remove.setAttribute('aria-label', `Eliminar etapa ${index + 1}`);
      remove.addEventListener('click', () => { state.stages.splice(index, 1); state.prices.forEach(row => row.values.splice(index, 1)); renderPriceTable(); markDirty(); });
      cell.append(tableInput(stage, `Nombre de la etapa ${index + 1}`, value => { state.stages[index] = value; }, 'Nombre de la etapa'), remove);
      heading.append(cell);
    });
    const actionsHeading = node('th');
    actionsHeading.append(node('span', 'sr-only', 'Acciones'));
    heading.append(actionsHeading);
    head.replaceChildren(heading);
    body.replaceChildren();
    state.prices.forEach((row, rowIndex) => {
      const tr = node('tr');
      const profile = node('td');
      profile.append(tableInput(row.profile, `Perfil ${rowIndex + 1}`, value => { row.profile = value; }, 'Ej. Estudiantes'));
      tr.append(profile);
      state.stages.forEach((stage, stageIndex) => {
        const cell = node('td');
        cell.append(tableInput(row.values[stageIndex] || '', `Precio del perfil ${rowIndex + 1}, etapa ${stageIndex + 1}`, value => { row.values[stageIndex] = value; }, '-'));
        tr.append(cell);
      });
      const actions = node('td');
      const remove = node('button', 'remove-button', 'Quitar');
      remove.type = 'button';
      remove.disabled = state.prices.length < 2;
      remove.setAttribute('aria-label', `Eliminar perfil ${rowIndex + 1}`);
      remove.addEventListener('click', () => { state.prices.splice(rowIndex, 1); renderPriceTable(); markDirty(); });
      actions.append(remove);
      tr.append(actions);
      body.append(tr);
    });
    byId('add-stage').disabled = state.stages.length >= 8;
    byId('add-profile').disabled = state.prices.length >= 20;
  }

  function lines(value) { return value.split(/\r?\n/).map(line => line.trim()).filter(Boolean); }

  function collectCourse(status) {
    const course = {};
    textFields.forEach(field => { course[field] = form.elements.namedItem(field).value.trim(); });
    course.precio = course.precio || '-';
    course.temario = lines(form.elements.namedItem('temario').value);
    course.incluye = lines(form.elements.namedItem('incluye').value);
    course.instructor = state.instructors.map(item => ({ nombre: item.nombre.trim(), desc: item.desc.trim(), cv: item.cv.trim() })).filter(item => item.nombre || item.desc || item.cv);
    course.precios = byId('use-price-table').checked ? { columnas: ['Perfil', ...state.stages.map(stage => stage.trim())], filas: state.prices.map(row => [row.profile.trim(), ...state.stages.map((_, index) => (row.values[index] || '').trim() || '-')]) } : null;
    course.publicationStatus = status || (state.current ? courseStatus(state.current) : 'draft');
    return course;
  }

  function currentBanner() {
    if (state.bannerURL) return state.bannerURL;
    const original = state.current && state.current.img;
    if (typeof original !== 'string') return '';
    const path = original.replace(/^\//, '');
    if (!path.startsWith('media/') || path.includes('..') || path.includes('\\')) return '';
    return '/' + path.replace(/^media\/admin\//, 'api/admin/banner/');
  }

  function previewList(id, title, values) {
    const container = byId(id);
    container.replaceChildren();
    if (!values.length) return;
    const list = node('ul');
    values.forEach(value => list.append(node('li', '', value)));
    container.append(node('h4', '', title), list);
  }

  function updatePreview() {
    const course = collectCourse();
    byId('preview-title').textContent = course.titulo || 'El próximo curso empieza aquí.';
    byId('preview-description').textContent = course.descripcion || 'Añade una descripción para contar qué aprenderán tus estudiantes.';
    byId('preview-category').textContent = course.categoria || 'Categoría del curso';
    const metadata = byId('preview-meta');
    metadata.replaceChildren();
    [['Fechas', course.fechas || [course.inicio, course.fin].filter(Boolean).join(' — ')], ['Horario', course.horario], ['Duración', course.duracion], ['Nivel', course.nivel], ['Formato', course.modalidad], ['Precio', course.precio]].forEach(([label, value]) => {
      const row = node('div');
      row.append(node('dt', '', label), node('dd', '', value || '-'));
      metadata.append(row);
    });
    const instructors = byId('preview-instructors');
    instructors.replaceChildren();
    if (course.instructor.length) {
      instructors.append(node('h4', '', 'Instructores'));
      course.instructor.forEach(instructor => { const row = node('div', 'instructor-preview'); row.append(node('strong', '', instructor.nombre || 'Nombre del instructor'), node('p', '', instructor.desc)); instructors.append(row); });
    }
    previewList('preview-syllabus', 'Temario', course.temario);
    previewList('preview-includes', 'Incluye', course.incluye);
    const prices = byId('preview-prices');
    prices.replaceChildren();
    if (course.precios) {
      const scroll = node('div', 'preview-pricing-scroll');
      const table = node('table');
      const head = node('thead');
      const heading = node('tr');
      course.precios.columnas.forEach((column, index) => { const cell = node('th', '', column || `Etapa ${index}`); cell.scope = 'col'; heading.append(cell); });
      head.append(heading);
      const body = node('tbody');
      course.precios.filas.forEach(row => { const tr = node('tr'); row.forEach(value => tr.append(node('td', '', value || '-'))); body.append(tr); });
      table.append(head, body);
      scroll.append(table);
      prices.append(node('h4', '', 'Precios por etapa'), scroll);
    }
    const source = currentBanner();
    const image = byId('preview-banner');
    image.hidden = !source;
    byId('preview-placeholder').hidden = Boolean(source);
    if (source) { if (image.getAttribute('src') !== source) image.src = source; }
    else image.removeAttribute('src');
  }

  function setBannerMessage() {
    byId('banner-message').textContent = state.current && state.current.img ? 'El banner actual se conservará si no seleccionas otra imagen.' : 'Puedes guardar el borrador antes de añadir el banner.';
  }

  function openCourse(course = null, preserveMessage = false) {
    state.current = course;
    state.banner = null;
    state.bannerURL = '';
    state.bannerRead += 1;
    state.readingBanner = false;
    state.dirty = false;
    state.conflict = false;
    form.reset();
    textFields.forEach(field => { form.elements.namedItem(field).value = course && typeof course[field] === 'string' ? course[field] : ''; });
    ['temario', 'incluye'].forEach(field => { form.elements.namedItem(field).value = course && Array.isArray(course[field]) ? course[field].join('\n') : ''; });
    const instructors = course && course.instructor ? (Array.isArray(course.instructor) ? course.instructor : [course.instructor]) : [{ nombre: '', desc: '', cv: '' }];
    state.instructors = instructors.map(item => ({ nombre: item.nombre || '', desc: item.desc || '', cv: item.cv || '' }));
    const prices = course && course.precios;
    const hasPrices = prices && Array.isArray(prices.columnas) && prices.columnas.length > 1 && Array.isArray(prices.filas) && prices.filas.length;
    state.stages = hasPrices ? prices.columnas.slice(1).map(String) : ['Preventa', 'Precio regular'];
    state.prices = hasPrices ? prices.filas.map(row => ({ profile: String(row[0] || ''), values: state.stages.map((_, index) => String(row[index + 1] || '')) })) : [{ profile: '', values: ['', ''] }];
    byId('use-price-table').checked = Boolean(hasPrices);
    byId('price-table-editor').hidden = !hasPrices;
    byId('reset-banner').hidden = true;
    byId('editor-title').textContent = course ? 'Editar curso' : 'Nuevo curso';
    byId('editor-description').textContent = course ? course.titulo : 'Prepara el contenido a tu ritmo y publícalo cuando esté listo.';
    byId('editor-status').textContent = course ? (courseStatus(course) === 'draft' ? 'Borrador' : 'Publicado') : 'Sin guardar';
    const published = course && courseStatus(course) === 'published';
    byId('save-draft').hidden = Boolean(published);
    byId('publish-course').textContent = published ? 'Guardar cambios publicados' : 'Publicar curso ↗';
    byId('save-state').textContent = published ? 'Los cambios se verán en el sitio al guardarlos.' : 'Tus cambios se guardan al pulsar un botón.';
    const view = byId('view-course');
    view.hidden = !published;
    if (published && /^c\d+$/.test(course.id)) view.href = `/cursos/${course.id}.html`;
    else view.removeAttribute('href');
    if (!preserveMessage) message('editor-message');
    form.querySelectorAll('[aria-invalid]').forEach(input => input.removeAttribute('aria-invalid'));
    renderInstructors();
    renderPriceTable();
    setBannerMessage();
    updatePreview();
    renderCourseList();
  }

  async function loadCourses({ discard = false } = {}) {
    const result = await api('/api/admin/courses');
    if (!Array.isArray(result.courses)) throw new Error('No se pudo leer la lista de cursos. Intenta actualizarla de nuevo.');
    state.courses = result.courses;
    // Keep the original revision with unsaved edits, so a concurrent save cannot be overwritten.
    if (!state.dirty || discard || state.revision === null) state.revision = result.revision;
    if (!state.initialized || discard) {
      const selected = state.current && state.courses.find(course => course.id === state.current.id);
      openCourse(selected || null);
      state.initialized = true;
    }
    renderCourseList();
  }

  async function enterPanel() {
    state.authenticated = true;
    byId('login-panel').hidden = true;
    byId('loading-state').hidden = true;
    byId('admin-panel').hidden = false;
    byId('logout-button').hidden = false;
    setBusy(true);
    try { await loadCourses(); }
    catch (error) { message('editor-message', error.message, true); }
    finally { setBusy(false); }
  }

  function validate(course, status) {
    form.querySelectorAll('[aria-invalid]').forEach(input => input.removeAttribute('aria-invalid'));
    if (!course.titulo) {
      form.elements.namedItem('titulo').setAttribute('aria-invalid', 'true');
      form.elements.namedItem('titulo').focus();
      return 'Escribe un título para guardar el curso.';
    }
    if (state.readingBanner) return 'La imagen todavía se está preparando. Espera unos segundos e inténtalo de nuevo.';
    if (state.conflict) return 'El catálogo cambió en otra sesión. Copia los cambios que quieras conservar y pulsa «Actualizar lista» antes de volver a guardar.';
    for (const key of ['inicio', 'fin']) {
      const field = form.elements.namedItem(key);
      if (field.validity.badInput || field.validity.rangeUnderflow || field.validity.rangeOverflow) return 'Utiliza fechas válidas entre 2000 y 2099.';
    }
    if (course.inicio && course.fin && course.fin < course.inicio) return 'La fecha de finalización debe ser igual o posterior a la fecha de inicio.';
    for (const instructor of course.instructor) {
      if (!instructor.cv) continue;
      try {
        const url = new URL(instructor.cv);
        if (url.protocol !== 'https:' || url.username || url.password) return 'El enlace de cada instructor debe ser una dirección HTTPS válida, sin usuario ni contraseña.';
      } catch { return 'El enlace de cada instructor debe ser una dirección HTTPS válida.'; }
    }
    if (course.temario.length > 60 || course.incluye.length > 60 || [...course.temario, ...course.incluye].some(value => value.length > 1000)) return 'El temario y los elementos incluidos admiten hasta 60 líneas de 1,000 caracteres cada una.';
    if (course.precios && (course.precios.columnas.slice(1).some(value => !value) || course.precios.filas.some(row => !row[0]))) return 'Añade un nombre a cada etapa y perfil de la tabla de precios.';
    if (status === 'published') {
      const needed = [['descripcion', 'descripción'], ['categoria', 'categoría'], ['inicio', 'fecha de inicio'], ['fin', 'fecha de finalización'], ['duracion', 'duración'], ['nivel', 'nivel']].filter(([key]) => !course[key]).map(([, label]) => label);
      if (needed.length) return `Antes de publicar, completa: ${needed.join(', ')}.`;
      if (!course.temario.length || !course.incluye.length) return 'Antes de publicar, añade al menos un tema y un elemento incluido en el curso.';
      if (!course.instructor.length || course.instructor.some(item => !item.nombre)) return 'Antes de publicar, completa el nombre de cada instructor.';
      if (!state.banner && !(state.current && state.current.img)) return 'Selecciona el banner del curso antes de publicarlo.';
    }
    return '';
  }

  form.addEventListener('input', event => {
    if (event.target.matches('[name]')) markDirty();
  });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (state.busy) return;
    const status = (state.current && courseStatus(state.current) === 'published') || (event.submitter && event.submitter.id === 'publish-course') ? 'published' : 'draft';
    const course = collectCourse(status);
    const issue = validate(course, status);
    if (issue) { message('editor-message', issue, true); byId('editor-message').focus(); return; }
    const body = { course, revision: state.revision };
    if (state.banner) body.banner = state.banner;
    setBusy(true);
    message('editor-message', status === 'draft' ? 'Guardando borrador…' : 'Guardando y actualizando el sitio…');
    try {
      const result = await api(state.current ? `/api/admin/courses/${encodeURIComponent(state.current.id)}` : '/api/admin/courses', { method: state.current ? 'PUT' : 'POST', body: JSON.stringify(body) });
      state.revision = result.revision;
      const index = state.courses.findIndex(item => item.id === result.course.id);
      if (index < 0) state.courses.unshift(result.course);
      else state.courses[index] = result.course;
      openCourse(result.course, true);
      message('editor-message', status === 'draft' ? 'Borrador guardado. Puedes volver a editarlo cuando quieras.' : 'Curso publicado. La ficha y el catálogo ya están actualizados.');
      byId('save-state').textContent = 'Todos los cambios están guardados.';
    } catch (error) {
      if (error.status === 409) {
        state.conflict = true;
        message('editor-message', 'El catálogo cambió en otra sesión. Tu formulario se conserva. Copia los cambios que quieras conservar y pulsa «Actualizar lista» para cargar la versión más reciente.', true);
      } else message('editor-message', `${error.message} Los cambios del formulario se conservan.`, true);
    } finally { setBusy(false); }
  });

  byId('add-instructor').addEventListener('click', () => { state.instructors.push({ nombre: '', desc: '', cv: '' }); renderInstructors(); markDirty(); byId('instructors-list').lastElementChild.querySelector('input').focus(); });
  byId('use-price-table').addEventListener('change', event => { byId('price-table-editor').hidden = !event.target.checked; markDirty(); });
  byId('add-stage').addEventListener('click', () => { state.stages.push(''); state.prices.forEach(row => row.values.push('')); renderPriceTable(); markDirty(); byId('price-table-head').querySelectorAll('input')[state.stages.length - 1].focus(); });
  byId('add-profile').addEventListener('click', () => { state.prices.push({ profile: '', values: state.stages.map(() => '') }); renderPriceTable(); markDirty(); byId('price-table-body').lastElementChild.querySelector('input').focus(); });
  byId('banner-file').addEventListener('change', event => {
    const file = event.target.files[0];
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024 || !file.size) {
      message('editor-message', 'Selecciona una imagen PNG, JPG o WebP de hasta 5 MB.', true);
      event.target.value = '';
      return;
    }
    const read = ++state.bannerRead;
    state.readingBanner = true;
    byId('banner-message').textContent = 'Preparando imagen…';
    const reader = new FileReader();
    reader.addEventListener('load', () => {
      if (read !== state.bannerRead) return;
      state.readingBanner = false;
      state.bannerURL = String(reader.result);
      state.banner = { data: state.bannerURL.slice(state.bannerURL.indexOf(',') + 1), mime: file.type };
      byId('banner-message').textContent = `${file.name} · ${(file.size / 1024 / 1024).toFixed(2)} MB · Se guardará junto con el curso.`;
      byId('reset-banner').hidden = false;
      markDirty();
    });
    reader.addEventListener('error', () => {
      if (read !== state.bannerRead) return;
      state.readingBanner = false;
      message('editor-message', 'No fue posible leer la imagen. Selecciona el archivo de nuevo.', true);
      setBannerMessage();
    });
    reader.readAsDataURL(file);
  });
  byId('reset-banner').addEventListener('click', () => { state.banner = null; state.bannerURL = ''; state.bannerRead += 1; state.readingBanner = false; byId('banner-file').value = ''; byId('reset-banner').hidden = true; setBannerMessage(); markDirty(); });
  byId('preview-banner').addEventListener('error', () => { byId('preview-banner').hidden = true; byId('preview-placeholder').hidden = false; byId('banner-message').textContent = 'No se pudo mostrar el banner. La referencia actual se conservará al guardar.'; });
  byId('new-course').addEventListener('click', () => { if (canLeave()) { openCourse(); byId('course-title').focus(); } });
  byId('course-search').addEventListener('input', renderCourseList);
  byId('course-filter').addEventListener('change', renderCourseList);
  byId('reload-courses').addEventListener('click', async () => {
    if (state.busy || !canLeave()) return;
    setBusy(true);
    try { await loadCourses({ discard: true }); message('editor-message', 'Lista actualizada. Estás viendo la versión más reciente.'); }
    catch (error) { message('editor-message', error.message, true); }
    finally { setBusy(false); }
  });
  byId('login-form').addEventListener('submit', async event => {
    event.preventDefault();
    if (byId('login-button').disabled) return;
    byId('login-button').disabled = true;
    const password = byId('admin-password').value;
    byId('admin-password').value = '';
    message('login-message', 'Comprobando acceso…');
    try {
      const result = await api('/api/admin/login', { method: 'POST', body: JSON.stringify({ password }) });
      state.csrfToken = result.csrfToken;
      await enterPanel();
    } catch (error) { message('login-message', error.message, true); byId('admin-password').focus(); }
    finally { byId('login-button').disabled = false; }
  });
  byId('logout-button').addEventListener('click', async () => {
    if (state.busy || !canLeave()) return;
    setBusy(true);
    try {
      await api('/api/admin/logout', { method: 'POST' });
      openCourse();
      state.courses = [];
      state.revision = null;
      state.initialized = false;
      renderCourseList();
      showLogin(true);
    } catch (error) { message('editor-message', error.message, true); }
    finally { setBusy(false); }
  });
  window.addEventListener('beforeunload', event => { if (state.dirty || state.busy) { event.preventDefault(); event.returnValue = ''; } });

  async function initialize() {
    openCourse();
    try {
      const session = await api('/api/admin/session');
      if (session.authenticated) { state.csrfToken = session.csrfToken; await enterPanel(); }
      else showLogin(session.configured !== false);
    } catch (error) { showLogin(true, error.message); }
  }
  initialize();
})();
