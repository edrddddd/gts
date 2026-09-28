"""Build the static site and shared chrome. Python standard library only."""
from pathlib import Path
from html import escape
from urllib.parse import quote
from datetime import date, datetime, timezone, timedelta
import json
import re
import hashlib

ROOT = Path(__file__).resolve().parents[1]
CONFIG = json.loads((ROOT / 'site.config.json').read_text(encoding='utf-8'))

def icon(name):
    paths = {
        'globe':'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c5 5 5 13 0 18-5-5-5-13 0-18Z"/>',
        'data':'<path d="M4 19h16M7 15V9m5 6V5m5 10v-4"/>',
        'code':'<path d="m8 6-6 6 6 6m8-12 6 6-6 6M14 3l-4 18"/>',
        'people':'<circle cx="9" cy="8" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3m0-18a3 3 0 0 1 0 6m3 5a5 5 0 0 1 3 4v3"/>',
    }
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+paths[name]+'</svg>'

def document(title, description, body, extra=''):
    return f'''<!doctype html>
<html lang="es" class="no-js"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>{escape(title)}</title><meta name="description" content="{escape(description, quote=True)}"><!-- SITE:HEAD -->{extra}</head>
<body><!-- SITE:HEADER --><main id="main-content">{body}</main><!-- SITE:FOOTER --></body></html>'''

def faq():
    questions = [
        ('¿Necesito experiencia previa?', 'Depende del curso. En cada ficha encontrarás su enfoque, los temas y las herramientas que se utilizan. Si no sabes por dónde empezar, cuéntanos tu experiencia y te orientamos.'),
        ('¿Los cursos son en línea?', 'La modalidad y los horarios se indican en cada ficha. Los cursos actuales se imparten en línea; consulta también qué grabaciones y materiales incluye cada edición.'),
        ('¿Cómo solicito una consultoría?', 'Elige Consultoría en el formulario de contacto y propón una fecha y hora. El equipo confirmará disponibilidad por correo o WhatsApp antes de acordar la sesión.'),
        ('¿Puedo inscribirme en un curso que ya comenzó?', 'Primero consulta con el equipo si es posible incorporarte. Los cursos en marcha y finalizados no habilitan pagos directos desde su ficha.'),
    ]
    return '<div class="faq-list">'+''.join(f'<details><summary>{escape(q)}</summary><p>{escape(a)}</p></details>' for q,a in questions)+'</div>'

def featured():
    path = ROOT / 'data/cursos.json'
    if not path.exists():
        return '<div class="empty-state"><h3>Encuentra tu próximo aprendizaje</h3><p>Explora las ediciones y consulta los próximos grupos disponibles.</p><a class="button" href="cursos.html">Explorar catálogo</a></div>'
    data = json.loads(path.read_text(encoding='utf-8'))
    courses = data if isinstance(data, list) else data.get('courses', [])
    today = datetime.now(timezone(timedelta(hours=-6))).date().isoformat()
    upcoming = [c for c in courses if c.get('inicio', '') > today]
    current = upcoming or [c for c in courses if c.get('fin', '') >= today]
    selected = sorted(current, key=lambda c:c.get('inicio',''))[:3] if current else sorted(courses, key=lambda c:c.get('fin',''), reverse=True)[:3]
    cards = []
    manifest = json.loads((ROOT / 'data/image-manifest.json').read_text(encoding='utf-8'))
    for c in selected:
        status = 'Finalizado' if c.get('fin','') < today else ('En curso' if c.get('inicio','') <= today else 'Próxima edición')
        src = c.get('img','')
        converted = 'media/optimized/'+str(Path(src).relative_to('media').with_suffix('.webp')).replace('\\','/') if src.startswith('media/') else src
        if (ROOT/converted).exists(): src = converted
        if src and c.get('cartelVigente', True):
            img = manifest.get(c.get('img', ''), {})
            dimensions = f' width="{img["width"]}" height="{img["height"]}"' if img.get('width') and img.get('height') else ''
            cover = f'<img src="{escape(src,quote=True)}"{dimensions} loading="lazy" decoding="async" alt="Cartel de {escape(c["titulo"],quote=True)}">'
        else:
            label = escape(c.get('etiquetaVisual', c.get('categoria', 'Bioinformática')))
            cover = f'<div class="featured-cover" aria-hidden="true"><strong>{label}</strong><span>GenomicsTrack / Formación</span>{icon("data")}</div>'
        cards.append(f'''<a class="card featured-course" href="cursos/{escape(c['id'])}.html" data-course-id="{escape(c['id'])}">
<div class="featured-media">{cover}<span class="badge" data-course-status>{status}</span></div>
<div class="featured-content"><h3>{escape(c['titulo'])}</h3><p>{escape(c['fechas'].strip())}</p><p>{escape(c.get('duracion',''))}</p><span class="course-link">Explorar curso <span aria-hidden="true">↗</span></span></div></a>''')
    return '<div class="'+('grid-2' if len(cards)==2 else 'grid-3')+'" id="home-courses">'+''.join(cards)+'</div>'

