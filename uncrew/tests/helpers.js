import { Game } from '../src/core/game.js';
import { createMemoryStorage } from '../src/core/save.js';
import { getBoard } from '../src/data/puzzles.js';

export function newGame({ storage = createMemoryStorage(), runIds } = {}) {
  let n = 0;
  const ids = runIds || [];
  const game = new Game({ storage, now: () => 1_700_000_000_000 + n * 1000, makeRunId: () => ids[n] || `test-run-${++n}` });
  return { game, storage };
}

/** 부록 해법을 실제 Game.puzzleMove로 재생합니다. */
export function playSolution(game) {
  const p = game.run.activePuzzle;
  const board = getBoard(p.boardId);
  let last;
  for (const [src, dst] of board.solution) {
    last = game.puzzleMove(src, dst);
    if (!last.ok) throw new Error(`move ${src}->${dst} rejected: ${last.reason}`);
  }
  return last;
}

/** 새 게임을 시작해 HAERIN_OPEN까지 진행 */
export function toHaerinOpen(game) {
  game.newGame();
  game.advance(); // PROLOGUE → RETURN
  game.advance(); // RETURN → HAERIN_OPEN
}

/** 선택 후 반응 확인까지 */
export function choose(game, id) {
  const res = game.choose(id);
  if (!res.ok) throw new Error(`choice ${id} rejected: ${res.reason}`);
  game.ackReaction();
  return res;
}

/** HAERIN_OPEN 선택 → 튜토리얼 건너뛰기 → 인사 장면 → 허브 */
export function toHub(game, haerinChoice = 'H01_A') {
  toHaerinOpen(game);
  choose(game, haerinChoice);
  game.finishTutorial({ skipped: true });
  game.advance(); // OFFICE_ENTER → MEMORY_HUB
}

export function investigate(game, topicId, difficulty) {
  const r = game.startTopic(topicId, difficulty);
  if (!r.ok) throw new Error(`startTopic ${topicId}/${difficulty}: ${r.reason}`);
  playSolution(game);
  game.closeReward();
}
