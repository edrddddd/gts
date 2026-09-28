"""Build the course catalog from data/cursos.json (no network or legacy JS needed).

Run: python scripts/build_courses.py [--date YYYY-MM-DD]
The optional date makes static snapshots reproducible. Browser statuses always
refresh against the current date in America/Mexico_City.
"""
from __future__ import annotations

import argparse
from datetime import date, datetime, timezone, timedelta
from html import escape
import json
from pathlib import Path
from urllib.parse import urlencode

ROOT = Path(__file__).resolve().parents[1]
LABELS = {"inscripcion": "Próxima edición", "en-curso": "En curso", "finalizado": "Finalizado"}


def status(course, today):
    if today < course["inicio"]:
        return "inscripcion"
    return "en-curso" if today <= course["fin"] else "finalizado"


def esc(value):
    return escape(str(value or ""), quote=True)


def contact_link(course, state, prefix=""):
    motives = {
        "inscripcion": "Solicitar información para inscribirme",
        "en-curso": "Consultar disponibilidad para incorporarme al curso iniciado",
        "finalizado": "Me interesa la próxima edición",
    }
    return prefix + "contacto.html?" + urlencode({"curso": course["id"], "servicio": "cursos", "motivo": motives[state]})


def cta_label(state):
    return {"inscripcion": "Consultar inscripción", "en-curso": "Consultar disponibilidad", "finalizado": "Avisarme de la próxima edición"}[state]


def notice(state):
    return {
        "inscripcion": "Confirma el cupo, el perfil y el importe con nuestro equipo antes de realizar un pago.",
        "en-curso": "Esta edición ya comenzó. Consulta si es posible incorporarte y confirma el importe antes de realizar un pago.",
        "finalizado": "Esta edición ya terminó. Puedes solicitar información sobre la próxima edición; las fechas y tarifas de esta ficha son históricas.",
    }[state]


def badge(state):
    return f'<span class="badge course-status status-{state}" data-course-status>{LABELS[state]}</span>'


def course_image(course, manifest, prefix=""):
    original = course.get("img", "")
    if not original or not course.get("cartelVigente", True):
        return ""
    img = manifest.get(original, {})
    dimensions = f' width="{img["width"]}" height="{img["height"]}"' if img.get("width") and img.get("height") else ""
    return f'<img src="{prefix}{esc(img.get("src", original))}" alt="Cartel informativo de {esc(course["titulo"])}" loading="lazy" decoding="async"{dimensions}>'


def card(course, today, manifest):
    state = status(course, today)
    inactive = ' hidden' if state == "finalizado" else ""
    image = course_image(course, manifest)
    poster = f'<a class="course-card-poster" href="cursos/{course["id"]}.html" aria-label="Ver cartel y detalles de {esc(course["titulo"])}">{image}</a>' if image else ""
    return f'''<article class="course-card card" data-course-id="{course['id']}"{inactive}>
      {poster}
      <div class="course-card-top"><span class="course-category">{esc(course['categoria'])}</span>{badge(state)}</div>
      <h2><a href="cursos/{course['id']}.html">{esc(course['titulo'])}</a></h2>
      <p class="course-description">{esc(course['descripcion'])}</p>
      <dl class="course-meta">
        <div><dt>Fechas</dt><dd>{esc(course['fechas'])}</dd></div>
        <div><dt>Duración</dt><dd>{esc(course['duracion'])}</dd></div>
        <div><dt>Nivel</dt><dd>{esc(course['nivel'])}</dd></div>
        <div><dt>Precio</dt><dd data-card-price>{esc(price_summary(course))}</dd></div>
      </dl>
      <div class="course-card-bottom"><span class="muted">{esc(course['modalidad'])}</span><a class="text-link" href="cursos/{course['id']}.html" aria-label="Ver detalles: {esc(course['titulo'])}">Temario y precios <span aria-hidden="true">↗</span></a></div>
    </article>'''


def page(title, content, depth=0, body_attrs=""):
    prefix = "../" * depth
    description = (f"Conoce el programa, fechas, modalidad e instructores de {title}. Consulta disponibilidad y condiciones con GenomicsTrack." if depth else "Explora cursos de bioinformática, R, Python y análisis de datos ómicos. Filtra por área y consulta las ediciones vigentes o el histórico.")
    return f'''<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{esc(title)} | GenomicsTrack Solutions</title>
  <meta name="description" content="{esc(description)}">
  <!-- SITE:HEAD -->
  <link rel="stylesheet" href="{prefix}catalog.css">
  <script src="{prefix}catalog-data.js" defer></script>
  <script src="{prefix}catalog.js" defer></script>
</head>
<body {body_attrs}>
  <!-- SITE:HEADER -->
  {content}
  <!-- SITE:FOOTER -->
</body>
</html>
'''


