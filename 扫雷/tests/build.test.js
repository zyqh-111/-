const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('package locks supported Node and build dependencies', () => {
  const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
  const lock = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package-lock.json'), 'utf8'));
  assert.equal(packageJson.engines.node, '>=24 <25');
  assert.equal(packageJson.devDependencies.postject, '1.0.0-alpha.6');
  assert.ok(lock.packages['node_modules/postject']);
});

test('build script validates a candidate before replacing the final executable', () => {
  const script = fs.readFileSync(path.join(__dirname, '..', 'scripts', 'build.ps1'), 'utf8');
  assert.match(script, /candidate/i);
  assert.match(script, /Assert-NativeSuccess/);
  assert.match(script, /MINESWEEPER_HEALTHCHECK/);
  assert.match(script, /Move-Item[^\n]+-Force/);
});