def build_home(services):
    service_rows = ''.join(f'''<a class="service-row" href="servicios.html#{s['id']}"><span class="index">0{i+1}</span><h3>{escape(s['nombre'])}</h3><p>{escape(s['resumen'])}</p><span class="row-arrow" aria-hidden="true">↗</span></a>''' for i,s in enumerate(services))
    trust = ''.join(f'<div class="trust-item">{icon(i)}<strong>{t}</strong></div>' for i,t in [('globe','En español, para Latinoamérica'),('data','Aprendizaje con datos reales'),('code','Herramientas de código abierto'),('people','Acompañamiento especializado')])
    body = f'''
<section class="home-hero"><div class="container hero-grid"><div class="hero-copy">
<span class="eyebrow">Ciencia accesible. Conocimiento compartido.</span>
<h1>Bioinformática para avanzar <em>tu investigación.</em></h1>
<p class="hero-description">Conecta tus preguntas con nuevas posibilidades. Cursos prácticos, consultoría y análisis de datos genómicos para dar el siguiente paso.</p>
<div class="actions"><a class="button" href="cursos.html">Explorar cursos <span aria-hidden="true">↗</span></a><a class="button button-secondary" href="servicios.html">Conocer servicios</a></div>
<p class="hero-note">Para estudiantes, investigadores y laboratorios.</p></div>
<div class="science-visual"><div class="science-image"><img src="media/optimized/logos/fondo frase.webp" width="1400" height="788" alt="Visualización de estructuras de ADN" fetchpriority="high"><div class="visual-topline"><span>GenomicsTrack · Solutions</span><span>ADN / DATA</span></div></div>
<div class="visual-caption"><p>Cada dato puede ser un punto de partida</p><div class="data-route"><span><small>01 / EXPLORAR</small>Tus datos</span><b aria-hidden="true">→</b><span><small>02 / COMPRENDER</small>El análisis</span><b aria-hidden="true">→</b><span><small>03 / AVANZAR</small>Tu ciencia</span></div></div></div></div></section>
<div class="trust-strip"><div class="container trust-grid">{trust}</div></div>
<section class="section"><div class="container"><div class="section-heading"><div><span class="eyebrow">Aprende haciendo</span><h2>Tu siguiente paso<br>empieza aquí.</h2></div><div><p id="home-course-intro">Explora nuestras ediciones, conoce el programa y encuentra tu próximo tema.</p><a class="text-link" href="cursos.html" style="margin-top:18px">Ver todos los cursos <span aria-hidden="true">↗</span></a></div></div>{featured()}</div></section>
<section class="section service-home"><div class="container"><div class="service-intro"><div><span class="eyebrow">Soluciones para tu proyecto</span><h2>De una buena pregunta<br>a un análisis con sentido.</h2></div><p>Hay más de una forma de avanzar. Encuentra el apoyo que necesitas según la etapa, los recursos y los objetivos de tu investigación.</p></div>{service_rows}</div></section>
<section class="section"><div class="container"><div class="section-heading"><div><span class="eyebrow">Ciencia en colaboración</span><h2>Un proceso claro.<br>Un equipo a tu lado.</h2></div><a class="text-link" href="acercade.html">Conoce GenomicsTrack <span aria-hidden="true">↗</span></a></div>
<div class="steps-grid"><article class="process-step"><span>01</span><h3>Te escuchamos</h3><p>Nos cuentas qué buscas resolver, qué datos tienes y en qué punto está tu proyecto.</p></article><article class="process-step"><span>02</span><h3>Trazamos un plan</h3><p>Acordamos el enfoque, los entregables, los tiempos y el presupuesto antes de comenzar.</p></article><article class="process-step"><span>03</span><h3>Avanzamos contigo</h3><p>Trabajamos con herramientas abiertas y documentación para que puedas entender y reproducir el análisis.</p></article></div></div></section>
<section class="section-sm"><div class="container"><div class="consultation-banner"><div><span class="eyebrow">Empecemos por conversar</span><h2>Una pregunta concreta.<br>Un siguiente paso claro.</h2><p>Revisa tus dudas con un especialista en una sesión de consultoría bioinformática.</p></div><div><div class="consultation-facts"><span><strong>45–60 min</strong>Sesión individual</span><span><strong>$650 MXN</strong>En línea</span></div><a class="button button-light" href="contacto.html?servicio=consultoria">Solicitar un horario <span aria-hidden="true">↗</span></a><p style="font-size:.75rem;margin:16px 0 0">Fecha y hora sujetas a confirmación del equipo.</p></div></div></div></section>
<section class="section"><div class="container faq-layout"><div><span class="eyebrow">Antes de empezar</span><h2>Resolvemos<br>tus dudas.</h2><a class="text-link" href="contacto.html">Hablemos de tu proyecto <span aria-hidden="true">↗</span></a></div>{faq()}</div></section>'''
    (ROOT/'index.html').write_text(document('GenomicsTrack · Bioinformática para tu investigación', CONFIG['description'], body, '<script src="catalog-data.js" defer></script><script src="home.js" defer></script>'), encoding='utf-8')

