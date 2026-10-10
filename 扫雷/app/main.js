(function startApp() {
  const { MinesweeperGame, CELL_STATE, GAME_STATUS, DIFFICULTIES } = window.Minesweeper;
  const { GameTimer, formatElapsed } = window.MinesweeperTimer;
  const board = document.getElementById('board');
  const mineCount = document.getElementById('mine-count');
  const timerDisplay = document.getElementById('timer');
  const status = document.getElementById('game-status');
  const difficultyInfo = document.getElementById('difficulty-info');
  const restartButton = document.getElementById('restart-button');
  const difficultyButtons = [...document.querySelectorAll('[data-difficulty]')];
  const modeButtons = [...document.querySelectorAll('[data-mode]')];
  const clock = new GameTimer();
  let game = new MinesweeperGame('easy');
  let mode = 'reveal';
  let timerId = null;
  let cellNodes = [];
  let activeIndex = 0;
  let pointerStart = null;
  let suppressClick = false;

  function updateTimer() { timerDisplay.textContent = formatElapsed(clock.elapsedSeconds()); }
  function stopTimer() {
    clock.stop();
    if (timerId !== null) window.clearInterval(timerId);
    timerId = null;
    updateTimer();
  }
  function startTimer() {
    clock.start();
    if (timerId === null) timerId = window.setInterval(updateTimer, 250);
    updateTimer();
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
  function cellLabel(cell) {
    const position = `第 ${cell.row + 1} 行，第 ${cell.col + 1} 列`;
    if (game.status === GAME_STATUS.LOST && cell.isMine) return `${position}，地雷`;
    if (game.status === GAME_STATUS.LOST && cell.state === CELL_STATE.FLAGGED && !cell.isMine) return `${position}，错误旗帜`;
    if (cell.state === CELL_STATE.FLAGGED) return `${position}，已插旗`;
    if (cell.state !== CELL_STATE.REVEALED) return `${position}，未翻开`;
    return cell.adjacentMines === 0 ? `${position}，空白` : `${position}，周围 ${cell.adjacentMines} 个雷`;
  }
  function createBoard() {
    board.style.gridTemplateColumns = `repeat(${game.cols}, var(--cell-size))`;
    board.setAttribute('aria-rowcount', String(game.rows));
    board.setAttribute('aria-colcount', String(game.cols));
    const fragment = document.createDocumentFragment();
    cellNodes = game.cells.flat().map((cell, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'cell';
      button.dataset.row = String(cell.row);
      button.dataset.col = String(cell.col);
      button.setAttribute('role', 'gridcell');
      button.setAttribute('aria-rowindex', String(cell.row + 1));
      button.setAttribute('aria-colindex', String(cell.col + 1));
      button.tabIndex = index === activeIndex ? 0 : -1;
      fragment.appendChild(button);
      return button;
    });
    board.replaceChildren(fragment);
  }
  function updateBoard() {
    const cells = game.cells.flat();
    for (let index = 0; index < cellNodes.length; index += 1) {
      const cell = cells[index];
      const button = cellNodes[index];
      button.className = 'cell';
      button.textContent = cellDisplay(cell);
      button.setAttribute('aria-label', cellLabel(cell));
      button.tabIndex = index === activeIndex ? 0 : -1;
      if (cell.state === CELL_STATE.REVEALED) button.classList.add('revealed');
      if (cell.state === CELL_STATE.FLAGGED) button.classList.add('flagged');
      if (game.status === GAME_STATUS.LOST && cell.isMine) button.classList.add('mine');
      if (game.explodedCell === cell) button.classList.add('exploded');
      if (game.status === GAME_STATUS.LOST && cell.state === CELL_STATE.FLAGGED && !cell.isMine) button.classList.add('wrong-flag');
      if (cell.state === CELL_STATE.REVEALED && cell.adjacentMines > 0) button.classList.add(`number-${cell.adjacentMines}`);
    }
  }
  function updateChrome() {
    const config = DIFFICULTIES[game.difficulty];
    mineCount.textContent = formatElapsed(game.remainingMines);
    status.textContent = statusText();
    difficultyInfo.textContent = `${config.cols} × ${config.rows} / ${config.mines} 雷`;
    difficultyButtons.forEach((button) => {
      const selected = button.dataset.difficulty === game.difficulty;
      button.classList.toggle('active', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    modeButtons.forEach((button) => {
      const selected = button.dataset.mode === mode;
      button.classList.toggle('active', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    if (game.status === GAME_STATUS.WON || game.status === GAME_STATUS.LOST) stopTimer();
  }
  function render() { updateBoard(); updateChrome(); }
  function setActive(index, focus = false) {
    activeIndex = Math.max(0, Math.min(cellNodes.length - 1, index));
    cellNodes.forEach((node, nodeIndex) => { node.tabIndex = nodeIndex === activeIndex ? 0 : -1; });
    if (focus) cellNodes[activeIndex].focus();
  }
  function actOnCell(button, requestedMode = mode) {
    const row = Number(button.dataset.row);
    const col = Number(button.dataset.col);
    setActive((row * game.cols) + col);
    if (requestedMode === 'flag') game.toggleFlag(row, col);
    else {
      const wasReady = game.status === GAME_STATUS.READY;
      const changed = game.reveal(row, col);
      if (changed && wasReady) startTimer();
    }
    render();
    if (document.activeElement === button) button.focus();
  }
  function reset(difficulty = game.difficulty) {
    stopTimer();
    clock.reset();
    updateTimer();
    mode = 'reveal';
    activeIndex = 0;
    game = new MinesweeperGame(difficulty);
    createBoard();
    render();
  }

  board.addEventListener('click', (event) => {
    const button = event.target.closest('.cell');
    if (!button || suppressClick) { suppressClick = false; return; }
    actOnCell(button);
  });
  board.addEventListener('contextmenu', (event) => {
    event.preventDefault();
    const button = event.target.closest('.cell');
    if (button) actOnCell(button, 'flag');
  });
  board.addEventListener('pointerdown', (event) => { pointerStart = { x: event.clientX, y: event.clientY }; });
  board.addEventListener('pointerup', (event) => {
    if (!pointerStart) return;
    suppressClick = Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y) > 8;
    pointerStart = null;
  });
  board.addEventListener('keydown', (event) => {
    const button = event.target.closest('.cell');
    if (!button) return;
    const row = Number(button.dataset.row);
    const col = Number(button.dataset.col);
    const moves = {
      ArrowUp: [Math.max(0, row - 1), col], ArrowDown: [Math.min(game.rows - 1, row + 1), col],
      ArrowLeft: [row, Math.max(0, col - 1)], ArrowRight: [row, Math.min(game.cols - 1, col + 1)],
    };
    if (moves[event.key]) {
      event.preventDefault();
      const [nextRow, nextCol] = moves[event.key];
      setActive((nextRow * game.cols) + nextCol, true);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      actOnCell(button, 'reveal');
    } else if (event.key.toLowerCase() === 'f') {
      event.preventDefault();
      actOnCell(button, 'flag');
    }
  });
  restartButton.addEventListener('click', () => reset());
  difficultyButtons.forEach((button) => button.addEventListener('click', () => reset(button.dataset.difficulty)));
  modeButtons.forEach((button) => button.addEventListener('click', () => { mode = button.dataset.mode; updateChrome(); }));
  document.addEventListener('visibilitychange', updateTimer);
  reset();
})();
