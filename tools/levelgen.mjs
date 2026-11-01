/*
 * 나사 너머 — 레벨 생성기
 *
 * 사용법:  node tools/levelgen.mjs                 (전체 재생성, 약 10분)
 *          ONLY=ella-3,mio-5 node tools/levelgen.mjs (지정한 레벨만 재생성, 나머지는 기존 데이터 유지)
 * 결과물:  prototype/levels.js   (웹 프로토타입이 읽는 파일)
 *          tools/data/levels.json (Unity 등 다른 엔진으로 옮길 때 쓰는 원본 데이터)
 *
 * 1) 시드 기반으로 판 배치를 무작위 생성 (좌우 대칭 위주)
 * 2) 풀이기로 '도구 없이 풀 수 있는지' 확인
 * 3) 무작위 플레이 300판의 성공률로 난이도를 추정해 스테이지 목표치에 가장 가까운 배치를 고름
 */
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const R = require('../prototype/rules.js');
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { cols: COLS, rows: ROWS } = R.GRID;

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const ri = (rng, a, b) => a + Math.floor(rng() * (b - a + 1));
const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];
const shuffle = (rng, arr) => { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; };

const DIRS = [[1, 0], [0, 1], [1, 1], [1, -1]];

function randomPlank(rng, cfg) {
  if (rng() < cfg.panelRate) {
    const w = ri(rng, 1, 2), h = ri(rng, 1, 2);
    const i0 = ri(rng, 0, COLS - 1 - w), j0 = ri(rng, 0, ROWS - 1 - h);
    const c = [[i0, j0], [i0 + w, j0], [i0, j0 + h], [i0 + w, j0 + h]];
    const holes = rng() < 0.5 ? c : rng() < 0.5 ? [c[0], c[3]] : [c[1], c[2]];
    return { kind: 'panel', a: [i0, j0], b: [i0 + w, j0 + h], holes };
  }
  const [di, dj] = pick(rng, DIRS);
  const L = ri(rng, 1, di && dj ? 3 : 4);
  const iMin = Math.max(0, -di * L), iMax = Math.min(COLS - 1, COLS - 1 - di * L);
  const jMin = Math.max(0, -dj * L), jMax = Math.min(ROWS - 1, ROWS - 1 - dj * L);
  if (iMin > iMax || jMin > jMax) return null;
  const a = [ri(rng, iMin, iMax), ri(rng, jMin, jMax)];
  const b = [a[0] + di * L, a[1] + dj * L];
  const holes = [a, b];
  if (L >= 2 && L % 2 === 0 && rng() < 0.4) holes.push([a[0] + di * L / 2, a[1] + dj * L / 2]);
  return { kind: 'bar', a, b, holes };
}

function mirror(p) {
  const m = (pt) => [COLS - 1 - pt[0], pt[1]];
  if (p.kind === 'panel') {
    const a = m(p.a), b = m(p.b);
    return { kind: 'panel', a: [Math.min(a[0], b[0]), a[1]], b: [Math.max(a[0], b[0]), b[1]], holes: p.holes.map(m) };
  }
  return { kind: 'bar', a: m(p.a), b: m(p.b), holes: p.holes.map(m) };
}

const cellsKey = (p) => p.kind + ':' + R.coveredPoints(p).map((c) => c.join(',')).sort().join(';');
const hasPt = (list, pt) => list.some((c) => c[0] === pt[0] && c[1] === pt[1]);

// 새 판을 맨 위에 올릴 수 있는지 검사
function canAdd(planks, q) {
  const qCells = R.coveredPoints(q);
  const qKey = cellsKey(q);
  for (const p of planks) if (cellsKey(p) === qKey) return false;
  for (const pt of q.holes) {
    for (const p of planks) {
      if (hasPt(R.coveredPoints(p), pt) && !hasPt(p.holes, pt)) return false;
    }
  }
  for (const c of qCells) {
    let depth = 0;
    for (const p of planks) if (hasPt(R.coveredPoints(p), c)) depth++;
    if (depth >= 3) return false;
  }
  return true;
}