def build_services(services):
    details = []
    for i,s in enumerate(services):
        included = ''.join(f'<li>{escape(item)}</li>' for item in s['incluye'])
        excluded = ''.join(f'<li>{escape(item)}</li>' for item in s['excluye'])
        details.append(f'''<article class="service-detail" id="{s['id']}"><div><span class="eyebrow">0{i+1} / Servicios</span><h2>{escape(s['nombre'])}</h2><div class="service-meta"><strong>{escape(s['precio'])}</strong>{escape(s['duracion'])}</div><a class="button" href="contacto.html?servicio={s['id']}">Consultar este servicio <span aria-hidden="true">↗</span></a></div><div><p class="service-description">{escape(s['descripcion'])}</p><h3>Qué incluye</h3><ul class="check-list">{included}</ul><details><summary>Alcance y exclusiones</summary><ul>{excluded}</ul></details></div></article>''')
    body = '''<section class="page-hero"><div class="container"><span class="eyebrow">Servicios bioinformáticos</span><h1>Tu investigación.<br>Nuestro trabajo en equipo.</h1><p>Desde una consulta puntual hasta un proyecto completo. Acordamos contigo el alcance y los entregables para que sepas qué esperar en cada etapa.</p></div></section><div class="container">'''+''.join(details)+'''</div><section class="section"><div class="container"><div class="simple-cta"><div><span class="eyebrow">También aprendemos juntos</span><h2>Cursos para explorar nuevas herramientas.</h2><p>Conoce los programas, las fechas y los instructores de cada edición.</p></div><a class="button" href="cursos.html">Explorar cursos ↗</a></div></div></section>'''
    (ROOT/'servicios.html').write_text(document('Servicios bioinformáticos · GenomicsTrack', 'Consultoría, capacitación personalizada, scripts y proyectos bioinformáticos con alcance y entregables definidos.', body), encoding='utf-8')