def catalog(courses, today, manifest):
    active_count = sum(status(c, today) != "finalizado" for c in courses)
    categories = sorted({c["categoria"] for c in courses})
    options = "".join(f'<option value="{esc(c)}">{esc(c)}</option>' for c in categories)
    archive = "".join(f'<li><a href="cursos/{c["id"]}.html">{esc(c["titulo"])} · {c["inicio"][:4]}</a></li>' for c in courses if status(c, today) == "finalizado")
    cards = "\n".join(card(c, today, manifest) for c in courses)
    return page("Cursos de bioinformática", f'''<main id="main-content">
    <section class="page-hero catalog-hero"><div class="container">
      <p class="eyebrow">APRENDE. ANALIZA. APLICA.</p>
      <h1>Tu siguiente paso<br>en bioinformática.</h1>
      <p class="catalog-intro">Cursos prácticos para transformar datos biológicos en conocimiento. Explora las ediciones vigentes y encuentra tu área de interés.</p>
      <div class="catalog-hero-notes"><span>Clases en línea</span><span>R, Python y herramientas ómicas</span><span>Horarios de Ciudad de México</span></div>
    </div></section>
    <section class="section catalog-section" aria-label="Catálogo de cursos"><div class="container">
      <form class="catalog-controls" id="catalog-filters" role="search" hidden>
        <div class="catalog-search"><label for="course-search">Busca tu próximo curso</label><input type="search" id="course-search" name="q" placeholder="Prueba con R, metagenómica o RNA-seq" autocomplete="off" aria-controls="course-grid"></div>
        <div class="catalog-topic"><label for="course-topic">Área de interés</label><select id="course-topic" name="area" aria-controls="course-grid"><option value="">Todas las áreas</option>{options}</select></div>
      </form>
      <div class="catalog-toolbar">
        <div class="catalog-tabs" role="group" aria-label="Filtrar por estado" id="course-states" hidden>
          <button type="button" data-filter="vigentes" aria-pressed="true">Vigentes</button>
          <button type="button" data-filter="inscripcion" aria-pressed="false">Próximas ediciones</button>
          <button type="button" data-filter="finalizado" aria-pressed="false">Histórico</button>
          <button type="button" data-filter="todos" aria-pressed="false">Todos</button>
        </div>
        <p id="course-count" role="status" aria-live="polite" aria-atomic="true">{active_count} cursos vigentes</p>
      </div>
      <p class="catalog-state-note muted" id="course-state-note">Las ediciones en curso requieren confirmar disponibilidad antes de incorporarte.</p>
      <div class="course-grid" id="course-grid">{cards}</div>
      <div class="catalog-empty card" id="course-empty"{'' if active_count == 0 else ' hidden'}>
        <span class="eyebrow">SIGAMOS APRENDIENDO</span><h2 id="course-empty-title">No hay ediciones vigentes por ahora.</h2>
        <p id="course-empty-message">Explora el histórico y cuéntanos qué curso te interesa para una próxima edición.</p>
        <button class="button button-secondary" type="button" id="clear-course-filters" hidden>Ver todos los cursos</button>
        <a class="text-link" href="contacto.html?servicio=cursos">Consultar próximas ediciones ↗</a>
      </div>
      <noscript><div class="notice"><p>Consulta también nuestro histórico de cursos. Para buscar y filtrar, activa JavaScript.</p><ul>{archive}</ul></div></noscript>
    </div></section>
    <section class="section catalog-guidance"><div class="container catalog-guidance-inner"><div><p class="eyebrow">APRENDIZAJE A TU MEDIDA</p><h2>¿Por dónde empezar?</h2><p>Cuéntanos con qué datos trabajas y qué quieres aprender. Te ayudamos a encontrar un curso o a preparar una capacitación para tu equipo.</p></div><a class="button" href="contacto.html?servicio=cursos&amp;motivo=Necesito%20orientaci%C3%B3n%20para%20elegir%20un%20curso">Ayúdame a elegir <span aria-hidden="true">↗</span></a></div></section>
  </main>''')


def instructors(course):
    entries = course.get("instructor") or []
    if not isinstance(entries, list):
        entries = [entries]
    if not entries:
        return '<p class="muted">Consulta con el equipo quién impartirá la próxima edición.</p>'
    rendered = []
    for person in entries:
        link = f'<a class="text-link" href="{esc(person["cv"])}" target="_blank" rel="noopener noreferrer">Ver trayectoria <span aria-hidden="true">↗</span></a>' if person.get("cv") else ""
        rendered.append(f'<div class="course-instructor"><span class="instructor-mark" aria-hidden="true">{esc("".join(part[0] for part in person["nombre"].split()[:2]))}</span><div><h3>{esc(person["nombre"])}</h3><p>{esc(person.get("desc"))}</p>{link}</div></div>')
    return "".join(rendered)


