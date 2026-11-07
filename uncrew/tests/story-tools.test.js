// 대사 기록(백로그) · 단서 작동 위치 · 안내 데이터
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildTranscript } from '../src/core/transcript.js';
import { clueUsage, requirementTree } from '../src/core/clueInfo.js';
import { CLUES, NODES, SITUATION, LIFE_GOALS } from '../src/data/case01.js';
import { GUIDE } from '../src/data/guide.js';
import { DEPTH_INFO } from '../src/data/config.js';
import { newGame, toHub, toHaerinOpen, choose } from './helpers.js';

const texts = (entries) => entries.filter((e) => e.kind === 'line').map((e) => e.line.text || e.line.narr || e.line.card);

test('대사 기록: 선택 화면에서 앞서 오간 대사와 내 대답·수치 변화를 모두 다시 볼 수 있다', () => {
  const { game } = newGame();
  toHub(game, 'H01_A');
  game.finishInvestigation();
  choose(game, 'DOC_SKIP');
  choose(game, 'B01_B');
  // 지금은 BOSS_02의 질문을 다 읽고 선택지를 보는 중
  const log = buildTranscript(game.run, { lineIdx: NODES.BOSS_02.lines.length - 1 });
  const t = texts(log);
  assert.ok(t.includes('어제 윤 변호사에게 무슨 서류를 줬지?'), '이전 장면의 회장 질문');
  assert.ok(t.includes('재단 결산이라.'), '내 대답에 대한 반응');
  assert.ok(t.includes('그쪽에서 다른 자료를 요구하지는 않았나?'), '지금 질문');
  const mine = log.filter((e) => e.kind === 'choice').map((e) => e.choiceId);
  assert.deepEqual(mine, ['H01_A', 'DOC_SKIP', 'B01_B']);
  const b01 = log.find((e) => e.choiceId === 'B01_B').record;
  assert.deepEqual([b01.before.suspicion, b01.after.suspicion], [20, 25]);
  assert.ok(t.includes('대규모 승계 작업이 끝난 밤. 열흘 만에 처음으로 사무실 불을 끄고 나왔다.'), '새 게임은 프롤로그부터 기록');
});

test('대사 기록: 아직 보지 않은 줄은 넣지 않는다', () => {
  const { game } = newGame();
  toHaerinOpen(game);
  const t0 = texts(buildTranscript(game.run, { lineIdx: 0 }));
  assert.ok(t0.includes(NODES.HAERIN_OPEN.lines[0].narr));
  assert.ok(!t0.includes(NODES.HAERIN_OPEN.lines[1].text));
  // 반응을 읽는 중: 화면 0번 줄은 내 대답이므로 반응 대사는 lineIdx개까지만
  game.choose('H01_B');
  const t1 = texts(buildTranscript(game.run, { lineIdx: 1 }));
  assert.ok(t1.includes('그녀의 눈빛이 단번에 식는다.'));
  assert.ok(!t1.includes('감시라니요. 회장님이 물으시는 건 업무예요, 실장님.'));
});

test('대사 기록: 제거로 끝나면 보지 못한 이후 장면은 넣지 않고, 재도전은 체크포인트부터 기록한다', () => {
  const { game } = newGame();
  toHub(game, 'H01_B');
  game.finishInvestigation();
  choose(game, 'DOC_SKIP');
  choose(game, 'B01_C');
  choose(game, 'B02_B');
  const log = buildTranscript(game.run);
  assert.ok(!log.some((e) => e.nodeId === 'BOSS_03'));
  assert.ok(texts(log).includes('무진아. 들어와라.'), '제거 장면 대사 포함');
  game.retryCase();
  const first = buildTranscript(game.run, { lineIdx: 0 }).find((e) => e.kind === 'scene');
  assert.equal(first.nodeId, 'HAERIN_OPEN');
});

