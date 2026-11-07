// 콘텐츠 로딩 검증과 브랜드 표기 검사
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as CASE from '../src/data/case01.js';
import { DIFFICULTIES, ITEMS } from '../src/data/config.js';
import { PUZZLES, TUTORIAL_BOARD } from '../src/data/puzzles.js';
import { validateContent, validateBoards } from '../src/core/validate.js';
import { evaluate } from '../src/core/conditions.js';

const content = { ...CASE, DIFFICULTIES, ITEMS, boards: [...PUZZLES, TUTORIAL_BOARD] };

test('첫 사건 콘텐츠와 퍼즐 데이터에 검증 오류가 없다', () => {
  assert.deepEqual(validateContent(content), []);
});

test('미등록 ID, 중복 ID, 숫자 누락을 로딩 시 잡아낸다', () => {
  const bad = structuredClone(content);
  bad.NODES.BOSS_01.choices[0].contradictsClues = ['C_NOPE'];
  bad.NODES.BOSS_02.choices[0].id = 'B01_B';
  bad.NODES.BOSS_03.choices[0].effects.suspicionDelta = '5';
  bad.NODES.BOSS_03.choices[2].requires = { all: [{ evidence: 'DOC_FAKE' }] };
  const errors = validateContent(bad);
  assert.ok(errors.some((e) => e.includes('C_NOPE')));
  assert.ok(errors.some((e) => e.includes('중복 선택지')));
  assert.ok(errors.some((e) => e.includes('suspicionDelta')));
  assert.ok(errors.some((e) => e.includes('DOC_FAKE')));

  const board = structuredClone(PUZZLES[0]);
  board.plates[0].blockedHoles = [];
  assert.ok(validateBoards([board]).some((e) => e.includes('미분류')));
});

test('조건 평가기는 구조화된 all/any만 처리하고 알 수 없는 키를 거부한다', () => {
  const run = { clues: ['C_BA_2', 'C_BB_2'], evidence: ['DOC_LIST'], flags: {}, trust: { HAERIN: 50 }, suspicion: 20 };
  const b03c = CASE.NODES.BOSS_03.choices.find((c) => c.id === 'B03_C').requires;
  assert.equal(evaluate(b03c, run), true);
  assert.equal(evaluate(b03c, { ...run, clues: ['C_BA_2'] }), false);
  assert.equal(evaluate(b03c, { ...run, clues: ['C_BA_3'] }), true);
  assert.throws(() => evaluate({ eval: '1+1' }, run));
});

test('프로젝트 표기는 UNCREW로 통일되어 있다 (일반 단어로 자동 교정된 표기 없음)', () => {
  const root = join(dirname(fileURLToPath(import.meta.url)), '..');
  const banned = ['UN', 'SCREW'].join(''); // 검사 대상 문자열 자체가 이 파일에 남지 않도록 나눠 씀
  const files = [];
  const walk = (d) => {
    for (const f of readdirSync(d)) {
      if (f === 'node_modules' || f.startsWith('.')) continue;
      const p = join(d, f);
      if (statSync(p).isDirectory()) walk(p);
      else if (/\.(js|mjs|html|css|md|json|webmanifest)$/.test(f)) files.push(p);
    }
  };
  walk(root);
  for (const f of files) {
    const text = readFileSync(f, 'utf8');
    assert.ok(!text.toUpperCase().includes(banned), `${f}에 잘못된 브랜드 표기`);
  }
  const html = readFileSync(join(root, 'index.html'), 'utf8');
  assert.ok(html.includes('UNCREW') && html.includes('언스크류'));
});

test('전체판 확장 데이터는 P0와 분리되어 있고 형식이 맞다', async () => {
  const X = await import('../src/data/expansion.js');
  assert.equal(X.CHAPTERS[0].day, 'D-30');
  assert.equal(X.CHARACTERS_FULL.length, 8);
  assert.ok(X.CHARACTERS_FULL.every((c) => c.age >= 30), '주요 인물은 모두 30세 이상 성인');
  const main = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'main.js'), 'utf8');
  assert.ok(!main.includes('expansion'), 'P0 실행 코드는 확장 데이터를 불러오지 않음');
});
