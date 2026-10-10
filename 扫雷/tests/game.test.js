const test = require('node:test');
const assert = require('node:assert/strict');

const {
  DIFFICULTIES,
  CELL_STATE,
  GAME_STATUS,
  MinesweeperGame,
} = require('../app/game.js');

test('difficulty presets expose the requested board sizes and mine counts', () => {
  assert.deepEqual(DIFFICULTIES.easy, { label: '简单', rows: 9, cols: 9, mines: 10 });
  assert.deepEqual(DIFFICULTIES.hard, { label: '困难', rows: 16, cols: 16, mines: 40 });
  assert.deepEqual(DIFFICULTIES.nightmare, { label: '噩梦', rows: 16, cols: 30, mines: 99 });
});

test('first reveal is safe and places the exact mine count', () => {
  const game = new MinesweeperGame('easy', () => 0);
  game.reveal(0, 0);

  assert.equal(game.getCell(0, 0).isMine, false);
  assert.equal(game.cells.flat().filter((cell) => cell.isMine).length, 10);
  assert.equal(game.status, GAME_STATUS.PLAYING);
});

test('adjacent mine counts include all eight neighboring positions', () => {
  const game = new MinesweeperGame('easy', () => 0);
  game.reveal(8, 8);

  assert.equal(game.getCell(0, 1).isMine, true);
  assert.equal(game.getCell(1, 2).adjacentMines, 3);
  assert.equal(game.getCell(2, 0).adjacentMines, 0);
});

test('empty-area expansion keeps flagged cells covered', () => {
  const game = new MinesweeperGame('easy', () => 0.999999);
  assert.equal(game.toggleFlag(0, 1), true);
  game.reveal(0, 0);

  assert.equal(game.getCell(0, 1).state, CELL_STATE.FLAGGED);
  assert.equal(game.getCell(0, 0).state, CELL_STATE.REVEALED);
});

test('flag count cannot exceed the mine count', () => {
  const game = new MinesweeperGame('easy');
  for (let index = 0; index < 10; index += 1) {
    assert.equal(game.toggleFlag(Math.floor(index / 9), index % 9), true);
  }

  assert.equal(game.toggleFlag(2, 0), false);
  assert.equal(game.flagsPlaced, 10);
  assert.equal(game.remainingMines, 0);
});

test('revealing a mine loses the game and blocks further actions', () => {
  const game = new MinesweeperGame('easy', () => 0);
  game.reveal(2, 0);
  assert.equal(game.getCell(0, 0).isMine, true);

  game.reveal(0, 0);
  assert.equal(game.status, GAME_STATUS.LOST);
  assert.equal(game.toggleFlag(5, 5), false);
  assert.equal(game.reveal(5, 5), false);
});

test('revealing every non-mine cell wins and flags all mines', () => {
  const game = new MinesweeperGame('easy', () => 0);
  game.reveal(8, 8);

  for (let row = 0; row < game.rows; row += 1) {
    for (let col = 0; col < game.cols; col += 1) {
      if (!game.getCell(row, col).isMine) game.reveal(row, col);
    }
  }

  assert.equal(game.status, GAME_STATUS.WON);
  assert.equal(game.flagsPlaced, 10);
  assert.equal(game.cells.flat().filter((cell) => cell.isMine && cell.state === CELL_STATE.FLAGGED).length, 10);
});

test('invalid coordinates are ignored without changing the game', () => {
  const game = new MinesweeperGame('easy');
  assert.equal(game.reveal(-1, 0), false);
  assert.equal(game.toggleFlag(99, 99), false);
  assert.equal(game.status, GAME_STATUS.READY);
});
