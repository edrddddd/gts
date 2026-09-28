# Despliegue de GenomicsTrack en Render y Cloudflare

Guía preparada para este proyecto el 27 de septiembre de 2026. Render ejecutará el sitio Node, el panel y la API de noticias. Cloudflare seguirá gestionando el dominio y sus DNS. El dominio principal será `https://www.genomicstracksolutions.com`, como indica `site.config.json`.

Los comandos de PowerShell se copian sin `PS ...>` ni `>>`. Ejecuta cada bloque en orden y continúa sólo si termina correctamente. Esta guía no crea ni contrata servicios por sí misma.

## 1. Preparar los archivos y subir el código

El remoto ya está configurado como `https://github.com/edrddddd/gts.git` y la rama actual es `main`. Los cambios del panel aún deben guardarse en Git y subirse. En una terminal nueva:

```powershell
Set-Location 'C:\Users\lalor\Desktop\v02.05.2026'
npm test
```

La revisión actual pasó 51 pruebas. Si alguna falla, resuélvela antes de continuar. Después:

```powershell
git add .
git diff --cached --name-only
```

Revisa la lista. Debe incluir `render.yaml`, `admin-server.cjs`, `course-renderer.cjs`, los archivos `admin.*`, las pruebas, los datos y las imágenes nuevas. `.env.local`, `.env.admin` y `.admin-data/` están excluidos por `.gitignore` y no deben aparecer en esa lista. No uses `git add -f` para incorporarlos.

```powershell
git commit -m "Agrega administracion de cursos y despliegue en Render"
git push origin main
```

