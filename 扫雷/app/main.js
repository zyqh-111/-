(function startApp() {
  const { MinesweeperGame, CELL_STATE, GAME_STATUS } = window.Minesweeper;
  const board = document.getElementById('board');
  const mineCount = document.getElementById('mine-count');
  const timer = document.getElementById('timer');
  const status = document.getElementById('game-status');
  const restartButton = document.getElementById('restart-button');
  const difficultyButtons = [...document.querySelectorAll('[data-difficulty]')];
  let game = new MinesweeperGame('easy');
  let elapsed = 0;
  let timerId = null;

  const padCounter = (value) => String(Math.max(0, Math.min(999, value))).padStart(3, '0');

  function stopTimer() {
    if (timerId !== null) window.clearInterval(timerId);
    timerId = null;
  }

  function startTimer() {
    if (timerId !== null) return;
    timerId = window.setInterval(() => {
      elapsed = Math.min(999, elapsed + 1);
      timer.textContent = padCounter(elapsed);
      if (elapsed === 999) stopTimer();
    }, 1000);
  }

  function statusText() {
    if (game.status === GAME_STATUS.PLAYING) return '游戏中';
    if (game.status === GAME_STATUS.WON) return '胜利！';
    if (game.status === GAME_STATUS.LOST) return '踩雷了';
    return '准备开始';
  }

  function cellDisplay(cell) {
    if (game.status === GAME_STATUS.LOST && cell.isMine) return '●';
    if (game.status === GAME_STATUS.LOST && cell.state === CELL_STATE.FLAGGED && !cell.isMine) return '×';
    if (cell.state === CELL_STATE.FLAGGED) return '⚑';
    if (cell.state === CELL_STATE.REVEALED && cell.adjacentMines > 0) return String(cell.adjacentMines);
    return '';
  }

  function render() {
    board.style.gridTemplateColumns = `repeat(${game.cols}, var(--cell-size))`;
    const fragment = document.createDocumentFragment();
    for (const cell of game.cells.flat()) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'cell';
      button.dataset.row = String(cell.row);
      button.dataset.col = String(cell.col);
      button.setAttribute('role', 'gridcell');
      button.setAttribute('aria-label', `第 ${cell.row + 1} 行，第 ${cell.col + 1} 列`);
      button.textContent = cellDisplay(cell);
      if (cell.state === CELL_STATE.REVEALED) button.classList.add('revealed');
      if (cell.state === CELL_STATE.FLAGGED) button.classList.add('flagged');
      if (game.status === GAME_STATUS.LOST && cell.isMine) button.classList.add('mine');
      if (game.explodedCell === cell) button.classList.add('exploded');
      if (game.status === GAME_STATUS.LOST && cell.state === CELL_STATE.FLAGGED && !cell.isMine) button.classList.add('wrong-flag');
      if (cell.state === CELL_STATE.REVEALED && cell.adjacentMines > 0) button.classList.add(`number-${cell.adjacentMines}`);
      fragment.appendChild(button);
    }
    board.replaceChildren(fragment);
    mineCount.textContent = padCounter(game.remainingMines);
    status.textContent = statusText();
    if (game.status === GAME_STATUS.WON || game.status === GAME_STATUS.LOST) stopTimer();
  }

  function reset(difficulty = game.difficulty) {
    stopTimer();
    elapsed = 0;
    timer.textContent = '000';
    game = new MinesweeperGame(difficulty);
    difficultyButtons.forEach((button) => button.classList.toggle('active', button.dataset.difficulty === difficulty));
    render();
  }

  board.addEventListener('click', (event) => {
    const cellButton = event.target.closest('.cell');
    if (!cellButton) return;
    const wasReady = game.status === GAME_STATUS.READY;
    const changed = game.reveal(Number(cellButton.dataset.row), Number(cellButton.dataset.col));
    if (changed && wasReady && game.status === GAME_STATUS.PLAYING) startTimer();
    render();
  });

  board.addEventListener('contextmenu', (event) => {
    event.preventDefault();
    const cellButton = event.target.closest('.cell');
    if (!cellButton) return;
    game.toggleFlag(Number(cellButton.dataset.row), Number(cellButton.dataset.col));
    render();
  });

  restartButton.addEventListener('click', () => reset());
  difficultyButtons.forEach((button) => button.addEventListener('click', () => reset(button.dataset.difficulty)));
  render();
})();