function genLayout(rng, cfg) {
  const planks = [];
  let tries = 0;
  const target = ri(rng, cfg.planks[0], cfg.planks[1]);
  while (planks.length < target && tries++ < 600) {
    const q = randomPlank(rng, cfg);
    if (!q || !canAdd(planks, q)) continue;
    if (rng() < cfg.symRate) {
      const m = mirror(q);
      if (cellsKey(m) === cellsKey(q)) { planks.push(q); continue; }
      if (planks.length + 2 > target + 1) continue;
      planks.push(q);
      if (canAdd(planks, m)) planks.push(m); else planks.pop();
    } else {
      planks.push(q);
    }
  }
  if (planks.length < cfg.planks[0]) return null;
  // 색상: 바로 아래 판과 겹치지 않게
  let prev = -1;
  planks.forEach((p) => {
    let c;
    do { c = ri(rng, 0, 5); } while (c === prev);
    p.color = c; prev = c;
  });
  return planks;
}

function placeScrews(rng, planks, cfg) {
  const pts = [];
  planks.forEach((p) => p.holes.forEach((pt) => { if (!hasPt(pts, pt)) pts.push(pt); }));
  const screws = [];
  pts.forEach((pt) => { if (rng() < cfg.screwRate) screws.push({ at: pt }); });
  planks.forEach((p) => {
    if (!p.holes.some((pt) => screws.some((s) => s.at[0] === pt[0] && s.at[1] === pt[1]))) {
      screws.push({ at: pick(rng, p.holes) });
    }
  });
  return screws;
}

function applyGimmick(rng, level, cfg) {
  if (cfg.gimmick === 'ice') {
    const model = R.buildModel(level);
    const st = R.initialState(model);
    // 처음부터 손이 닿는 나사를 우선 얼려야 기믹이 체감됩니다.
    const order = shuffle(rng, level.screws.map((_, i) => i))
      .sort((a, b) => (R.isOpen(model, st, st.screws[b].h) ? 1 : 0) - (R.isOpen(model, st, st.screws[a].h) ? 1 : 0));
    order.slice(0, cfg.gimmickCount).forEach((i) => { level.screws[i].ice = ri(rng, cfg.ice[0], cfg.ice[1]); });
  }
  if (cfg.gimmick === 'lock') {
    const n = level.planks.length;
    const keyZ = ri(rng, Math.floor(n * 0.25), Math.max(Math.floor(n * 0.25), Math.floor(n * 0.7)));
    level.planks[keyZ].key = true;
    const keyHoles = level.planks[keyZ].holes;
    const cands = shuffle(rng, level.screws.map((_, i) => i)).filter((i) => !hasPt(keyHoles, level.screws[i].at));
    cands.slice(0, cfg.gimmickCount).forEach((i) => { level.screws[i].lock = true; });
  }
}

function coverage(planks) {
  const { barR, panelM, boardW, boardH } = R.GRID;
  let hit = 0, total = 0;
  for (let y = 5; y < boardH; y += 10) {
    for (let x = 5; x < boardW; x += 10) {
      total++;
      const inside = planks.some((p) => {
        const [ax, ay] = R.gridXY(p.a), [bx, by] = R.gridXY(p.b);
        if (p.kind === 'panel') {
          return x >= Math.min(ax, bx) - panelM && x <= Math.max(ax, bx) + panelM && y >= Math.min(ay, by) - panelM && y <= Math.max(ay, by) + panelM;
        }
        const dx = bx - ax, dy = by - ay;
        const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy)));
        return Math.hypot(x - ax - t * dx, y - ay - t * dy) <= barR;
      });
      if (inside) hit++;
    }
  }
  return hit / total;
}

