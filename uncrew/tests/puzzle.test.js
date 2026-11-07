// 명세 20.1 퍼즐 필수 검증
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PUZZLES, getBoard } from '../src/data/puzzles.js';
import * as PE from '../src/core/puzzleEngine.js';
import { solve } from '../src/core/solver.js';
import { newGame, toHub } from './helpers.js';

const easy = getBoard('SCREW_EASY_01');
const normal = getBoard('SCREW_NORMAL_01');
const hard = getBoard('SCREW_HARD_01');

test('부록 3개 보드의 해법을 PuzzleEngine으로 재생하면 모두 클리어되고, 나사 수가 유지된다', () => {
  for (const board of PUZZLES) {
    let s = PE.createPuzzleState(board);
    const count = s.screws.length;
    for (const [src, dst] of board.solution) {
      const r = PE.applyMove(board, s, src, dst);
      assert.ok(r.ok, `${board.id} ${src}->${dst}: ${r.reason}`);
      s = r.state;
      assert.equal(s.screws.length, count, `${board.id} 나사 수 변화`);
    }
    assert.equal(s.status, 'cleared', board.id);
    assert.deepEqual(s.activePlates, []);
    assert.equal(s.moves, board.solution.length);
    assert.ok(s.moves <= board.moveLimit);
  }
});

test('부록 해법 길이(4/8/12)는 너비 우선 탐색 최단 해법과 같다', () => {
  assert.equal(solve(easy, PE.createPuzzleState(easy)).length, 4);
  assert.equal(solve(normal, PE.createPuzzleState(normal)).length, 8);
  assert.equal(solve(hard, PE.createPuzzleState(hard)).length, 12);
});

test('활성 판에 가려진 나사는 집을 수 없고, 가려진 구멍에 넣을 수 없다', () => {
  const s = PE.createPuzzleState(easy);
  // c는 판 A(위)에 가려진 B의 나사
  assert.equal(PE.canSelect(easy, s, 'c'), false);
  assert.equal(PE.checkMove(easy, s, 'c', 'g').reason, PE.REASONS.SRC_BLOCKED);
  // 보통 보드: i는 판 B에 가려짐. 다른 나사를 i로 넣을 수 없음 (i에 나사가 있으므로 먼저 빈 상태를 만든다)
  let n = PE.createPuzzleState(normal);
  n = { ...n, screws: n.screws.filter((h) => h !== 'i') };
  assert.equal(PE.checkMove(normal, n, 'a', 'i').reason, PE.REASONS.DST_BLOCKED);
});

test('같은 구멍, 점유된 구멍, 미등록 구멍으로는 이동할 수 없다', () => {
  const s = PE.createPuzzleState(easy);
  assert.equal(PE.checkMove(easy, s, 'a', 'a').reason, PE.REASONS.SAME_HOLE);
  assert.equal(PE.checkMove(easy, s, 'a', 'b').reason, PE.REASONS.OCCUPIED);
  assert.equal(PE.checkMove(easy, s, 'a', 'zz').reason, PE.REASONS.UNKNOWN_HOLE);
  assert.equal(PE.checkMove(easy, s, 'a', PE.TEMP_HOLE_ID).reason, PE.REASONS.UNKNOWN_HOLE);
  assert.equal(PE.checkMove(easy, s, 'g', 'h').reason, PE.REASONS.NO_SCREW);
  const r = PE.applyMove(easy, s, 'a', 'b');
  assert.equal(r.ok, false);
  assert.equal(r.state, s, '거절된 이동은 상태를 바꾸지 않는다');
});

test('공유 anchorHole의 나사를 옮기면 관련 판 모두의 지지 수가 갱신된다', () => {
  // 보통 보드에서 d는 판 B와 C가 공유
  let s = PE.createPuzzleState(normal);
  for (const [a, b] of [['a', 'g'], ['b', 'h'], ['c', 'k']]) s = PE.applyMove(normal, s, a, b).state;
  assert.ok(s.activePlates.includes('B') && s.activePlates.includes('C'));
  assert.equal(PE.supportCount(normal, s, 'B'), 1);
  assert.equal(PE.supportCount(normal, s, 'C'), 3);
  const r = PE.applyMove(normal, s, 'd', 'a');
  assert.deepEqual(r.removed, ['B'], 'B는 지지 0이 되어 제거');
  assert.equal(PE.supportCount(normal, r.state, 'C'), 2, 'C의 지지도 함께 감소');
});

test('판 제거 전의 빈 anchorHole에 다시 넣으면 판이 다시 지지된다', () => {
  let s = PE.createPuzzleState(easy);
  s = PE.applyMove(easy, s, 'a', 'g').state;
  assert.equal(PE.supportCount(easy, s, 'A'), 1);
  s = PE.applyMove(easy, s, 'g', 'a').state;
  assert.equal(PE.supportCount(easy, s, 'A'), 2);
  s = PE.applyMove(easy, s, 'b', 'h').state;
  assert.ok(s.activePlates.includes('A'), 'a에 다시 들어간 나사가 A를 지지');
});