def build_about():
    body = '''<section class="page-hero"><div class="container"><span class="eyebrow">Acerca de GenomicsTrack</span><h1>Acercamos la bioinformática<br>a tu realidad.</h1><p>Conocimiento, herramientas abiertas y colaboración para que más preguntas científicas encuentren una respuesta.</p></div></section>
<section class="section"><div class="container about-intro"><div><span class="eyebrow">Nuestra razón de ser</span><h2>El potencial está<br>en tus preguntas.</h2></div><div><p class="large-copy">Somos una empresa especializada en servicios bioinformáticos accesibles y personalizados para Latinoamérica.</p><p class="muted">Acompañamos a estudiantes, investigadores, laboratorios y centros académicos para aprovechar sus datos y desarrollar capacidades de análisis. Adaptamos el trabajo a los recursos, al nivel técnico y a los objetivos de cada proyecto.</p><p class="muted">Nuestra misión es acercar herramientas y conocimiento que permitan hacer análisis genómicos de calidad, aprovechando tanto datos propios como información pública.</p></div></div></section>
<section class="section service-home"><div class="container"><div class="section-heading"><div><span class="eyebrow">Cómo entendemos la ciencia</span><h2>Principios que se<br>convierten en práctica.</h2></div></div><div class="grid-3 value-grid"><article class="card"><span>01 / ACCESIBILIDAD</span><h3>El contexto importa</h3><p>Partimos de tus recursos y tus objetivos para proponer un alcance realista y útil.</p></article><article class="card"><span>02 / COLABORACIÓN</span><h3>Aprender en el proceso</h3><p>Explicamos las decisiones y acompañamos las dudas desde el diseño hasta los resultados.</p></article><article class="card"><span>03 / REPRODUCIBILIDAD</span><h3>Resultados que puedes seguir</h3><p>Priorizamos herramientas abiertas, flujos documentados y análisis que puedan reproducirse.</p></article></div></div></section>
<section class="section"><div class="container"><div class="section-heading"><div><span class="eyebrow">Conoce a tus instructores</span><h2>Personas detrás<br>del conocimiento.</h2></div><p>Consulta la experiencia y los perfiles de quienes imparten nuestras ediciones más recientes.</p></div><div class="grid-2"><article class="card instructor"><img src="media/optimized/equipodetrabajo/ceo.webp" width="160" height="250" loading="lazy" alt="José A. Ovando-Ricardez"><div class="instructor-info"><h3>José A. Ovando-Ricardez</h3><p>Bioinformático, instructor y consultor especializado en análisis metagenómicos y datos ómicos.</p><a class="text-link" href="https://sites.google.com/view/joseantonioovandoricardez" target="_blank" rel="noopener noreferrer">Ver perfil profesional ↗</a></div></article><article class="card instructor"><img src="media/optimized/equipodetrabajo/Josué Guzmán Linares.webp" width="160" height="250" loading="lazy" alt="Josué Guzmán Linares"><div class="instructor-info"><h3>Josué Guzmán Linares</h3><p>Ingeniero en Biotecnología y bioinformático con experiencia en análisis de RNA-seq, ChIP-seq y ATAC-seq.</p><a class="text-link" href="https://drive.google.com/file/d/1ssk3K8dxYXWjtlS_KNMSCFnbsWYiWhID/view" target="_blank" rel="noopener noreferrer">Ver perfil profesional ↗</a></div></article></div></div></section>
<section class="section-sm"><div class="container"><div class="simple-cta"><div><span class="eyebrow">Construyamos el siguiente paso</span><h2>Cuéntanos qué te gustaría resolver.</h2><p>Encontraremos contigo la forma de empezar.</p></div><a class="button" href="contacto.html">Hablemos ↗</a></div></div></section>'''
    (ROOT/'acercade.html').write_text(document('Acerca de nosotros · GenomicsTrack', 'Conoce el enfoque, los principios y los instructores de GenomicsTrack Solutions: bioinformática accesible para Latinoamérica.', body), encoding='utf-8')

def marker(text, name, content):
    start, end = f'<!-- SITE:{name} -->', f'<!-- /SITE:{name} -->'
    block = start+'\n'+content+'\n'+end
    if end in text:
        return re.sub(re.escape(start)+'.*?'+re.escape(end), lambda _:block, text, flags=re.S)
    return text.replace(start, block)

