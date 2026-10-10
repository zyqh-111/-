const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');

const ASSET_NAMES = new Set(['index.html', 'styles.css', 'game.js', 'main.js']);

function normalizeAssetPath(requestUrl) {
  const rawPath = String(requestUrl || '/').split('?')[0];
  let decoded;
  try { decoded = decodeURIComponent(rawPath); } catch { return null; }
  if (decoded.split('/').includes('..')) return null;
  const name = decoded === '/' ? 'index.html' : decoded.replace(/^\/+/, '');
  return ASSET_NAMES.has(name) ? name : null;
}

function contentTypeFor(name) {
  if (name.endsWith('.html')) return 'text/html; charset=utf-8';
  if (name.endsWith('.css')) return 'text/css; charset=utf-8';
  if (name.endsWith('.js')) return 'text/javascript; charset=utf-8';
  return 'application/octet-stream';
}

function readAsset(name) {
  try {
    const sea = require('node:sea');
    if (sea.isSea()) return Buffer.from(sea.getRawAsset(name));
  } catch {}
  return fs.readFileSync(path.join(__dirname, 'app', name));
}

function createRequestHandler(onServed = () => {}) {
  return (request, response) => {
    const assetName = normalizeAssetPath(request.url);
    if (!assetName) {
      response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('Not found');
      return;
    }
    try {
      const data = readAsset(assetName);
      response.writeHead(200, {
        'Content-Type': contentTypeFor(assetName),
        'Content-Length': data.length,
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      });
      response.end(data);
      onServed();
    } catch (error) {
      response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('Unable to load game files');
    }
  };
}

function createServerOptions() {
  return { host: '127.0.0.1', port: 0 };
}

function scheduleServerClose(server, delayMs = 2000) {
  let timer = null;
  return () => {
    if (timer !== null) clearTimeout(timer);
    timer = setTimeout(() => server.close(), delayMs);
    if (typeof timer.unref === 'function') timer.unref();
  };
}

function browserCandidates(url) {
  const edgePaths = [
    path.join(process.env['ProgramFiles(x86)'] || '', 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
    path.join(process.env.ProgramFiles || '', 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
  ].filter(Boolean);
  return [
    ...edgePaths.map((command) => ({ command, args: [`--app=${url}`, '--start-maximized'] })),
    { command: 'cmd.exe', args: ['/c', 'start', '', url], fallback: true },
  ];
}

function launchCandidate(candidate, spawnImpl, graceMs) {
  return new Promise((resolve) => {
    let child;
    let settled = false;
    let timer = null;
    const finish = (success) => {
      if (settled) return;
      settled = true;
      if (timer !== null) clearTimeout(timer);
      if (success && child && typeof child.unref === 'function') child.unref();
      resolve(success);
    };
    try {
      child = spawnImpl(candidate.command, candidate.args, {
        detached: true,
        stdio: 'ignore',
        windowsHide: true,
      });
      child.once('error', () => finish(false));
      child.once('exit', () => finish(Boolean(candidate.fallback)));
      child.once('spawn', () => {
        if (candidate.fallback) finish(true);
        else timer = setTimeout(() => finish(true), graceMs);
      });
    } catch {
      finish(false);
    }
  });
}

async function openBrowser(url, spawnImpl = spawn, fileExists = fs.existsSync, graceMs = 250) {
  for (const candidate of browserCandidates(url)) {
    if (!candidate.fallback && !fileExists(candidate.command)) continue;
    if (await launchCandidate(candidate, spawnImpl, graceMs)) return true;
  }
  return false;
}

function start() {
  let scheduleClose = () => {};
  const server = http.createServer(createRequestHandler(() => scheduleClose()));
  scheduleClose = scheduleServerClose(server);
  const options = createServerOptions();
  server.listen(options.port, options.host, () => {
    const address = server.address();
    const url = `http://${options.host}:${address.port}`;
    process.stdout.write(`MINESWEEPER_URL=${url}\n`);
    if (process.env.MINESWEEPER_NO_BROWSER !== '1') void openBrowser(url);
  });
  return server;
}

if (require.main === module) start();

module.exports = {
  normalizeAssetPath,
  contentTypeFor,
  readAsset,
  createRequestHandler,
  createServerOptions,
  scheduleServerClose,
  browserCandidates,
  openBrowser,
  start,
};
