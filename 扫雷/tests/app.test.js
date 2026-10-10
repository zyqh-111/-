const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

const appDir = path.join(__dirname, '..', 'app');

function loadApp() {
  const html = fs.readFileSync(path.join(appDir, 'index.html'), 'utf8');
  const dom = new JSDOM(html, { runScripts: 'outside-only', url: 'http://127.0.0.1/' });
  dom.window.eval(fs.readFileSync(path.join(appDir, 'game.js'), 'utf8'));
  dom.window.eval(fs.readFileSync(path.join(appDir, 'timer.js'), 'utf8'));
  dom.window.eval(fs.readFileSync(path.join(appDir, 'main.js'), 'utf8'));
  return dom;
}

test('board nodes stay stable and keyboard actions retain focus', () => {
  const dom = loadApp();
  const first = dom.window.document.querySelector('.cell');
  first.focus();
  first.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'f', bubbles: true }));
  assert.equal(dom.window.document.querySelector('.cell'), first);
  assert.equal(first.textContent, '⚑');
  first.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
  assert.equal(dom.window.document.activeElement.dataset.col, '1');
  assert.equal(dom.window.document.querySelectorAll('.cell[tabindex="0"]').length, 1);
});

test('touch mode exposes flagging and reset restores reveal mode', () => {
  const dom = loadApp();
  const flagMode = dom.window.document.querySelector('[data-mode="flag"]');
  flagMode.click();
  dom.window.document.querySelector('.cell').click();
  assert.equal(dom.window.document.getElementById('mine-count').textContent, '009');
  dom.window.document.getElementById('restart-button').click();
  assert.equal(dom.window.document.querySelector('[data-mode="reveal"]').getAttribute('aria-pressed'), 'true');
});

test('difficulty information updates with the selected board', () => {
  const dom = loadApp();
  dom.window.document.querySelector('[data-difficulty="nightmare"]').click();
  assert.equal(dom.window.document.getElementById('difficulty-info').textContent, '30 × 16 / 99 雷');
  assert.equal(dom.window.document.querySelectorAll('.cell').length, 480);
});