// 사람보다 서툰 '무작위 플레이어'의 성공률. 낮을수록 어려운 퍼즐
function playoutRate(model, rng, runs) {
  let ok = 0;
  const st0 = R.initialState(model);
  for (let r = 0; r < runs; r++) {
    let st = st0;
    for (let step = 0; step < 120; step++) {
      if (R.won(st)) break;
      const moves = R.candidateMoves(model, st, null);
      if (!moves.length) break;
      const falling = moves.filter((m) => m.score >= 10);
      const m = falling.length && rng() < 0.6 ? pick(rng, falling) : pick(rng, moves);
      st = R.move(model, st, m.sid, m.h).state;
    }
    if (R.won(st)) ok++;
  }
  return ok / runs;
}

function evaluate(level, rng) {
  const model = R.buildModel(level);
  if (R.validate(model)) return null;
  const st0 = R.initialState(model);
  if (st0.alive.some((a) => !a)) return null;
  const first = R.solve(model, st0, { limit: 120000 });
  if (first.status !== 'solved') return null;
  return { dfsLen: first.path.length, success: playoutRate(model, rng, 300), cover: coverage(level.planks) };
}

// 목표 이동 수: A*로 구한 최소 이동 수. 탐색 한도를 넘으면 DFS 풀이 길이로 대신합니다.
function parOf(level, fallback) {
  const model = R.buildModel(level);
  const v = R.minMoves(model, R.initialState(model), 400000);
  return v == null ? fallback : v.moves;
}

// 캐릭터 = 챕터, 스테이지 5개. 성공률 목표가 낮을수록 어렵습니다.
const CHAPTERS = [
  {
    id: 'zena', seed: 1101, gimmick: null,
    stages: [
      { planks: [3, 4], tray: 3, target: 0.97, minCover: 0.3 },
      { planks: [6, 7], tray: 3, target: 0.8, minCover: 0.45 },
      { planks: [8, 9], tray: 3, target: 0.6, minCover: 0.5 },
      { planks: [10, 11], tray: 3, target: 0.45, minCover: 0.55 },
      { planks: [12, 13], tray: 3, target: 0.3, minCover: 0.6 },
    ],
  },
  {
    id: 'ella', seed: 2203, gimmick: 'ice',
    stages: [
      { planks: [5, 6], tray: 3, target: 0.85, minCover: 0.4, gimmickCount: 1, ice: [2, 3] },
      { planks: [7, 8], tray: 3, target: 0.65, minCover: 0.5, gimmickCount: 2, ice: [3, 5] },
      { planks: [9, 10], tray: 3, target: 0.5, minCover: 0.55, gimmickCount: 2, ice: [4, 6] },
      { planks: [10, 12], tray: 3, target: 0.35, minCover: 0.58, gimmickCount: 3, ice: [4, 7] },
      { planks: [12, 14], tray: 3, target: 0.25, minCover: 0.6, gimmickCount: 3, ice: [5, 8] },
    ],
  },
  {
    id: 'mio', seed: 3307, gimmick: 'lock',
    stages: [
      { planks: [5, 6], tray: 3, target: 0.85, minCover: 0.4, gimmickCount: 1 },
      { planks: [7, 8], tray: 3, target: 0.65, minCover: 0.5, gimmickCount: 2 },
      { planks: [9, 10], tray: 3, target: 0.5, minCover: 0.55, gimmickCount: 2 },
      { planks: [10, 12], tray: 3, target: 0.35, minCover: 0.58, gimmickCount: 3 },
      { planks: [12, 14], tray: 3, target: 0.25, minCover: 0.6, gimmickCount: 3 },
    ],
  },
];

