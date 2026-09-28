'use strict';

const http = require('node:http');
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');
const { createAdmin } = require('./admin-server.cjs');
const coursePages = require('./course-renderer.cjs');

const PUBLIC_FILES = new Set([
  'index.html', 'cursos.html', 'contacto.html', 'acercade.html', 'servicios.html',
  'posts.html', 'pagos.html', 'site.css', 'site.js', 'news.css', 'noticias.js',
  'catalog.css', 'catalog-data.js', 'catalog.js', 'home.js', 'contact-flow.css',
  'contacto.js', 'pagos.js', 'gts.ico', 'robots.txt', 'sitemap.xml',
  'data/cursos.json', 'data/image-manifest.json', 'admin.html', 'admin.css', 'admin.js'
]);
const MEDIA_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.avif', '.gif', '.svg', '.ico', '.pdf', '.mp4', '.woff', '.woff2']);
const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.avif': 'image/avif', '.gif': 'image/gif',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.pdf': 'application/pdf',
  '.mp4': 'video/mp4', '.woff': 'font/woff', '.woff2': 'font/woff2'
};
const ENV_KEYS = new Set(['META_ACCESS_TOKEN', 'META_PAGE_ID', 'META_API_VERSION', 'HOST', 'PORT', 'ADMIN_PASSWORD_HASH', 'ADMIN_ORIGIN', 'ADMIN_DATA_DIR']);
const PUBLIC_ERROR = 'Las publicaciones no están disponibles en este momento. Puedes consultarlas en Facebook.';

function loadConfig(root = __dirname, environment = process.env) {
  const values = {};
  for (const filename of ['.env.local', '.env.admin']) {
   try {
    for (const line of fs.readFileSync(path.join(root, filename), 'utf8').split(/\r?\n/)) {
      const match = line.trim().match(/^([A-Z_]+)\s*=\s*(.*)$/);
      if (!match || !ENV_KEYS.has(match[1])) continue;
      if (filename === '.env.admin' && !match[1].startsWith('ADMIN_')) continue;
      let value = match[2].trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
      values[match[1]] = value;
    }
   } catch (error) {
    if (error.code !== 'ENOENT') throw new Error('No se pudo leer la configuración local.');
   }
  }
  for (const key of ENV_KEYS) if (environment[key] !== undefined) values[key] = environment[key];
  return {
    accessToken: values.META_ACCESS_TOKEN || '', pageId: values.META_PAGE_ID || '',
    apiVersion: values.META_API_VERSION || 'v23.0',
    host: values.HOST || '127.0.0.1', port: Number(values.PORT || 8765),
    adminPasswordHash: values.ADMIN_PASSWORD_HASH || '',
    adminOrigin: values.ADMIN_ORIGIN || '',
    adminDataDir: values.ADMIN_DATA_DIR ? path.resolve(root, values.ADMIN_DATA_DIR) : path.join(root, '.admin-data')
  };
}

function safeUrl(value, domains) {
  if (typeof value !== 'string' || value.length > 4096) return '';
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password || (url.port && url.port !== '443')) return '';
    return domains.some(domain => url.hostname === domain || url.hostname.endsWith(`.${domain}`)) ? url.href : '';
  } catch { return ''; }
}

function sanitizePosts(rows, pageId) {
  if (!Array.isArray(rows)) throw new Error('Invalid upstream data');
  return rows.slice(0, 15).flatMap(row => {
    if (!row || typeof row !== 'object' || !/^\d{1,40}_\d{1,40}$/.test(row.id || '')) return [];
    const createdAt = typeof row.created_time === 'string' ? new Date(row.created_time) : new Date(NaN);
    const permalink = safeUrl(row.permalink_url, ['facebook.com']);
    return [{
      id: row.id,
      message: typeof row.message === 'string' ? row.message.slice(0, 12000) : typeof row.story === 'string' ? row.story.slice(0, 12000) : '',
      full_picture: safeUrl(row.full_picture, ['fbcdn.net', 'facebook.com', 'fbsbx.com']),
      permalink_url: permalink || `https://www.facebook.com/permalink.php?story_fbid=${row.id.split('_')[1]}&id=${pageId}`,
      created_time: Number.isNaN(createdAt.valueOf()) ? '' : createdAt.toISOString()
    }];
  });
}

