(function initMinesweeper(globalScope, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  globalScope.Minesweeper = api;
})(typeof globalThis !== 'undefined' ? globalThis : window, function createApi() {
  const DIFFICULTIES = Object.freeze({
    easy: Object.freeze({ label: '简单', rows: 9, cols: 9, mines: 10 }),
    hard: Object.freeze({ label: '困难', rows: 16, cols: 16, mines: 40 }),
    nightmare: Object.freeze({ label: '噩梦', rows: 16, cols: 30, mines: 99 }),
  });

  const CELL_STATE = Object.freeze({ COVERED: 'covered', REVEALED: 'revealed', FLAGGED: 'flagged' });
  const GAME_STATUS = Object.freeze({ READY: 'ready', PLAYING: 'playing', WON: 'won', LOST: 'lost' });

  class MinesweeperGame {
    constructor(difficulty = 'easy', random = Math.random) {
      this.random = random;
      this.reset(difficulty);
    }

    reset(difficulty = this.difficulty || 'easy') {
      if (!DIFFICULTIES[difficulty]) throw new Error(`Unknown difficulty: ${difficulty}`);
      const config = DIFFICULTIES[difficulty];
      this.difficulty = difficulty;
      this.rows = config.rows;
      this.cols = config.cols;
      this.mineCount = config.mines;
      this.status = GAME_STATUS.READY;
      this.flagsPlaced = 0;
      this.revealedCount = 0;
      this.minesPlaced = false;
      this.explodedCell = null;
      this.cells = Array.from({ length: this.rows }, (_, row) =>
        Array.from({ length: this.cols }, (_, col) => ({
          row, col, isMine: false, adjacentMines: 0, state: CELL_STATE.COVERED,
        })),
      );
      return this;
    }

    get remainingMines() {
      return this.mineCount - this.flagsPlaced;
    }

    getCell(row, col) {
      return this.isValid(row, col) ? this.cells[row][col] : null;
    }

    isValid(row, col) {
      return Number.isInteger(row) && Number.isInteger(col)
        && row >= 0 && row < this.rows && col >= 0 && col < this.cols;
    }

    neighbors(row, col) {
      const result = [];
      for (let rowOffset = -1; rowOffset <= 1; rowOffset += 1) {
        for (let colOffset = -1; colOffset <= 1; colOffset += 1) {
          if (rowOffset === 0 && colOffset === 0) continue;
          const cell = this.getCell(row + rowOffset, col + colOffset);
          if (cell) result.push(cell);
        }
      }
      return result;
    }

    placeMines(safeRow, safeCol) {
      const candidates = this.cells.flat().filter((cell) => cell.row !== safeRow || cell.col !== safeCol);
      for (let count = 0; count < this.mineCount; count += 1) {
        const rawIndex = Math.floor(this.random() * candidates.length);
        const index = Math.max(0, Math.min(rawIndex, candidates.length - 1));
        candidates.splice(index, 1)[0].isMine = true;
      }
      for (const cell of this.cells.flat()) {
        if (!cell.isMine) cell.adjacentMines = this.neighbors(cell.row, cell.col).filter((item) => item.isMine).length;
      }
      this.minesPlaced = true;
    }

    toggleFlag(row, col) {
      if (this.status === GAME_STATUS.WON || this.status === GAME_STATUS.LOST) return false;
      const cell = this.getCell(row, col);
      if (!cell || cell.state === CELL_STATE.REVEALED) return false;
      if (cell.state === CELL_STATE.FLAGGED) {
        cell.state = CELL_STATE.COVERED;
        this.flagsPlaced -= 1;
        return true;
      }
      if (this.flagsPlaced >= this.mineCount) return false;
      cell.state = CELL_STATE.FLAGGED;
      this.flagsPlaced += 1;
      return true;
    }

    reveal(row, col) {
      if (this.status === GAME_STATUS.WON || this.status === GAME_STATUS.LOST) return false;
      const start = this.getCell(row, col);
      if (!start || start.state !== CELL_STATE.COVERED) return false;
      if (!this.minesPlaced) {
        this.placeMines(row, col);
        this.status = GAME_STATUS.PLAYING;
      }
      if (start.isMine) {
        start.state = CELL_STATE.REVEALED;
        this.explodedCell = start;
        this.status = GAME_STATUS.LOST;
        return true;
      }

      const queue = [start];
      const queued = new Set([`${row}:${col}`]);
      while (queue.length > 0) {
        const cell = queue.shift();
        if (cell.state !== CELL_STATE.COVERED || cell.isMine) continue;
        cell.state = CELL_STATE.REVEALED;
        this.revealedCount += 1;
        if (cell.adjacentMines !== 0) continue;
        for (const neighbor of this.neighbors(cell.row, cell.col)) {
          const key = `${neighbor.row}:${neighbor.col}`;
          if (neighbor.state === CELL_STATE.COVERED && !neighbor.isMine && !queued.has(key)) {
            queued.add(key);
            queue.push(neighbor);
          }
        }
      }

      if (this.revealedCount === (this.rows * this.cols) - this.mineCount) this.finishWin();
      return true;
    }

    finishWin() {
      this.status = GAME_STATUS.WON;
      for (const cell of this.cells.flat()) {
        if (cell.isMine && cell.state !== CELL_STATE.FLAGGED) cell.state = CELL_STATE.FLAGGED;
      }
      this.flagsPlaced = this.mineCount;
    }
  }

  return { DIFFICULTIES, CELL_STATE, GAME_STATUS, MinesweeperGame };
});
