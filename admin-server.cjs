'use strict';

const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const { promisify } = require('node:util');

const scrypt = promisify(crypto.scrypt);
const MAX_BANNER = 5 * 1024 * 1024;
const MAX_BODY = Math.ceil(MAX_BANNER * 4 / 3) + 128 * 1024;
const SESSION_MS = 8 * 60 * 60 * 1000;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const COOKIE = 'gts_admin';
const BANNER_LEAF = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}\.(png|jpg|webp)$/;
const locks = new Map();

class PublicError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

function parseHash(value) {
  if (typeof value !== 'string') return null;
  const match = value.match(/^scrypt\$16384\$8\$1\$([a-f0-9]{32})\$([a-f0-9]{64})$/);
  return match ? { salt: Buffer.from(match[1], 'hex'), key: Buffer.from(match[2], 'hex') } : null;
}

async function hashPassword(password) {
  if (typeof password !== 'string' || password.length < 12 || password.length > 256) throw new Error('La contraseña debe tener de 12 a 256 caracteres.');
  const salt = crypto.randomBytes(16);
  const key = await scrypt(password, salt, 32, { N: 16384, r: 8, p: 1 });
  return `scrypt$16384$8$1$${salt.toString('hex')}$${key.toString('hex')}`;
}

function equalToken(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function sendJson(response, status, data) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
  response.end(JSON.stringify(data));
}

function readJson(request, limit = MAX_BODY) {
  if (!/^application\/json(?:\s*;|$)/i.test(request.headers['content-type'] || '')) {
    request.resume();
    throw new PublicError(415, 'Envía la información como JSON.');
  }
  if (Number(request.headers['content-length']) > limit) {
    request.resume();
    throw new PublicError(413, 'La solicitud supera el tamaño permitido.');
  }
  return new Promise((resolve, reject) => {
    let length = 0;
    let chunks = [];
    let rejected = false;
    request.on('data', chunk => {
      if (rejected) return;
      length += chunk.length;
      if (length > limit) {
        rejected = true; chunks = [];
        reject(new PublicError(413, 'La solicitud supera el tamaño permitido.'));
      } else chunks.push(chunk);
    });
    request.on('end', () => {
      if (rejected) return;
      try {
        const value = JSON.parse(Buffer.concat(chunks).toString('utf8'));
        if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error();
        resolve(value);
      } catch { reject(new PublicError(400, 'La solicitud no contiene JSON válido.')); }
    });
    request.on('error', () => reject(new PublicError(400, 'No se pudo leer la solicitud.')));
    request.on('aborted', () => reject(new PublicError(400, 'La solicitud se interrumpió.')));
  });
}

function cleanText(value, label, max, fallback = '') {
  if (value === undefined) return fallback;
  if (typeof value !== 'string' || value.length > max || /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(value) || /<\/?[a-z!][^>]*>/i.test(value)) {
    throw new PublicError(400, `${label}: utiliza texto simple de hasta ${max} caracteres.`);
  }
  return value.trim();
}

function textList(value, label) {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > 60) throw new PublicError(400, `${label}: utiliza hasta 60 elementos.`);
  return value.map(item => cleanText(item, label, 1000)).filter(Boolean);
}

function cleanDate(value, label) {
  const result = cleanText(value, label, 10);
  if (result && (!/^20\d{2}-\d{2}-\d{2}$/.test(result) || Number.isNaN(Date.parse(`${result}T00:00:00Z`)) || new Date(`${result}T00:00:00Z`).toISOString().slice(0, 10) !== result)) {
    throw new PublicError(400, `${label}: utiliza una fecha válida (AAAA-MM-DD).`);
  }
  return result;
}

