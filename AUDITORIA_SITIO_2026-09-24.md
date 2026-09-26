# Revisión de GenomicsTrack Solutions · 24 de septiembre de 2026

> Diagnóstico histórico anterior al rediseño. La implementación y las verificaciones posteriores están documentadas en [README.md](README.md).

La actualización debería centrarse en ayudar al visitante a elegir un curso o solicitar un servicio, con una presentación científica más sobria, información consistente y recorridos completos hasta el contacto o la inscripción. La identidad verde y azul puede conservarse.

Se revisaron los archivos de las seis páginas y sus scripts/estilos. Se abrió la versión local en navegador, con revisión visual de Inicio, Cursos y Contacto, y pruebas del menú móvil, filtros y fichas de cursos. La revisión móvil utilizó un viewport de 390 × 844. No se realizaron pagos ni se enviaron formularios o mensajes. No se modificó el sitio: este documento contiene el diagnóstico y la propuesta. No se verificó una versión publicada ni se midieron conversiones o Core Web Vitals.

**Lo que conviene conservar**

- Identidad reconocible en verde y azul, símbolo de marca y enfoque en bioinformática para Latinoamérica.
- Oferta específica de cursos, consultoría, capacitación y proyectos; hay contenido suficiente para explicar cada servicio.
- Histórico de cursos, perfiles de instructores y contacto directo por WhatsApp.
- El filtro de cursos y la apertura/cierre de fichas funcionan en las pruebas realizadas.

**Correcciones funcionales prioritarias**

| Prioridad | Hallazgo | Cambio propuesto |
|---|---|---|
| Alta | Hay una credencial de Meta incrustada en JavaScript público. Se confirmó su presencia, sin probar vigencia ni permisos. | Retirar la credencial del cliente y revocarla o rotarla si sigue activa. Obtener noticias desde un servicio que mantenga la credencial fuera del navegador y conserve una copia de las publicaciones. Evidencia: [noticias.js:6](C:/Users/lalor/Desktop/v02.05.2026/noticias.js:6). |
| Alta | Las fichas de cursos finalizados también muestran «Pagar via Paypal». Se confirmó en código y al abrir una ficha finalizada en navegador; no se inició un pago. | Mostrar «Avisarme de la próxima edición». Ofrecer compra de grabaciones solo cuando exista esa oferta y esté explicada. Evidencia: [cursos2026.js:1013](C:/Users/lalor/Desktop/v02.05.2026/cursos2026.js:1013). |
| Alta | Bioestadística en R muestra una descripción de metagenómica, temario vacío y precios «--». El curso de metagenómica terminado el 17 de septiembre sigue activo el día 24. | Corregir la información antes de promover inscripciones. Separar inscripción abierta, en curso, finalizado y grabaciones. Unificar datos de portada y catálogo. Evidencia: [cursos2026.js:20](C:/Users/lalor/Desktop/v02.05.2026/cursos2026.js:20), [cursos2026.js:89](C:/Users/lalor/Desktop/v02.05.2026/cursos2026.js:89). |
| Alta | El formulario acepta un correo inválido. La función de validación se declara dos veces y la segunda sustituye parte de la primera. Los botones no activan por sí mismos la validación HTML. | Unificar reglas y utilizar la validación del formulario antes de continuar. La comprobación aislada con DOM simulado devolvió `true` con correo inválido y varios campos obligatorios vacíos. Evidencia: [contacto.js:1](C:/Users/lalor/Desktop/v02.05.2026/contacto.js:1), [contacto.html:138](C:/Users/lalor/Desktop/v02.05.2026/contacto.html:138). |
| Media | La agenda invita a comprobar disponibilidad y reservar, pero solo recoge una fecha/hora y prepara WhatsApp. | A corto plazo, llamarla «Solicitar horario» y explicar la confirmación posterior. Para reservas automáticas, conectar disponibilidad real, zona horaria y confirmación. Evidencia: [overview.js:71](C:/Users/lalor/Desktop/v02.05.2026/overview.js:71). |
| Media | Contacto presenta 11 campos, 10 marcados como obligatorios en HTML. «Enviar por Correo» abre el cliente de correo del visitante. | Pedir inicialmente nombre, correo, servicio y mensaje; ampliar preguntas según servicio. Mostrar con precisión si se abre correo/WhatsApp o si la solicitud fue recibida mediante un sistema de envío. Evidencia: [contacto.html:60](C:/Users/lalor/Desktop/v02.05.2026/contacto.html:60). |
| Media | El pago utiliza un destino genérico, no conserva claramente el curso y está separado de una guía de pagos sin enlaces internos hacia ella. | Un recorrido «curso → modalidad/perfil → importe → instrucciones → confirmación», con nombre y referencia del curso en cada paso. Revisar con el negocio la consistencia de los datos del beneficiario. Evidencia: [cursos2026.js:1001](C:/Users/lalor/Desktop/v02.05.2026/cursos2026.js:1001), [pagos.html:63](C:/Users/lalor/Desktop/v02.05.2026/pagos.html:63). |

