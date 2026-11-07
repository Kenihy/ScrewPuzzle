// 명세 20.3 보상·저장 필수 검증 + 아이템 규칙(12장)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/core/game.js';
import { createMemoryStorage, SAVE_KEY, CORRUPT_PREFIX } from '../src/core/save.js';
import { TOPICS } from '../src/data/case01.js';
import { DIFFICULTIES } from '../src/data/config.js';
import { newGame, toHub, choose, investigate, playSolution } from './helpers.js';

test('집중력보다 비싼 난이도는 시작할 수 없고, 거절 시 집중력이 줄지 않는다', () => {
  const { game } = newGame();
  toHub(game);
  investigate(game, 'HA', 'normal'); // 4 → 2
  const r = game.startTopic('HB', 'hard');
  assert.equal(r.reason, 'NO_FOCUS');
  assert.equal(game.run.focus, 2);
  assert.equal(game.run.nodeId, 'MEMORY_HUB');
});

test('시작 확인을 연타해도 비용은 한 번만 차감된다', () => {
  const { game } = newGame();
  toHub(game);
  assert.ok(game.startTopic('HA', 'normal').ok);
  assert.equal(game.startTopic('HA', 'normal').ok, false);
  assert.equal(game.startTopic('HB', 'easy').ok, false);
  assert.equal(game.run.focus, 2);
});

test('네 주제 각각 쉬움/보통/어려움에서 1/2/3개 단서와 고정 아이템을 지급한다', () => {
  for (const topicId of Object.keys(TOPICS)) {
    for (const diff of ['easy', 'normal', 'hard']) {
      const { game } = newGame();
      toHub(game);
      game.startTopic(topicId, diff);
      playSolution(game);
      const d = DIFFICULTIES[diff];
      assert.deepEqual(game.run.clues, TOPICS[topicId].clues.slice(0, d.depth), `${topicId}/${diff}`);
      for (const [item, n] of Object.entries(game.run.inventory)) assert.equal(n, d.items[item] || 0, `${topicId}/${diff} ${item}`);
      assert.equal(game.run.nodeId, 'REWARD');
      assert.equal(game.run.focus, 4 - d.cost);
    }
  }
});

test('보상 화면 재진입·새로고침·중복 콜백에도 보상은 한 번만 지급된다', () => {
  const storage = createMemoryStorage();
  const { game } = newGame({ storage });
  toHub(game);
  game.startTopic('BA', 'normal');
  playSolution(game);
  const snapshot = JSON.stringify(game.run);
  // 중복 콜백
  const dup = game.completePuzzle('BA');
  assert.equal(dup.duplicate, true);
  assert.equal(JSON.stringify(game.run), snapshot);
  // 새로고침 = 같은 저장소로 새 Game
  const reloaded = new Game({ storage });
  assert.equal(reloaded.run.nodeId, 'REWARD');
  assert.equal(JSON.stringify(reloaded.run), snapshot);
  reloaded.completePuzzle('BA');
  assert.equal(reloaded.run.clues.length, 2);
  assert.equal(reloaded.run.inventory.undo, 1);
  reloaded.closeReward();
  reloaded.completePuzzle('BA'); // 허브에서 늦게 도착한 콜백
  assert.equal(reloaded.run.nodeId, 'MEMORY_HUB', '중복 콜백이 노드를 되돌리지 않음');
  assert.equal(reloaded.run.inventory.temp_hole, 1);
});

test('실패하거나 포기한 주제의 지급 보상은 0이고, 포기한 주제는 다시 고를 수 없다', () => {
  const { game } = newGame();
  toHub(game);
  game.startTopic('HA', 'easy');
  for (let i = 0; i < 8; i++) game.puzzleMove(i % 2 ? 'g' : 'a', i % 2 ? 'a' : 'g');
  assert.equal(game.run.activePuzzle.status, 'failed');
  assert.deepEqual(game.run.clues, []);
  assert.ok(game.puzzleAbandon().ok);
  assert.deepEqual(game.run.clues, []);
  assert.equal(game.run.inventory.undo, 0);
  assert.equal(game.run.focus, 3, '집중력 환급 없음');
  assert.equal(game.startTopic('HA', 'easy').reason, 'TOPIC_USED');
  assert.ok(game.startTopic('HB', 'easy').ok, '다른 주제는 조사 가능');
});

