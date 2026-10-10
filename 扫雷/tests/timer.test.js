const test = require('node:test');
const assert = require('node:assert/strict');

const { GameTimer, formatElapsed } = require('../app/timer.js');

test('timer derives elapsed seconds from monotonic time instead of callback count', () => {
  let now = 1000;
  const timer = new GameTimer(() => now);
  timer.start();
  now = 11250;
  assert.equal(timer.elapsedSeconds(), 10);
});

test('stopping freezes elapsed time and reset clears it', () => {
  let now = 0;
  const timer = new GameTimer(() => now);
  timer.start();
  now = 5500;
  timer.stop();
  now = 20000;
  assert.equal(timer.elapsedSeconds(), 5);
  timer.reset();
  assert.equal(timer.elapsedSeconds(), 0);
});

test('elapsed display is clamped to three digits', () => {
  assert.equal(formatElapsed(0), '000');
  assert.equal(formatElapsed(10), '010');
  assert.equal(formatElapsed(1005), '999');
});
