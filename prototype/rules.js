/*
 * 하트볼트(Heartbolt) — 퍼즐 규칙 엔진 (브라우저와 Node.js 공용)
 *
 * 판(plank), 구멍(hole), 나사(screw)의 관계와 이동 규칙만 담당합니다.
 * 화면 그리기와 입력 처리는 game.js가, 레벨 생성은 tools/levelgen.mjs가 이 파일을 사용합니다.
 * Unity로 옮길 때도 이 파일의 규칙을 그대로 C#으로 옮기면 됩니다. (docs/game-design.md 참고)
 *
 * 플레이어의 행동은 모두 '액션' 하나로 표현합니다.
 *   { kind: 'move', sid, h }    나사 sid를 구멍 h로 옮김
 *   { kind: 'provoke', sid, h } 반항 나사를 처음 건드림 → 가장 가까운 빈 구멍 h로 달아남
 *   { kind: 'bit' }             드라이버 비트 교체 (이끄는 쪽 ↔ 따르는 쪽)
 * 세 액션 모두 이동 1회로 계산합니다.
 *
 * 기믹
 *   ice(긴장·경계 나사)  : 이동 수가 ice 이상이 될 때까지 집을 수 없음
 *   lock(규칙 나사)      : 열쇠(조건) 판이 떨어지기 전까지 집을 수 없음
 *   brat(반항 나사)      : 처음 건드리면 가장 가까운 빈 구멍으로 달아난 뒤, 그다음부터 평범한 나사가 됨
 *   head(스위치 나사)    : 'lead' 또는 'follow'. 지금 비트와 같은 머리만 돌릴 수 있음
 *   glass(유리 판)       : 규칙은 일반 판과 같음. 투명해서 아래가 보임 (화면 연출)
 *   tie(리본 판)         : 같은 tie 번호의 판들은 모두 나사가 빠져야 함께 떨어짐
 *   heart(하트볼트 판)   : 규칙은 일반 판과 같음. 가장 깊은 비밀을 잠근 판 (화면 연출)
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.ScrewRules = factory();
})(typeof self !== 'undefined' ? self : globalThis, function () {
  'use strict';

  // 보드 좌표계: 300 x 400 (일러스트 3:4 비율과 동일), 격자 5열 x 7행.
  // 화면 좌표는 보드 위에 보관 구멍 줄(trayH)이 붙은 300 x 460 입니다.
  const GRID = {
    cols: 5, rows: 7, x0: 40, y0: 35, step: 55,
    boardW: 300, boardH: 400,
    barR: 19,      // 막대형 판의 반폭
    panelM: 22,    // 판넬형 판이 격자점 바깥으로 나오는 여백
    holeR: 8.5,
    screwR: 11,
    trayH: 60,     // 보관 구멍 줄 높이
    slotGap: 42,   // 보관 구멍 간격
  };
  const MAX_TRAY = 6;
  const BIT_START = 'lead';

  function gridXY(pt) {
    return [GRID.x0 + GRID.step * pt[0], GRID.y0 + GRID.step * pt[1]];
  }

  // 판이 덮는 격자점 목록
  function coveredPoints(p) {
    const out = [];
    if (p.kind === 'bar') {
      const di = Math.sign(p.b[0] - p.a[0]);
      const dj = Math.sign(p.b[1] - p.a[1]);
      const L = Math.max(Math.abs(p.b[0] - p.a[0]), Math.abs(p.b[1] - p.a[1]));
      for (let k = 0; k <= L; k++) out.push([p.a[0] + di * k, p.a[1] + dj * k]);
    } else {
      const i0 = Math.min(p.a[0], p.b[0]), i1 = Math.max(p.a[0], p.b[0]);
      const j0 = Math.min(p.a[1], p.b[1]), j1 = Math.max(p.a[1], p.b[1]);
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) out.push([i, j]);
    }
    return out;
  }

  const ptKey = (pt) => pt[0] + ',' + pt[1];

  /*
   * 레벨 데이터 → 계산용 모델
   * holes[0..5]  : 상단 보관 구멍(트레이). st.tray 개수만큼만 사용 가능
   * holes[6..]   : 보드 구멍. 판에 뚫린 구멍 위치의 합집합
   * hole.cover   : 그 구멍 위치를 덮는 판 목록(아래→위 순서). hole=true면 그 판에도 구멍이 뚫려 있음
   */
  function buildModel(level) {
    const holes = [];
    for (let t = 0; t < MAX_TRAY; t++) holes.push({ tray: true, slot: t, cover: [] });
    const index = new Map();
    const planks = level.planks.map((p, z) => ({
      z, kind: p.kind, a: p.a, b: p.b, color: p.color || 0,
      key: !!p.key, glass: !!p.glass, heart: !!p.heart, tie: p.tie || 0,
      holePts: p.holes, holeIdx: [], cells: coveredPoints(p),
    }));
    planks.forEach((p) => {
      p.holePts.forEach((pt) => {
        const k = ptKey(pt);
        if (!index.has(k)) {
          index.set(k, holes.length);
          holes.push({ tray: false, i: pt[0], j: pt[1], cover: [] });
        }
        p.holeIdx.push(index.get(k));
      });
    });
    holes.forEach((h, hi) => {
      if (h.tray) return;
      planks.forEach((p) => {
        if (p.cells.some((c) => c[0] === h.i && c[1] === h.j)) {
          h.cover.push({ p: p.z, hole: p.holeIdx.includes(hi) });
        }
      });
    });
    const ties = {};
    planks.forEach((p) => { if (p.tie) (ties[p.tie] = ties[p.tie] || []).push(p.z); });
    const screws = level.screws || [];
    let maxIce = 0;
    screws.forEach((s) => { if (s.ice) maxIce = Math.max(maxIce, s.ice); });
    return {
      level, holes, planks, index, ties, maxIce,
      keyPlank: planks.findIndex((p) => p.key),
      hasSwitch: screws.some((s) => s.head),
      hasBrat: screws.some((s) => s.brat),
    };
  }

  // 구조 검사: 판의 구멍은 반드시 판 위에 있어야 하고,
  // 한 구멍 위치에서 '구멍 뚫린 판'은 항상 아래쪽부터 연속으로 쌓여야 합니다.
  function validate(model) {
    for (const p of model.planks) {
      for (const pt of p.holePts) {
        if (!p.cells.some((c) => c[0] === pt[0] && c[1] === pt[1])) return 'plank ' + p.z + ' hole outside';
      }
    }
    for (const h of model.holes) {
      if (h.tray) continue;
      let solidSeen = false;
      for (const c of h.cover) {
        if (!c.hole) solidSeen = true;
        else if (solidSeen) return 'hole ' + ptKey([h.i, h.j]) + ' prefix broken';
      }
    }
    return null;
  }

  function initialState(model) {
    const lv = model.level;
    const st = {
      alive: model.planks.map(() => 1),
      occ: model.holes.map(() => -1),
      screws: [],
      moves: 0,
      tray: lv.tray,
      bit: BIT_START,
    };
    lv.screws.forEach((s, id) => {
      const h = model.index.get(ptKey(s.at));
      st.screws.push({ h, ice: s.ice || 0, lock: !!s.lock, guard: !!s.guard, brat: !!s.brat, head: s.head || null });
      st.occ[h] = id;
    });
    settle(model, st);
    return st;
  }

  function clone(st) {
    return {
      alive: st.alive.slice(),
      occ: st.occ.slice(),
      screws: st.screws.map((s) => ({ h: s.h, ice: s.ice, lock: s.lock, guard: s.guard, brat: s.brat, head: s.head })),
      moves: st.moves,
      tray: st.tray,
      bit: st.bit,
    };
  }

  // 화면 좌표 (보관 구멍 포함). 반항 나사가 달아날 곳을 정할 때도 씁니다.
  function holeXY(model, st, h) {
    const hole = model.holes[h];
    if (hole.tray) {
      const w = st.tray * GRID.slotGap;
      return [(GRID.boardW - w) / 2 + GRID.slotGap / 2 + hole.slot * GRID.slotGap, GRID.trayH / 2];
    }
    const [x, y] = gridXY([hole.i, hole.j]);
    return [x, y + GRID.trayH];
  }

  // 구멍이 위에서 열려 있는가 (덮고 있는 판이 모두 같은 자리에 구멍이 있는가)
  function isOpen(model, st, h) {
    const hole = model.holes[h];
    if (hole.tray) return hole.slot < st.tray;
    for (const c of hole.cover) if (st.alive[c.p] && !c.hole) return false;
    return true;
  }

  // 이 구멍에 나사가 있으면 고정되는 판이 남아 있는가
  function pinsAlive(model, st, h) {
    for (const c of model.holes[h].cover) if (st.alive[c.p] && c.hole) return true;
    return false;
  }

  function keyAlive(model, st) {
    return model.keyPlank >= 0 && !!st.alive[model.keyPlank];
  }

  // 'free' | 'blocked'(가려짐) | 'ice'(긴장·경계) | 'lock'(규칙) | 'bit'(비트가 맞지 않음) | 'brat'(아직 반항 중)
  function screwStatus(model, st, sid) {
    const s = st.screws[sid];
    if (!isOpen(model, st, s.h)) return 'blocked';
    if (s.ice && st.moves < s.ice) return 'ice';
    if (s.lock && keyAlive(model, st)) return 'lock';
    if (s.head && s.head !== st.bit) return 'bit';
    if (s.brat) return 'brat';
    return 'free';
  }

  function canPlace(model, st, h) {
    return st.occ[h] === -1 && isOpen(model, st, h);
  }

  // 나사가 하나도 남지 않은 판은 떨어집니다. 리본으로 묶인 판은 묶인 판이 모두 비어야 함께 떨어집니다.
  function settle(model, st) {
    const empty = (z) => !model.planks[z].holeIdx.some((h) => st.occ[h] >= 0);
    const fallen = [];
    model.planks.forEach((p, z) => {
      if (!st.alive[z] || !empty(z)) return;
      if (p.tie) {
        const group = model.ties[p.tie];
        if (group.some((g) => st.alive[g] && !empty(g))) return;
      }
      fallen.push(z);
    });
    fallen.forEach((z) => { st.alive[z] = 0; });
    return fallen;
  }

  // 반항 나사가 달아날 구멍: 가장 가까운 빈 구멍 (같은 거리면 번호가 작은 구멍)
  function bratTarget(model, st, sid) {
    const s = st.screws[sid];
    const [sx, sy] = holeXY(model, st, s.h);
    let best = -1, bd = Infinity;
    for (let h = 0; h < model.holes.length; h++) {
      if (h === s.h || !canPlace(model, st, h)) continue;
      const [x, y] = holeXY(model, st, h);
      const d = (x - sx) * (x - sx) + (y - sy) * (y - sy);
      if (d < bd - 1e-6) { bd = d; best = h; }
    }
    return best;
  }

  function relocate(model, st, sid, h) {
    const n = clone(st);
    const s = n.screws[sid];
    n.occ[s.h] = -1;
    s.h = h; s.ice = 0; s.lock = false; s.guard = false; s.brat = false;
    n.occ[h] = sid;
    n.moves++;
    const fallen = settle(model, n);
    return { state: n, fallen };
  }

  function move(model, st, sid, h) { return relocate(model, st, sid, h); }

  function provoke(model, st, sid) {
    const h = bratTarget(model, st, sid);
    if (h < 0) return null;
    const r = relocate(model, st, sid, h);
    r.to = h;
    return r;
  }

  function toggleBit(model, st) {
    const n = clone(st);
    n.bit = n.bit === 'lead' ? 'follow' : 'lead';
    n.moves++;
    return { state: n, fallen: [] };
  }

  function apply(model, st, a) {
    if (a.kind === 'bit') return toggleBit(model, st);
    if (a.kind === 'provoke') return provoke(model, st, a.sid);
    return move(model, st, a.sid, a.h);
  }

  // 도구: 망치 — 판 하나를 바로 부숩니다. 리본으로 묶인 판은 함께 떨어집니다.
  function smash(model, st, z) {
    const n = clone(st);
    const p = model.planks[z];
    const group = p.tie ? model.ties[p.tie] : [z];
    const fallen = group.filter((g) => n.alive[g]);
    fallen.forEach((g) => { n.alive[g] = 0; });
    return { state: n, fallen };
  }

  function won(st) { return st.alive.every((a) => !a); }

  // 지금 할 수 있는 모든 액션
  function legalMoves(model, st) {
    const out = [];
    const targets = [];
    for (let h = 0; h < model.holes.length; h++) if (canPlace(model, st, h)) targets.push(h);
    st.screws.forEach((s, sid) => {
      const status = screwStatus(model, st, sid);
      if (status === 'brat') {
        const h = bratTarget(model, st, sid);
        if (h >= 0) out.push({ kind: 'provoke', sid, h });
      }
      if (status !== 'free') return;
      for (const h of targets) if (h !== s.h) out.push({ kind: 'move', sid, h });
    });
    if (model.hasSwitch) out.push({ kind: 'bit' });
    return out;
  }

  function hasAnyMove(model, st) {
    return legalMoves(model, st).some((a) => a.kind !== 'bit') || (model.hasSwitch && st.screws.some((s) => s.head && s.head !== st.bit));
  }

  function stateKey(model, st) {
    let k = '';
    for (const a of st.alive) k += a;
    k += '|';
    for (const o of st.occ) {
      if (o < 0) k += '0';
      else { const hd = st.screws[o].head; k += hd === 'lead' ? 'L' : hd === 'follow' ? 'F' : '1'; }
    }
    k += '|' + Math.min(st.moves, model.maxIce) + '|' + st.tray + '|' + st.bit;
    if (model.hasBrat) { k += '|'; for (const s of st.screws) k += s.brat ? 1 : 0; }
    return k;
  }

  // 구멍 h의 나사를 빼면 떨어지는 판 수(리본은 고려하지 않은 어림값)
  function fallsIfVacate(model, st, h) {
    let falls = 0;
    for (const c of model.holes[h].cover) {
      if (!st.alive[c.p] || !c.hole) continue;
      const others = model.planks[c.p].holeIdx.some((hh) => hh !== h && st.occ[hh] >= 0);
      if (!others) falls++;
    }
    return falls;
  }

  // 탐색용 후보 액션: 서로 바꿔도 결과가 같은 수는 하나만 남깁니다.
  function candidateMoves(model, st, rng) {
    const free = [], pin = [];
    for (let h = 0; h < model.holes.length; h++) {
      if (!canPlace(model, st, h)) continue;
      (pinsAlive(model, st, h) ? pin : free).push(h);
    }
    const r = () => (rng ? rng() : 0);
    const iceLeft = st.screws.some((s) => s.ice && st.moves < s.ice);
    const moves = [];
    const freeSourceUsed = new Set();
    st.screws.forEach((s, sid) => {
      const status = screwStatus(model, st, sid);
      if (status === 'brat') {
        const h = bratTarget(model, st, sid);
        if (h >= 0) moves.push({ kind: 'provoke', sid, h, score: fallsIfVacate(model, st, s.h) * 10 + 4 + r() });
        return;
      }
      if (status !== 'free') return;
      const srcPins = pinsAlive(model, st, s.h);
      if (!srcPins) {
        const kind = s.head || 'n';
        if (freeSourceUsed.has(kind)) return;
        freeSourceUsed.add(kind);
      }
      const t = free.find((h) => h !== s.h);
      if (t !== undefined && (srcPins || iceLeft)) {
        moves.push({ kind: 'move', sid, h: t, score: fallsIfVacate(model, st, s.h) * 10 + (srcPins ? 5 : 1) + r() });
      }
      for (const h of pin) if (h !== s.h) moves.push({ kind: 'move', sid, h, score: r() });
    });
    if (model.hasSwitch) moves.push({ kind: 'bit', score: 2 + r() });
    moves.sort((a, b) => b.score - a.score);
    return moves;
  }

  const strip = (m) => (m.kind === 'bit' ? { kind: 'bit' } : { kind: m.kind, sid: m.sid, h: m.h });

  /*
   * 깊이 우선 탐색 풀이기
   * status: 'solved'(풀이 찾음) | 'unsolvable'(모든 경우를 확인했지만 불가) | 'unknown'(탐색 한도 초과)
   */
  function solve(model, st0, opts) {
    const limit = (opts && opts.limit) || 200000;
    const rng = opts && opts.rng;
    const seen = new Set([stateKey(model, st0)]);
    const stack = [{ st: st0, moves: null, i: 0, m: null }];
    let nodes = 0;
    while (stack.length) {
      const top = stack[stack.length - 1];
      if (won(top.st)) {
        return { status: 'solved', path: stack.slice(1).map((f) => f.m), nodes };
      }
      if (!top.moves) {
        if (++nodes > limit) return { status: 'unknown', path: null, nodes };
        top.moves = candidateMoves(model, top.st, rng);
      }
      if (top.i >= top.moves.length) { stack.pop(); continue; }
      const m = top.moves[top.i++];
      const ns = apply(model, top.st, m).state;
      const k = stateKey(model, ns);
      if (seen.has(k)) continue;
      seen.add(k);
      stack.push({ st: ns, moves: null, i: 0, m: strip(m) });
    }
    return { status: 'unsolvable', path: null, nodes };
  }

  // 최소 이동 수와 그 경로(A*). 결과: { moves, path } 또는 탐색 한도 초과 시 null.
  // 판을 고정 중인 나사는 최소 한 번씩 움직여야 하므로 그 개수를 하한으로 씁니다.
  // weight > 1 이면 가중 A*로 빠르게 찾습니다(최소에 가깝지만 최소라는 보장은 없음).
  // 메모리를 지키기 위해 대기 목록이 한도를 넘으면 탐색을 멈춥니다.
  function minMoves(model, st0, limit, weight) {
    const w = weight || 1;
    const maxQueue = Math.max(20000, (limit || 150000) * 4);
    const hOf = (st) => st.screws.reduce((n, s) => n + (pinsAlive(model, st, s.h) ? 1 : 0), 0);
    const heap = [];
    const better = (a, b) => a.f < b.f || (a.f === b.f && a.g > b.g);
    const swap = (i, j) => { const t = heap[i]; heap[i] = heap[j]; heap[j] = t; };
    const push = (node) => {
      heap.push(node);
      let i = heap.length - 1;
      while (i > 0) {
        const p = (i - 1) >> 1;
        if (!better(heap[i], heap[p])) break;
        swap(i, p); i = p;
      }
    };
    const pop = () => {
      const top = heap[0];
      const last = heap.pop();
      if (heap.length) {
        heap[0] = last;
        let i = 0;
        for (;;) {
          const l = 2 * i + 1, r = l + 1;
          let m = i;
          if (l < heap.length && better(heap[l], heap[m])) m = l;
          if (r < heap.length && better(heap[r], heap[m])) m = r;
          if (m === i) break;
          swap(i, m); i = m;
        }
      }
      return top;
    };
    const best = new Map();
    push({ st: st0, g: 0, f: w * hOf(st0), prev: null, m: null });
    best.set(stateKey(model, st0), 0);
    let nodes = 0;
    while (heap.length) {
      const cur = pop();
      if (won(cur.st)) {
        const path = [];
        for (let n = cur; n.prev; n = n.prev) path.unshift(n.m);
        return { moves: cur.g, path };
      }
      if (++nodes > (limit || 150000)) return null;
      for (const m of candidateMoves(model, cur.st, null)) {
        const ns = apply(model, cur.st, m).state;
        const k = stateKey(model, ns);
        const g = cur.g + 1;
        if (best.has(k) && best.get(k) <= g) continue;
        best.set(k, g);
        push({ st: ns, g, f: g + w * hOf(ns), prev: cur, m: strip(m) });
      }
      if (heap.length > maxQueue) return null;
    }
    return null;
  }

  return {
    GRID, MAX_TRAY, BIT_START, gridXY, coveredPoints, buildModel, validate, initialState, clone, holeXY,
    isOpen, pinsAlive, keyAlive, screwStatus, canPlace, settle, bratTarget,
    move, provoke, toggleBit, apply, smash, won,
    legalMoves, hasAnyMove, stateKey, candidateMoves, solve, minMoves,
  };
});
