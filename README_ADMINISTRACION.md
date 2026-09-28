# Administración de cursos

El panel se abre en `/admin.html` (también `/admin`). Permite crear y editar cursos, guardar borradores y publicarlos. Los cambios publicados aparecen inmediatamente en el catálogo, la ficha del curso, los selectores de contacto/pagos y, según sus fechas, la portada. No necesitas ejecutar Python para publicar desde el panel.

## Primera configuración local

1. Abre una terminal en la carpeta del proyecto y ejecuta `npm run admin:setup`.
2. Elige una contraseña de al menos 12 caracteres. La terminal no la muestra y sólo guarda su hash en `.env.admin`, excluido de Git.
3. Inicia o reinicia el servidor con `npm start`.
4. Abre `http://127.0.0.1:8765/admin.html` e inicia sesión con esa contraseña.

El panel permanece cerrado a escrituras mientras no se configure una contraseña. No existe una contraseña predeterminada. La sesión caduca y se puede cerrar con el botón del panel.

## Crear o actualizar un curso

1. Pulsa **Nuevo curso**, o selecciona una edición existente para editarla.
2. Completa título, descripción, categoría, fechas de inicio y fin, texto de las sesiones, horario, duración, nivel y modalidad.
3. Escribe el precio general. Un precio vacío se muestra como `-`; no se calcula ningún cobro automáticamente.
4. Añade un tema por línea en **Qué aprenderás** y un recurso por línea en **Qué incluye**.
5. Añade los instructores con nombre, descripción y enlace opcional a su trayectoria.
6. Completa **Precios por etapa**: cada columna es una etapa y cada fila es un perfil. Puedes añadir o quitar etapas y perfiles; los importes vacíos se muestran como `-`.
7. Sube el cartel en PNG, JPEG o WebP, hasta 5 MB. Revisa su vista previa antes de guardar.
8. Usa **Guardar borrador** para continuar después. Usa **Publicar curso** cuando esté listo; luego abre **Ver ficha** para comprobarlo.

Los borradores y sus imágenes no aparecen en el sitio público. En una edición publicada, el botón **Guardar cambios publicados** actualiza su ficha. Las fechas determinan automáticamente si una edición es próxima, está en curso o terminó. Una edición pasada aparece en el filtro Histórico.

Si otra pestaña guardó cambios antes que tú, el panel te avisará del conflicto y conservará lo escrito: revisa la otra pestaña antes de recargar. No sobrescribe cambios ajenos silenciosamente.

## Preparar Render

Para el procedimiento completo con GitHub, migración de cursos locales, Cloudflare y solución de problemas, sigue [README_DESPLIEGUE.md](README_DESPLIEGUE.md).

Este panel necesita un **Web Service Node con disco persistente**. El archivo `render.yaml` prepara un servicio de una instancia y un disco de 1 GB. Su creación tiene costo: Render sólo admite discos persistentes en servicios de pago. No se ha creado ni contratado ningún servicio desde este proyecto.

1. Ejecuta `npm run admin:setup` localmente y conserva tu contraseña. Abre `.env.admin` en tu editor y copia únicamente el valor de `ADMIN_PASSWORD_HASH` al campo privado del mismo nombre en Render. No subas `.env.admin` al repositorio.
2. Sube el código al repositorio que conectarás a Render. Incluye los HTML, datos, scripts y nuevos carteles públicos; excluye `.env*` privados y `.admin-data/`.
3. En Render, crea un Blueprint desde ese repositorio usando `render.yaml`, o un Web Service con estos ajustes:

   | Ajuste | Valor |
   | --- | --- |
   | Runtime | Node |
   | Build Command | `npm test` |
   | Start Command | `npm start` |
   | Instancias | `1` |
   | Disco persistente | Montado en `/var/data`, 1 GB inicial |
   | `HOST` | `0.0.0.0` |
   | `ADMIN_DATA_DIR` | `/var/data/genomicstrack` |
   | `ADMIN_PASSWORD_HASH` | El hash generado localmente |
   | `ADMIN_ORIGIN` | La dirección HTTPS exacta desde la que abrirás el panel, sin ruta ni barra final |
   | `META_ACCESS_TOKEN` | La credencial autorizada de Meta, como variable privada |
   | `META_PAGE_ID` | `645692701952356` |
   | `META_API_VERSION` | `v23.0`, o la versión configurada para tu aplicación Meta |

4. Deja que Render asigne `PORT`. Al principio puedes usar `https://nombre-asignado.onrender.com` como `ADMIN_ORIGIN`; cuando conectes tu dominio, cámbialo a su dirección final exacta, por ejemplo `https://www.genomicstracksolutions.com`.
5. Despliega y comprueba `/admin.html`, el catálogo y `/api/noticias`. Configura el dominio en **Custom Domains** de Render y crea en Cloudflare los registros DNS que Render indique. Abre el panel siempre desde el dominio de `ADMIN_ORIGIN`.
6. Para la comprobación inicial, guarda un curso de prueba como borrador, reinicia el servicio y confirma que el borrador y la imagen siguen presentes. Publícalo sólo cuando quieras mostrarlo al público.

Sin ese disco, Render elimina los cambios locales al reiniciar o desplegar. El disco debe mantenerse al actualizar el servicio. Esta implementación utiliza una sola instancia Node; no ejecutes varios procesos escribiendo sobre el mismo archivo de cursos.

Fuentes: [discos persistentes de Render](https://render.com/docs/disks) y [especificación de Blueprints](https://render.com/docs/blueprint-spec).

## Datos y respaldo

Los cursos originales permanecen en `data/cursos.json`. Las altas, borradores, cambios y banners del panel se guardan en `ADMIN_DATA_DIR`, que localmente es `.admin-data/`. El servidor combina ambos al entregar el sitio. Un despliegue de código no reemplaza los datos del disco; una edición guardada en el panel prevalece sobre el mismo ID del catálogo original.

Respalda el directorio persistente completo, incluidos sus banners, además del repositorio. En Render puedes usar los snapshots del disco. No copies archivos de producción con el servidor escribiendo ni restaures sólo el JSON sin sus imágenes. El panel no guarda información de pagos ni de alumnos.

Los HTML del repositorio son la versión estática del catálogo original. Para ver cursos guardados desde el panel debes ejecutar el servidor Node; un alojamiento exclusivamente estático no ejecuta el panel ni incorpora sus cambios.

## Verificar

`npm test` ejecuta las pruebas del catálogo, contacto, noticias, acceso al panel, almacenamiento y publicación de cursos. Los datos de prueba y contraseñas ficticias se aíslan del catálogo real.
