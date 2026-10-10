const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const appDir = path.join(__dirname, '..', 'app');

test('game page exposes the complete playable control surface', () => {
  const html = fs.readFileSync(path.join(appDir, 'index.html'), 'utf8');
  assert.match(html, /data-difficulty="easy"[^>]*>\s*简单/);
  assert.match(html, /data-difficulty="hard"[^>]*>\s*困难/);
  assert.match(html, /data-difficulty="nightmare"[^>]*>\s*噩梦/);
  for (const id of ['mine-count', 'timer', 'game-status', 'restart-button', 'board']) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
});

test('layout keeps a white background, stable cells, overflow, and focus visibility', () => {
  const css = fs.readFileSync(path.join(appDir, 'styles.css'), 'utf8');
  assert.match(css, /body\s*\{[^}]*background:\s*#fff(?:fff)?/s);
  assert.match(css, /--cell-size:\s*32px/);
  assert.match(css, /\.board-scroll\s*\{[^}]*overflow-x:\s*auto/s);
  assert.match(css, /:focus-visible/);
});

test('controller registers left click and right-click flagging', () => {
  const script = fs.readFileSync(path.join(appDir, 'main.js'), 'utf8');
  assert.match(script, /addEventListener\(['"]click['"]/);
  assert.match(script, /addEventListener\(['"]contextmenu['"]/);
  assert.match(script, /preventDefault\(\)/);
});
