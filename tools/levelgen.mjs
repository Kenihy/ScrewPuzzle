/*
 * 하트볼트(Heartbolt) — 레벨 생성기
 *
 * 사용법:  node tools/levelgen.mjs                 (전체 재생성, 약 10~15분. 이어서 tools/variants.mjs 실행)
 *          ONLY=ella-3,mio-5 node tools/levelgen.mjs (지정한 레벨만 재생성, 나머지는 기존 데이터 유지)
 *          RESUME=1 node tools/levelgen.mjs          (중간에 멈췄을 때 이어서 생성)
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
  // 만남 5: 가장 깊은 곳(맨 아래)에 하트볼트 판을 먼저 놓습니다.
  const planks = cfg.heart ? [{ kind: 'panel', a: [1, 2], b: [3, 4], holes: [[1, 2], [3, 2], [1, 4], [3, 4]], heart: true }] : [];
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

// 캐릭터별 기믹 배치. cfg에 적힌 기믹만 적용합니다.
function applyGimmicks(rng, level, cfg) {
  const model = R.buildModel(level);
  const st = R.initialState(model);
  const openFirst = (ids) => shuffle(rng, ids).sort((a, b) => (R.isOpen(model, st, st.screws[b].h) ? 1 : 0) - (R.isOpen(model, st, st.screws[a].h) ? 1 : 0));
  const plain = (i) => { const s = level.screws[i]; return !s.ice && !s.lock && !s.brat; };
  const n = level.planks.length;
  const normal = level.planks.map((_, z) => z).filter((z) => !level.planks[z].heart);

  // 규칙 나사(미오): 조건(열쇠) 판이 떨어져야 풀림
  if (cfg.lock) {
    const keyZ = pick(rng, normal.filter((z) => z >= Math.floor(n * 0.25) && z <= Math.max(Math.floor(n * 0.25), Math.floor(n * 0.7))).concat(normal.slice(0, 1)));
    level.planks[keyZ].key = true;
    const keyHoles = level.planks[keyZ].holes;
    shuffle(rng, level.screws.map((_, i) => i)).filter((i) => !hasPt(keyHoles, level.screws[i].at)).slice(0, cfg.lock)
      .forEach((i) => { level.screws[i].lock = true; });
  }
  // 긴장 나사(엘라): 처음부터 손이 닿는 나사를 우선
  if (cfg.ice) {
    openFirst(level.screws.map((_, i) => i).filter(plain)).slice(0, cfg.ice.count)
      .forEach((i) => { level.screws[i].ice = ri(rng, cfg.ice.range[0], cfg.ice.range[1]); });
  }
  // 반항 나사(제나): 처음부터 손이 닿는 나사여야 도발이 바로 보입니다
  if (cfg.brat) {
    openFirst(level.screws.map((_, i) => i).filter(plain)).slice(0, cfg.brat)
      .forEach((i) => { level.screws[i].brat = true; });
  }
  // 유리 판(제나): 위쪽 층의 판을 투명하게
  if (cfg.glass) {
    const top = normal.filter((z) => z >= Math.floor(n * 0.45));
    shuffle(rng, top).slice(0, cfg.glass).forEach((z) => { level.planks[z].glass = true; });
  }
  // 리본 판(엘라): 좌우 대칭인 판 두 장을 우선 묶습니다
  if (cfg.ribbon) {
    const pairs = [];
    for (const a of normal) for (const b of normal) {
      if (a < b && cellsKey(mirror(level.planks[a])) === cellsKey(level.planks[b])) pairs.push([a, b]);
    }
    if (pairs.length < cfg.ribbon) {
      for (let z = 0; z + 1 < normal.length; z++) pairs.push([normal[z], normal[z + 1]]);
    }
    const used = new Set();
    let tie = 1;
    for (const [a, b] of shuffle(rng, pairs)) {
      if (tie > cfg.ribbon || used.has(a) || used.has(b)) continue;
      level.planks[a].tie = tie; level.planks[b].tie = tie; used.add(a); used.add(b); tie++;
    }
  }
  // 스위치 나사(미오): 머리를 '이끄는 쪽'과 '따르는 쪽'으로 나눕니다
  if (cfg.switch) {
    const ids = level.screws.map((_, i) => i).filter((i) => rng() < cfg.switch);
    ids.forEach((i, k) => { level.screws[i].head = k % 2 ? 'follow' : rng() < 0.5 ? 'lead' : 'follow'; });
    const heads = level.screws.map((s) => s.head).filter(Boolean);
    if (!heads.includes('follow') && ids.length) level.screws[ids[0]].head = 'follow';
    if (!heads.includes('lead') && ids.length > 1) level.screws[ids[1]].head = 'lead';
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
      st = R.apply(model, st, m).state;
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
  return { dfsLen: first.path.length, success: playoutRate(model, rng, PLAYOUTS), cover: coverage(level.planks) };
}

// 목표 이동 수: A*로 구한 최소 이동 수. 탐색 한도를 넘으면 DFS 풀이 길이로 대신합니다.
function parOf(level, fallback) {
  const model = R.buildModel(level);
  const st = R.initialState(model);
  const v = R.minMoves(model, st, 60000) || R.minMoves(model, st, 60000, 1.5);
  return v == null ? fallback : Math.min(v.moves, fallback);
}

// 캐릭터 = 챕터, 만남 6개. 성공률 목표가 낮을수록 어렵습니다.
// 만남 1 기본 → 2 기믹 A → 3 기믹 B → 4 조합(성향 추리) → 5 하트볼트 → 6 둘만의 밤
const CHAPTERS = [
  {
    id: 'zena', seed: 1101, // 브랫 × 엑시비셔니스트: 반항 나사, 유리 판
    stages: [
      { planks: [3, 4], tray: 3, target: 0.97, minCover: 0.3 },
      { planks: [6, 7], tray: 3, target: 0.85, minCover: 0.45, brat: 2 },
      { planks: [7, 9], tray: 3, target: 0.7, minCover: 0.5, glass: 2, brat: 1 },
      { planks: [9, 11], tray: 3, target: 0.55, minCover: 0.55, brat: 2, glass: 2 },
      { planks: [10, 12], tray: 3, target: 0.4, minCover: 0.6, heart: true, brat: 2, glass: 1 },
      { planks: [9, 11], tray: 3, target: 0.5, minCover: 0.6, brat: 2, glass: 2 },
    ],
  },
  {
    id: 'ella', seed: 2203, // 서브미시브 × 로프 버니: 긴장 나사, 리본 판
    stages: [
      { planks: [5, 6], tray: 3, target: 0.92, minCover: 0.4 },
      { planks: [6, 8], tray: 3, target: 0.78, minCover: 0.5, ice: { count: 2, range: [2, 4] } },
      { planks: [8, 9], tray: 3, target: 0.62, minCover: 0.55, ribbon: 1, ice: { count: 1, range: [3, 4] } },
      { planks: [9, 11], tray: 3, target: 0.48, minCover: 0.58, ribbon: 2, ice: { count: 2, range: [3, 6] } },
      { planks: [10, 12], tray: 3, target: 0.36, minCover: 0.6, heart: true, ribbon: 1, ice: { count: 2, range: [4, 7] } },
      { planks: [9, 11], tray: 3, target: 0.46, minCover: 0.6, ribbon: 2, ice: { count: 2, range: [3, 6] } },
    ],
  },
  {
    id: 'mio', seed: 3307, // 스위치 × 서비스 탑: 규칙 나사, 스위치 나사
    stages: [
      { planks: [5, 6], tray: 3, target: 0.92, minCover: 0.4 },
      { planks: [6, 8], tray: 3, target: 0.78, minCover: 0.5, lock: 2 },
      { planks: [7, 9], tray: 3, target: 0.62, minCover: 0.55, switch: 0.6 },
      { planks: [9, 11], tray: 3, target: 0.48, minCover: 0.58, lock: 2, switch: 0.5 },
      { planks: [10, 12], tray: 3, target: 0.36, minCover: 0.6, heart: true, lock: 2, switch: 0.5 },
      { planks: [9, 11], tray: 3, target: 0.46, minCover: 0.6, lock: 2, switch: 0.6 },
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
const VERSION = 3;
const RESUME = !!process.env.RESUME;
const prevFile = fs.existsSync(prevPath) ? JSON.parse(fs.readFileSync(prevPath, 'utf8')) : null;
const prev = (ONLY || RESUME) && prevFile && prevFile.version === VERSION ? prevFile.levels : {};
const writeJson = (levels) => {
  fs.mkdirSync(path.join(ROOT, 'tools/data'), { recursive: true });
  fs.writeFileSync(prevPath, JSON.stringify({ version: VERSION, grid: R.GRID, levels }, null, 1) + '\n');
};
const ATTEMPTS = Number(process.env.ATTEMPTS || 140);
const PLAYOUTS = Number(process.env.PLAYOUTS || 200);

const out = {};
for (const ch of CHAPTERS) {
  ch.stages.forEach((sc, si) => {
    const cfg = { ...BASE, ...sc };
    const rng = mulberry32(ch.seed * 100 + si);
    const lid = ch.id + '-' + (si + 1);
    if (ONLY && !ONLY.includes(lid) && prev[lid]) { out[lid] = prev[lid]; return; }
    if (RESUME && prev[lid]) { out[lid] = prev[lid]; console.log(lid.padEnd(8), '이전 결과 사용'); return; }
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
      applyGimmicks(rng, level, cfg);
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
    writeJson(out); // 레벨마다 바로 저장해 중간에 멈춰도 결과를 잃지 않습니다
    console.log(id.padEnd(8), 'planks', String(best.level.planks.length).padStart(2), 'screws', String(best.level.screws.length).padStart(2),
      'par', String(best.ev.par).padStart(2), 'success', best.ev.success.toFixed(2), '(목표', cfg.target + ')', 'cover', best.ev.cover.toFixed(2));
  });
}

writeJson(out);
fs.writeFileSync(path.join(ROOT, 'prototype/levels.js'),
  '// tools/levelgen.mjs가 자동 생성한 파일입니다. 직접 수정하지 마세요.\nwindow.GAME_LEVELS = ' + JSON.stringify(out) + ';\n');
console.log('저장 완료: prototype/levels.js, tools/data/levels.json');
