const test = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const http = require('node:http');

const {
  normalizeAssetPath,
  contentTypeFor,
  browserCandidates,
  createServerOptions,
  openBrowser,
  start,
} = require('../launcher.js');

test('asset paths normalize to known app files and reject traversal', () => {
  assert.equal(normalizeAssetPath('/'), 'index.html');
  assert.equal(normalizeAssetPath('/styles.css?x=1'), 'styles.css');
  assert.equal(normalizeAssetPath('/timer.js'), 'timer.js');
  assert.equal(normalizeAssetPath('/app/../game.js'), null);
  assert.equal(normalizeAssetPath('/missing.txt'), null);
});

test('static assets receive correct content types', () => {
  assert.equal(contentTypeFor('index.html'), 'text/html; charset=utf-8');
  assert.equal(contentTypeFor('styles.css'), 'text/css; charset=utf-8');
  assert.equal(contentTypeFor('main.js'), 'text/javascript; charset=utf-8');
});

test('server binds only to localhost and requests an available port', () => {
  assert.deepEqual(createServerOptions(), { host: '127.0.0.1', port: 0 });
});

test('browser candidates prefer Edge app mode and retain a default-browser fallback', () => {
  const candidates = browserCandidates('http://127.0.0.1:1234');
  assert.match(candidates[0].command.toLowerCase(), /msedge\.exe$/);
  assert.deepEqual(candidates[0].args, ['--app=http://127.0.0.1:1234', '--start-maximized']);
  assert.equal(candidates.at(-1).command, 'cmd.exe');
  assert.deepEqual(candidates.at(-1).args.slice(0, 2), ['/c', 'start']);
});

test('server remains available until explicitly closed', async () => {
  const server = start({ open: false });
  await new Promise((resolve) => server.once('listening', resolve));
  const { port } = server.address();
  const request = () => new Promise((resolve, reject) => {
    http.get(`http://127.0.0.1:${port}/`, (response) => {
      response.resume();
      response.once('end', () => resolve(response.statusCode));
    }).once('error', reject);
  });
  try {
    assert.equal(await request(), 200);
    await new Promise((resolve) => setTimeout(resolve, 2200));
    assert.equal(await request(), 200);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('browser launch falls back when the preferred candidate emits an error', async () => {
  const attempted = [];
  const fakeSpawn = (command) => {
    attempted.push(command);
    const child = new EventEmitter();
    child.unref = () => {};
    process.nextTick(() => child.emit(attempted.length === 1 ? 'error' : 'spawn', new Error('bad executable')));
    return child;
  };

  const opened = await openBrowser('http://127.0.0.1:1234', fakeSpawn, () => true);
  assert.equal(opened, true);
  assert.equal(attempted.length, 2);
});

test('browser launch reports failure when every candidate fails', async () => {
  const fakeSpawn = () => {
    const child = new EventEmitter();
    child.unref = () => {};
    process.nextTick(() => child.emit('error', new Error('cannot launch')));
    return child;
  };
  assert.equal(await openBrowser('http://127.0.0.1:1234', fakeSpawn, () => true), false);
});
