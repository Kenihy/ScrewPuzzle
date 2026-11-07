// 명세 20.2 대화 경로 검증
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newGame, toHaerinOpen, toHub, choose, investigate } from './helpers.js';

function suspicionTrail(game, ids) {
  const trail = [game.run.suspicion];
  for (const id of ids) {
    choose(game, id);
    trail.push(game.run.suspicion);
  }
  return trail;
}

test('기본 생존: H01_A → 조사 생략 → DOC_SKIP → B01_B → B02_A → B03_A', () => {
  const { game } = newGame();
  toHub(game, 'H01_A');
  game.finishInvestigation();
  choose(game, 'DOC_SKIP');
  const trail = suspicionTrail(game, ['B01_B', 'B02_A', 'B03_A']);
  assert.deepEqual(trail, [20, 25, 30, 35]);
  assert.equal(game.run.result.endingId, 'END_SURVIVED');
  assert.ok(game.run.clues.includes('C_CASE_01_END'));
});

test('어려움 활용: BA hard → DOC_REQUEST → B01_D → B02_A → B03_C → END_ADVANTAGE', () => {
  const { game } = newGame();
  toHub(game, 'H01_A');
  investigate(game, 'BA', 'hard');
  assert.equal(game.run.focus, 0);
  game.finishInvestigation();
  choose(game, 'DOC_REQUEST');
  assert.equal(game.run.trust.HAERIN, 60);
  assert.ok(game.run.evidence.includes('DOC_LIST'));
  const trail = suspicionTrail(game, ['B01_D', 'B02_A', 'B03_C']);
  assert.deepEqual(trail, [20, 10, 15, 10]);
  assert.equal(game.run.flags.F_PRESERVE_RECORD, true);
  assert.equal(game.run.result.endingId, 'END_ADVANTAGE');
});

test('보통 조합: BA normal + BB normal → DOC_REQUEST → B01_D → B02_D → B03_C → END_ADVANTAGE', () => {
  const { game } = newGame();
  toHub(game, 'H01_A');
  investigate(game, 'BA', 'normal');
  investigate(game, 'BB', 'normal');
  assert.equal(game.run.focus, 0);
  game.finishInvestigation();
  choose(game, 'DOC_REQUEST');
  assert.equal(game.run.trust.HAERIN, 60);
  const trail = suspicionTrail(game, ['B01_D', 'B02_D', 'B03_C']);
  assert.deepEqual(trail, [20, 10, 0, 0]);
  assert.equal(game.run.result.endingId, 'END_ADVANTAGE');
});

test('제거: H01_B → DOC_SKIP → B01_C → B02_B → BOSS_03 진입 없이 END_REMOVED', () => {
  const { game } = newGame();
  toHaerinOpen(game);
  const trail = [game.run.suspicion];
  choose(game, 'H01_B');
  trail.push(game.run.suspicion);
  game.finishTutorial({ skipped: true });
  game.advance();
  game.finishInvestigation();
  choose(game, 'DOC_SKIP');
  choose(game, 'B01_C');
  trail.push(game.run.suspicion);
  const res = game.choose('B02_B');
  trail.push(game.run.suspicion);
  assert.deepEqual(trail, [20, 30, 65, 100]);
  assert.equal(res.reaction.removed, true);
  assert.equal(game.run.nodeId, 'RESULT');
  assert.equal(game.run.result.endingId, 'END_REMOVED');
  assert.equal(game.run.result.cause.choiceId, 'B02_B');
  assert.equal(game.run.result.cause.before.suspicion, 65);
  assert.ok(!game.run.choices.BOSS_03, 'BOSS_03에 진입하지 않음');
  assert.ok(!game.run.clues.includes('C_CASE_01_END'), '제거 후 보상 없음');
});

test('경계 생존: H01_A → DOC_SKIP → B01_C → B02_A → B03_D → END_WATCHED', () => {
  const { game } = newGame();
  toHub(game, 'H01_A');
  game.finishInvestigation();
  choose(game, 'DOC_SKIP');
  const trail = suspicionTrail(game, ['B01_C', 'B02_A', 'B03_D']);
  assert.deepEqual(trail, [20, 55, 60, 75]);
  assert.equal(game.run.flags.F_CUT_CONTACT, true);
  assert.equal(game.run.result.endingId, 'END_WATCHED');
  assert.ok(game.run.clues.includes('C_CASE_01_END'));
});

test('쉬움만 조사: HA/HB/BA/BB easy → DOC_REQUEST → B01_D → B02_A → B03_A → END_SURVIVED', () => {
  const { game } = newGame();
  toHub(game, 'H01_A');
  for (const t of ['HA', 'HB', 'BA', 'BB']) investigate(game, t, 'easy');
  assert.equal(game.run.focus, 0);
  assert.deepEqual([...game.run.clues].sort(), ['C_BA_1', 'C_BB_1', 'C_HA_1', 'C_HB_1']);
  game.finishInvestigation();
  choose(game, 'DOC_REQUEST');
  const trail = suspicionTrail(game, ['B01_D', 'B02_A', 'B03_A']);
  assert.deepEqual(trail, [20, 10, 15, 20]);
  assert.equal(game.run.result.endingId, 'END_SURVIVED');
  assert.ok(game.run.clues.includes('C_CASE_01_END'), '공통 핵심 단서');
});

test('C_HA_3를 이미 가진 경우 공통 단서는 "다시 확인"으로 표시된다', () => {
  const { game } = newGame();
  toHub(game, 'H01_A');
  investigate(game, 'HA', 'hard');
  game.finishInvestigation();
  choose(game, 'DOC_SKIP');
  for (const id of ['B01_B', 'B02_A', 'B03_A']) choose(game, id);
  assert.equal(game.run.result.caseClue.reconfirmed, true);
});

test('신뢰도 45 미만이면 DOC_REQUEST는 거절 대사만 나오고 증거·신뢰 변화가 없다', () => {
  const { game } = newGame();
  toHub(game, 'H01_B'); // 신뢰 35
  game.finishInvestigation();
  const res = game.choose('DOC_REQUEST');
  assert.equal(res.reaction.outcomeId, 'REFUSED');
  assert.equal(game.run.trust.HAERIN, 35);
  assert.deepEqual(game.run.evidence, []);
  game.ackReaction();
  assert.equal(game.run.nodeId, 'BOSS_01', '거절되어도 회장 대화로 진행');
});

test('의심도 구간 진입 반응은 한 번만 표시하고 별도 수치를 더하지 않는다', () => {
  const { game } = newGame();
  toHub(game, 'H01_C'); // 40 → 관찰 대상
  assert.equal(game.run.suspicion, 40);
  assert.deepEqual(game.run.bandsShown, ['watched']);
  game.finishInvestigation();
  choose(game, 'DOC_SKIP');
  const r = game.choose('B01_C'); // 75 → 제거 검토
  assert.equal(r.reaction.bandEntered, 'review');
  assert.equal(game.run.suspicion, 75);
});