**Cambios visuales con mayor impacto**

| Elemento | Observación | Propuesta |
|---|---|---|
| Portada | El fondo de ADN ocupa 530 px en escritorio. Hay una frase amplia, sin botón principal en ese bloque. | Encabezado con una promesa específica, explicación breve y botones «Explorar cursos» y «Solicitar consultoría». Imagen científica más contenida y espacio suficiente para leer. |
| Navegación | El símbolo aparece sin el nombre de la empresa. Servicios no tiene acceso directo en el menú. En móvil, el ancho de cabecera supera el viewport y algunos controles quedan al borde. | Mostrar marca y nombre, añadir acceso a Servicios y ordenar por intención del visitante. Corregir ancho, padding y tamaño de controles antes de aplicar nuevos estilos. |
| Servicios | A la anchura de escritorio revisada, se distribuyen cuatro tarjetas y una aislada debajo. El texto pequeño y justificado genera espacios irregulares. En móvil se observaron recortes laterales. | Una cuadrícula consistente, texto alineado a la izquierda y descripciones breves. Iconos más pequeños; botones con acción específica. Resolver el conflicto entre las reglas móviles de estilos.css y las de services.css. |
| Cursos | Los carteles contienen mucho texto que se vuelve diminuto en tarjeta y se recorta en la cabecera del modal. El título «CURSOS» también queda muy pequeño en móvil. | Imagen como apoyo; título, nivel, fecha, duración, modalidad y precio como texto HTML. Encabezados con tamaño mínimo legible. Página propia por curso para compartir el enlace y leer sin un modal largo. |
| Jerarquía | Se alternan fondos muy ilustrados, blanco, gris y modales oscuros, con tamaños y estilos de botones distintos. | Una escala común de tipografía, separación, bordes, tarjetas y botones. Usar el naranja para destacar acciones puntuales y estados relevantes. |
| Confianza | Predominan textos de misión y promesas generales. El equipo y testimonios de portada están comentados en el HTML. | Publicar perfiles vigentes de instructores, experiencia y casos verificables; incorporar testimonios autorizados. Dar más espacio a resultados y entregables que a la explicación de la marca gráfica. |

Evidencia visual/técnica: [estilos.css:87](C:/Users/lalor/Desktop/v02.05.2026/estilos.css:87), [estilos.css:231](C:/Users/lalor/Desktop/v02.05.2026/estilos.css:231), [estilos.css:438](C:/Users/lalor/Desktop/v02.05.2026/estilos.css:438), [services.css:15](C:/Users/lalor/Desktop/v02.05.2026/services.css:15), [cursos2026.css:183](C:/Users/lalor/Desktop/v02.05.2026/cursos2026.css:183).

**Dirección visual propuesta**

Una presentación científica, limpia y cercana: fondo blanco cálido o gris muy claro, texto azul oscuro, verde institucional para acciones principales y naranja como acento. Mantener una familia tipográfica coherente; tomar 16–18 px como punto de partida para cuerpo, con interlineado cómodo y títulos adaptables al dispositivo. Reducir giros de iconos, resplandores, sombras fuertes y animaciones constantes. Priorizar fotografías propias, ejemplos de análisis y gráficos pertinentes cuando estén disponibles.

