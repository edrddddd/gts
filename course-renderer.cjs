'use strict';

// Runtime rendering uses the checked-in pages as shells, so publishing a course
// does not require Python or a second build process on the production server.
const LABELS = {inscripcion: 'Próxima edición', 'en-curso': 'En curso', finalizado: 'Finalizado'};
const NOTICES = {
  inscripcion: 'Confirma el cupo, el perfil y el importe con nuestro equipo antes de realizar un pago.',
  'en-curso': 'Esta edición ya comenzó. Consulta si es posible incorporarte y confirma el importe antes de realizar un pago.',
  finalizado: 'Esta edición ya terminó. Puedes solicitar información sobre la próxima edición; las fechas y tarifas de esta ficha son históricas.'
};
const CTA = {inscripcion: 'Consultar inscripción', 'en-curso': 'Consultar disponibilidad', finalizado: 'Avisarme de la próxima edición'};
const MOTIVES = {inscripcion: 'Solicitar información para inscribirme', 'en-curso': 'Consultar disponibilidad para incorporarme al curso iniciado', finalizado: 'Me interesa la próxima edición'};
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[char]));
const list = value => Array.isArray(value) ? value : [];
const published = courses => list(courses).filter(course => course && course.publicationStatus !== 'draft');
const displayValue = value => value == null || !String(value).trim() || /^[-—–]+$/.test(String(value).trim()) ? '-' : String(value).trim();
const route = course => 'cursos/' + encodeURIComponent(String(course.id)) + '.html';

function localDay(value) {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const parsed = new Date(value + 'T00:00:00Z');
    if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) throw new TypeError('Fecha de catálogo inválida');
    return value;
  }
  const date = value === undefined ? new Date() : new Date(value);
  if (!Number.isFinite(date.getTime())) throw new TypeError('Fecha de catálogo inválida');
  const parts = new Intl.DateTimeFormat('en-US', {timeZone: 'America/Mexico_City', year: 'numeric', month: '2-digit', day: '2-digit'}).formatToParts(date);
  const part = type => parts.find(item => item.type === type).value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

function getStatus(course, today) {
  if (!course.inicio || !course.fin) return 'finalizado';
  return today < course.inicio ? 'inscripcion' : today <= course.fin ? 'en-curso' : 'finalizado';
}

function cardPrice(course) {
  if (typeof course.precio === 'string' && course.precio.trim()) return course.precio.trim();
  return list(course.precios?.filas).some(row => list(row).some(value => String(value).includes('$'))) ? 'Ver precios por etapa en la ficha' : '-';
}

function safeHTTPS(value) {
  if (typeof value !== 'string' || /[\u0000-\u0020\u007f\\]/.test(value)) return '';
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : '';
  } catch { return ''; }
}