test('한 번 제거된 판은 재삽입으로 부활하지 않는다', () => {
  let s = PE.createPuzzleState(easy);
  s = PE.applyMove(easy, s, 'a', 'g').state;
  s = PE.applyMove(easy, s, 'b', 'h').state;
  assert.ok(!s.activePlates.includes('A'));
  s = PE.applyMove(easy, s, 'g', 'a').state;
  assert.ok(!s.activePlates.includes('A'));
});

test('마지막 허용 이동에서 모든 판을 제거하면 실패보다 클리어가 우선한다', () => {
  let s = PE.createPuzzleState(easy);
  s = { ...s, moveLimit: 4 };
  for (const [a, b] of easy.solution) s = PE.applyMove(easy, s, a, b).state;
  assert.equal(s.moves, 4);
  assert.equal(s.status, 'cleared');
});

test('이동 한도에 도달했는데 판이 남으면 실패하고, 이후 이동은 거절된다', () => {
  let s = PE.createPuzzleState(easy);
  // a↔g를 오가며 8회 소비
  for (let i = 0; i < 8; i++) s = PE.applyMove(easy, s, i % 2 ? 'g' : 'a', i % 2 ? 'a' : 'g').state;
  assert.equal(s.status, 'failed');
  assert.equal(PE.checkMove(easy, s, 'b', 'h').reason, PE.REASONS.NOT_PLAYING);
});

test('undo로 제거된 판·구멍 가림·나사 위치·이동 횟수가 모두 복원된다', () => {
  let s = PE.createPuzzleState(easy);
  s = PE.applyMove(easy, s, 'a', 'g').state;
  const before = structuredClone(s);
  const r = PE.applyMove(easy, s, 'b', 'h');
  assert.deepEqual(r.removed, ['A']);
  assert.equal(PE.isBlocked(easy, r.state, 'c'), false);
  const u = PE.applyUndo(easy, r.state);
  assert.ok(u.ok);
  assert.deepEqual(u.state.screws, before.screws);
  assert.deepEqual(u.state.activePlates, before.activePlates);
  assert.equal(u.state.moves, before.moves);
  assert.equal(PE.isBlocked(easy, u.state, 'c'), true, '가림 복원');
});

test('임시 구멍의 나사는 어떤 판도 지지하지 않는다', () => {
  let s = PE.createPuzzleState(easy);
  s = PE.applyMove(easy, s, 'a', 'g').state;
  s = PE.applyTempHole(easy, s).state;
  assert.equal(s.undoStack.length, 0, '임시 구멍 생성 시 undo 기록 비움');
  assert.equal(s.moves, 1, '임시 구멍 생성은 이동 횟수를 쓰지 않음');
  const r = PE.applyMove(easy, s, 'b', PE.TEMP_HOLE_ID);
  assert.ok(r.ok);
  assert.deepEqual(r.removed, ['A'], 'T로 옮긴 나사는 A를 지지하지 않음');
  assert.equal(PE.applyTempHole(easy, r.state).reason, PE.REASONS.TEMP_HOLE_USED, '보드당 1회');
});

test('보드 재도전: 임시 구멍은 유지되고 비워지며 배치는 초기화된다', () => {
  let s = PE.createPuzzleState(easy);
  s = PE.applyTempHole(easy, s).state;
  s = PE.applyMove(easy, s, 'a', PE.TEMP_HOLE_ID).state;
  const r = PE.resetPuzzle(easy, s);
  assert.equal(r.tempHole, true);
  assert.ok(!r.screws.includes(PE.TEMP_HOLE_ID));
  assert.deepEqual(r.screws, easy.screws);
  assert.equal(r.moves, 0);
});

test('Game: 잘못된 클릭은 이동 횟수·집중력·아이템을 바꾸지 않는다', () => {
  const { game } = newGame();
  toHub(game);
  game.startTopic('HA', 'easy');
  const snap = JSON.stringify(game.run);
  for (const [a, b] of [['c', 'g'], ['a', 'b'], ['a', 'a'], ['zz', 'g'], ['g', 'h'], ['a', 'T']]) {
    const r = game.puzzleMove(a, b);
    assert.equal(r.ok, false, `${a}->${b}`);
  }
  assert.equal(JSON.stringify(game.run), snap);
});

test('Game: 보드 재도전은 집중력을 다시 쓰지 않고, 소비한 아이템을 복원하지 않는다', () => {
  const { game } = newGame();
  toHub(game);
  game.startTopic('HA', 'easy');
  for (const [a, b] of getBoard('SCREW_EASY_01').solution) game.puzzleMove(a, b);
  game.closeReward();
  assert.equal(game.run.inventory.undo, 1);
  game.startTopic('HB', 'easy');
  const focus = game.run.focus;
  game.puzzleMove('a', 'g');
  assert.ok(game.puzzleUndo().ok);
  assert.equal(game.run.inventory.undo, 0);
  game.puzzleMove('a', 'g');
  assert.ok(game.puzzleRetry().ok);
  assert.equal(game.run.focus, focus);
  assert.equal(game.run.inventory.undo, 0);
  assert.equal(game.run.activePuzzle.moves, 0);
  assert.equal(game.puzzleUndo().reason, 'NO_ITEM');
});