test('지난 시도 도감의 단서는 이번 시도의 선택지 조건을 충족시키지 않는다', () => {
  const { game } = newGame();
  toHub(game);
  investigate(game, 'BA', 'normal');
  investigate(game, 'BB', 'normal');
  assert.ok(game.meta.codex.includes('C_BB_2'));
  game.retryCase();
  assert.deepEqual(game.run.clues, []);
  assert.ok(game.meta.codex.includes('C_BB_2'), '도감 유지');
  assert.equal(game.clueStatus('C_BB_2'), 'past');
  choose(game, 'H01_A');
  game.finishTutorial({ skipped: true });
  game.advance();
  game.finishInvestigation();
  choose(game, 'DOC_REQUEST');
  choose(game, 'B01_D');
  const views = game.choiceView();
  assert.equal(views.find((v) => v.choice.id === 'B02_D').enabled, false);
  assert.equal(game.choose('B02_D').reason, 'LOCKED');
});

test('저장 후 재접속하면 노드·수치·보드·아이템·선택 잠금이 복원된다', () => {
  const storage = createMemoryStorage();
  const { game } = newGame({ storage });
  toHub(game);
  investigate(game, 'HA', 'easy');
  game.startTopic('BA', 'normal');
  game.puzzleMove('a', 'g');
  game.puzzleMove('b', 'h');
  game.puzzleUndo();
  const before = JSON.parse(JSON.stringify(game.state));
  const g2 = new Game({ storage });
  assert.deepEqual(g2.state.run, before.run);
  assert.equal(g2.run.nodeId, 'PUZZLE');
  assert.deepEqual(g2.run.activePuzzle.screws, before.run.activePuzzle.screws);
  assert.equal(g2.run.choices.HAERIN_OPEN.choiceId, 'H01_A');
  assert.equal(g2.choose('H01_B').ok, false, '이미 지난 선택은 다시 고를 수 없음');
});

test('사건 재도전 후 인벤토리·단서·플래그는 초기화되고 도감·엔딩 기록은 유지된다', () => {
  const { game } = newGame();
  toHub(game);
  investigate(game, 'BA', 'hard');
  game.finishInvestigation();
  choose(game, 'DOC_REQUEST');
  for (const id of ['B01_D', 'B02_A', 'B03_C']) choose(game, id);
  const oldRun = game.run.runId;
  game.retryCase();
  assert.notEqual(game.run.runId, oldRun);
  assert.equal(game.run.nodeId, 'HAERIN_OPEN');
  assert.equal(game.run.suspicion, 20);
  assert.equal(game.run.trust.HAERIN, 50);
  assert.equal(game.run.focus, 4);
  assert.deepEqual(Object.values(game.run.inventory), [0, 0, 0, 0]);
  assert.deepEqual(game.run.clues, []);
  assert.deepEqual(game.run.evidence, []);
  assert.deepEqual(game.run.flags, {});
  assert.deepEqual(game.run.rewardClaims, []);
  assert.ok(game.meta.endingsSeen.includes('END_ADVANTAGE'));
  assert.ok(game.meta.codex.includes('C_BA_3'));
});

test('조건을 충족하지 않은 B03_C는 직접 호출해도 실행되지 않는다', () => {
  const { game } = newGame();
  toHub(game);
  game.finishInvestigation();
  choose(game, 'DOC_REQUEST'); // 전달 목록은 있지만 회장 단서 없음
  choose(game, 'B01_B');
  choose(game, 'B02_A');
  const s = game.run.suspicion;
  const r = game.choose('B03_C');
  assert.equal(r.reason, 'LOCKED');
  assert.equal(game.run.suspicion, s);
  assert.equal(game.run.flags.F_PRESERVE_RECORD, undefined);
});

test('결과 화면에서 다시 불러오거나 선택을 반복해도 핵심 효과는 중복 적용되지 않는다', () => {
  const storage = createMemoryStorage();
  const { game } = newGame({ storage });
  toHub(game);
  game.finishInvestigation();
  choose(game, 'DOC_SKIP');
  for (const id of ['B01_B', 'B02_A']) choose(game, id);
  game.choose('B03_A');
  assert.equal(game.choose('B03_A').ok, false, '연타 무시');
  const snap = JSON.stringify(game.run);
  const g2 = new Game({ storage });
  assert.equal(JSON.stringify(g2.run), snap);
  g2.ackReaction();
  assert.equal(g2.run.suspicion, 35);
  assert.equal(g2.run.clues.filter((c) => c === 'C_CASE_01_END').length, 1);
});