def price_summary(course):
    if str(course.get("precio", "")).strip():
        return course["precio"].strip()
    prices = course.get("precios") or {}
    return "Ver precios por etapa en la ficha" if any("$" in str(value) for row in prices.get("filas", []) for value in row) else "-"


def price_table(course, state):
    prices = course.get("precios")
    if not prices or not prices.get("filas") or not any(str(value).strip() for row in prices["filas"] for value in row):
        if course.get("precioNota"):
            return f'<p class="notice">{esc(course["precioNota"])}</p>'
        return f'<p class="course-base-price">Precio: <strong>{esc(course.get("precio") or "-")}</strong></p>'
    columns = prices["columnas"]
    headers = "".join(f'<th scope="col">{esc(c.strip())}</th>' for c in columns)
    rows = []
    for row in prices["filas"]:
        padded = (row + ["—"] * len(columns))[:len(columns)]
        rows.append("<tr>" + "".join(f'<{"th scope=" + chr(34) + "row" + chr(34) if i == 0 else "td"}>{esc(v.strip()) if v.strip() and v.strip() != "--" else "-"}</{"th" if i == 0 else "td"}>' for i, v in enumerate(padded)) + "</tr>")
    return f'''<div class="course-prices"><p class="muted" data-price-notice>Tarifas de referencia de esta edición; las promociones publicadas pueden haber finalizado. Confirma el importe vigente antes de pagar.</p><div class="course-table-scroll" tabindex="0" role="region" aria-label="Precios por etapa y perfil; desplaza horizontalmente para ver todas las columnas"><table><caption data-price-caption>{'Tarifas históricas · edición finalizada' if state == 'finalizado' else 'Tarifas publicadas · confirmar vigencia'}</caption><thead><tr>{headers}</tr></thead><tbody>{''.join(rows)}</tbody></table></div><p class="muted">Los importes en USD y las condiciones de cada promoción corresponden a la publicación original. Consulta los requisitos del perfil de estudiante con el equipo.</p></div>'''


def detail(course, today, manifest):
    state = status(course, today)
    syllabus = course.get("temario", [])
    topics = '<ol class="course-syllabus">' + "".join(f'<li><span>{esc(t)}</span></li>' for t in syllabus) + '</ol>' if syllabus else f'<div class="notice"><p>{esc(course.get("temarioNota", "Solicita el temario actualizado al equipo para conocer los contenidos de la próxima edición."))}</p></div>'
    includes = "".join(f'<li>{esc(item)}</li>' for item in course.get("incluye", []))
    image = course_image(course, manifest, "../")
    poster = f'<figure class="course-poster" id="cartel"><a href="../{esc(course["img"])}" target="_blank" rel="noopener noreferrer" aria-label="Ampliar cartel de {esc(course["titulo"])}">{image}</a><figcaption><a class="text-link" href="../{esc(course["img"])}" target="_blank" rel="noopener noreferrer">Ampliar cartel ↗</a></figcaption></figure>' if image else ''
    if course.get('fuente'):
        poster += f'<p class="course-source"><a class="text-link" href="{esc(course["fuente"])}" target="_blank" rel="noopener noreferrer">Ver convocatoria original ↗</a></p>'
    return page(course["titulo"], f'''<main id="main-content" data-course-detail="{course['id']}">
    <section class="page-hero course-detail-hero"><div class="container">
      <a class="course-back text-link" href="../cursos.html"><span aria-hidden="true">←</span> Explorar todos los cursos</a>
      <div class="course-detail-heading"><div><p class="eyebrow">{esc(course['categoria'])} · {esc(course['modalidad'])}</p><h1>{esc(course['titulo'])}</h1><p class="course-detail-intro">{esc(course['descripcion'])}</p></div><div class="course-edition-card">{badge(state)}<p class="eyebrow">ESTA EDICIÓN</p><p class="edition-dates">{esc(course['fechas'])}</p><p>{esc(course['horario'])}</p><p class="edition-duration">{esc(course['duracion'])}</p><a class="button" data-course-cta href="{esc(contact_link(course, state, '../'))}">{cta_label(state)}</a><p class="edition-note" data-course-notice>{notice(state)}</p></div></div>
      <nav class="course-section-links" aria-label="Información del curso"><a href="#temario">Temario</a><a href="#precios">Precios por etapa</a><a href="#inscripcion">Inscripción y pago</a></nav>
    </div></section>
    <section class="section course-program"><div class="container course-detail-layout">
      <div class="course-detail-content">
        <section id="temario" aria-labelledby="syllabus-heading"><p class="eyebrow">QUÉ APRENDERÁS</p><h2 id="syllabus-heading">Temario del curso</h2>{topics}</section>
        <section id="precios" class="course-tuition" aria-labelledby="price-heading"><p class="eyebrow">INFORMACIÓN DE LA EDICIÓN</p><h2 id="price-heading">Precios por etapa</h2>{price_table(course, state)}<p><a class="text-link" href="{esc(contact_link(course, state, '../'))}">Consultar inscripción y tarifas ↗</a></p></section>
        <section aria-labelledby="includes-heading"><p class="eyebrow">RECURSOS PARA APRENDER</p><h2 id="includes-heading">Esta edición incluye</h2><ul class="course-includes">{includes}</ul></section>
        <section aria-labelledby="instructor-heading"><p class="eyebrow">CONOCE A TUS INSTRUCTORES</p><h2 id="instructor-heading">Experiencia que acompaña</h2>{instructors(course)}</section>
      </div>
      <aside class="course-detail-aside" aria-label="Cartel e información para participar">{poster}<div class="card course-info-card" id="inscripcion"><p class="eyebrow">INSCRIPCIÓN</p><h2>Información para inscribirte.</h2><p data-course-notice>{notice(state)}</p><dl class="course-meta"><div><dt>Nivel</dt><dd>{esc(course['nivel'])}</dd></div><div><dt>Zona horaria</dt><dd>Ciudad de México</dd></div></dl><a class="button button-secondary" data-course-cta href="{esc(contact_link(course, state, '../'))}">{cta_label(state)}</a><a class="text-link" href="../pagos.html?curso={course['id']}">Cuentas y opciones de pago ↗</a></div></aside>
    </div></section>
  </main>''', depth=1)