def sync_shell():
    pages = list(ROOT.glob('*.html')) + list((ROOT/'cursos').glob('*.html'))
    for path in pages:
        text = path.read_text(encoding='utf-8')
        if '<!-- SITE:HEAD -->' not in text: continue
        prefix = '../' if path.parent.name == 'cursos' else ''
        current = 'cursos.html' if prefix else path.name
        links = []
        for href,label in [('cursos.html','Cursos'),('servicios.html','Servicios'),('acercade.html','Nosotros'),('posts.html','Noticias')]:
            active = ' aria-current="page"' if current == href else ''
            links.append(f'<a href="{prefix}{href}"{active}>{label}</a>')
        active = ' aria-current="page"' if current=='contacto.html' else ''
        brand = f'<a class="brand" href="{prefix}index.html" aria-label="GenomicsTrack Solutions · Inicio"><img src="{prefix}media/optimized/logos/load3.webp" width="43" height="43" alt=""><span><strong>GenomicsTrack</strong><small>Solutions</small></span></a>'
        header = f'''<a class="skip-link" href="#main-content">Saltar al contenido</a><header class="site-header"><div class="container header-inner">{brand}<button class="menu-button" id="menu-toggle" type="button" aria-label="Abrir menú de navegación" aria-expanded="false" aria-controls="site-navigation">Menú <span class="menu-glyph" aria-hidden="true"><span></span><span></span></span></button><nav class="site-nav" id="site-navigation" aria-label="Navegación principal">{''.join(links)}<a class="button" href="{prefix}contacto.html"{active}>Hablemos <span aria-hidden="true">↗</span></a></nav></div></header><div id="menu-backdrop" class="menu-backdrop" hidden></div>'''
        footer = f'''<footer class="site-footer"><div class="container"><div class="footer-top"><div class="footer-intro">{brand.replace('load3.webp','load2.webp')}<p>Bioinformática para avanzar tu investigación.<br>Desde Latinoamérica, en colaboración contigo.</p></div><div class="footer-links"><h2>Explora</h2><a href="{prefix}cursos.html">Cursos y formación</a><a href="{prefix}servicios.html">Servicios bioinformáticos</a><a href="{prefix}acercade.html">Acerca de nosotros</a><a href="{prefix}posts.html">Noticias</a></div><div class="footer-links"><h2>Conversemos</h2><a href="{prefix}contacto.html">Solicitar información</a><a href="{prefix}pagos.html">Inscripciones y pagos</a><a href="mailto:hola@genomicstracksolutions.com">hola@genomicstracksolutions.com</a><a href="https://wa.me/5215643236165" target="_blank" rel="noopener noreferrer">WhatsApp ↗</a></div></div><div class="footer-bottom"><p>© {date.today().year} GenomicsTrack Solutions.</p><div class="footer-social"><a href="https://www.facebook.com/profile.php?id=61574893912022" target="_blank" rel="noopener noreferrer">Facebook ↗</a><a href="https://www.instagram.com/genomicstracksolutions/" target="_blank" rel="noopener noreferrer">Instagram ↗</a><a href="https://www.linkedin.com/company/genomicstrack-solutions/" target="_blank" rel="noopener noreferrer">LinkedIn ↗</a></div></div></div></footer>'''
        title = re.search(r'<title>(.*?)</title>',text,re.S)
        desc = re.search(r'<meta\s+name=[\"\']description[\"\']\s+content=[\"\']([^\"\']*)', text)
        head = f'<link rel="stylesheet" href="{prefix}site.css"><link rel="icon" href="{prefix}gts.ico"><meta name="theme-color" content="#164e3e"><script src="{prefix}site.js" defer></script>'
        head += '<meta property="og:type" content="website"><meta property="og:locale" content="es_MX"><meta name="twitter:card" content="summary_large_image">'
        head += f'<meta property="og:site_name" content="GenomicsTrack Solutions"><meta property="og:title" content="{escape(title.group(1) if title else CONFIG["name"],quote=True)}"><meta property="og:description" content="{desc.group(1) if desc else escape(CONFIG["description"],quote=True)}">'
        base = CONFIG.get('url','').rstrip('/')
        if base.startswith('https://'):
            canonical = base+'/'+path.relative_to(ROOT).as_posix()
            head += f'<link rel="canonical" href="{escape(canonical,quote=True)}"><meta property="og:url" content="{escape(canonical,quote=True)}"><meta property="og:image" content="{base}/media/optimized/logos/fondo%20frase.webp">'
        if not re.search(r'<html[^>]*class=', text): text=text.replace('<html lang="es">','<html lang="es" class="no-js">')
        text=marker(marker(marker(text,'HEAD',head),'HEADER',header),'FOOTER',footer)
        # All page content has a consistent destination for the skip link.
        if 'id="main-content"' not in text:
            text=re.sub(r'<main(?:\s[^>]*)?>',lambda m:m.group(0)[:-1]+' id="main-content">',text,count=1)
        # Fingerprints prevent an older deployment's scripts/styles surviving an update.
        def version_asset(match):
            attribute, url = match.group(1), match.group(2).split('?')[0]
            asset = path.parent / url
            if not asset.is_file(): return match.group(0)
            version = hashlib.sha256(asset.read_bytes()).hexdigest()[:12]
            return f'{attribute}="{url}?v={version}"'
        text = re.sub(r'(src|href)="([^"?#]+\.(?:js|css)(?:\?[^"#]*)?)"', version_asset, text)
        path.write_text(text,encoding='utf-8')
    if CONFIG.get('url','').startswith('https://'):
        base=CONFIG['url'].rstrip('/')
        urls=''.join(f'<url><loc>{escape(base+"/"+p.relative_to(ROOT).as_posix())}</loc></url>' for p in pages if p.name != 'admin.html')
        (ROOT/'sitemap.xml').write_text('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+urls+'</urlset>',encoding='utf-8')
        (ROOT/'robots.txt').write_text('User-agent: *\nAllow: /\nSitemap: '+base+'/sitemap.xml\n',encoding='utf-8')

def main():
    import build_courses
    build_courses.main()
    services=json.loads((ROOT/'data/servicios.json').read_text(encoding='utf-8'))
    build_home(services)
    build_services(services)
    build_about()
    sync_shell()
    print('Site generated; shared navigation and metadata synchronized.')

if __name__=='__main__':
    main()