function cleanCourse(input, previous, id, hasBanner) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new PublicError(400, 'Falta la información del curso.');
  const merged = { ...previous, ...input };
  const course = { ...previous, id };
  for (const [key, max] of Object.entries({ titulo: 200, descripcion: 6000, categoria: 100, fechas: 500, horario: 500, duracion: 200, nivel: 100, modalidad: 200, precio: 200 })) {
    course[key] = cleanText(merged[key], key, max);
  }
  course.precio ||= '-';
  course.inicio = cleanDate(merged.inicio, 'Inicio');
  course.fin = cleanDate(merged.fin, 'Fin');
  if (course.inicio && course.fin && course.fin < course.inicio) throw new PublicError(400, 'La fecha final debe ser igual o posterior al inicio.');
  course.temario = textList(merged.temario, 'Temario');
  course.incluye = textList(merged.incluye, 'Incluye');
  let instructors = merged.instructor;
  if (instructors === undefined) instructors = [];
  if (instructors && !Array.isArray(instructors) && typeof instructors === 'object') instructors = [instructors];
  if (!Array.isArray(instructors) || instructors.length > 12) throw new PublicError(400, 'Utiliza hasta 12 instructores.');
  course.instructor = instructors.map(item => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) throw new PublicError(400, 'Instructor no válido.');
    const result = { nombre: cleanText(item.nombre, 'Nombre del instructor', 200), desc: cleanText(item.desc, 'Descripción del instructor', 4000) };
    const cv = cleanText(item.cv, 'Enlace del instructor', 2000);
    if (cv) {
      let url;
      try { url = new URL(cv); } catch { throw new PublicError(400, 'El enlace del instructor debe ser una dirección HTTPS válida.'); }
      if (url.protocol !== 'https:' || url.username || url.password) throw new PublicError(400, 'El enlace del instructor debe ser una dirección HTTPS válida.');
      result.cv = url.href;
    }
    return result;
  });
  course.precios = null;
  if (merged.precios !== undefined && merged.precios !== null) {
    const prices = merged.precios;
    if (!prices || typeof prices !== 'object' || !Array.isArray(prices.columnas) || prices.columnas.length < 2 || prices.columnas.length > 9 || !Array.isArray(prices.filas) || prices.filas.length < 1 || prices.filas.length > 20) {
      throw new PublicError(400, 'La tabla debe tener de 1 a 8 etapas y de 1 a 20 perfiles.');
    }
    const columns = prices.columnas.map(value => cleanText(value, 'Etapa de precios', 150));
    if (columns[0] !== 'Perfil' || columns.some(value => !value)) throw new PublicError(400, 'La primera columna debe ser Perfil y cada etapa debe tener nombre.');
    const rows = prices.filas.map(row => {
      // Some original editions omitted trailing price cells. Preserve those
      // editions on partial edits, while requiring complete tables in new input.
      const legacyRow = input.precios === undefined && Array.isArray(row) && row.length < columns.length;
      if (!Array.isArray(row) || (!legacyRow && row.length !== columns.length)) throw new PublicError(400, 'Cada perfil debe tener un precio para cada etapa.');
      const cells = Array.from({ length: columns.length }, (_, index) => cleanText(row[index], 'Celda de precios', 200));
      if (!cells[0]) throw new PublicError(400, 'Cada fila de precios necesita un perfil.');
      return cells.map((value, index) => index ? value || '-' : value);
    });
    course.precios = { columnas: columns, filas: rows };
  }
  course.publicationStatus = merged.publicationStatus || (previous ? 'published' : 'draft');
  if (!['draft', 'published'].includes(course.publicationStatus)) throw new PublicError(400, 'Estado de publicación no válido.');
  if (!course.titulo) throw new PublicError(400, 'Escribe el título del curso.');
  // Only fields explicitly assigned above are writable; existing source metadata survives edits.
  if (course.publicationStatus === 'published') {
    const required = ['descripcion', 'categoria', 'inicio', 'fin', 'duracion', 'nivel'];
    if (required.some(key => !course[key]) || !course.temario.length || !course.incluye.length || !course.instructor.some(item => item.nombre) || (!hasBanner && !course.img)) {
      throw new PublicError(400, 'Para publicar completa descripción, categoría, fechas de inicio y fin, duración, nivel, temario, qué incluye, instructor y banner.');
    }
  }
  return course;
}