API = r'''
  function localDay(value) {
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const parsed = new Date(value + 'T00:00:00Z');
      if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) throw new TypeError('Fecha de catálogo inválida');
      return value;
    }
    const date = value === undefined ? new Date() : new Date(value);
    if (!Number.isFinite(date.getTime())) throw new TypeError('Fecha de catálogo inválida');
    const parts = new Intl.DateTimeFormat('en-US', {timeZone: 'America/Mexico_City', year: 'numeric', month: '2-digit', day: '2-digit'}).formatToParts(date);
    const part = type => parts.find(p => p.type === type).value;
    return `${part('year')}-${part('month')}-${part('day')}`;
  }
  function getStatus(course, date) {
    if (!course || !course.inicio || !course.fin) return 'finalizado';
    const today = localDay(date);
    if (today < course.inicio) return 'inscripcion';
    return today <= course.fin ? 'en-curso' : 'finalizado';
  }
  function getById(id) { return courses.find(course => course.id === id); }
  function labelStatus(status) { return ({inscripcion: 'Próxima edición', 'en-curso': 'En curso', finalizado: 'Finalizado'})[status] || 'Consultar'; }
  function canPay(course, date) { return !!course && getStatus(course, date) === 'inscripcion' && course.inscripcionConfirmada === true; }
  return {courses, getStatus, getById, labelStatus, localDay, canPay};
});
'''


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--date", type=date.fromisoformat)
    args = parser.parse_args()
    # Mexico City has used UTC-06 year-round since 2022; avoids tzdata dependency on Windows.
    today = (args.date or datetime.now(timezone(timedelta(hours=-6))).date()).isoformat()
    courses = json.loads((ROOT / "data/cursos.json").read_text(encoding="utf-8"))
    ids = [c["id"] for c in courses]
    if len(set(ids)) != len(ids):
        raise ValueError("Los ids de cursos deben ser únicos")
    for course in courses:
        if date.fromisoformat(course["inicio"]) > date.fromisoformat(course["fin"]):
            raise ValueError(f"Rango de fechas inválido: {course['id']}")
    manifest_path = ROOT / "data/image-manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8")) if manifest_path.exists() else {}
    payload = json.dumps(courses, ensure_ascii=False, separators=(",", ":"))
    wrapper = "// Generated from data/cursos.json by scripts/build_courses.py.\n(function(root,factory){if(typeof module==='object'&&module.exports){module.exports=factory();}else{root.CourseCatalog=factory();}})(typeof globalThis!=='undefined'?globalThis:this,function(){\n  'use strict';\n  const courses = "
    (ROOT / "catalog-data.js").write_text(wrapper + payload + ";\n" + API, encoding="utf-8")
    (ROOT / "cursos.html").write_text(catalog(courses, today, manifest), encoding="utf-8")
    (ROOT / "cursos").mkdir(exist_ok=True)
    for course in courses:
        (ROOT / "cursos" / (course["id"] + ".html")).write_text(detail(course, today, manifest), encoding="utf-8")
    print(f"Generated catalog and {len(courses)} course pages for {today}.")


if __name__ == "__main__":
    main()
    from build_site import sync_shell
    sync_shell()
