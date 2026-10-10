(function initTimer(globalScope, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  globalScope.MinesweeperTimer = api;
})(typeof globalThis !== 'undefined' ? globalThis : window, function createTimerApi() {
  const formatElapsed = (seconds) => String(Math.max(0, Math.min(999, Math.floor(seconds)))).padStart(3, '0');

  class GameTimer {
    constructor(now = () => performance.now()) { this.now = now; this.reset(); }
    start() { if (this.startedAt === null && this.stoppedAt === null) this.startedAt = this.now(); }
    stop() { if (this.startedAt !== null && this.stoppedAt === null) this.stoppedAt = this.now(); }
    reset() { this.startedAt = null; this.stoppedAt = null; }
    elapsedSeconds() {
      if (this.startedAt === null) return 0;
      const end = this.stoppedAt === null ? this.now() : this.stoppedAt;
      return Math.min(999, Math.max(0, Math.floor((end - this.startedAt) / 1000)));
    }
  }

  return { GameTimer, formatElapsed };
});