function publicPath(requestUrl) {
  let pathname;
  try { pathname = decodeURIComponent(requestUrl.split('?')[0]); } catch { return null; }
  if (!pathname.startsWith('/') || pathname.includes('\\') || pathname.includes('%') || /[\x00-\x1f\x7f]/.test(pathname)) return null;
  const segments = pathname.split('/');
  if (segments.some(segment => segment.startsWith('.') || segment.toLowerCase() === 'cvs')) return null;
  const relative = pathname === '/' ? 'index.html' : pathname.slice(1);
  if (PUBLIC_FILES.has(relative)) return relative;
  if (/^cursos\/[a-z0-9-]+\.html$/.test(relative)) return relative;
  if (relative.startsWith('media/') && MEDIA_EXTENSIONS.has(path.extname(relative).toLowerCase())) return relative;
  return null;
}

function sendJson(response, status, payload) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  response.end(JSON.stringify(payload));
}

function sendNotFound(response, headOnly = false) {
  response.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
  response.end(headOnly ? undefined : '<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Página no encontrada | GenomicsTrack</title><link rel="stylesheet" href="/site.css"><main class="container section"><p class="eyebrow">Error 404</p><h1>No encontramos esta página.</h1><p>El enlace puede haber cambiado.</p><a class="button" href="/">Volver al inicio</a></main></html>');
}