test('깨진 저장은 별도 키로 보관하고 잘못된 수치로 복원하지 않는다', () => {
  const storage = createMemoryStorage();
  const { game } = newGame({ storage });
  toHub(game);
  const data = JSON.parse(storage.getItem(SAVE_KEY));
  data.run.suspicion = 140;
  storage.setItem(SAVE_KEY, JSON.stringify(data));
  const g2 = new Game({ storage });
  assert.equal(g2.run, null);
  assert.equal(g2.loadIssue.kind, 'corrupt');
  assert.ok(storage.keys().some((k) => k.startsWith(CORRUPT_PREFIX)));
  assert.equal(storage.getItem(SAVE_KEY), null);

  storage.setItem(SAVE_KEY, '{not json');
  const g3 = new Game({ storage });
  assert.equal(g3.loadIssue.kind, 'corrupt');
});

test('저장에 실패해도 예외 없이 메모리 상태로 계속 플레이한다', () => {
  const storage = createMemoryStorage();
  storage.setItem = () => {
    throw new Error('QuotaExceededError');
  };
  const game = new Game({ storage });
  game.newGame();
  assert.ok(game.lastSaveError);
  game.advance();
  assert.equal(game.run.nodeId, 'RETURN');
});

test('기억 돋보기: 실제 모순 대상이 있을 때만 1개 소비한다', () => {
  const { game } = newGame();
  toHub(game);
  investigate(game, 'HB', 'hard'); // C_HB_1~3, magnifier 1, rehearsal 1
  game.finishInvestigation();
  // DOCUMENT_ACTION에는 모순 선택지가 없음
  assert.equal(game.useMagnifier().reason, 'NO_TARGET');
  assert.equal(game.run.inventory.magnifier, 1);
  choose(game, 'DOC_REQUEST');
  // BOSS_01: B01_A는 C_HA_1과 모순 → 이번 시도에 C_HA_1이 없으므로 대상 없음
  assert.equal(game.useMagnifier().reason, 'NO_TARGET');
  choose(game, 'B01_D');
  // BOSS_02: B02_C는 C_HB_2와 모순
  const r = game.useMagnifier();
  assert.ok(r.ok);
  assert.equal(r.choiceId, 'B02_C');
  assert.equal(game.run.inventory.magnifier, 0);
  assert.equal(game.choiceView().find((v) => v.choice.id === 'B02_C').magnified.clueId, 'C_HB_2');
});

test('대화 리허설: 방향만 알려 주고, 같은 선택지에 다시 쓰면 추가 소비하지 않는다', () => {
  const { game } = newGame();
  toHub(game);
  investigate(game, 'HA', 'hard');
  game.finishInvestigation();
  choose(game, 'DOC_SKIP');
  const r1 = game.useRehearsal('B01_C');
  assert.deepEqual([r1.ok, r1.direction, r1.reused], [true, 'up', false]);
  assert.equal(game.run.inventory.rehearsal, 0);
  const r2 = game.useRehearsal('B01_C');
  assert.deepEqual([r2.ok, r2.direction, r2.reused], [true, 'up', true]);
  assert.equal(game.useRehearsal('B01_B').reason, 'NO_ITEM');
  assert.equal(game.useRehearsal('B01_D').reason, 'LOCKED', '잠긴 선택지는 대상이 아님');
});

test('튜토리얼은 보상·집중력·아이템·의심도를 바꾸지 않는다', () => {
  const { game } = newGame();
  game.newGame();
  game.advance();
  game.advance();
  choose(game, 'H01_A');
  const before = JSON.stringify({ ...game.run, activePuzzle: null });
  game.startTutorial();
  assert.equal(game.puzzleUndo().reason, 'TUTORIAL_NO_ITEMS');
  playSolution(game);
  assert.equal(game.run.activePuzzle.status, 'cleared');
  game.finishTutorial();
  const after = game.run;
  assert.equal(after.nodeId, 'OFFICE_ENTER');
  assert.equal(after.focus, 4);
  assert.deepEqual(Object.values(after.inventory), [0, 0, 0, 0]);
  assert.deepEqual(after.clues, []);
  assert.equal(after.suspicion, JSON.parse(before).suspicion);
  assert.equal(game.meta.tutorialSeen, true);
});

test('로컬 로그에 주요 이벤트가 기록된다', () => {
  const { game } = newGame();
  toHub(game);
  investigate(game, 'HA', 'easy');
  game.finishInvestigation();
  choose(game, 'DOC_SKIP');
  for (const id of ['B01_B', 'B02_A', 'B03_A']) choose(game, id);
  const types = new Set(game.log.list().map((e) => e.type));
  for (const t of ['case_start', 'topic_start', 'puzzle_move', 'puzzle_clear', 'clue_granted', 'dialogue_choice', 'case_result']) {
    assert.ok(types.has(t), t);
  }
  const ts = game.log.list().find((e) => e.type === 'topic_start');
  assert.deepEqual([ts.focusBefore, ts.focusAfter], [4, 3]);
});