function decodeBanner(banner) {
  if (banner === undefined || banner === null) return null;
  if (!banner || typeof banner !== 'object' || typeof banner.data !== 'string' || !['image/png', 'image/jpeg', 'image/webp'].includes(banner.mime)) throw new PublicError(400, 'El banner debe ser PNG, JPG o WebP.');
  if (banner.data.length > Math.ceil(MAX_BANNER * 4 / 3) + 4) throw new PublicError(413, 'El banner debe pesar como máximo 5 MB.');
  if (!banner.data || banner.data.length % 4 !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/.test(banner.data)) throw new PublicError(400, 'El contenido del banner no es válido.');
  const bytes = Buffer.from(banner.data, 'base64');
  if (bytes.length > MAX_BANNER) throw new PublicError(413, 'El banner debe pesar como máximo 5 MB.');
  let valid = false;
  let extension;
  if (banner.mime === 'image/png') {
    extension = 'png';
    valid = bytes.length >= 45 && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) && bytes.toString('ascii', 12, 16) === 'IHDR' && bytes.readUInt32BE(8) === 13 && bytes.readUInt32BE(16) > 0 && bytes.readUInt32BE(20) > 0 && bytes.toString('ascii', bytes.length - 8, bytes.length - 4) === 'IEND';
  } else if (banner.mime === 'image/jpeg') {
    extension = 'jpg';
    valid = bytes.length >= 12 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255 && bytes[bytes.length - 2] === 255 && bytes[bytes.length - 1] === 217;
  } else {
    extension = 'webp';
    valid = bytes.length >= 20 && bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP' && bytes.readUInt32LE(4) + 8 === bytes.length && ['VP8 ', 'VP8L', 'VP8X'].includes(bytes.toString('ascii', 12, 16));
  }
  if (!valid) throw new PublicError(400, 'El archivo no coincide con un banner PNG, JPG o WebP válido.');
  return { bytes, extension };
}

// Reject symlinks in every component, including a configured external data directory.
async function safeDirectory(directory, create = false) {
  const absolute = path.resolve(directory);
  const parsed = path.parse(absolute);
  let current = parsed.root;
  for (const component of absolute.slice(parsed.root.length).split(path.sep).filter(Boolean)) {
    current = path.join(current, component);
    let info;
    try { info = await fsp.lstat(current); } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      if (!create) return false;
      try { await fsp.mkdir(current, { mode: 0o700 }); } catch (mkdirError) { if (mkdirError.code !== 'EEXIST') throw mkdirError; }
      info = await fsp.lstat(current);
    }
    if (info.isSymbolicLink() || !info.isDirectory()) throw new Error('Unsafe storage directory');
  }
  return true;
}

async function safeRead(filename, limit) {
  if (!await safeDirectory(path.dirname(filename))) return null;
  let info;
  try { info = await fsp.lstat(filename); } catch (error) { if (error.code === 'ENOENT') return null; throw error; }
  if (info.isSymbolicLink() || !info.isFile() || info.nlink !== 1 || info.size > limit) throw new Error('Unsafe storage file');
  const handle = await fsp.open(filename, fs.constants.O_RDONLY | (fs.constants.O_NOFOLLOW || 0));
  try {
    const opened = await handle.stat();
    if (!opened.isFile() || opened.nlink !== 1 || opened.size > limit) throw new Error('Unsafe storage file');
    return await handle.readFile();
  } finally { await handle.close(); }
}

function serialized(key, operation) {
  const before = locks.get(key) || Promise.resolve();
  const next = before.catch(() => {}).then(operation);
  const settled = next.catch(() => {});
  locks.set(key, settled);
  settled.finally(() => { if (locks.get(key) === settled) locks.delete(key); });
  return next;
}