Comprueba en [GitHub](https://github.com/edrddddd/gts) que `render.yaml` está en la raíz de `main`. Si el push es rechazado por cambios remotos, sincroniza y resuelve los conflictos; no uses un push forzado. La subida del código no transporta los cursos creados desde el panel local: eso se hace en el paso 6.

## 2. Preparar los dos valores privados

Ya configuraste tu contraseña; no necesitas ejecutar otra vez `npm run admin:setup`.

Abre `.env.admin` en tu editor. De la línea `ADMIN_PASSWORD_HASH=...`, copia únicamente lo que aparece después del primer `=`. Conserva toda la cadena, incluidos los signos `$`. Es el hash; no es tu contraseña escrita normalmente.

Abre `.env.local` y localiza `META_ACCESS_TOKEN`. Copia su valor vigente para Render. Comprueba también el ID de página y la versión que estés usando. No subas estos archivos a GitHub ni pongas sus valores en `noticias.js`. Render permite guardar estas variables en su panel **Environment**. [Variables privadas en Render](https://render.com/docs/configure-environment-variables).

## 3. Crear el servicio con el archivo preparado

En [Render](https://dashboard.render.com/), conecta tu cuenta de GitHub y concede acceso al repositorio `edrddddd/gts`. Elige **New → Blueprint**, conecta el repositorio, selecciona `main` y utiliza `render.yaml` como Blueprint Path. Pon un nombre al Blueprint, por ejemplo `genomicstrack-produccion`. [Creación de Blueprints](https://render.com/docs/infrastructure-as-code).

El archivo del proyecto ya define:

| Ajuste | Valor |
| --- | --- |
| Servicio | Web Service, Node |
| Versión de Node | `22` |
| Plan de cómputo | `0.5c-512mb` |
| Build Command | `npm test` |
| Start Command | `npm start` |
| Instancias | `1` |
| Health Check Path | `/admin.html` |
| Disco | `1 GB`, montado en `/var/data` |
| Datos del panel | `/var/data/genomicstrack` |
| Despliegues por cambios de código | Manuales |

Este servicio y su disco tienen costo: revisa el importe mostrado antes de **Deploy Blueprint**. El disco persistente requiere un servicio de pago; sin él, los cursos y banners guardados en el servidor se perderían al reiniciar o desplegar. [Persistencia en Render](https://render.com/docs/disks).

Cuando el formulario pida los valores que faltan, rellena:

| Variable | Valor |
| --- | --- |
| `ADMIN_PASSWORD_HASH` | El valor completo que copiaste de `.env.admin`, sin el nombre de la variable ni comillas añadidas |
| `ADMIN_ORIGIN` | `https://www.genomicstracksolutions.com` |
| `META_ACCESS_TOKEN` | La credencial vigente que copiaste de `.env.local` |

Verifica las variables ya declaradas por el Blueprint:

| Variable | Valor |
| --- | --- |
| `HOST` | `0.0.0.0` |
| `NODE_VERSION` | `22` |
| `ADMIN_DATA_DIR` | `/var/data/genomicstrack` |
| `META_PAGE_ID` | `645692701952356` |
| `META_API_VERSION` | `v23.0`, la versión configurada en este proyecto |

Deja que Render asigne `PORT`. No uses el puerto local `8765` como configuración de producción. No necesitas instalar dependencias npm ni ejecutar Python en Render: este proyecto usa módulos incluidos en Node y ya contiene los HTML y recursos generados.

Revisa la propuesta y pulsa **Deploy Blueprint**. Espera a que el servicio aparezca **Live**. Si modificas variables posteriormente, usa **Save and deploy** para aplicarlas; **Save only** las deja pendientes hasta otro despliegue. [Aplicar variables](https://render.com/docs/configure-environment-variables).

## 4. Probar el sitio en la dirección de Render

Copia la dirección HTTPS que Render asigne al servicio. En esta guía, `TU-SERVICIO.onrender.com` es un marcador: reemplázalo por el nombre real.

Comprueba estas rutas en esa dirección:

| Ruta | Resultado esperado |
| --- | --- |
| `/` | Portada con cursos y recursos visibles |
| `/cursos.html` | Catálogo con banners |
| `/cursos/c32.html` | Ficha con temario y precio `-` |
| `/posts.html` | Página de noticias |
| `/api/noticias` | JSON con `posts`, `updatedAt` y `stale` |

La página de noticias llama al endpoint del mismo sitio. No tienes que introducir la credencial en el navegador ni crear otra API en Cloudflare. Un JSON con `posts: []` indica que la consulta funcionó pero no devolvió publicaciones; un estado HTTP 503 indica que no hubo una respuesta utilizable de Meta. En ese caso revisa las tres variables `META_*` y aplica los cambios con un despliegue.

El servidor conserva noticias en memoria durante 15 minutos. `stale: true` significa que está devolviendo la última copia válida tras fallar una actualización. Reiniciar vacía esa copia.

El acceso al panel debe hacerse desde el dominio configurado en `ADMIN_ORIGIN`. Con el valor del paso 3, iniciar sesión desde `onrender.com` dará un error de origen. Para probar el panel antes de conectar el dominio, puedes cambiar temporalmente `ADMIN_ORIGIN` a la URL HTTPS exacta de Render, aplicar **Save and deploy**, probarlo y devolverla a `https://www.genomicstracksolutions.com` antes del paso 8. No añadas `/admin.html`, una barra final, dos dominios ni comodines al valor.

## 5. Registrar el dominio en Render

Dentro del servicio, abre **Settings → Custom Domains → Add Custom Domain**. Añade primero:

```text
www.genomicstracksolutions.com
```

Render añade también el dominio raíz y configura su redirección hacia `www`. Guarda y deja abierta esta pantalla para verificar el DNS en el paso 7. [Dominios y redirección a www](https://render.com/docs/custom-domains).

## 6. Llevar los cursos del panel local a Render

En este equipo existe `.admin-data/courses.json` y una carpeta de banners. Si contienen cursos o modificaciones que deseas conservar, realiza este paso antes de usar el panel de producción. El catálogo original de `data/cursos.json` sí viaja con Git; los cambios del panel no.

Si sólo hiciste pruebas descartables y quieres comenzar con el catálogo original, puedes omitir la importación y mantener la carpeta local como respaldo.

**Preparar la copia en Windows:** detén tu servidor local con Ctrl+C para que nadie esté guardando datos mientras haces la copia. No abras el panel de producción para crear cursos durante esta importación.

```powershell
Set-Location 'C:\Users\lalor\Desktop\v02.05.2026'
tar -czf "$env:TEMP\gts-cursos-locales.tgz" -C .admin-data .
```

El archivo queda fuera del repositorio y contiene tanto el JSON como sus banners.

**Habilitar la transferencia:** Render admite SSH en el Web Service de pago. Registra una clave pública en **Account settings → SSH Public Keys**. Si ya tienes una clave SSH, puedes utilizarla. Si creas una nueva con `ssh-keygen -t ed25519`, no sobrescribas una existente; registra sólo el archivo `.pub`. En el servicio, **Connect → SSH** muestra el usuario y host reales. [Configurar SSH](https://render.com/docs/ssh).

En PowerShell, sustituye `USUARIO@HOST` por el destino mostrado por Render (sin la palabra `ssh`):

```powershell
scp "$env:TEMP\gts-cursos-locales.tgz" USUARIO@HOST:/var/data/gts-cursos-locales.tgz
```

Utiliza la misma clave registrada; si guardaste la clave con un nombre distinto del predeterminado, añade `-i "RUTA_DE_TU_CLAVE_PRIVADA"` a `scp`. Al conectar por primera vez, contrasta la huella del servidor con la publicada por Render antes de aceptarla. [Transferencia al disco](https://render.com/docs/disks).

**Importar en el servicio nuevo:** abre la pestaña **Shell** del servicio en Render y ejecuta este bloque Bash allí, no en PowerShell. Está pensado únicamente para una instalación nueva que todavía no tenga cursos guardados desde el panel en Render:

```bash
if [ -e /var/data/genomicstrack/courses.json ]; then
  echo "Ya hay datos del panel en Render. No se importó nada."
else
  mkdir -p /var/data/genomicstrack
  tar -xzf /var/data/gts-cursos-locales.tgz -C /var/data/genomicstrack
fi
```

Si se importó correctamente, debe existir `/var/data/genomicstrack/courses.json` y, junto a él, `banners/`. Si el mensaje indica que ya hay datos, no borres ni sobrescribas ese archivo: conserva ambas copias para una migración que combine sus registros. El servidor lee los datos del disco en cada consulta; no necesita un build para reconocer la importación.

## 7. Configurar los DNS en Cloudflare

En Cloudflare selecciona `genomicstracksolutions.com` y abre **DNS → Records**. Conserva una copia de los valores actuales de `@` y `www` antes de cambiarlos, por si necesitas volver al alojamiento anterior.

Configura estos registros con el hostname real asignado por Render:

| Tipo | Nombre | Destino | Proxy |
| --- | --- | --- | --- |
| CNAME | `@` | `TU-SERVICIO.onrender.com` | DNS only, nube gris |
| CNAME | `www` | `TU-SERVICIO.onrender.com` | DNS only, nube gris |

El destino no lleva `https://` ni rutas. Sustituye los registros A/CNAME anteriores que entren en conflicto con esos dos nombres y retira sus AAAA antiguos. Conserva los registros de correo MX/TXT y los de otros subdominios. Cloudflare gestiona el CNAME del dominio raíz. [Configuración oficial de Cloudflare para Render](https://render.com/docs/configure-cloudflare-dns).

Regresa a **Custom Domains** en Render, pulsa **Verify** y espera a que el dominio y su certificado HTTPS queden verificados. Si hay registros CAA restrictivos, Render documenta las autoridades que deben permitirse. [Verificar dominio y certificado](https://render.com/docs/custom-domains).

Puedes dejar ambos registros en DNS only: Render atenderá HTTPS directamente. Si más adelante activas la nube naranja, hazlo después de que el certificado de Render sea válido y utiliza **SSL/TLS → Full (strict)** para validar también la conexión al servidor. [Modo Full (strict) de Cloudflare](https://developers.cloudflare.com/ssl/origin-configuration/ssl-modes/full-strict/).

## 8. Comprobar el funcionamiento final

Confirma que `ADMIN_ORIGIN` sea exactamente `https://www.genomicstracksolutions.com`. Después prueba:

- `https://www.genomicstracksolutions.com/`: portada.
- `https://www.genomicstracksolutions.com/cursos.html`: catálogo, carteles y cursos importados/publicados.
- Una ficha de curso: temario, precios por etapa, banner y botón de consulta.
- El botón de consulta: debe conservar ese curso seleccionado.
- `https://www.genomicstracksolutions.com/pagos.html`: cuentas y enlace de PayPal.
- `https://www.genomicstracksolutions.com/posts.html` y `/api/noticias`: noticias reales.
- `https://www.genomicstracksolutions.com/admin.html`: inicia sesión con la contraseña que ya elegiste, no con el hash.

Desde el panel público guarda un borrador con imagen, sin publicarlo. En Render utiliza **Manual Deploy → Restart service**; al volver a iniciar sesión, el borrador y la imagen deben seguir presentes. Así verificas que el disco está conservando los datos. [Reiniciar el servicio](https://render.com/docs/deploys).

Cuando estas comprobaciones funcionen, puedes apagar la computadora: Render mantiene el servidor funcionando. El servidor local sólo será necesario para futuras pruebas de desarrollo.

## 9. Actualizaciones y respaldos

Los cursos nuevos y las ediciones de cursos se publican desde el panel, sin tocar Git ni redesplegar. Las modificaciones del código requieren commit y push; después, en Render, **Manual Deploy → Deploy latest commit**. `autoDeployTrigger: off` está declarado en el proyecto. Los cambios del propio Blueprint pueden iniciar una sincronización de infraestructura aparte. [Despliegues manuales](https://render.com/docs/deploys).

Conserva una copia del directorio persistente completo, incluido `courses.json` y `banners/`. Render genera snapshots diarios; una restauración recupera todo el disco y elimina los cambios posteriores a esa copia. Un rollback del código no debe tratarse como una restauración de los cursos. Los despliegues con disco pueden tener una interrupción breve. [Snapshots y límites del disco](https://render.com/docs/disks).

## 10. Resolver problemas habituales

| Síntoma | Qué revisar |
| --- | --- |
| El Blueprint no encuentra `render.yaml` | Que esté subido a la raíz de la rama `main` seleccionada. |
| Falla `npm test` en Render | El primer error en los logs; confirma que subiste todas las pruebas, plantillas y datos. No cambies el build a un comando que omita las pruebas. |
| El servicio no escucha o devuelve 502 | `HOST=0.0.0.0`, Start Command `npm start`, estado Live y `PORT` asignado por Render. |
| El panel indica que falta configuración | `ADMIN_PASSWORD_HASH` completo, sin comillas ni saltos, y cambios de entorno desplegados. |
| “El origen de la solicitud no está permitido” | Abre el panel desde el dominio exacto de `ADMIN_ORIGIN`, con HTTPS y el mismo `www`. |
| Contraseña incorrecta | Se inicia sesión con tu contraseña, no con la cadena `scrypt$...`. |
| Conflicto al guardar | Otra pestaña guardó antes. Conserva tu texto y actualiza la lista tras revisar la otra edición. |
| Desaparecen cursos después de reiniciar | Disco en `/var/data` y `ADMIN_DATA_DIR=/var/data/genomicstrack`; revisa también que hayas importado los datos locales. |
| Noticias devuelve 503 | Revisa la credencial vigente, `META_PAGE_ID`, `META_API_VERSION` y que aplicaste las variables con un despliegue. |
| El dominio muestra el sitio anterior | Revisa los destinos DNS de `@`/`www`, registros incompatibles y propagación. |
| El certificado no se valida | Deja DNS only durante la verificación y comprueba CAA si existe. |
| Cambios de código no aparecen | Deben estar subidos y debes ejecutar Deploy latest commit. Si activaste proxy/caché, revisa sus reglas. |

La guía de uso del panel está en [README_ADMINISTRACION.md](README_ADMINISTRACION.md).
