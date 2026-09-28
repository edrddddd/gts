'use strict';
// Isolated browser QA fixture. This password belongs only to this temporary,
// loopback-only process. It never enables administration on the actual site.
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { createSiteServer } = require('../server.cjs');
const { hashPassword } = require('../admin-server.cjs');

(async () => {
  const adminDataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'gts-admin-browser-'));
  const server = createSiteServer({ config: {
    adminPasswordHash: await hashPassword('Browser-fixture-only-2026'),
    adminOrigin: 'http://127.0.0.1:8766', adminDataDir
  } });
  server.listen(8766, '127.0.0.1', () => console.log('Panel de pruebas aislado: http://127.0.0.1:8766/admin.html'));
  let closing = false;
  async function close() {
    if (closing) return;
    closing = true;
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
    const expectedPrefix = path.resolve(os.tmpdir()) + path.sep + 'gts-admin-browser-';
    if (!path.resolve(adminDataDir).startsWith(expectedPrefix)) throw new Error('Unexpected test directory');
    await fs.rm(adminDataDir, { recursive: true, force: true });
    process.exit(0);
  }
  process.on('SIGINT', close);
  process.on('SIGTERM', close);
})().catch(() => { console.error('No se pudo iniciar el panel de pruebas aislado.'); process.exitCode = 1; });
