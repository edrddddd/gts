# GenomicsTrack Solutions

Sitio renovado en septiembre de 2026: 7 páginas principales y 33 fichas de cursos. HTML, CSS y JavaScript sin dependencias de frontend; Node mantiene privada la integración de noticias de Meta.

## Vista local

```powershell
node server.cjs
```

Abre http://127.0.0.1:8765. El servidor sirve únicamente archivos públicos. La configuración privada existente está en `.env.local`, ignorada por Git. Las variables y las opciones de alojamiento están en [README_SERVIDOR.md](README_SERVIDOR.md).

## Actualizar contenido

- **Cursos:** `data/cursos.json` es la fuente de datos. Cada edición tiene id propio, fechas ISO, horario de Ciudad de México, temario, instructor y condiciones. `fuente` identifica la convocatoria revisada cuando existe. Los estados se calculan por fecha; terminar una edición desactiva su consulta de inscripción y ofrece consultar la siguiente.
- **Servicios:** editar `data/servicios.json`.
- **Portada, Nosotros y elementos compartidos:** editar `scripts/build_site.py`. Este archivo genera esas páginas y sincroniza cabecera, pie y metadatos en todas las demás.
- **Contacto, Pagos y Noticias:** editar sus HTML/JS/CSS; conservar los bloques `SITE:*`, que administra el generador.
- **Dominio y descripción:** `site.config.json`. El dominio verificado es `https://www.genomicstracksolutions.com`; se usa en enlaces canónicos, metadatos sociales, sitemap y robots.

Después de editar:

```powershell
python scripts/build_site.py
python scripts/check_site.py
npm test
```

El generador y el verificador requieren Python 3.10+ y solo su biblioteca estándar. Los HTML generados están incluidos: Python no hace falta para servir el sitio. El generador añade versiones a CSS/JS según su contenido para evitar que un visitante conserve scripts de una publicación anterior. Recarga la vista local después de reconstruir.

El catálogo también puede reconstruirse con `python scripts/build_courses.py`; sincroniza automáticamente la navegación compartida. Para una instantánea reproducible admite `--date YYYY-MM-DD`; el navegador sigue mostrando los estados según la fecha real.

Las imágenes optimizadas ya están incluidas. Al añadir imágenes originales, `python scripts/optimize_images.py` crea sus copias WebP y actualiza `data/image-manifest.json`; ese comando opcional requiere Pillow. Conserva los originales.

`scripts/update_catalog_20260925.py` documenta la actualización puntual basada en las convocatorias revisadas. No se ejecuta en cada compilación y no debe usarse para sobrescribir posteriores cambios comerciales.

## Recorridos implementados

- Catálogo con búsqueda sin acentos, filtro por área y estado, enlaces compartibles y página propia para cada edición.
- Formulario con cuatro campos obligatorios, validación, solicitud opcional de horario y revisión del mensaje. El visitante elige abrir WhatsApp, abrir su correo o copiar el texto. No se guardan consultas ni se promete un envío automático.
- Guía de inscripción que conserva curso/perfil y pide confirmar disponibilidad, importe e instrucciones. No ejecuta cobros ni confirma pagos.
- Noticias reales mediante `/api/noticias`, con caché, reintento y respuesta de respaldo ante fallos de Meta. La credencial autorizada sigue vigente y reside solo en el servidor.
- Navegación móvil accesible por teclado, foco visible, enlace para saltar al contenido y respeto a movimiento reducido.

## Verificación de la entrega

- 25 pruebas automáticas aprobadas: fechas y estados, datos, contacto, contexto de inscripción y servidor de noticias.
- 40 páginas verificadas: enlaces locales, recursos, identificadores, encabezados, metadescripciones y navegación.
- Pruebas manuales en navegador: búsqueda/filtros, ficha → contacto, pagos → perfil → contacto, errores del formulario, preparación y edición del mensaje, horario CDMX, menú móvil con Tab/Escape y noticias reales.
- 40 imágenes optimizadas: 13,303,904 → 2,889,056 bytes en disco, aproximadamente 78 % menos. No equivale a una medición de Core Web Vitals.
- Meta respondió con 15 publicaciones reales. No se enviaron mensajes, correos ni pagos durante la comprobación.

## Datos comerciales y publicación

Los precios vigentes de Bioestadística y de las nuevas convocatorias no aparecen en los anuncios detallados; se mantienen como consulta al equipo. Las promociones de apertura de 36 horas publicadas el 21 de septiembre no se usan como precios actuales. La agenda solicita un horario; una reserva automática requiere conectar un calendario real. Cobros y envío de correo automáticos requieren el proveedor y su configuración.

El trabajo está preparado y comprobado localmente. Publicar las noticias automáticas requiere el servidor Node o un endpoint equivalente en el alojamiento definitivo; consultar [las instrucciones de publicación](README_SERVIDOR.md#publicación). No publicar la raíz completa como archivos estáticos. No se ha desplegado ni modificado el sitio en producción.

El [diagnóstico inicial](AUDITORIA_SITIO_2026-09-24.md) conserva los hallazgos anteriores al rediseño; no representa el estado actual.