function createSiteServer({ root = __dirname, config = loadConfig(root), fetchImpl = globalThis.fetch, now = Date.now, cacheTtlMs = 15 * 60 * 1000, timeoutMs = 8000 } = {}) {
  const rootPath = fs.realpathSync(root);
  const admin = createAdmin({ root: rootPath, config, now });
  const hasCatalog = fs.existsSync(path.join(rootPath, 'data/cursos.json'));
  const readPublicTemplate = relative => fsp.readFile(path.join(rootPath, relative), 'utf8');
  async function optionalJson(relative, fallback) {
    try { return JSON.parse(await readPublicTemplate(relative)); }
    catch (error) { if (error.code === 'ENOENT') return fallback; throw error; }
  }
  async function renderCourseRoute(rawPath, response, headOnly) {
    const detailMatch = /^\/cursos\/(c\d+)\.html$/.exec(rawPath);
    const routes = ['/', '/index.html', '/cursos.html', '/catalog-data.js', '/data/cursos.json', '/sitemap.xml'];
    if (!hasCatalog || (!detailMatch && !routes.includes(rawPath))) return false;
    const courses = await admin.getPublishedCourses();
    const manifest = await optionalJson('data/image-manifest.json', {});
    let body;
    let type = 'text/html; charset=utf-8';
    if (detailMatch) {
      const course = courses.find(item => item.id === detailMatch[1]);
      if (!course) { sendNotFound(response, headOnly); return true; }
      body = coursePages.renderDetailPage(await readPublicTemplate('cursos/c1.html'), course, manifest);
    } else if (rawPath === '/data/cursos.json') {
      body = JSON.stringify(courses); type = MIME['.json'];
    } else if (rawPath === '/catalog-data.js') {
      body = coursePages.renderCatalogData(await readPublicTemplate('catalog-data.js'), courses); type = MIME['.js'];
    } else if (rawPath === '/cursos.html') {
      body = coursePages.renderCatalogPage(await readPublicTemplate('cursos.html'), courses, manifest);
    } else if (rawPath === '/sitemap.xml') {
      const site = await optionalJson('site.config.json', {});
      body = coursePages.renderSitemap(await readPublicTemplate('sitemap.xml'), courses, site.url || ''); type = MIME['.xml'];
    } else {
      body = coursePages.renderHomePage(await readPublicTemplate('index.html'), courses, manifest);
    }
    response.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-cache' });
    response.end(headOnly ? undefined : body);
    return true;
  }
  let cache = null;
  let pending = null;

  async function refreshPosts() {
    if (pending) return pending;
    pending = (async () => {
      if (!config.accessToken || !/^\d+$/.test(config.pageId) || !/^v\d+\.\d+$/.test(config.apiVersion)) throw new Error('Unavailable configuration');
      const url = new URL(`https://graph.facebook.com/${config.apiVersion}/${config.pageId}/posts`);
      url.searchParams.set('fields', 'id,message,story,full_picture,permalink_url,created_time');
      url.searchParams.set('limit', '15');
      // The access token travels only in the server-to-server authorization header.
      const result = await fetchImpl(url, { headers: { Authorization: `Bearer ${config.accessToken}` }, signal: AbortSignal.timeout(timeoutMs), redirect: 'error' });
      if (!result.ok) throw new Error('Upstream unavailable');
      const payload = await result.json();
      if (payload.error) throw new Error('Upstream unavailable');
      cache = { posts: sanitizePosts(payload.data, config.pageId), fetchedAt: now() };
      return cache;
    })();
    try { return await pending; } finally { pending = null; }
  }

  return http.createServer(async (request, response) => {
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.setHeader('X-Frame-Options', 'SAMEORIGIN');
    try {
      const rawPath = (request.url || '/').split('?')[0];
      if (await admin.handle(request, response)) return;
      if (rawPath === '/api/noticias') {
        if (request.method !== 'GET') { response.setHeader('Allow', 'GET'); sendJson(response, 405, { error: 'Método no permitido.' }); return; }
        let stale = false;
        if (!cache || now() - cache.fetchedAt >= cacheTtlMs) {
          try { await refreshPosts(); } catch {
            if (!cache) { sendJson(response, 503, { error: PUBLIC_ERROR }); return; }
            stale = true;
          }
        }
        sendJson(response, 200, { posts: cache.posts, updatedAt: new Date(cache.fetchedAt).toISOString(), stale });
        return;
      }
      if (request.method !== 'GET' && request.method !== 'HEAD') {
        response.setHeader('Allow', 'GET, HEAD');
        sendJson(response, 405, { error: 'Método no permitido.' });
        return;
      }
      if (rawPath === '/admin' || rawPath === '/admin/') {
        response.writeHead(302, { Location: '/admin.html', 'Cache-Control': 'no-store' });
        response.end(); return;
      }
      if (rawPath.startsWith('/media/admin/')) {
        const banner = await admin.getBanner(rawPath);
        if (!banner) { sendNotFound(response, request.method === 'HEAD'); return; }
        response.writeHead(200, { 'Content-Type': MIME[path.extname(rawPath)], 'Cache-Control': 'no-cache' });
        response.end(request.method === 'HEAD' ? undefined : banner); return;
      }
      // Route normalized aliases through the same catalog checks; unpublished
      // overrides must never fall back to an older static course page.
      const publicRelative = publicPath(request.url || '/');
      if (publicRelative && await renderCourseRoute('/' + publicRelative, response, request.method === 'HEAD')) return;
      const relative = publicPath(request.url || '/');
      if (!relative) { sendNotFound(response, request.method === 'HEAD'); return; }
      if (relative.startsWith('media/admin/')) { sendNotFound(response, request.method === 'HEAD'); return; }
      let realFile;
      try {
        realFile = await fsp.realpath(path.join(rootPath, relative));
        const relativeReal = path.relative(rootPath, realFile);
        if (relativeReal.startsWith('..') || path.isAbsolute(relativeReal) || !publicPath(`/${relativeReal.split(path.sep).join('/')}`)) throw new Error('Not public');
        const info = await fsp.stat(realFile);
        if (!info.isFile()) throw new Error('Not a file');
      } catch { sendNotFound(response, request.method === 'HEAD'); return; }
      const body = request.method === 'HEAD' ? null : await fsp.readFile(realFile);
      response.writeHead(200, {
        'Content-Type': MIME[path.extname(realFile).toLowerCase()] || 'application/octet-stream',
        'Cache-Control': relative.startsWith('admin.') ? 'no-store' : relative.startsWith('media/') ? 'public, max-age=86400' : 'no-cache',
        ...(relative.startsWith('admin.') ? { 'X-Robots-Tag': 'noindex, nofollow', 'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' blob: data:; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'" } : {})
      });
      response.end(body);
    } catch {
      if (!response.headersSent) sendJson(response, 500, { error: 'No se pudo completar la solicitud.' });
      else response.end();
    }
  });
}

if (require.main === module) {
  try {
    const config = loadConfig();
    if (!Number.isInteger(config.port) || config.port < 1 || config.port > 65535) throw new Error('Invalid port');
    const server = createSiteServer({ config });
    server.on('error', () => { console.error('No se pudo iniciar el servidor. Comprueba HOST y PORT.'); process.exitCode = 1; });
    server.listen(config.port, config.host, () => console.log(`GenomicsTrack disponible en http://${config.host}:${config.port}`));
  } catch { console.error('No se pudo iniciar el servidor. Comprueba la configuración.'); process.exitCode = 1; }
}

module.exports = { createSiteServer, loadConfig, publicPath, sanitizePosts };
