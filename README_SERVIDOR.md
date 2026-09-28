# Servidor de GenomicsTrack

El sitio conserva sus plantillas HTML, CSS y JavaScript. El servidor Node entrega el catálogo con los cursos publicados desde el panel de administración y consulta las noticias mediante `GET /api/noticias`, sin entregar la credencial al navegador. No hay dependencias que instalar.

Para crear cursos y preparar el almacenamiento persistente en Render, consulta [README_ADMINISTRACION.md](README_ADMINISTRACION.md). El panel se abre en `/admin.html`; primero configura su contraseña con `npm run admin:setup`.

## Ejecutar localmente

Requiere Node.js 20 o superior (probado con 20.19.6).

```powershell
node server.cjs
```

Abre `http://127.0.0.1:8765`. El servidor escucha únicamente en la interfaz local por defecto. El archivo `.env.local` existente conserva la credencial autorizada; no se revocó ni se modificaron sus permisos. No muestres, adjuntes ni subas ese archivo.

En otra instalación, copia `.env.example` a `.env.local` y completa `META_ACCESS_TOKEN`. Puedes establecer las mismas variables en el entorno del proceso; tienen prioridad sobre el archivo.

| Variable | Uso |
| --- | --- |
| `META_ACCESS_TOKEN` | Credencial de Meta con acceso a las publicaciones de la página. Solo servidor. |
| `META_PAGE_ID` | ID de la página, actualmente `645692701952356`. |
| `META_API_VERSION` | Versión de Graph API configurable; valor inicial `v23.0`. Ajustar al ciclo de versiones de la aplicación Meta. |
| `HOST` | `127.0.0.1` por defecto; usar la interfaz que requiera el proveedor de alojamiento. |
| `PORT` | `8765` por defecto; establecer el puerto asignado por el proveedor. |

## Noticias

- El token se envía en una cabecera de autorización entre el servidor y Meta; nunca en JavaScript ni en la URL pública.
- El servidor solicita hasta 15 publicaciones y conserva en memoria una copia durante 15 minutos. Las solicitudes simultáneas comparten una consulta. Un reinicio vacía esta caché.
- Si Meta tarda más de 8 segundos o devuelve un error, se conserva la última respuesta válida y el visitante ve un aviso de que son publicaciones guardadas. Sin datos previos, la página ofrece reintentar y consultar Facebook.
- La respuesta pública contiene solo los campos necesarios. Los textos se dibujan con `textContent`; los enlaces e imágenes aceptan únicamente HTTPS y dominios de Facebook/Meta conocidos.
- No se envían errores de Meta, tokens ni datos internos al visitante, ni se registran en consola.
- No se ha añadido envío de correo, reserva automática ni confirmación de pagos. Los canales de contacto del sitio explican cuándo se abre otra aplicación y cuándo hace falta confirmación del equipo.

## Publicación

Para conservar el feed automático, ejecuta `node server.cjs` en un alojamiento que soporte procesos Node, configura sus variables privadas y dirige el dominio por HTTPS al puerto del proceso. Deja que el proveedor gestione reinicios y TLS. No uses un servidor estático genérico sobre la raíz del repositorio: aquí también viven `.env.local` y archivos de trabajo.

El servidor incluido publica únicamente la lista de archivos de interfaz definida en `PUBLIC_FILES`, las fichas HTML bajo `cursos/` y archivos de medios permitidos bajo `media/`. Devuelve 404 para `.env*`, `.git`, `CVS`, `scripts`, pruebas, documentación, fuentes del servidor y rutas que intenten salir del directorio. Al añadir un nuevo archivo público fuera de esos directorios, actualiza `PUBLIC_FILES`.

Si el alojamiento solo admite HTML estático, publica exclusivamente los archivos públicos y los medios, sin archivos ocultos, `CVS`, scripts de mantenimiento ni fuentes del servidor. El resto del sitio funciona y Noticias muestra un enlace honesto a Facebook; para cargar automáticamente las publicaciones hace falta conectar el endpoint del mismo origen. No copies el token de vuelta a `noticias.js`.

La credencial estuvo incluida en versiones anteriores del JavaScript y puede permanecer en el historial Git, copias CVS o despliegues anteriores. `.gitignore` evita nuevas incorporaciones del archivo privado, pero no borra ese historial. Se conservó la credencial vigente por indicación del propietario. Después de desplegar y verificar el servicio, el propietario puede valorar su rotación desde Meta y actualizar la variable privada; no se ejecutó ninguna revocación.

## Verificación

```powershell
node --test tests/server.test.cjs
```

Las pruebas usan una credencial ficticia y respuestas simuladas; no consultan Meta. Comprueban publicación de archivos permitidos, bloqueo de secretos y rutas, errores públicos genéricos, timeout, caché, respuestas concurrentes y limpieza de URLs. La comprobación de un feed real debe hacerse aparte, con la configuración privada, sin imprimir la credencial ni los errores crudos del proveedor.