test('단서 작동 위치: 선택지 조건·모순·관련 표시를 콘텐츠 데이터에서 찾는다', () => {
  assert.deepEqual(clueUsage('C_BB_2').unlocks.map((x) => x.choiceId), ['B02_D', 'B03_C']);
  assert.deepEqual(clueUsage('C_HA_1').contradicts.map((x) => x.choiceId), ['H01_C', 'B01_A']);
  assert.deepEqual(clueUsage('C_HB_1').related.map((x) => x.choiceId), ['DOC_REQUEST']);
  assert.deepEqual(clueUsage('DOC_LIST', { evidence: true }).unlocks.map((x) => x.choiceId), ['B01_D', 'B02_D', 'B03_C']);
  const run = { clues: ['C_BA_2'], evidence: ['DOC_LIST'], flags: {}, trust: { HAERIN: 50 }, suspicion: 20 };
  const tree = requirementTree(NODES.BOSS_03.choices.find((c) => c.id === 'B03_C').requires, run);
  assert.equal(tree.ok, false);
  assert.equal(tree.items[0].ok, true, '전달 목록 ✓');
  assert.equal(tree.items[1].items[1].items[0].ok, true, '질문의 목적·중층 ✓');
  assert.equal(tree.items[1].items[1].items[1].ok, false, '허용된 보고·중층 ✗');
});

test('안내 데이터: 모든 단서에 판단 힌트가 있고, 깊이·용어·상황 요약이 채워져 있다', () => {
  for (const c of Object.values(CLUES)) assert.ok(typeof c.use === 'string' && c.use.length > 10, c.id);
  assert.deepEqual(Object.keys(DEPTH_INFO), ['1', '2', '3']);
  for (const id of ['memory', 'evidence', 'depth', 'reading']) assert.ok(GUIDE.some((g) => g.id === id), id);
  assert.ok(!GUIDE.some((g) => g.body.join('').includes('45')), '신뢰도 기준값을 미리 알려 주지 않음');
  assert.equal(LIFE_GOALS.length, 4);
  assert.ok(SITUATION.firstLife.length >= 5 && SITUATION.caseGoal.steps.length === 3);
  const awakenGoal = NODES.AWAKEN.lines.find((l) => l.list);
  assert.equal(awakenGoal.list, LIFE_GOALS, '각성 장면 목표 카드와 노트가 같은 목표를 씀');
});

test('프롤로그는 십 년의 배경 → 회장실 청소부 → 마지막 30일 → 죽음의 밤 순서로 사건 경위와 심리를 보여 준다', () => {
  const cards = NODES.PROLOGUE.lines.filter((l) => l.card).map((l) => l.card);
  assert.deepEqual(cards, ['십 년 전', '회장실 청소부', '마지막 30일']);
  const all = NODES.PROLOGUE.lines.map((l) => l.text || l.narr || '').join(' ');
  for (const key of ['병원비', '승계 작업', '외부 변호사', '송금 승인서', '감사팀', '횡령', '셔터']) assert.ok(all.includes(key), key);
  // 무력이 아닌 전략으로 일하던 해결사, 모든 판을 안다는 자만, 배신의 모욕감, 이유를 짐작만 하는 상태
  for (const key of ['주먹을 쓰지 않았다', '회장실 청소부', '내가 모르는 판은 없다', '모욕감', '무엇을 알아서인가']) assert.ok(all.includes(key), key);
});

test('표기: 날짜는 30일로 쓰고, 현대 배경에 어울리지 않는 사무용품 표현을 쓰지 않는다', async () => {
  const C = await import('../src/data/case01.js');
  const texts = JSON.stringify([C.NODES, C.CLUES, C.TOPICS, C.CHARACTERS, C.ENDINGS, C.SITUATION, C.LIFE_GOALS, C.TUTORIAL, C.HUB, C.BAND_LINES, C.REMOVAL_LINES, C.RESULT_COMMON]);
  assert.ok(!texts.includes('서른 날'), '서른 날 → 30일');
  for (const w of ['잉크', '만년필', '펜촉', '다이얼', '수화기', '형광등', '지우개', '결재판', '타자기', '전보', '삐삐']) assert.ok(!texts.includes(w), w);
});