// 직접 설계한 레벨. 튜토리얼은 무작위 대신 의도한 순서대로 규칙을 익히게 합니다.
//  1) 맨 위 가로 막대의 나사 2개를 빼면 막대가 떨어진다
//  2) 세로 막대 아래쪽 나사는 판넬에 가려져 있어 바로 뺄 수 없다
//  3) 막대가 떨어진 자리의 빈 구멍을 보관 구멍처럼 쓸 수 있다
const FIXED = {
  'zena-1': {
    tray: 3,
    planks: [
      { kind: 'bar', a: [2, 1], b: [2, 5], holes: [[2, 1], [2, 5]], color: 0 },
      { kind: 'panel', a: [1, 4], b: [3, 5], holes: [[1, 4], [3, 4], [1, 5], [3, 5]], color: 3 },
      { kind: 'bar', a: [0, 2], b: [4, 2], holes: [[0, 2], [4, 2]], color: 1 },
    ],
    screws: [{ at: [2, 1] }, { at: [2, 5] }, { at: [1, 4] }, { at: [3, 5] }, { at: [0, 2] }, { at: [4, 2] }],
  },
};

const BASE = { panelRate: 0.4, symRate: 0.75, screwRate: 0.8 };
const ONLY = process.env.ONLY ? process.env.ONLY.split(',') : null;
const prevPath = path.join(ROOT, 'tools/data/levels.json');
const prev = ONLY && fs.existsSync(prevPath) ? JSON.parse(fs.readFileSync(prevPath, 'utf8')).levels : {};
const ATTEMPTS = Number(process.env.ATTEMPTS || 220);

const out = {};
for (const ch of CHAPTERS) {
  ch.stages.forEach((sc, si) => {
    const cfg = { ...BASE, ...sc, gimmick: ch.gimmick };
    const rng = mulberry32(ch.seed * 100 + si);
    const lid = ch.id + '-' + (si + 1);
    if (ONLY && !ONLY.includes(lid) && prev[lid]) { out[lid] = prev[lid]; return; }
    let best = null;
    if (FIXED[lid]) {
      const level = JSON.parse(JSON.stringify(FIXED[lid]));
      const ev = evaluate(level, rng);
      if (!ev) throw new Error('고정 레벨을 풀 수 없음: ' + lid);
      best = { score: 0, level, ev };
    }
    for (let a = 0; !FIXED[lid] && a < ATTEMPTS; a++) {
      const planks = genLayout(rng, cfg);
      if (!planks) continue;
      const level = { tray: cfg.tray, planks, screws: placeScrews(rng, planks, cfg) };
      if (level.screws.length > 22) continue;
      if (ch.gimmick) applyGimmick(rng, level, cfg);
      const ev = evaluate(level, rng);
      if (!ev) continue;
      const coverPenalty = Math.max(0, cfg.minCover - ev.cover) * 3;
      const score = Math.abs(ev.success - cfg.target) + coverPenalty - ev.cover * 0.15;
      if (!best || score < best.score) best = { score, level, ev };
    }
    if (!best) throw new Error('레벨 생성 실패: ' + ch.id + '-' + (si + 1));
    const id = ch.id + '-' + (si + 1);
    best.ev.par = parOf(best.level, best.ev.dfsLen);
    out[id] = {
      id, character: ch.id, stage: si + 1,
      tray: best.level.tray, par: best.ev.par,
      planks: best.level.planks, screws: best.level.screws,
      meta: { success: +best.ev.success.toFixed(2), cover: +best.ev.cover.toFixed(2), target: cfg.target },
    };
    console.log(id.padEnd(8), 'planks', String(best.level.planks.length).padStart(2), 'screws', String(best.level.screws.length).padStart(2),
      'par', String(best.ev.par).padStart(2), 'success', best.ev.success.toFixed(2), '(목표', cfg.target + ')', 'cover', best.ev.cover.toFixed(2));
  });
}

fs.mkdirSync(path.join(ROOT, 'tools/data'), { recursive: true });
const json = JSON.stringify({ grid: R.GRID, levels: out }, null, 1);
fs.writeFileSync(path.join(ROOT, 'tools/data/levels.json'), json + '\n');
fs.writeFileSync(path.join(ROOT, 'prototype/levels.js'),
  '// tools/levelgen.mjs가 자동 생성한 파일입니다. 직접 수정하지 마세요.\nwindow.GAME_LEVELS = ' + JSON.stringify(out) + ';\n');
console.log('저장 완료: prototype/levels.js, tools/data/levels.json');