Propuesta de texto inicial: «Bioinformática para avanzar tu investigación». Apoyo: «Cursos prácticos, consultoría y análisis de datos genómicos para estudiantes, investigadores y laboratorios». Es una propuesta editorial, pendiente de validación comercial.

Orden sugerido de Inicio:

1. Promesa y acciones principales.
2. Cursos con inscripciones abiertas; si no los hay, explicar las próximas opciones o lista de interés.
3. Servicios y entregables.
4. Cómo trabajamos: diagnóstico, propuesta y ejecución.
5. Instructores, casos y testimonios verificables.
6. Preguntas frecuentes y contacto breve.

**Rendimiento, accesibilidad y mantenimiento**

- El catálogo renderiza 31 cursos y sus modales al inicio. Las 31 imágenes únicas referenciadas suman **10,910,861 bytes, aproximadamente 10.4 MiB**. Inicio referencia aproximadamente **3.93 MiB** de imágenes. Son tamaños de archivos locales, no tiempos de carga ni transferencia medida. Optimizar formatos y dimensiones, cargar imágenes fuera de pantalla bajo demanda y crear el contenido del modal cuando haga falta. Mantener la imagen principal fuera de la carga diferida, como recomienda [web.dev](https://web.dev/articles/browser-level-image-lazy-loading).
- El loader tapa toda la página hasta `window.load` y añade una transición de 1.5 segundos. Mostrar el contenido de inmediato y reservar indicadores para operaciones que sí lo necesiten. Evidencia: [menu.js:81](C:/Users/lalor/Desktop/v02.05.2026/menu.js:81), [estilos.css:319](C:/Users/lalor/Desktop/v02.05.2026/estilos.css:319).
- Se observaron errores de consola: el menú intenta enlazar un elemento inexistente y testimonios intenta escribir en un contador ausente. Los listeners del menú registrados antes del error siguen funcionando. Eliminar inicializaciones obsoletas o proteger componentes opcionales. Evidencia: [menu.js:101](C:/Users/lalor/Desktop/v02.05.2026/menu.js:101), [testimonios.js:8](C:/Users/lalor/Desktop/v02.05.2026/testimonios.js:8).
- Hay referencias a archivos inexistentes: dos scripts en Cursos y un CSS/script en Noticias. Evidencia: [cursos.html:12](C:/Users/lalor/Desktop/v02.05.2026/cursos.html:12), [posts.html:8](C:/Users/lalor/Desktop/v02.05.2026/posts.html:8), [posts.html:98](C:/Users/lalor/Desktop/v02.05.2026/posts.html:98).
- Las seis páginas comparten título y carecen de h1 y metadescripción. Añadir títulos y encabezados específicos, metadatos para compartir y URLs propias de los cursos. La ausencia de estas etiquetas no demuestra por sí misma que el sitio no esté indexado.
- Menú y cierres de modal necesitan nombres accesibles y estados explícitos. Los diálogos deben gestionar entrada, permanencia y devolución del foco. Escape ya funciona en las fichas probadas. Usar el [patrón de diálogo de W3C](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/) como referencia. No se realizó una auditoría completa con lector de pantalla.
- Centralizar catálogo y estilos compartidos; los mismos servicios, cabecera y pie se repiten entre páginas. La modernización puede hacerse sobre la base estática existente, sin imponer una migración de framework.

**Orden recomendado de implementación**

1. **Corregir confianza y funcionamiento:** credencial expuesta, fichas incompletas, estados, pago de finalizados, validación y errores de ejecución.
2. **Rediseñar Inicio y Cursos:** sistema visual común, adaptación móvil, nuevas fichas y contacto simplificado. Extender después a las otras páginas.
3. **Completar operaciones y medición:** disponibilidad real si se necesita, confirmación de solicitudes/pagos, páginas compartibles y medición del recorrido hasta inscripción o consulta.

Tras cada etapa, comprobar tareas reales: encontrar un curso disponible, conocer precio y requisitos, solicitar información conservando contexto y recorrer el sitio en móvil y con teclado. Medir tiempos y resultados antes de atribuir mejoras de conversión al rediseño.
