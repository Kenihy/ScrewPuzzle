/*
 * 하트볼트(Heartbolt) — 선택지별 퍼즐 변형 생성기
 *
 * 사용법: node tools/variants.mjs   (levelgen.mjs 실행 뒤에 실행)
 *
 * 대화 선택지에 따라 같은 배치의 퍼즐 조건을 바꿉니다.
 *  - safe(안전한 선택)        : 보관 구멍 +1 (쉬워짐)
 *  - deep(진심에 다가가는 선택): 보관 구멍 -1 (어려워짐)
 *    보관 구멍을 줄이면 풀 수 없는 레벨은, 대신 '경계 나사'(얼음과 같은 규칙) 2개를 추가합니다.
 * 모든 변형은 풀이기로 도구 없이 풀 수 있는지 확인하고, 최소 이동 수(par)를 다시 계산합니다.
 */
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const R = require('../prototype/rules.js');
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const jsonPath = path.join(ROOT, 'tools/data/levels.json');
const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

function check(level) {
  const model = R.buildModel(level);
  const st = R.initialState(model);
  const r = R.solve(model, st, { limit: 300000 });
  if (r.status !== 'solved') return null;
  const best = R.minMoves(model, st, 250000);
  return best ? best.moves : r.path.length;
}

for (const [id, L] of Object.entries(data.levels)) {
  const base = { tray: L.tray, planks: L.planks, screws: L.screws };
  const safeTray = Math.min(R.MAX_TRAY, L.tray + 1);
  const safePar = check({ ...base, tray: safeTray }) ?? L.par;
  let deep = null;
  if (L.tray > 1) {
    const par = check({ ...base, tray: L.tray - 1 });
    if (par != null) deep = { tray: L.tray - 1, par, effect: 'tray' };
  }
  if (!deep) {
    // 처음부터 손이 닿는 나사 중 얼지 않은 2개를 '경계 나사'로
    const model = R.buildModel(base);
    const st = R.initialState(model);
    const screws = L.screws.map((s) => ({ ...s }));
    let added = 0;
    screws.forEach((s, i) => {
      if (added >= 2 || s.ice || s.lock) return;
      if (R.isOpen(model, st, st.screws[i].h)) { s.ice = 3; s.guard = true; added++; }
    });
    const par = check({ ...base, screws });
    if (par == null) throw new Error('어려운 변형을 만들 수 없음: ' + id);
    deep = { tray: L.tray, par, effect: 'guard', screws };
  }
  L.variants = { safe: { tray: safeTray, par: safePar, effect: 'tray' }, deep };
  console.log(id.padEnd(8), 'base', L.tray, 'par', L.par, '| safe', safeTray, 'par', safePar, '| deep', deep.effect, deep.tray, 'par', deep.par);
}

fs.writeFileSync(jsonPath, JSON.stringify(data, null, 1) + '\n');
fs.writeFileSync(path.join(ROOT, 'prototype/levels.js'),
  '// tools/levelgen.mjs, tools/variants.mjs가 자동 생성한 파일입니다. 직접 수정하지 마세요.\nwindow.GAME_LEVELS = ' + JSON.stringify(data.levels) + ';\n');
console.log('저장 완료');