function createAdmin({ root = __dirname, config = {}, now = Date.now } = {}) {
  const rootPath = path.resolve(root);
  const dataDirectory = path.resolve(rootPath, config.adminDataDir || '.admin-data');
  const relative = path.relative(rootPath, dataDirectory).split(path.sep).join('/');
  if (!relative || /^(?:media|data|cursos)(?:\/|$)/i.test(relative)) throw new Error('Admin data must use a private directory');
  const recordFile = path.join(dataDirectory, 'courses.json');
  const bannerDirectory = path.join(dataDirectory, 'banners');
  const passwordHash = parseHash(config.adminPasswordHash);
  const sessions = new Map();
  const attempts = new Map();
  let activeLogins = 0;
  let configuredOrigin = '';
  if (config.adminOrigin) {
    try {
      const parsed = new URL(config.adminOrigin);
      const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname);
      if ((parsed.protocol !== 'https:' && !(parsed.protocol === 'http:' && loopback)) || parsed.username || parsed.password || parsed.pathname !== '/' || parsed.search || parsed.hash) throw new Error();
      configuredOrigin = parsed.origin;
    } catch { throw new Error('ADMIN_ORIGIN must be an HTTPS origin or local HTTP origin'); }
  }

  async function readState() {
    const bytes = await safeRead(recordFile, 32 * 1024 * 1024);
    if (bytes === null) return { revision: 0, courses: [] };
    const state = JSON.parse(bytes.toString('utf8'));
    if (!state || !Number.isSafeInteger(state.revision) || state.revision < 0 || !Array.isArray(state.courses) || state.courses.length > 5000) throw new Error('Invalid course store');
    const ids = new Set();
    for (const course of state.courses) {
      if (!course || !/^c[1-9]\d{0,8}$/.test(course.id) || ids.has(course.id) || !['draft', 'published'].includes(course.publicationStatus)) throw new Error('Invalid stored course');
      ids.add(course.id);
    }
    return state;
  }

  async function baseCourses() {
    try {
      const rows = JSON.parse(await fsp.readFile(path.join(rootPath, 'data', 'cursos.json'), 'utf8'));
      if (!Array.isArray(rows)) throw new Error('Invalid base catalog');
      return rows;
    } catch (error) { if (error.code === 'ENOENT') return []; throw error; }
  }

  function overlay(base, overrides) {
    const courses = new Map(base.map(course => [course.id, course]));
    for (const course of overrides) courses.set(course.id, { ...courses.get(course.id), ...course });
    return [...courses.values()].sort((a, b) => Number(b.id.slice(1)) - Number(a.id.slice(1)));
  }

  async function getPublishedCourses() {
    const [base, state] = await Promise.all([baseCourses(), readState()]);
    return overlay(base, state.courses).filter(course => course.publicationStatus !== 'draft');
  }

  async function bannerBytes(leaf, includeDrafts) {
    if (!BANNER_LEAF.test(leaf)) return null;
    const courses = includeDrafts ? overlay(await baseCourses(), (await readState()).courses) : await getPublishedCourses();
    if (!courses.some(course => course.img === `media/admin/${leaf}` || course.img === `/media/admin/${leaf}`)) return null;
    return safeRead(path.join(bannerDirectory, leaf), MAX_BANNER);
  }

  async function getBanner(relativePath) {
    if (typeof relativePath !== 'string') return null;
    const match = relativePath.match(/^\/?media\/admin\/([^/]+)$/);
    return match ? bannerBytes(match[1], false) : null;
  }

  function originFor(request) {
    if (configuredOrigin) return configuredOrigin;
    const host = request.headers.host || '';
    if (!/^(?:localhost|127\.0\.0\.1|\[::1\])(?::\d{1,5})?$/.test(host)) throw new PublicError(503, 'Configura ADMIN_ORIGIN para habilitar la administración en este servidor.');
    return `${request.socket.encrypted ? 'https' : 'http'}://${host}`;
  }

  function assertOrigin(request) {
    const expected = originFor(request);
    if (request.headers.origin !== expected) throw new PublicError(403, 'El origen de la solicitud no está permitido.');
    return expected;
  }

  function sessionFor(request) {
    const current = now();
    for (const [key, value] of sessions) if (value.expires <= current) sessions.delete(key);
    const cookies = (request.headers.cookie || '').split(';').map(value => value.trim());
    const token = cookies.find(value => value.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1);
    return token && sessions.has(token) ? { token, ...sessions.get(token) } : null;
  }

  function authenticate(request, writing = false) {
    const session = sessionFor(request);
    if (!session) throw new PublicError(401, 'Inicia sesión para administrar los cursos.');
    if (writing) {
      assertOrigin(request);
      if (!equalToken(request.headers['x-csrf-token'], session.csrfToken)) throw new PublicError(403, 'La sesión de edición no es válida. Actualiza la página.');
    }
    return session;
  }

  function setCookie(response, token, secure, expire = false) {
    response.setHeader('Set-Cookie', `${COOKIE}=${token}; Path=/api/admin; HttpOnly; SameSite=Strict; Max-Age=${expire ? 0 : SESSION_MS / 1000}${secure ? '; Secure' : ''}`);
  }

  async function login(request, response) {
    const origin = assertOrigin(request);
    const key = request.socket.remoteAddress || 'unknown';
    const current = now();
    for (const [ip, value] of attempts) if (current - value.started >= LOGIN_WINDOW_MS) attempts.delete(ip);
    if (attempts.size >= 2000 && !attempts.has(key)) attempts.delete(attempts.keys().next().value);
    const attempt = attempts.get(key) || { started: current, count: 0 };
    if (attempt.count >= 8 || activeLogins >= 4) {
      response.setHeader('Retry-After', '900');
      throw new PublicError(429, 'Demasiados intentos. Espera 15 minutos e inténtalo de nuevo.');
    }
    attempt.count += 1; attempts.set(key, attempt);
    const body = await readJson(request, 4096);
    if (typeof body.password !== 'string' || body.password.length > 256) throw new PublicError(401, 'Contraseña incorrecta.');
    // Recheck after the body arrives: simultaneous slow uploads must not queue unbounded scrypt work.
    if (activeLogins >= 4) {
      response.setHeader('Retry-After', '15');
      throw new PublicError(429, 'Hay varios accesos en proceso. Inténtalo en unos segundos.');
    }
    activeLogins += 1;
    let derived;
    try { derived = await scrypt(body.password, passwordHash.salt, 32, { N: 16384, r: 8, p: 1 }); } finally { activeLogins -= 1; }
    if (!crypto.timingSafeEqual(derived, passwordHash.key)) throw new PublicError(401, 'Contraseña incorrecta.');
    attempts.delete(key);
    const oldSession = sessionFor(request);
    if (oldSession) sessions.delete(oldSession.token);
    if (sessions.size >= 128) sessions.delete(sessions.keys().next().value);
    const token = crypto.randomBytes(32).toString('base64url');
    const csrfToken = crypto.randomBytes(32).toString('base64url');
    sessions.set(token, { csrfToken, expires: now() + SESSION_MS });
    setCookie(response, token, origin.startsWith('https:'));
    sendJson(response, 200, { authenticated: true, csrfToken });
  }

  async function saveCourse(body, courseId) {
    return serialized(recordFile, async () => {
      const [base, state] = await Promise.all([baseCourses(), readState()]);
      if (!Number.isSafeInteger(body.revision) || body.revision !== state.revision) throw new PublicError(409, 'Otro cambio actualizó el catálogo. Recarga los cursos antes de guardar.');
      const all = overlay(base, state.courses);
      const previous = courseId ? all.find(course => course.id === courseId) : undefined;
      if (courseId && !previous) throw new PublicError(404, 'No se encontró el curso.');
      const nextNumber = all.reduce((max, course) => /^c\d+$/.test(course.id) ? Math.max(max, Number(course.id.slice(1))) : max, 0) + 1;
      if (nextNumber > 999999999) throw new PublicError(400, 'No se pueden crear más cursos.');
      const id = courseId || `c${nextNumber}`;
      const banner = decodeBanner(body.banner);
      const course = cleanCourse(body.course, previous, id, Boolean(banner));
      if (banner) {
        course.img = `media/admin/${crypto.randomUUID()}.${banner.extension}`;
        course.cartelVigente = true;
      }
      const nextState = { revision: state.revision + 1, courses: [...state.courses.filter(item => item.id !== id), course] };
      if (nextState.courses.length > 5000) throw new PublicError(400, 'Se alcanzó el límite de cursos administrados.');
      const contents = JSON.stringify(nextState, null, 2) + '\n';
      if (Buffer.byteLength(contents) > 32 * 1024 * 1024) throw new PublicError(400, 'El catálogo supera el tamaño permitido.');
      // Validate everything before creating files. A committed record always points to a complete image.
      await safeDirectory(dataDirectory, true);
      if (banner) {
        await safeDirectory(bannerDirectory, true);
        const imageFile = await fsp.open(path.join(bannerDirectory, path.basename(course.img)), 'wx', 0o600);
        try { await imageFile.writeFile(banner.bytes); await imageFile.sync(); } finally { await imageFile.close(); }
      }
      const temporary = path.join(dataDirectory, `.courses-${crypto.randomUUID()}.tmp`);
      try {
        const file = await fsp.open(temporary, 'wx', 0o600);
        try { await file.writeFile(contents, 'utf8'); await file.sync(); } finally { await file.close(); }
        await safeDirectory(dataDirectory);
        // readState already rejects symlinks; rename replaces the directory entry atomically.
        await fsp.rename(temporary, recordFile);
      } finally { await fsp.unlink(temporary).catch(error => { if (error.code !== 'ENOENT') throw error; }); }
      return { course, revision: nextState.revision };
    });
  }

  async function handle(request, response) {
    const route = (request.url || '/').split('?')[0];
    if (route !== '/api/admin' && !route.startsWith('/api/admin/')) return false;
    try {
      if (route === '/api/admin/session' && request.method === 'GET') {
        const session = passwordHash ? sessionFor(request) : null;
        sendJson(response, 200, { configured: Boolean(passwordHash), authenticated: Boolean(session), ...(session ? { csrfToken: session.csrfToken } : {}) });
        return true;
      }
      if (!passwordHash) throw new PublicError(503, 'La administración no está configurada. Ejecuta npm run admin:setup en el servidor.');
      if (route === '/api/admin/login' && request.method === 'POST') await login(request, response);
      else if (route === '/api/admin/logout' && request.method === 'POST') {
        const session = authenticate(request, true);
        sessions.delete(session.token);
        setCookie(response, '', originFor(request).startsWith('https:'), true);
        sendJson(response, 200, { authenticated: false });
      } else if (route === '/api/admin/courses' && request.method === 'GET') {
        authenticate(request);
        const [base, state] = await Promise.all([baseCourses(), readState()]);
        sendJson(response, 200, { courses: overlay(base, state.courses).map(course => ({ ...course, publicationStatus: course.publicationStatus || 'published' })), revision: state.revision });
      } else if ((route === '/api/admin/courses' && request.method === 'POST') || (/^\/api\/admin\/courses\/c[1-9]\d{0,8}$/.test(route) && request.method === 'PUT')) {
        authenticate(request, true);
        const body = await readJson(request);
        const result = await saveCourse(body, request.method === 'PUT' ? route.split('/').pop() : undefined);
        sendJson(response, request.method === 'POST' ? 201 : 200, result);
      } else if (route.startsWith('/api/admin/banner/') && request.method === 'GET') {
        authenticate(request);
        const leaf = route.slice('/api/admin/banner/'.length);
        const bytes = await bannerBytes(leaf, true);
        if (!bytes) throw new PublicError(404, 'No se encontró el banner.');
        const mime = { '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp' }[path.extname(leaf)];
        response.writeHead(200, { 'Content-Type': mime, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
        response.end(bytes);
      } else throw new PublicError(404, 'No se encontró esta operación de administración.');
    } catch (error) {
      if (!response.headersSent) sendJson(response, error instanceof PublicError ? error.status : 500, { error: error instanceof PublicError ? error.message : 'No se pudo completar la operación. Inténtalo de nuevo.' });
      else response.end();
    }
    return true;
  }

  return { handle, getPublishedCourses, getBanner };
}

module.exports = { createAdmin, hashPassword };
