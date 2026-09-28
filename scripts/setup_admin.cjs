'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');
const readline = require('node:readline');
const crypto = require('node:crypto');
const { hashPassword } = require('../admin-server.cjs');

function hiddenPrompt(label) {
  if (!process.stdin.isTTY || !process.stdout.isTTY) throw new Error('Ejecuta este comando en una terminal interactiva.');
  process.stdout.write(label);
  readline.emitKeypressEvents(process.stdin);
  process.stdin.setRawMode(true);
  process.stdin.resume();
  return new Promise((resolve, reject) => {
    let value = '';
    function finish(error) {
      process.stdin.removeListener('keypress', onKey);
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdout.write('\n');
      if (error) reject(error); else resolve(value);
    }
    function onKey(text, key = {}) {
      if (key.ctrl && key.name === 'c') { finish(new Error('Configuración cancelada.')); return; }
      if (key.name === 'return' || key.name === 'enter') { finish(); return; }
      if (key.name === 'backspace') { value = [...value].slice(0, -1).join(''); return; }
      if (text && !key.ctrl && !key.meta && !/[\x00-\x1f\x7f]/.test(text) && value.length + text.length <= 256) value += text;
    }
    process.stdin.on('keypress', onKey);
  });
}

async function main() {
  const root = path.resolve(__dirname, '..');
  const destination = path.join(root, '.env.admin');
  let existing;
  try { existing = await fs.lstat(destination); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  if (existing && (existing.isSymbolicLink() || !existing.isFile() || existing.nlink !== 1)) throw new Error('El archivo de configuración no es seguro.');
  console.log('Configura la contraseña del panel (12 a 256 caracteres). No se mostrará al escribir.');
  const password = await hiddenPrompt('Contraseña nueva: ');
  if (password.length < 12) throw new Error('La contraseña debe tener al menos 12 caracteres.');
  const confirmation = await hiddenPrompt('Repite la contraseña: ');
  if (password !== confirmation) throw new Error('Las contraseñas no coinciden.');
  const hash = await hashPassword(password);
  let previous = '';
  if (existing) previous = await fs.readFile(destination, 'utf8');
  const retained = previous.split(/\r?\n/).filter(line => !/^\s*ADMIN_PASSWORD_HASH\s*=/.test(line));
  while (retained.length && !retained[retained.length - 1]) retained.pop();
  const contents = [...retained, `ADMIN_PASSWORD_HASH=${hash}`, ''].join('\n');
  const temporary = path.join(root, `.env.admin-${crypto.randomUUID()}.tmp`);
  try {
    const file = await fs.open(temporary, 'wx', 0o600);
    try { await file.writeFile(contents, 'utf8'); await file.sync(); } finally { await file.close(); }
    await fs.rename(temporary, destination);
    await fs.chmod(destination, 0o600);
  } finally { await fs.unlink(temporary).catch(error => { if (error.code !== 'ENOENT') throw error; }); }
  console.log('Contraseña guardada en .env.admin. Reinicia el servidor para aplicarla.');
}

if (require.main === module) main().catch(error => { console.error(error.message || 'No se pudo configurar la administración.'); process.exitCode = 1; });

module.exports = { hiddenPrompt };
