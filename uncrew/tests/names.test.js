// 주인공 이름 규칙 · 조사 처리 · 이름 입력 흐름
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validatePlayerName, josa, formatText, invalidTokens, DEFAULT_PLAYER } from '../src/core/names.js';
import { Game } from '../src/core/game.js';
import { createMemoryStorage, SAVE_KEY } from '../src/core/save.js';
import { NODES, NODE_ORDER } from '../src/data/case01.js';
import { newGame, toHaerinOpen, choose } from './helpers.js';

const ok = (surname, given) => validatePlayerName({ surname, given }).ok;

test('이름 규칙: 한글 성 1자(복성 2자) + 이름 2자', () => {
  assert.ok(ok('한', '도윤'));
  assert.ok(ok('강', '민호'));
  assert.ok(ok('남궁', '민수'));
  assert.ok(ok(' 이 ', ' 서준 '), '앞뒤 공백은 정리');
  assert.ok(!ok('', '도윤'));
  assert.ok(!ok('한', ''));
  assert.ok(!ok('김이', '도윤'), '복성 목록에 없는 2자 성');
  assert.ok(!ok('한', '도'), '이름 1자');
  assert.ok(!ok('한', '도윤아'), '이름 3자');
  assert.ok(!ok('Han', '도윤'));
  assert.ok(!ok('한', 'ㄷㅇ'), '자모 단독');
  assert.ok(!ok('한', '도 윤'), '중간 공백');
  assert.ok(!ok('한', '도1'));
});

test('이름 규칙: 회장 일가의 성, 다른 등장인물 이름, 호칭, 비속어는 쓸 수 없다', () => {
  const r = validatePlayerName({ surname: '차', given: '민호' });
  assert.ok(!r.ok && r.errors[0].includes('회장 일가'));
  assert.ok(!ok('서', '해린'));
  assert.ok(!ok('김', '해린'), '다른 인물의 이름 2자와 같음');
  assert.ok(!ok('한', '무진'));
  assert.ok(!ok('한', '회장'));
  assert.ok(!ok('한', '실장'));
  assert.ok(!ok('한', '병신'));
});

test('조사는 받침에 맞춰 바뀐다', () => {
  assert.equal('도윤' + josa('도윤', '아'), '도윤아');
  assert.equal('민호' + josa('민호', '아'), '민호야');
  assert.equal('도윤' + josa('도윤', '과'), '도윤과');
  assert.equal('민호' + josa('민호', '과'), '민호와');
  assert.equal('도윤' + josa('도윤', '이'), '도윤이');
  assert.equal('민호' + josa('민호', '이'), '민호가');
  assert.equal('하늘' + josa('하늘', '으로'), '하늘로', 'ㄹ 받침은 로');
  assert.equal('도윤' + josa('도윤', '으로'), '도윤으로');
});

test('대본 자리 표시는 이름과 조사로 바뀌고, 지원하지 않는 표시는 검증에서 걸린다', () => {
  const p = { surname: '강', given: '민호' };
  assert.equal(formatText('{name:아}. 나는 네가', p), '민호야. 나는 네가');
  assert.equal(formatText('회장은 {name:과} 윤서진이', p), '회장은 민호와 윤서진이');
  assert.equal(formatText('{surname} 실장님', p), '강 실장님');
  assert.equal(formatText('{fullname}.', p), '강민호.');
  assert.equal(formatText('{name:아}', null), '도윤아', '이름이 없으면 기본 이름');
  assert.deepEqual(invalidTokens('{nmae} {name:의} {name}'), ['{nmae}', '{name:의}']);
});

test('이름을 떠올리기 전 장면(프롤로그·회귀)에는 이름 자리 표시가 없고, 주인공은 "나"로 표시된다', () => {
  const idx = NODE_ORDER.indexOf('NAME_ENTRY');
  for (const id of NODE_ORDER.slice(0, idx)) {
    for (const ln of NODES[id].lines || []) {
      for (const t of [ln.text, ln.narr, ln.sub]) assert.ok(!/\{(name|surname|fullname)/.test(t || ''), `${id}: ${t}`);
    }
  }
  assert.deepEqual(NODE_ORDER.slice(0, 5), ['PROLOGUE', 'RETURN', 'NAME_ENTRY', 'AWAKEN', 'HAERIN_OPEN']);
});

test('이름 입력: 회귀 장면 뒤에만 받고, 규칙에 맞지 않으면 진행하지 않는다', () => {
  const { game } = newGame();
  game.newGame();
  assert.equal(game.setPlayerName(DEFAULT_PLAYER).reason, 'BAD_NODE', '프롤로그에서는 입력 불가');
  game.advance();
  game.advance();
  assert.equal(game.run.nodeId, 'NAME_ENTRY');
  assert.equal(game.advance().ok, false, '이름 없이 넘어갈 수 없음');
  const bad = game.setPlayerName({ surname: '차', given: '민호' });
  assert.equal(bad.reason, 'BAD_NAME');
  assert.equal(game.run.player, null);
  assert.ok(game.setPlayerName({ surname: '강', given: '민호' }).ok);
  assert.equal(game.run.nodeId, 'AWAKEN');
  assert.deepEqual(game.run.player, { surname: '강', given: '민호' });
  assert.ok(!JSON.stringify(game.log.list()).includes('민호'), '로그에 이름을 남기지 않음');
});

test('사건 재도전은 이름을 유지하고, 새 게임은 회귀 장면에서 다시 묻되 지난 이름을 기억한다', () => {
  const { game } = newGame();
  toHaerinOpen(game, { surname: '강', given: '민호' });
  choose(game, 'H01_A');
  game.retryCase();
  assert.deepEqual(game.run.player, { surname: '강', given: '민호' });
  game.newGame();
  assert.equal(game.run.player, null);
  assert.deepEqual(game.meta.lastPlayer, { surname: '강', given: '민호' });
});

test('이전 형식(v1) 저장은 기본 이름으로 변환해 이어 할 수 있다', () => {
  const storage = createMemoryStorage();
  const { game } = newGame({ storage });
  toHaerinOpen(game);
  const data = JSON.parse(storage.getItem(SAVE_KEY));
  data.schemaVersion = 1;
  data.run.schemaVersion = 1;
  delete data.run.player;
  delete data.meta.lastPlayer;
  storage.setItem(SAVE_KEY, JSON.stringify(data));
  const g2 = new Game({ storage });
  assert.equal(g2.loadIssue, null);
  assert.deepEqual(g2.run.player, DEFAULT_PLAYER);
  assert.equal(g2.run.nodeId, 'HAERIN_OPEN');
});

test('이름이 없는데 이름 장면 이후로 저장된 데이터는 깨진 저장으로 처리한다', () => {
  const storage = createMemoryStorage();
  const { game } = newGame({ storage });
  toHaerinOpen(game);
  const data = JSON.parse(storage.getItem(SAVE_KEY));
  data.run.player = null;
  storage.setItem(SAVE_KEY, JSON.stringify(data));
  assert.equal(new Game({ storage }).loadIssue?.kind, 'corrupt');
  data.run.player = { surname: '차', given: '민호' };
  storage.setItem(SAVE_KEY, JSON.stringify(data));
  assert.equal(new Game({ storage }).loadIssue?.kind, 'corrupt');
});