function safeImage(value) {
  if (typeof value !== 'string' || /[\u0000-\u001f\u007f\\]/.test(value)) return '';
  const remote = safeHTTPS(value);
  if (remote) return /\.(?:png|jpe?g|webp|gif|avif)$/i.test(new URL(remote).pathname) ? remote : '';
  let decoded;
  try { decoded = decodeURIComponent(value); } catch { return ''; }
  if (!value.startsWith('media/') || !decoded.startsWith('media/') || /[\\?#%\u0000-\u001f\u007f]/.test(decoded)) return '';
  if (decoded.split('/').some(part => !part || part === '.' || part === '..')) return '';
  return /\.(?:png|jpe?g|webp|gif|avif)$/i.test(decoded) ? value : '';
}

function imageInfo(course, manifest = {}) {
  if (course.cartelVigente === false) return null;
  const original = safeImage(course.img);
  if (!original) return null;
  const entry = Object.hasOwn(manifest, course.img) ? manifest[course.img] : {};
  return {original, src: safeImage(entry?.src) || original, width: entry?.width, height: entry?.height};
}

function courseImage(course, manifest, prefix = '') {
  const info = imageInfo(course, manifest);
  if (!info) return '';
  const dimensions = Number.isSafeInteger(info.width) && info.width > 0 && Number.isSafeInteger(info.height) && info.height > 0 ? ` width="${info.width}" height="${info.height}"` : '';
  const src = info.src.startsWith('media/') ? prefix + info.src : info.src;
  return `<img src="${esc(src)}" alt="Cartel informativo de ${esc(course.titulo)}" loading="lazy" decoding="async"${dimensions}>`;
}

function badge(state) {
  return `<span class="badge course-status status-${state}" data-course-status>${LABELS[state]}</span>`;
}

function contactLink(course, state, prefix = '') {
  return prefix + 'contacto.html?' + new URLSearchParams({curso: String(course.id), servicio: 'cursos', motivo: MOTIVES[state]}).toString();
}

function card(course, today, manifest) {
  const state = getStatus(course, today);
  const image = courseImage(course, manifest);
  const href = esc(route(course));
  return `<article class="course-card card" data-course-id="${esc(course.id)}"${state === 'finalizado' ? ' hidden' : ''}>
      ${image ? `<a class="course-card-poster" href="${href}" aria-label="Ver cartel y detalles de ${esc(course.titulo)}">${image}</a>` : ''}
      <div class="course-card-top"><span class="course-category">${esc(course.categoria)}</span>${badge(state)}</div>
      <h2><a href="${href}">${esc(course.titulo)}</a></h2>
      <p class="course-description">${esc(course.descripcion)}</p>
      <dl class="course-meta">
        <div><dt>Fechas</dt><dd>${esc(course.fechas)}</dd></div>
        <div><dt>Duración</dt><dd>${esc(course.duracion)}</dd></div>
        <div><dt>Nivel</dt><dd>${esc(course.nivel)}</dd></div>
        <div><dt>Precio</dt><dd data-card-price>${esc(cardPrice(course))}</dd></div>
      </dl>
      <div class="course-card-bottom"><span class="muted">${esc(course.modalidad)}</span><a class="text-link" href="${href}" aria-label="Ver detalles: ${esc(course.titulo)}">Temario y precios <span aria-hidden="true">↗</span></a></div>
    </article>`;
}

// Only the trusted template is scanned for element boundaries. Inserted course
// content is escaped and never scanned as template markup.
function replaceElement(template, tag, id, replacement) {
  const opening = new RegExp(`<${tag}\\b[^>]*\\bid=["']${id}["'][^>]*>`, 'i').exec(template);
  if (!opening) throw new Error(`Falta #${id} en la plantilla`);
  const tags = new RegExp(`<\\/?${tag}\\b[^>]*>`, 'gi');
  tags.lastIndex = opening.index + opening[0].length;
  let depth = 1;
  let match;
  while ((match = tags.exec(template))) {
    depth += /^<\//.test(match[0]) ? -1 : 1;
    if (!depth) return template.slice(0, opening.index) + replacement + template.slice(tags.lastIndex);
  }
  throw new Error(`Elemento #${id} sin cierre en la plantilla`);
}

function renderCatalogPage(template, courses, manifest = {}, today) {
  const day = localDay(today);
  const visible = published(courses);
  const activeCount = visible.filter(course => getStatus(course, day) !== 'finalizado').length;
  const categories = [...new Set(visible.map(course => String(course.categoria || '')).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es'));
  let result = replaceElement(template, 'div', 'course-grid', `<div class="course-grid" id="course-grid">${visible.map(course => card(course, day, manifest)).join('\n')}</div>`);
  result = replaceElement(result, 'select', 'course-topic', `<select id="course-topic" name="area" aria-controls="course-grid"><option value="">Todas las áreas</option>${categories.map(category => `<option value="${esc(category)}">${esc(category)}</option>`).join('')}</select>`);
  result = replaceElement(result, 'p', 'course-count', `<p id="course-count" role="status" aria-live="polite" aria-atomic="true">${activeCount} ${activeCount === 1 ? 'curso vigente' : 'cursos vigentes'}</p>`);
  result = result.replace(/<div\b[^>]*\bid=["']course-empty["'][^>]*>/i, opening => opening.replace(/\s+hidden(?:=(?:"[^"]*"|'[^']*'))?/gi, '').replace(/>$/, activeCount ? ' hidden>' : '>'));
  const archive = visible.filter(course => getStatus(course, day) === 'finalizado').map(course => `<li><a href="${esc(route(course))}">${esc(course.titulo)} · ${esc(String(course.inicio || '').slice(0, 4))}</a></li>`).join('');
  return result.replace(/<noscript>[^]*?<\/noscript>/i, () => `<noscript><div class="notice"><p>Consulta también nuestro histórico de cursos. Para buscar y filtrar, activa JavaScript.</p><ul>${archive}</ul></div></noscript>`);
}

function instructors(course) {
  const entries = (Array.isArray(course.instructor) ? course.instructor : course.instructor ? [course.instructor] : []).filter(person => person && typeof person === 'object');
  if (!entries.length) return '<p class="muted">Consulta con el equipo quién impartirá la próxima edición.</p>';
  return entries.map(person => {
    const url = safeHTTPS(person.cv);
    const initials = String(person.nombre || '').trim().split(/\s+/).slice(0, 2).map(part => [...part][0] || '').join('');
    return `<div class="course-instructor"><span class="instructor-mark" aria-hidden="true">${esc(initials)}</span><div><h3>${esc(person.nombre)}</h3><p>${esc(person.desc)}</p>${url ? `<a class="text-link" href="${esc(url)}" target="_blank" rel="noopener noreferrer">Ver trayectoria <span aria-hidden="true">↗</span></a>` : ''}</div></div>`;
  }).join('');
}

function priceTable(course, state) {
  const prices = course.precios;
  const columns = list(prices?.columnas);
  const rows = list(prices?.filas);
  if (!columns.length || !rows.length) return '';
  const headers = columns.map(value => `<th scope="col">${esc(displayValue(value))}</th>`).join('');
  const body = rows.map(row => '<tr>' + columns.map((_, index) => {
    const value = esc(displayValue(list(row)[index]));
    return index === 0 ? `<th scope="row">${value}</th>` : `<td>${value}</td>`;
  }).join('') + '</tr>').join('');
  return `<div class="course-prices"><p class="muted" data-price-notice>Tarifas de referencia de esta edición; las promociones publicadas pueden haber finalizado. Confirma el importe vigente antes de pagar.</p><div class="course-table-scroll" tabindex="0" role="region" aria-label="Precios por etapa y perfil; desplaza horizontalmente para ver todas las columnas"><table><caption data-price-caption>${state === 'finalizado' ? 'Tarifas históricas · edición finalizada' : 'Tarifas publicadas · confirmar vigencia'}</caption><thead><tr>${headers}</tr></thead><tbody>${body}</tbody></table></div><p class="muted">Los importes en USD y las condiciones de cada promoción corresponden a la publicación original. Consulta los requisitos del perfil de estudiante con el equipo.</p></div>`;
}

function detailMain(course, manifest, today) {
  const state = getStatus(course, today);
  const link = esc(contactLink(course, state, '../'));
  const syllabus = list(course.temario);
  const topics = syllabus.length ? `<ol class="course-syllabus">${syllabus.map(topic => `<li><span>${esc(topic)}</span></li>`).join('')}</ol>` : `<div class="notice"><p>${esc(course.temarioNota || 'Solicita el temario actualizado al equipo para conocer los contenidos de la próxima edición.')}</p></div>`;
  const info = imageInfo(course, manifest);
  const original = info ? esc(info.original.startsWith('media/') ? '../' + info.original : info.original) : '';
  const poster = info ? `<figure class="course-poster" id="cartel"><a href="${original}" target="_blank" rel="noopener noreferrer" aria-label="Ampliar cartel de ${esc(course.titulo)}">${courseImage(course, manifest, '../')}</a><figcaption><a class="text-link" href="${original}" target="_blank" rel="noopener noreferrer">Ampliar cartel ↗</a></figcaption></figure>` : '';
  const source = safeHTTPS(course.fuente);
  return `<main id="main-content" data-course-detail="${esc(course.id)}">
    <section class="page-hero course-detail-hero"><div class="container">
      <a class="course-back text-link" href="../cursos.html"><span aria-hidden="true">←</span> Explorar todos los cursos</a>
      <div class="course-detail-heading"><div><p class="eyebrow">${esc(course.categoria)} · ${esc(course.modalidad)}</p><h1>${esc(course.titulo)}</h1><p class="course-detail-intro">${esc(course.descripcion)}</p></div><div class="course-edition-card">${badge(state)}<p class="eyebrow">ESTA EDICIÓN</p><p class="edition-dates">${esc(course.fechas)}</p><p>${esc(course.horario)}</p><p class="edition-duration">${esc(course.duracion)}</p><a class="button" data-course-cta href="${link}">${CTA[state]}</a><p class="edition-note" data-course-notice>${NOTICES[state]}</p></div></div>
      <nav class="course-section-links" aria-label="Información del curso"><a href="#temario">Temario</a><a href="#precios">Precios por etapa</a><a href="#inscripcion">Inscripción y pago</a></nav>
    </div></section>
    <section class="section course-program"><div class="container course-detail-layout">
      <div class="course-detail-content">
        <section id="temario" aria-labelledby="syllabus-heading"><p class="eyebrow">QUÉ APRENDERÁS</p><h2 id="syllabus-heading">Temario del curso</h2>${topics}</section>
        <section id="precios" class="course-tuition" aria-labelledby="price-heading"><p class="eyebrow">INFORMACIÓN DE LA EDICIÓN</p><h2 id="price-heading">Precios por etapa</h2><dl class="course-meta"><div><dt>Precio</dt><dd data-course-price>${esc(displayValue(course.precio))}</dd></div></dl>${priceTable(course, state)}<p><a class="text-link" href="${link}">Consultar inscripción y tarifas ↗</a></p></section>
        <section aria-labelledby="includes-heading"><p class="eyebrow">RECURSOS PARA APRENDER</p><h2 id="includes-heading">Esta edición incluye</h2><ul class="course-includes">${list(course.incluye).map(item => `<li>${esc(item)}</li>`).join('')}</ul></section>
        <section aria-labelledby="instructor-heading"><p class="eyebrow">CONOCE A TUS INSTRUCTORES</p><h2 id="instructor-heading">Experiencia que acompaña</h2>${instructors(course)}</section>
      </div>
      <aside class="course-detail-aside" aria-label="Cartel e información para participar">${poster}${source ? `<p class="course-source"><a class="text-link" href="${esc(source)}" target="_blank" rel="noopener noreferrer">Ver convocatoria original ↗</a></p>` : ''}<div class="card course-info-card" id="inscripcion"><p class="eyebrow">INSCRIPCIÓN</p><h2>Información para inscribirte.</h2><p data-course-notice>${NOTICES[state]}</p><dl class="course-meta"><div><dt>Nivel</dt><dd>${esc(course.nivel)}</dd></div><div><dt>Zona horaria</dt><dd>Ciudad de México</dd></div></dl><a class="button button-secondary" data-course-cta href="${link}">${CTA[state]}</a><a class="text-link" href="../pagos.html?curso=${esc(encodeURIComponent(String(course.id)))}">Cuentas y opciones de pago ↗</a></div></aside>
    </div></section>
  </main>`;
}

function attribute(tag, name) {
  return new RegExp(`\\b${name}=["']([^"']*)["']`, 'i').exec(tag)?.[1] || '';
}

function renderDetailPage(template, course, manifest = {}, today) {
  if (!course || course.publicationStatus === 'draft') throw new Error('Curso no publicado');
  const title = `${course.titulo} | GenomicsTrack Solutions`;
  const description = `Conoce el programa, fechas, modalidad e instructores de ${course.titulo}. Consulta disponibilidad y condiciones con GenomicsTrack.`;
  const canonicalTag = (template.match(/<link\b[^>]*>/gi) || []).find(tag => attribute(tag, 'rel') === 'canonical');
  const previousURL = canonicalTag ? safeHTTPS(attribute(canonicalTag, 'href')) : '';
  const baseURL = previousURL ? new URL('../', previousURL).href : '';
  const canonical = baseURL ? new URL(route(course), baseURL).href : '';
  const info = imageInfo(course, manifest);
  const ogImage = baseURL ? new URL(info?.src || 'media/optimized/logos/fondo%20frase.webp', baseURL).href : info?.src?.startsWith('https:') ? info.src : '';
  const metadata = {'description': description, 'og:title': title, 'og:description': description, 'og:url': canonical, 'og:image': ogImage};
  let result = template.replace(/<title>[^]*?<\/title>/i, () => `<title>${esc(title)}</title>`);
  result = result.replace(/<meta\b[^>]*>/gi, tag => {
    const key = attribute(tag, 'property') || attribute(tag, 'name');
    return Object.hasOwn(metadata, key) ? `<meta ${key.startsWith('og:') ? 'property' : 'name'}="${key}" content="${esc(metadata[key])}">` : tag;
  });
  if (canonicalTag) result = result.replace(canonicalTag, () => `<link rel="canonical" href="${esc(canonical)}">`);
  const main = /<main\b[^>]*>[^]*?<\/main\s*>/i;
  if (!main.test(result)) throw new Error('Falta main en la plantilla del curso');
  return result.replace(main, () => detailMain(course, manifest, localDay(today)));
}

function renderHomePage(template, courses, manifest = {}, today) {
  const day = localDay(today);
  const visible = published(courses);
  const upcoming = visible.filter(course => getStatus(course, day) === 'inscripcion');
  const current = upcoming.length ? upcoming : visible.filter(course => getStatus(course, day) === 'en-curso');
  const selected = (current.length ? [...current].sort((a, b) => String(a.inicio).localeCompare(String(b.inicio))) : [...visible].sort((a, b) => String(b.fin).localeCompare(String(a.fin)))).slice(0, 3);
  const cards = selected.map(course => {
    const cover = courseImage(course, manifest) || `<div class="featured-cover" aria-hidden="true"><strong>${esc(course.etiquetaVisual || course.categoria || 'Bioinformática')}</strong><span>GenomicsTrack / Formación</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M4 19h16M7 15V9m5 6V5m5 10v-4"/></svg></div>`;
    return `<a class="card featured-course" href="${esc(route(course))}" data-course-id="${esc(course.id)}"><div class="featured-media">${cover}${badge(getStatus(course, day))}</div><div class="featured-content"><h3>${esc(course.titulo)}</h3><p>${esc(String(course.fechas || '').trim())}</p><p>${esc(course.duracion)}</p><p>Precio: <span data-card-price>${esc(cardPrice(course))}</span></p><span class="course-link">Explorar curso <span aria-hidden="true">↗</span></span></div></a>`;
  }).join('');
  return replaceElement(template, 'div', 'home-courses', `<div class="${selected.length === 2 ? 'grid-2' : 'grid-3'}" id="home-courses">${cards}</div>`);
}

function renderCatalogData(template, courses) {
  const payload = JSON.stringify(published(courses)).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
  const declaration = /^([ \t]*const courses\s*=\s*)[^\r\n]*;[ \t]*$/m;
  if (!declaration.test(template)) throw new Error('Falta la declaración courses en catalog-data.js');
  return template.replace(declaration, (_, prefix) => prefix + payload + ';');
}

function renderSitemap(template, courses, baseUrl) {
  const base = safeHTTPS(String(baseUrl || '').replace(/\/$/, ''));
  if (!base) throw new Error('URL pública inválida para el sitemap');
  const existing = template.replace(/<url\b[^>]*>[^]*?<\/url>/gi, entry => {
    const loc = /<loc>([^]*?)<\/loc>/i.exec(entry)?.[1] || '';
    return /\/(?:cursos\/[^/?#]+\.html|admin(?:\.html|\/?))(?:[?#]|$)/i.test(loc) ? '' : entry;
  });
  const urls = published(courses).map(course => `<url><loc>${esc(new URL(route(course), base.replace(/\/$/, '') + '/').href)}</loc></url>`).join('');
  if (!/<\/urlset\s*>/i.test(existing)) throw new Error('Sitemap sin urlset');
  return existing.replace(/<\/urlset\s*>/i, () => urls + '</urlset>');
}

module.exports = {renderCatalogPage, renderDetailPage, renderHomePage, renderCatalogData, renderSitemap};
